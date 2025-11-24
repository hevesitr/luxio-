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
 * POST /payments/subscribe
 * Prémium előfizetés vásárlása
 */
router.post('/subscribe', async (req, res) => {
  try {
    const userId = req.user.id;
    const { tier, platform, receipt, transactionId } = req.body;

    if (!tier || !platform || (!receipt && !transactionId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_DATA',
          message: 'Tier, platform és receipt/transaction ID kötelező.',
        },
      });
    }

    // Validate tier
    const validTiers = ['plus', 'gold', 'platinum'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TIER',
          message: 'Érvénytelen tier.',
        },
      });
    }

    // TODO: Validate receipt with App Store/Play Store
    // For now, just create subscription

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    // Create subscription
    const subscriptionResult = await pool.query(
      `INSERT INTO subscriptions (user_id, tier, platform, start_date, end_date, auto_renew, status, original_transaction_id, latest_receipt)
       VALUES ($1, $2, $3, $4, $5, TRUE, 'active', $6, $7)
       RETURNING id, start_date, end_date`,
      [userId, tier, platform, startDate, endDate, transactionId || null, receipt || null]
    );

    const subscription = subscriptionResult.rows[0];

    // Update user profile
    await pool.query(
      `UPDATE profiles 
       SET is_premium = TRUE, premium_tier = $1, premium_expires_at = $2
       WHERE user_id = $3`,
      [tier, endDate, userId]
    );

    // Create payment record
    await pool.query(
      `INSERT INTO payments (user_id, subscription_id, amount, currency, platform, transaction_id, receipt_data, status)
       VALUES ($1, $2, $3, 'HUF', $4, $5, $6, 'completed')`,
      [userId, subscription.id, 0, platform, transactionId || null, receipt || null]
    );

    res.json({
      success: true,
      data: {
        subscription: {
          id: subscription.id,
          tier,
          startDate: subscription.start_date,
          endDate: subscription.end_date,
          autoRenew: true,
          status: 'active',
        },
      },
    });
  } catch (error) {
    console.error('Subscribe error:', error);
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
 * GET /payments/subscription
 * Aktuális előfizetés lekérése
 */
router.get('/subscription', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        id,
        tier,
        start_date,
        end_date,
        auto_renew,
        status
      FROM subscriptions
      WHERE user_id = $1
        AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NO_SUBSCRIPTION',
          message: 'Nincs aktív előfizetés.',
        },
      });
    }

    res.json({
      success: true,
      data: {
        subscription: result.rows[0],
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
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
 * POST /payments/cancel
 * Előfizetés lemondása
 */
router.post('/cancel', async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      `UPDATE subscriptions 
       SET status = 'cancelled', cancelled_at = NOW(), auto_renew = FALSE
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Előfizetés lemondva',
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
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

