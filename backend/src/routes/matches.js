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
 * POST /matches/like
 * Profil like-olása
 */
router.post('/like', async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId, isSuperLike = false } = req.body;

    if (!profileId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PROFILE_ID',
          message: 'Profil ID hiányzik.',
        },
      });
    }

    // Check if already swiped
    const existingSwipe = await pool.query(
      'SELECT id FROM swipes WHERE swiper_id = $1 AND swiped_id = $2',
      [userId, profileId]
    );

    if (existingSwipe.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_SWIPED',
          message: 'Már swipe-oltad ezt a profilt.',
        },
      });
    }

    // Record swipe
    await pool.query(
      'INSERT INTO swipes (swiper_id, swiped_id, action) VALUES ($1, $2, $3)',
      [userId, profileId, isSuperLike ? 'super_like' : 'like']
    );

    // Check if there's a mutual like (match)
    const mutualLike = await pool.query(
      `SELECT id FROM swipes 
       WHERE swiper_id = $1 AND swiped_id = $2 AND action IN ('like', 'super_like')`,
      [profileId, userId]
    );

    let match = null;
    if (mutualLike.rows.length > 0) {
      // Create match
      const matchResult = await pool.query(
        `INSERT INTO matches (user1_id, user2_id)
         VALUES ($1, $2)
         ON CONFLICT (user1_id, user2_id) DO NOTHING
         RETURNING id, matched_at`,
        [userId, profileId]
      );

      if (matchResult.rows.length > 0) {
        match = matchResult.rows[0];

        // Get profile data
        const profileResult = await pool.query(
          `SELECT u.id, u.name, u.birth_date, p.is_verified
           FROM users u
           INNER JOIN profiles p ON u.id = p.user_id
           WHERE u.id = $1`,
          [profileId]
        );

        if (profileResult.rows.length > 0) {
          const profile = profileResult.rows[0];
          const birthDate = new Date(profile.birth_date);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }

          match.profile = {
            id: profile.id,
            name: profile.name,
            age,
            isVerified: profile.is_verified,
          };
        }
      }
    }

    // Update statistics
    await pool.query(
      `INSERT INTO user_statistics (user_id, date, likes_sent)
       VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (user_id, date)
       DO UPDATE SET likes_sent = user_statistics.likes_sent + 1`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        isMatch: match !== null,
        match: match || null,
      },
    });
  } catch (error) {
    console.error('Like error:', error);
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
 * POST /matches/pass
 * Profil pass-elése (dislike)
 */
router.post('/pass', async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.body;

    if (!profileId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PROFILE_ID',
          message: 'Profil ID hiányzik.',
        },
      });
    }

    // Record swipe
    await pool.query(
      'INSERT INTO swipes (swiper_id, swiped_id, action) VALUES ($1, $2, $3)',
      [userId, profileId, 'pass']
    );

    // Update statistics
    await pool.query(
      `INSERT INTO user_statistics (user_id, date, passes_sent)
       VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (user_id, date)
       DO UPDATE SET passes_sent = user_statistics.passes_sent + 1`,
      [userId]
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.error('Pass error:', error);
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
 * GET /matches
 * Matchek listázása
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // Get matches
    const matchesResult = await pool.query(
      `SELECT 
        m.id,
        m.matched_at,
        CASE 
          WHEN m.user1_id = $1 THEN m.user2_id
          ELSE m.user1_id
        END as match_user_id
      FROM matches m
      WHERE (m.user1_id = $1 OR m.user2_id = $1)
        AND m.is_active = TRUE
      ORDER BY m.matched_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get profile data for each match
    const matches = await Promise.all(
      matchesResult.rows.map(async (match) => {
        const profileResult = await pool.query(
          `SELECT 
            u.id,
            u.name,
            u.birth_date,
            p.is_verified,
            u.last_active
          FROM users u
          INNER JOIN profiles p ON u.id = p.user_id
          WHERE u.id = $1`,
          [match.match_user_id]
        );

        if (profileResult.rows.length === 0) {
          return null;
        }

        const profile = profileResult.rows[0];

        // Calculate age
        const birthDate = new Date(profile.birth_date);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        // Get photos
        const photosResult = await pool.query(
          `SELECT url, thumbnail_url
           FROM profile_photos
           WHERE profile_id = (SELECT id FROM profiles WHERE user_id = $1)
           ORDER BY order_index
           LIMIT 1`,
          [profile.id]
        );

        // Get unread messages count
        const unreadResult = await pool.query(
          `SELECT COUNT(*) as count
           FROM messages
           WHERE match_id = $1
             AND sender_id != $2
             AND read_status != 'read'`,
          [match.id, userId]
        );

        // Get last message
        const lastMessageResult = await pool.query(
          `SELECT text, timestamp
           FROM messages
           WHERE match_id = $1
           ORDER BY timestamp DESC
           LIMIT 1`,
          [match.id]
        );

        return {
          id: match.id,
          profile: {
            id: profile.id,
            name: profile.name,
            age,
            photos: photosResult.rows.map(p => ({
              url: p.url,
              thumbnailUrl: p.thumbnail_url,
            })),
            isVerified: profile.is_verified,
            lastActive: profile.last_active,
          },
          matchedAt: match.matched_at,
          unreadMessages: parseInt(unreadResult.rows[0]?.count || 0),
          lastMessage: lastMessageResult.rows[0] ? {
            text: lastMessageResult.rows[0].text,
            timestamp: lastMessageResult.rows[0].timestamp,
          } : null,
        };
      })
    );

    // Filter out null matches
    const validMatches = matches.filter(m => m !== null);

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM matches
       WHERE (user1_id = $1 OR user2_id = $1)
         AND is_active = TRUE`,
      [userId]
    );

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        matches: validMatches,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    console.error('Get matches error:', error);
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
 * DELETE /matches/:matchId
 * Match törlése (unmatch)
 */
router.delete('/:matchId', async (req, res) => {
  try {
    const userId = req.user.id;
    const matchId = req.params.matchId;

    // Check if user is part of the match
    const matchResult = await pool.query(
      'SELECT id FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [matchId, userId]
    );

    if (matchResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MATCH_NOT_FOUND',
          message: 'Match nem található.',
        },
      });
    }

    // Deactivate match
    await pool.query(
      'UPDATE matches SET is_active = FALSE, unmatched_at = NOW(), unmatched_by = $1 WHERE id = $2',
      [userId, matchId]
    );

    res.json({
      success: true,
      message: 'Match törölve',
    });
  } catch (error) {
    console.error('Unmatch error:', error);
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

