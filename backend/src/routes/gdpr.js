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
 * GET /gdpr/data
 * Adatlekérés (Right to Access)
 */
router.get('/data', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all user data
    const userResult = await pool.query(
      `SELECT 
        u.*,
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

    // Get matches (anonimizálva)
    const matchesResult = await pool.query(
      `SELECT 
        m.id,
        m.matched_at,
        CASE 
          WHEN m.user1_id = $1 THEN 'User 2'
          ELSE 'User 1'
        END as match_partner
      FROM matches m
      WHERE (m.user1_id = $1 OR m.user2_id = $1)`,
      [userId]
    );

    // Get messages (anonimizálva)
    const messagesResult = await pool.query(
      `SELECT 
        m.id,
        m.type,
        m.text,
        m.created_at,
        CASE 
          WHEN m.sender_id = $1 THEN 'sent'
          ELSE 'received'
        END as direction
      FROM messages m
      INNER JOIN matches ma ON m.match_id = ma.id
      WHERE (ma.user1_id = $1 OR ma.user2_id = $1)`,
      [userId]
    );

    // Get activity logs (anonimizálva)
    const activityResult = await pool.query(
      `SELECT 
        action,
        resource_type,
        created_at
      FROM audit_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 100`,
      [userId]
    );

    // Create export request
    await pool.query(
      `INSERT INTO data_export_requests (user_id, status)
       VALUES ($1, 'completed')
       ON CONFLICT (user_id) DO UPDATE
       SET status = 'completed', completed_at = NOW()`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          birthDate: user.birth_date,
          gender: user.gender,
          lookingFor: user.looking_for,
          createdAt: user.created_at,
          lastActive: user.last_active,
        },
        profile: {
          bio: user.bio,
          interests: user.interests,
          relationshipGoal: user.relationship_goal,
          isVerified: user.is_verified,
        },
        matches: matchesResult.rows.map(m => ({
          id: m.id,
          matchedAt: m.matched_at,
          partner: m.match_partner, // Anonimizálva
        })),
        messages: messagesResult.rows.map(m => ({
          id: m.id,
          type: m.type,
          text: m.text ? m.text.substring(0, 50) + '...' : null, // Részleges
          direction: m.direction,
          createdAt: m.created_at,
        })),
        activity: activityResult.rows,
        exportedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('GDPR data export error:', error);
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
 * POST /gdpr/delete
 * Adat törlés kérése (Right to be Forgotten)
 */
router.post('/delete', async (req, res) => {
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
    console.error('GDPR delete request error:', error);
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
 * POST /gdpr/consent
 * Consent kezelés
 */
router.post('/consent', async (req, res) => {
  try {
    const userId = req.user.id;
    const { consentType, accepted } = req.body;

    if (!consentType || accepted === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_DATA',
          message: 'Consent típus és elfogadás státusz kötelező.',
        },
      });
    }

    await pool.query(
      `INSERT INTO user_consents (user_id, consent_type, accepted, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, consentType, accepted, req.ip, req.get('user-agent')]
    );

    res.json({
      success: true,
      message: 'Consent frissítve',
    });
  } catch (error) {
    console.error('GDPR consent error:', error);
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

