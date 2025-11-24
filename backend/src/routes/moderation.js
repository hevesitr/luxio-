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
 * POST /moderation/report
 * Felhasználó/profil jelentése
 */
router.post('/report', async (req, res) => {
  try {
    const userId = req.user.id;
    const { reportedUserId, reason, description, evidence } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_DATA',
          message: 'Jelentett felhasználó ID és ok kötelező.',
        },
      });
    }

    // Check if user exists
    const userResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [reportedUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Jelentett felhasználó nem található.',
        },
      });
    }

    // Insert report
    await pool.query(
      `INSERT INTO reports (reporter_id, reported_id, reason, description, evidence_urls, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [userId, reportedUserId, reason, description || null, evidence || []]
    );

    res.status(201).json({
      success: true,
      message: 'Jelentésedet megkaptuk. Köszönjük!',
    });
  } catch (error) {
    console.error('Report error:', error);
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
 * POST /moderation/block
 * Felhasználó blokkolása
 */
router.post('/block', async (req, res) => {
  try {
    const userId = req.user.id;
    const { blockedUserId } = req.body;

    if (!blockedUserId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'Blokkolt felhasználó ID hiányzik.',
        },
      });
    }

    // Check if user exists
    const userResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [blockedUserId]
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

    // Insert block
    await pool.query(
      `INSERT INTO blocks (blocker_id, blocked_id)
       VALUES ($1, $2)
       ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
      [userId, blockedUserId]
    );

    // Deactivate match if exists
    await pool.query(
      `UPDATE matches 
       SET is_active = FALSE, unmatched_at = NOW(), unmatched_by = $1
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
      [userId, blockedUserId]
    );

    res.json({
      success: true,
      message: 'Felhasználó blokkolva',
    });
  } catch (error) {
    console.error('Block error:', error);
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
 * GET /moderation/blocked
 * Blokkolt felhasználók listája
 */
router.get('/blocked', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        u.id,
        u.name,
        b.created_at as blocked_at
      FROM blocks b
      INNER JOIN users u ON b.blocked_id = u.id
      WHERE b.blocker_id = $1
      ORDER BY b.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        blockedUsers: result.rows.map(row => ({
          id: row.id,
          name: row.name,
          blockedAt: row.blocked_at,
        })),
      },
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
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
 * DELETE /moderation/block/:userId
 * Blokkolás feloldása
 */
router.delete('/block/:userId', async (req, res) => {
  try {
    const userId = req.user.id;
    const blockedUserId = req.params.userId;

    await pool.query(
      'DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2',
      [userId, blockedUserId]
    );

    res.json({
      success: true,
      message: 'Blokkolás feloldva',
    });
  } catch (error) {
    console.error('Unblock error:', error);
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

