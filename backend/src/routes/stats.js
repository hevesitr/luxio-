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
 * GET /stats/analytics
 * Felhasználói statisztikák
 */
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get swipe statistics
    const swipeStats = await pool.query(
      `SELECT 
        SUM(swipes_sent) as total_swipes,
        SUM(likes_sent) as total_likes,
        SUM(passes_sent) as total_passes,
        SUM(super_likes_sent) as total_super_likes
      FROM user_statistics
      WHERE user_id = $1`,
      [userId]
    );

    // Get match statistics
    const matchStats = await pool.query(
      `SELECT 
        COUNT(*) as total_matches,
        COUNT(*) FILTER (WHERE matched_at >= CURRENT_DATE - INTERVAL '7 days') as this_week,
        COUNT(*) FILTER (WHERE matched_at >= CURRENT_DATE - INTERVAL '30 days') as this_month
      FROM matches
      WHERE (user1_id = $1 OR user2_id = $1) AND is_active = TRUE`,
      [userId]
    );

    // Get message statistics
    const messageStats = await pool.query(
      `SELECT 
        SUM(messages_sent) as total_sent,
        SUM(messages_received) as total_received,
        COUNT(DISTINCT match_id) as conversations
      FROM (
        SELECT 
          match_id,
          COUNT(*) FILTER (WHERE sender_id = $1) as messages_sent,
          COUNT(*) FILTER (WHERE sender_id != $1) as messages_received
        FROM messages
        INNER JOIN matches m ON messages.match_id = m.id
        WHERE (m.user1_id = $1 OR m.user2_id = $1) AND m.is_active = TRUE
        GROUP BY match_id
      ) subquery`,
      [userId]
    );

    // Get profile views and likes received
    const profileStats = await pool.query(
      `SELECT 
        SUM(profile_views) as total_views,
        SUM(likes_received) as total_likes_received
      FROM user_statistics
      WHERE user_id = $1`,
      [userId]
    );

    // Calculate match rate
    const totalSwipes = parseInt(swipeStats.rows[0]?.total_swipes || 0);
    const totalLikes = parseInt(swipeStats.rows[0]?.total_likes || 0);
    const totalMatches = parseInt(matchStats.rows[0]?.total_matches || 0);
    const matchRate = totalLikes > 0 ? (totalMatches / totalLikes) * 100 : 0;

    res.json({
      success: true,
      data: {
        swipes: {
          total: totalSwipes,
          likes: parseInt(swipeStats.rows[0]?.total_likes || 0),
          passes: parseInt(swipeStats.rows[0]?.total_passes || 0),
          superLikes: parseInt(swipeStats.rows[0]?.total_super_likes || 0),
        },
        matches: {
          total: totalMatches,
          thisWeek: parseInt(matchStats.rows[0]?.this_week || 0),
          thisMonth: parseInt(matchStats.rows[0]?.this_month || 0),
        },
        messages: {
          sent: parseInt(messageStats.rows[0]?.total_sent || 0),
          received: parseInt(messageStats.rows[0]?.total_received || 0),
          conversations: parseInt(messageStats.rows[0]?.conversations || 0),
        },
        profileViews: parseInt(profileStats.rows[0]?.total_views || 0),
        likesReceived: parseInt(profileStats.rows[0]?.total_likes_received || 0),
        matchRate: Math.round(matchRate * 10) / 10,
        averageResponseTime: 7200, // TODO: Calculate from actual data
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
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

