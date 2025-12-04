/**
 * Logger Service - Központi logging rendszer
 * Development módban részletes logolás, production módban csak hibák
 * Implements Requirements 12.1, 12.5
 */

const IS_DEV = __DEV__;

class Logger {
  constructor() {
    // PII mezők, amiket ki kell szűrni
    this.piiFields = [
      'email',
      'phone',
      'phone_number',
      'full_name',
      'first_name',
      'last_name',
      'address',
      'credit_card',
      'ssn',
      'password'
    ];

    // PII minták, amiket regex-szel kell keresni
    this.piiPatterns = [
      {
        name: 'email',
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        replacement: '[EMAIL_REDACTED]'
      },
      {
        name: 'phone',
        pattern: /(\+?\d{1,3}[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\b/g,
        replacement: '[PHONE_REDACTED]'
      },
      {
        name: 'credit_card',
        pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
        replacement: '[CARD_REDACTED]'
      }
    ];
  }

  /**
   * Debug szintű log (csak development-ben)
   */
  debug(message, context = {}) {
    if (IS_DEV) {
      console.log(`[DEBUG] ${message}`, context);
    }
  }

  /**
   * Info szintű log
   */
  info(message, context = {}) {
    if (IS_DEV) {
      console.info(`[INFO] ${message}`, context);
    }
  }

  /**
   * Success szintű log (zöld színnel development-ben)
   */
  success(message, context = {}) {
    if (IS_DEV) {
      console.log(`✅ [SUCCESS] ${message}`, context);
    }
  }

  /**
   * Warning szintű log
   */
  warn(message, context = {}) {
    console.warn(`⚠️ [WARN] ${message}`, context);
  }

  /**
   * Error szintű log (mindig logol) - timestamp és PII védelemmel
   */
  error(message, error, context = {}) {
    const timestamp = new Date().toISOString();
    const sanitizedContext = this.sanitizeLogData(context);
    const sanitizedMessage = this.redactPIIFromString(message);

    console.error(`❌ [ERROR] ${timestamp} ${sanitizedMessage}`, {
      error: error?.message || error,
      stack: error?.stack,
      context: sanitizedContext,
      timestamp,
    });
  }

  /**
   * Warning szintű log PII védelemmel
   */
  warn(message, context = {}) {
    const timestamp = new Date().toISOString();
    const sanitizedContext = this.sanitizeLogData(context);
    const sanitizedMessage = this.redactPIIFromString(message);

    console.warn(`⚠️ [WARN] ${timestamp} ${sanitizedMessage}`, {
      context: sanitizedContext,
      timestamp,
    });
  }

  /**
   * PII redaction string-ből
   */
  redactPIIFromString(text) {
    if (!text || typeof text !== 'string') return text;

    let sanitized = text;
    this.piiPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern.pattern, pattern.replacement);
    });

    return sanitized;
  }

  /**
   * PII redaction objektumból
   */
  redactPIIFromObject(obj, maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth || !obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.redactPIIFromObject(item, maxDepth, currentDepth + 1));
    }

    const sanitized = { ...obj };

    // PII mezők redakciója mező név alapján
    this.piiFields.forEach(field => {
      if (sanitized[field] !== undefined) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // PII minták keresése string értékekben
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = this.redactPIIFromString(sanitized[key]);
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.redactPIIFromObject(sanitized[key], maxDepth, currentDepth + 1);
      }
    });

    return sanitized;
  }

  /**
   * Log adatok PII védelem alá helyezése
   */
  sanitizeLogData(data) {
    if (data === null || data === undefined) return data;
    if (typeof data === 'string') return this.redactPIIFromString(data);
    if (typeof data === 'object') return this.redactPIIFromObject(data);
    return data;
  }

  /**
   * Network request log
   */
  network(method, url, status, duration) {
    if (IS_DEV) {
      const statusEmoji = status >= 200 && status < 300 ? '✅' : '❌';
      console.log(`${statusEmoji} [NETWORK] ${method} ${url} - ${status} (${duration}ms)`);
    }
  }
}

export default new Logger();
