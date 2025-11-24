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
 * GET /messages/:matchId
 * Üzenetek lekérése egy match-hez
 */
router.get('/:matchId', async (req, res) => {
  try {
    const userId = req.user.id;
    const matchId = req.params.matchId;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before; // ISO 8601 timestamp

    // Verify user is part of the match
    const matchResult = await pool.query(
      'SELECT id FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2) AND is_active = TRUE',
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

    // Build query
    let query = `
      SELECT 
        id,
        sender_id,
        type,
        text,
        media_url,
        thumbnail_url,
        duration,
        read_status,
        read_at,
        created_at as timestamp
      FROM messages
      WHERE match_id = $1
        AND is_deleted = FALSE
    `;

    const queryParams = [matchId];
    let paramIndex = 2;

    if (before) {
      query += ` AND created_at < $${paramIndex}`;
      queryParams.push(before);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    queryParams.push(limit);

    const result = await pool.query(query, queryParams);

    const messages = result.rows.map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      text: msg.text,
      type: msg.type,
      mediaUrl: msg.media_url,
      thumbnailUrl: msg.thumbnail_url,
      duration: msg.duration,
      readStatus: msg.read_status,
      timestamp: msg.timestamp,
    }));

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        hasMore: messages.length === limit,
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
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
 * POST /messages/:matchId
 * Üzenet küldése
 */
router.post('/:matchId', async (req, res) => {
  try {
    const userId = req.user.id;
    const matchId = req.params.matchId;
    const { text, type = 'text', mediaUrl, thumbnailUrl, duration } = req.body;

    // Verify user is part of the match
    const matchResult = await pool.query(
      'SELECT id FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2) AND is_active = TRUE',
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

    // Validate message
    if (type === 'text' && !text) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TEXT',
          message: 'Üzenet szövege hiányzik.',
        },
      });
    }

    if ((type === 'voice' || type === 'video') && !mediaUrl) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_MEDIA',
          message: 'Média URL hiányzik.',
        },
      });
    }

    // Insert message
    const result = await pool.query(
      `INSERT INTO messages (match_id, sender_id, type, text, media_url, thumbnail_url, duration, read_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent')
       RETURNING id, created_at as timestamp`,
      [matchId, userId, type, text || null, mediaUrl || null, thumbnailUrl || null, duration || null]
    );

    const message = result.rows[0];

    // Update statistics
    await pool.query(
      `INSERT INTO user_statistics (user_id, date, messages_sent)
       VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (user_id, date)
       DO UPDATE SET messages_sent = user_statistics.messages_sent + 1`,
      [userId]
    );

    res.status(201).json({
      success: true,
      data: {
        message: {
          id: message.id,
          senderId: userId,
          text,
          type,
          mediaUrl,
          thumbnailUrl,
          duration,
          readStatus: 'sent',
          timestamp: message.timestamp,
        },
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
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
 * PUT /messages/:messageId/read
 * Üzenet olvasottnak jelölése
 */
router.put('/:messageId/read', async (req, res) => {
  try {
    const userId = req.user.id;
    const messageId = req.params.messageId;

    // Get message and verify it's not from the user
    const messageResult = await pool.query(
      `SELECT m.id, m.match_id, m.sender_id
       FROM messages m
       INNER JOIN matches ma ON m.match_id = ma.id
       WHERE m.id = $1
         AND m.sender_id != $2
         AND (ma.user1_id = $2 OR ma.user2_id = $2)`,
      [messageId, userId]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Üzenet nem található.',
        },
      });
    }

    // Update read status
    await pool.query(
      `UPDATE messages 
       SET read_status = 'read', read_at = NOW()
       WHERE id = $1 AND read_status != 'read'`,
      [messageId]
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.error('Mark message read error:', error);
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
 * DELETE /messages/:messageId
 * Üzenet törlése
 */
router.delete('/:messageId', async (req, res) => {
  try {
    const userId = req.user.id;
    const messageId = req.params.messageId;

    // Verify message belongs to user
    const messageResult = await pool.query(
      'SELECT id FROM messages WHERE id = $1 AND sender_id = $2',
      [messageId, userId]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Üzenet nem található.',
        },
      });
    }

    // Soft delete
    await pool.query(
      'UPDATE messages SET is_deleted = TRUE, deleted_at = NOW() WHERE id = $1',
      [messageId]
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete message error:', error);
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

