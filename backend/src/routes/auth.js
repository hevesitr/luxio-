const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool, isDatabaseAvailable } = require('../database/pool');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Twilio client (SMS)
const twilioClient = process.env.TWILIO_ACCOUNT_SID ? twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
) : null;

/**
 * Generate OTP
 */
const generateOTP = (length = 6) => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Calculate age from birth date
 */
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

/**
 * POST /auth/register
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('birthDate').isISO8601(),
  body('gender').isIn(['male', 'female', 'other']),
  body('lookingFor').isArray().notEmpty(),
  body('acceptTerms').equals('true'),
  body('acceptPrivacy').equals('true'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validációs hibák',
          details: errors.array(),
        },
      });
    }

    const { email, phone, password, name, birthDate, gender, lookingFor } = req.body;

    // Check age (must be 18+)
    const age = calculateAge(birthDate);
    if (age < 18) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'AGE_RESTRICTION',
          message: 'Legalább 18 évesnek kell lenned a regisztrációhoz.',
        },
      });
    }

    // Check if email already exists
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Ez az email cím már regisztrálva van.',
        },
      });
    }

    // Check if phone already exists (if provided)
    if (phone) {
      const phoneCheck = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
      if (phoneCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'PHONE_EXISTS',
            message: 'Ez a telefonszám már regisztrálva van.',
          },
        });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, phone, password_hash, name, birth_date, gender, looking_for, email_verification_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, email_verified`,
      [email, phone || null, passwordHash, name, birthDate, gender, lookingFor, emailVerificationToken]
    );

    const user = result.rows[0];

    // Create user settings
    await pool.query(
      `INSERT INTO user_settings (user_id) VALUES ($1)`,
      [user.id]
    );

    // Create profile
    await pool.query(
      `INSERT INTO profiles (user_id) VALUES ($1)`,
      [user.id]
    );

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Erősítsd meg az email címedet',
      html: `
        <h1>Üdvözöllek a Luxio-ban!</h1>
        <p>Kérjük, erősítsd meg az email címedet a következő linkre kattintva:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>Vagy használd ezt a kódot: ${emailVerificationToken.substring(0, 6)}</p>
      `,
    });

    res.status(201).json({
      success: true,
      message: 'Regisztráció sikeres. Kérjük, erősítsd meg az email címedet.',
      data: {
        userId: user.id,
        email: user.email,
        verificationRequired: !user.email_verified,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Szerver hiba történt a regisztráció során.',
      },
    });
  }
});

/**
 * POST /auth/verify-email
 */
router.post('/verify-email', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Érvénytelen adatok',
        },
      });
    }

    const { email, otp } = req.body;

    // Find user
    const userResult = await pool.query(
      'SELECT id, email, email_verification_token FROM users WHERE email = $1',
      [email]
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

    // Verify OTP (simplified - in production, use proper OTP service)
    // For now, check if token starts with OTP
    if (!user.email_verification_token || !user.email_verification_token.startsWith(otp)) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'Érvénytelen OTP kód.',
        },
      });
    }

    // Update user
    await pool.query(
      'UPDATE users SET email_verified = TRUE, email_verification_token = NULL WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );

    // Get user data
    const userDataResult = await pool.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [user.id]
    );

    res.json({
      success: true,
      message: 'Email sikeresen megerősítve',
      data: {
        token,
        refreshToken,
        user: userDataResult.rows[0],
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
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
 * POST /auth/login
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Érvénytelen adatok',
        },
      });
    }

    const { email, password } = req.body;

    // Find user
    const userResult = await pool.query(
      'SELECT id, email, password_hash, email_verified, is_active, is_banned FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Hibás email vagy jelszó.',
        },
      });
    }

    const user = userResult.rows[0];

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Kérjük, erősítsd meg az email címedet.',
        },
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Fiókod inaktív.',
        },
      });
    }

    // Check if user is banned
    if (user.is_banned) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_BANNED',
          message: 'Fiókod letiltva.',
        },
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Hibás email vagy jelszó.',
        },
      });
    }

    // Generate tokens
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );

    // Update last active
    await pool.query('UPDATE users SET last_active = NOW() WHERE id = $1', [user.id]);

    // Get user data
    const userDataResult = await pool.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [user.id]
    );

    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: userDataResult.rows[0],
      },
    });
  } catch (error) {
    console.error('Login error:', error);
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
 * POST /auth/refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Nincs refresh token.',
        },
      });
    }

    const refreshToken = authHeader.substring(7);

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Generate new tokens
    const token = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    const newRefreshToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );

    res.json({
      success: true,
      data: {
        token,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Érvénytelen vagy lejárt refresh token.',
        },
      });
    }

    console.error('Refresh token error:', error);
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
 * POST /auth/logout
 */
router.post('/logout', async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // But we can log the event or invalidate refresh tokens if needed
  res.json({
    success: true,
    message: 'Sikeresen kijelentkeztél',
  });
});

module.exports = router;

