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
 * POST /search
 * Részletes keresés
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { query, filters = {}, limit = 20, offset = 0 } = req.body;

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
    let sqlQuery = `
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
    if (filters.gender && filters.gender !== 'all') {
      sqlQuery += ` AND u.gender = $${paramIndex}`;
      queryParams.push(filters.gender);
      paramIndex++;
    } else if (user.looking_for && user.looking_for.length > 0) {
      sqlQuery += ` AND u.gender = ANY($${paramIndex})`;
      queryParams.push(user.looking_for);
      paramIndex++;
    }

    // Age filter
    if (filters.ageMin) {
      const maxBirthDate = new Date();
      maxBirthDate.setFullYear(maxBirthDate.getFullYear() - filters.ageMin);
      sqlQuery += ` AND u.birth_date <= $${paramIndex}`;
      queryParams.push(maxBirthDate.toISOString().split('T')[0]);
      paramIndex++;
    }

    if (filters.ageMax) {
      const minBirthDate = new Date();
      minBirthDate.setFullYear(minBirthDate.getFullYear() - filters.ageMax);
      sqlQuery += ` AND u.birth_date >= $${paramIndex}`;
      queryParams.push(minBirthDate.toISOString().split('T')[0]);
      paramIndex++;
    }

    // Distance filter
    if (filters.distance && user.location_latitude && user.location_longitude) {
      // This is simplified - in production, use proper distance calculation
      sqlQuery += ` AND (
        6371 * acos(
          cos(radians($${paramIndex})) * cos(radians(p.location_latitude)) *
          cos(radians(p.location_longitude) - radians($${paramIndex + 1})) +
          sin(radians($${paramIndex})) * sin(radians(p.location_latitude))
        )
      ) <= $${paramIndex + 2}`;
      queryParams.push(user.location_latitude, user.location_longitude, filters.distance);
      paramIndex += 3;
    }

    // Relationship goal filter
    if (filters.relationshipGoal) {
      sqlQuery += ` AND p.relationship_goal = $${paramIndex}`;
      queryParams.push(filters.relationshipGoal);
      paramIndex++;
    }

    // Interests filter
    if (filters.interests && filters.interests.length > 0) {
      sqlQuery += ` AND p.interests && $${paramIndex}`;
      queryParams.push(filters.interests);
      paramIndex++;
    }

    // Verified only
    if (filters.verifiedOnly) {
      sqlQuery += ` AND p.is_verified = TRUE`;
    }

    // Online only
    if (filters.onlineOnly) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      sqlQuery += ` AND u.last_active >= $${paramIndex}`;
      queryParams.push(fiveMinutesAgo.toISOString());
      paramIndex++;
    }

    // Exclude already swiped
    sqlQuery += ` AND u.id NOT IN (
      SELECT swiped_id FROM swipes WHERE swiper_id = $1
    )`;

    // Exclude blocked
    sqlQuery += ` AND u.id NOT IN (
      SELECT blocked_id FROM blocks WHERE blocker_id = $1
    )`;

    // Order by distance if user has location
    if (user.location_latitude && user.location_longitude) {
      sqlQuery += `
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
      sqlQuery += ` ORDER BY u.created_at DESC`;
    }

    sqlQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(sqlQuery, queryParams);

    // Format results (similar to profiles route)
    const profiles = result.rows.map(profile => {
      const birthDate = new Date(profile.birth_date);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return {
        id: profile.id,
        name: profile.name,
        age,
        bio: profile.bio,
        interests: profile.interests || [],
        relationshipGoal: profile.relationship_goal,
        isVerified: profile.is_verified,
        lastActive: profile.last_active,
      };
    });

    res.json({
      success: true,
      data: {
        profiles,
        pagination: {
          limit,
          offset,
          total: profiles.length, // Simplified - should get actual count
          hasMore: profiles.length === limit,
        },
      },
    });
  } catch (error) {
    console.error('Search error:', error);
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
 * POST /search/ai
 * AI-alapú keresés
 */
router.post('/ai', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_DESCRIPTION',
          message: 'Leírás hiányzik.',
        },
      });
    }

    // Extract filters from description (simplified - in production, use NLP/AI)
    const extractedFilters = {
      relationshipGoal: description.toLowerCase().includes('laza') ? 'casual' : null,
      location: description.match(/budapest|debrecen|szeged|pécs/i)?.[0] || null,
      interests: [],
    };

    // For now, return extracted filters
    // In production, this would call an AI service to extract more information
    res.json({
      success: true,
      data: {
        extractedFilters,
        message: 'AI keresés még fejlesztés alatt. Kérjük, használd a normál keresést.',
      },
    });
  } catch (error) {
    console.error('AI search error:', error);
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

