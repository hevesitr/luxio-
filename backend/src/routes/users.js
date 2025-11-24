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
 * GET /users/me
 * Saját felhasználói adatok lekérése
 */
router.get('/me', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const userResult = await pool.query(
      `SELECT 
        u.id,
        u.email,
        u.phone,
        u.name,
        u.birth_date,
        u.gender,
        u.looking_for,
        u.last_active,
        u.created_at,
        p.*
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

    // Get photos
    const photosResult = await pool.query(
      `SELECT url, thumbnail_url, is_private, order_index
       FROM profile_photos
       WHERE profile_id = $1
       ORDER BY order_index`,
      [user.id]
    );

    // Get settings
    const settingsResult = await pool.query(
      `SELECT * FROM user_settings WHERE user_id = $1`,
      [userId]
    );

    // Calculate age
    const birthDate = new Date(user.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        birthDate: user.birth_date,
        age,
        gender: user.gender,
        lookingFor: user.looking_for,
        profile: {
          id: user.id,
          photos: photosResult.rows.map(p => ({
            url: p.url,
            thumbnailUrl: p.thumbnail_url,
            isPrivate: p.is_private,
            order: p.order_index,
          })),
          bio: user.bio,
          interests: user.interests || [],
          isVerified: user.is_verified,
          isPremium: user.is_premium,
          premiumTier: user.premium_tier,
        },
        settings: settingsResult.rows[0] || {},
        createdAt: user.created_at,
        lastActive: user.last_active,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
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
 * PUT /users/me
 * Saját felhasználói adatok frissítése
 */
router.put('/me', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, bio, interests, relationshipGoal, location } = req.body;

    // Update user
    if (name) {
      await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, userId]);
    }

    // Update profile
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (bio !== undefined) {
      updateFields.push(`bio = $${paramIndex++}`);
      updateValues.push(bio);
    }

    if (interests !== undefined) {
      updateFields.push(`interests = $${paramIndex++}`);
      updateValues.push(interests);
    }

    if (relationshipGoal !== undefined) {
      updateFields.push(`relationship_goal = $${paramIndex++}`);
      updateValues.push(relationshipGoal);
    }

    if (location) {
      updateFields.push(`location_latitude = $${paramIndex++}`);
      updateValues.push(location.latitude);
      updateFields.push(`location_longitude = $${paramIndex++}`);
      updateValues.push(location.longitude);
      if (location.city) {
        updateFields.push(`location_city = $${paramIndex++}`);
        updateValues.push(location.city);
      }
      if (location.country) {
        updateFields.push(`location_country = $${paramIndex++}`);
        updateValues.push(location.country);
      }
    }

    if (updateFields.length > 0) {
      updateValues.push(userId);
      await pool.query(
        `UPDATE profiles SET ${updateFields.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex}`,
        updateValues
      );
    }

    res.json({
      success: true,
      message: 'Profil sikeresen frissítve',
    });
  } catch (error) {
    console.error('Update user error:', error);
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
 * DELETE /users/me
 * Fiók törlése (GDPR - Right to be Forgotten)
 */
router.delete('/me', async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PASSWORD_REQUIRED',
          message: 'Jelszó szükséges a megerősítéshez.',
        },
      });
    }

    // Verify password
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
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

    const bcrypt = require('bcrypt');
    const passwordMatch = await bcrypt.compare(password, userResult.rows[0].password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Hibás jelszó.',
        },
      });
    }

    // Create deletion request (30 days grace period)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    await pool.query(
      `INSERT INTO data_deletion_requests (user_id, scheduled_deletion_date, status)
       VALUES ($1, $2, 'scheduled')
       ON CONFLICT (user_id) DO UPDATE
       SET scheduled_deletion_date = $2, status = 'scheduled'`,
      [userId, deletionDate]
    );

    res.json({
      success: true,
      message: 'Fiókod 30 napon belül törlésre kerül. Ezen idő alatt visszavonhatod a kérést.',
    });
  } catch (error) {
    console.error('Delete user error:', error);
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

