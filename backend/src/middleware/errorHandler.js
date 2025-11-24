const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
  ],
});

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: req.user?.id,
  });

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Szerver hiba történt.';
  let code = err.code || 'INTERNAL_ERROR';

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validációs hiba';
    code = 'VALIDATION_ERROR';
  }

  // Database errors
  if (err.code === '23505') { // Unique violation
    statusCode = 409;
    message = 'Ez az adat már létezik.';
    code = 'DUPLICATE_ENTRY';
  }

  if (err.code === '23503') { // Foreign key violation
    statusCode = 400;
    message = 'Érvénytelen referencia.';
    code = 'FOREIGN_KEY_VIOLATION';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Érvénytelen token.';
    code = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token lejárt.';
    code = 'TOKEN_EXPIRED';
  }

  // Response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

module.exports = { errorHandler };

