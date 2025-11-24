require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const winston = require('winston');
const { pool, isDatabaseAvailable } = require('./database/pool');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profiles');
const matchRoutes = require('./routes/matches');
const messageRoutes = require('./routes/messages');
const searchRoutes = require('./routes/search');
const mediaRoutes = require('./routes/media');
const moderationRoutes = require('./routes/moderation');
const paymentRoutes = require('./routes/payments');
const gdprRoutes = require('./routes/gdpr');
const notificationRoutes = require('./routes/notifications');
const statsRoutes = require('./routes/stats');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/authenticate');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || './logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: process.env.LOG_FILE || './logs/app.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Data sanitization
app.use(mongoSanitize());
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: 'Túl sok kérés. Kérjük, próbáld újra később.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(`/api/${API_VERSION}`, limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: 'Túl sok bejelentkezési kísérlet. Kérjük, próbáld újra 15 perc múlva.',
});
app.use(`/api/${API_VERSION}/auth`, authLimiter);

// Health check
app.get('/health', async (req, res) => {
  const dbStatus = isDatabaseAvailable();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus ? 'connected' : 'disconnected',
  });
});

// API Routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, authenticate, userRoutes);
app.use(`/api/${API_VERSION}/profiles`, authenticate, profileRoutes);
app.use(`/api/${API_VERSION}/matches`, authenticate, matchRoutes);
app.use(`/api/${API_VERSION}/messages`, authenticate, messageRoutes);
app.use(`/api/${API_VERSION}/search`, authenticate, searchRoutes);
app.use(`/api/${API_VERSION}/media`, authenticate, mediaRoutes);
app.use(`/api/${API_VERSION}/moderation`, authenticate, moderationRoutes);
app.use(`/api/${API_VERSION}/payments`, authenticate, paymentRoutes);
app.use(`/api/${API_VERSION}/gdpr`, authenticate, gdprRoutes);
app.use(`/api/${API_VERSION}/notifications`, authenticate, notificationRoutes);
app.use(`/api/${API_VERSION}/stats`, authenticate, statsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint nem található',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  if (isDatabaseAvailable()) {
    pool.end(() => {
      logger.info('Database pool closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  if (isDatabaseAvailable()) {
    pool.end(() => {
      logger.info('Database pool closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`API version: ${API_VERSION}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

