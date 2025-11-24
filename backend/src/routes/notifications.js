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
 * POST /notifications/register
 * Push notification token regisztrálása
 */
router.post('/register', async (req, res) => {
  try {
    const userId = req.user.id;
    const { token, platform, deviceId } = req.body;

    if (!token || !platform || !deviceId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_DATA',
          message: 'Token, platform és device ID kötelező.',
        },
      });
    }

    await pool.query(
      `INSERT INTO push_tokens (user_id, token, platform, device_id, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (user_id, device_id)
       DO UPDATE SET token = $2, platform = $3, is_active = TRUE, updated_at = NOW()`,
      [userId, token, platform, deviceId]
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.error('Register push token error:', error);
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
 * PUT /notifications/settings
 * Értesítési beállítások frissítése
 */
router.put('/settings', async (req, res) => {
  try {
    const userId = req.user.id;
    const { matches, messages, likes, superLikes, topPicks, promotions, quietHours } = req.body;

    await pool.query(
      `UPDATE user_settings 
       SET 
         notifications_matches = COALESCE($1, notifications_matches),
         notifications_messages = COALESCE($2, notifications_messages),
         notifications_likes = COALESCE($3, notifications_likes),
         notifications_super_likes = COALESCE($4, notifications_super_likes),
         notifications_top_picks = COALESCE($5, notifications_top_picks),
         notifications_promotions = COALESCE($6, notifications_promotions),
         quiet_hours_enabled = COALESCE($7, quiet_hours_enabled),
         quiet_hours_start = COALESCE($8, quiet_hours_start),
         quiet_hours_end = COALESCE($9, quiet_hours_end),
         updated_at = NOW()
       WHERE user_id = $10`,
      [
        matches, messages, likes, superLikes, topPicks, promotions,
        quietHours?.enabled, quietHours?.start, quietHours?.end,
        userId
      ]
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
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

