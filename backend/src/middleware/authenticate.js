const jwt = require('jsonwebtoken');
const { pool, isDatabaseAvailable } = require('../database/pool');

/**
 * JWT Authentication Middleware
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Nincs autentikáció. Kérjük, jelentkezz be.',
        },
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists and is active
    const userResult = await pool.query(
      'SELECT id, email, is_active, is_banned FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Felhasználó nem található.',
        },
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Fiókod inaktív.',
        },
      });
    }

    if (user.is_banned) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Fiókod letiltva.',
        },
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
    };

    // Update last active
    await pool.query(
      'UPDATE users SET last_active = NOW() WHERE id = $1',
      [user.id]
    );

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Érvénytelen token.',
        },
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token lejárt. Kérjük, jelentkezz be újra.',
        },
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Szerver hiba történt.',
      },
    });
  }
};

module.exports = { authenticate };

