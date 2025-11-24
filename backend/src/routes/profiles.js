const express = require('express');
const router = express.Router();
const { pool, isDatabaseAvailable } = require('../database/pool');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

/**
 * GET /profiles
 * Profilok lekérése (swipe feed)
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // Get user's location and preferences
    const userResult = await pool.query(
      `SELECT u.gender, u.looking_for, u.birth_date, p.location_latitude, p.location_longitude
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Felhasználó nem található.',
        },
      });
    }

    const user = userResult.rows[0];

    // Build query
    let query = `
      SELECT 
        u.id,
        u.name,
        u.birth_date,
        u.gender,
        p.bio,
        p.interests,
        p.relationship_goal,
        p.is_verified,
        p.location_latitude,
        p.location_longitude,
        u.last_active
      FROM users u
      INNER JOIN profiles p ON u.id = p.user_id
      WHERE u.id != $1
        AND u.is_active = TRUE
        AND u.is_banned = FALSE
        AND u.email_verified = TRUE
    `;

    const queryParams = [userId];
    let paramIndex = 2;

    // Gender filter
    if (user.looking_for && user.looking_for.length > 0) {
      query += ` AND u.gender = ANY($${paramIndex})`;
      queryParams.push(user.looking_for);
      paramIndex++;
    }

    // Exclude already swiped users
    query += ` AND u.id NOT IN (
      SELECT swiped_id FROM swipes WHERE swiper_id = $1
    )`;

    // Exclude blocked users
    query += ` AND u.id NOT IN (
      SELECT blocked_id FROM blocks WHERE blocker_id = $1
    )`;

    // Age filter (optional)
    if (req.query.minAge) {
      const minBirthDate = new Date();
      minBirthDate.setFullYear(minBirthDate.getFullYear() - parseInt(req.query.maxAge || 100));
      query += ` AND u.birth_date <= $${paramIndex}`;
      queryParams.push(minBirthDate.toISOString().split('T')[0]);
      paramIndex++;
    }

    if (req.query.maxAge) {
      const maxBirthDate = new Date();
      maxBirthDate.setFullYear(maxBirthDate.getFullYear() - parseInt(req.query.minAge || 18));
      query += ` AND u.birth_date >= $${paramIndex}`;
      queryParams.push(maxBirthDate.toISOString().split('T')[0]);
      paramIndex++;
    }

    // Verified only filter
    if (req.query.verifiedOnly === 'true') {
      query += ` AND p.is_verified = TRUE`;
    }

    // Relationship goal filter
    if (req.query.relationshipGoal) {
      query += ` AND p.relationship_goal = $${paramIndex}`;
      queryParams.push(req.query.relationshipGoal);
      paramIndex++;
    }

    // Order by distance if user has location
    if (user.location_latitude && user.location_longitude) {
      query += `
        ORDER BY (
          6371 * acos(
            cos(radians($${paramIndex})) * cos(radians(p.location_latitude)) *
            cos(radians(p.location_longitude) - radians($${paramIndex + 1})) +
            sin(radians($${paramIndex})) * sin(radians(p.location_latitude))
          )
        )
      `;
      queryParams.push(user.location_latitude, user.location_longitude);
      paramIndex += 2;
    } else {
      query += ` ORDER BY u.created_at DESC`;
    }

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get photos for each profile
    const profiles = await Promise.all(
      result.rows.map(async (profile) => {
        const photosResult = await pool.query(
          `SELECT url, thumbnail_url, is_private, order_index
           FROM profile_photos
           WHERE profile_id = (
             SELECT id FROM profiles WHERE user_id = $1
           )
           ORDER BY order_index
           LIMIT 6`,
          [profile.id]
        );

        // Calculate age
        const birthDate = new Date(profile.birth_date);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        // Calculate distance
        let distance = null;
        if (user.location_latitude && user.location_longitude && 
            profile.location_latitude && profile.location_longitude) {
          const R = 6371; // Earth's radius in km
          const dLat = (profile.location_latitude - user.location_latitude) * Math.PI / 180;
          const dLon = (profile.location_longitude - user.location_longitude) * Math.PI / 180;
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(user.location_latitude * Math.PI / 180) *
            Math.cos(profile.location_latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distance = Math.round(R * c * 10) / 10; // Round to 1 decimal
        }

        return {
          id: profile.id,
          name: profile.name,
          age,
          distance,
          photos: photosResult.rows.map(p => ({
            url: p.url,
            thumbnailUrl: p.thumbnail_url,
            isPrivate: p.is_private,
            order: p.order_index,
          })),
          bio: profile.bio,
          interests: profile.interests || [],
          relationshipGoal: profile.relationship_goal,
          isVerified: profile.is_verified,
          lastActive: profile.last_active,
        };
      })
    );

    // Get total count (simplified)
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM users u
       INNER JOIN profiles p ON u.id = p.user_id
       WHERE u.id != $1
         AND u.is_active = TRUE
         AND u.is_banned = FALSE
         AND u.email_verified = TRUE`,
      [userId]
    );

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        profiles,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Szerver hiba történt.',
      },
    });
  }
});

/**
 * GET /profiles/:id
 * Egy profil részletes adatainak lekérése
 */
