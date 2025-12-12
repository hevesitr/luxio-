/**
 * Security Headers Middleware
 * Adds security headers to all HTTP responses
 * 
 * Property: Property 18 - Security Header Presence
 * Validates: Requirements 19 (Security Headers)
 */

const helmet = require('helmet');

/**
 * Configure security headers middleware
 */
const configureSecurityHeaders = (app) => {
  // Use Helmet for basic security headers
  app.use(helmet());

  // Content Security Policy
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.supabase.co'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    })
  );

  // Strict Transport Security
  app.use(
    helmet.hsts({
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    })
  );

  // X-Frame-Options
  app.use(
    helmet.frameguard({
      action: 'deny',
    })
  );

  // X-Content-Type-Options
  app.use(helmet.noSniff());

  // X-XSS-Protection
  app.use(
    helmet.xssFilter({
      setOnOldIE: true,
    })
  );

  // Referrer Policy
  app.use(
    helmet.referrerPolicy({
      policy: 'strict-origin-when-cross-origin',
    })
  );

  // Hide X-Powered-By
  app.use(helmet.hidePoweredBy());

  // DNS Prefetch Control
  app.use(
    helmet.dnsPrefetchControl({
      allow: false,
    })
  );

  // IE No Open
  app.use(helmet.ieNoOpen());

  // Custom security headers
  app.use((req, res, next) => {
    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(self), microphone=(), camera=()'
    );

    // X-Download-Options
    res.setHeader('X-Download-Options', 'noopen');

    // X-Permitted-Cross-Domain-Policies
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    next();
  });

  console.log('[Security] Security headers configured');
};

module.exports = { configureSecurityHeaders };