router.get('/:id', async (req, res) => {
  try {
    const profileId = req.params.id;
    const userId = req.user.id;

    // Get profile
    const profileResult = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.birth_date,
        u.gender,
        p.*
      FROM users u
      INNER JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1 AND u.is_active = TRUE`,
      [profileId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Profil nem található.',
        },
      });
    }

    const profile = profileResult.rows[0];

    // Get photos
    const photosResult = await pool.query(
      `SELECT url, thumbnail_url, is_private, order_index
       FROM profile_photos
       WHERE profile_id = $1
       ORDER BY order_index`,
      [profile.id]
    );

    // Get prompts
    const promptsResult = await pool.query(
      `SELECT question, answer, order_index
       FROM profile_prompts
       WHERE profile_id = $1
       ORDER BY order_index`,
      [profile.id]
    );

    // Get music
    const musicResult = await pool.query(
      `SELECT artists, genres, anthem
       FROM profile_music
       WHERE profile_id = $1`,
      [profile.id]
    );

    // Calculate age
    const birthDate = new Date(profile.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Log profile view
    await pool.query(
      `INSERT INTO user_statistics (user_id, date, profile_views)
       VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (user_id, date)
       DO UPDATE SET profile_views = user_statistics.profile_views + 1`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        id: profile.id,
        name: profile.name,
        age,
        photos: photosResult.rows.map(p => ({
          url: p.url,
          thumbnailUrl: p.thumbnail_url,
          isPrivate: p.is_private,
          order: p.order_index,
        })),
        bio: profile.bio,
        interests: profile.interests || [],
        height: profile.height,
        work: profile.work,
        education: profile.education,
        exercise: profile.exercise,
        smoking: profile.smoking,
        drinking: profile.drinking,
        children: profile.children,
        religion: profile.religion,
        politics: profile.politics,
        zodiacSign: profile.zodiac_sign,
        mbti: profile.mbti,
        relationshipGoal: profile.relationship_goal,
        communicationStyle: profile.communication_style,
        isVerified: profile.is_verified,
        isPremium: profile.is_premium,
        prompts: promptsResult.rows.map(p => ({
          question: p.question,
          answer: p.answer,
          order: p.order_index,
        })),
        music: musicResult.rows[0] ? {
          artists: musicResult.rows[0].artists || [],
          genres: musicResult.rows[0].genres || [],
          anthem: musicResult.rows[0].anthem,
        } : null,
        lastActive: profile.last_active,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Szerver hiba történt.',
      },
    });
  }
});

/**
 * POST /profiles/:id/view
 * Profil megtekintésének naplózása
 */
router.post('/:id/view', async (req, res) => {
  try {
    const profileId = req.params.id;
    const userId = req.user.id;

    // Log view
    await pool.query(
      `INSERT INTO user_statistics (user_id, date, profile_views)
       VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (user_id, date)
       DO UPDATE SET profile_views = user_statistics.profile_views + 1`,
      [profileId]
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.error('Log profile view error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Szerver hiba történt.',
      },
    });
  }
});

module.exports = router;

