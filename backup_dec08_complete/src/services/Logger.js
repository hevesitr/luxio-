/**
 * Logger Service - Központi logging rendszer
 * Development módban részletes logolás, production módban csak hibák
 * Implements Requirements 12.1, 12.5
 * Phase 1: Enhanced with PIIRedactionService for comprehensive PII protection
 */

// Phase 1: Import PII Redaction Service
import { piiRedactionService } from './PIIRedactionService';

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
   * Debug szintű log (csak development-ben) - PII védelemmel
   */
  debug(message, context = {}) {
    if (IS_DEV) {
      const sanitizedMessage = this.redactPIIFromString(message);
      const sanitizedContext = this.sanitizeLogData(context);
      console.log(`[DEBUG] ${sanitizedMessage}`, sanitizedContext);
    }
  }

  /**
   * Info szintű log - PII védelemmel
   */
  info(message, context = {}) {
    if (IS_DEV) {
      const sanitizedMessage = this.redactPIIFromString(message);
      const sanitizedContext = this.sanitizeLogData(context);
      console.info(`[INFO] ${sanitizedMessage}`, sanitizedContext);
    }
  }

  /**
   * Success szintű log (zöld színnel development-ben) - PII védelemmel
   */
  success(message, context = {}) {
    if (IS_DEV) {
      const sanitizedMessage = this.redactPIIFromString(message);
      const sanitizedContext = this.sanitizeLogData(context);
      console.log(`✅ [SUCCESS] ${sanitizedMessage}`, sanitizedContext);
    }
  }

  /**
   * Warning szintű log - PII védelemmel
   */
  warn(message, context = {}) {
    const sanitizedMessage = this.redactPIIFromString(message);
    const sanitizedContext = this.sanitizeLogData(context);
    console.warn(`⚠️ [WARN] ${sanitizedMessage}`, sanitizedContext);
  }

  /**
   * Error szintű log (mindig logol) - timestamp és PII védelemmel
   * Phase 1: Enhanced with comprehensive PII redaction
   */
  error(message, error, context = {}) {
    const timestamp = new Date().toISOString();
    
    // Phase 1: Use PIIRedactionService for comprehensive redaction
    const redactedMessage = piiRedactionService.redactString(message);
    const redactedContext = piiRedactionService.redactObject(context);
    const redactedError = piiRedactionService.redactError(error);

    console.error(`❌ [ERROR] ${timestamp} ${redactedMessage}`, {
      error: redactedError?.message || redactedError,
      stack: redactedError?.stack,
      context: redactedContext,
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
   * Production-ready log minden szinten PII védelemmel
   */
  log(level, message, context = {}) {
    const sanitizedMessage = this.redactPIIFromString(message);
    const sanitizedContext = this.sanitizeLogData(context);
    const timestamp = new Date().toISOString();

    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message: sanitizedMessage,
      context: sanitizedContext
    };

    // Always log errors and warnings
    if (level === 'error' || level === 'warn') {
      console.error(`[${level.toUpperCase()}] ${timestamp} ${sanitizedMessage}`, sanitizedContext);
    } else if (IS_DEV) {
      console.log(`[${level.toUpperCase()}] ${sanitizedMessage}`, sanitizedContext);
    }

    // In production, you would send to logging service here
    // this.sendToLoggingService(logEntry);
  }

  /**
   * Network request log - PII védelemmel
   */
  network(method, url, status, duration) {
    // Sanitize URL to remove potential PII
    const sanitizedUrl = this.redactPIIFromString(url);
    const statusEmoji = status >= 200 && status < 300 ? '✅' : '❌';

    if (IS_DEV) {
      console.log(`${statusEmoji} [NETWORK] ${method} ${sanitizedUrl} - ${status} (${duration}ms)`);
    }
  }

  /**
   * Security event log - mindig logol, extra PII védelem
   */
  security(event, details = {}) {
    const sanitizedDetails = this.sanitizeLogData(details);
    const timestamp = new Date().toISOString();

    console.warn(`🔒 [SECURITY] ${timestamp} ${event}`, {
      ...sanitizedDetails,
      security: true,
      timestamp
    });

    // In production, send to security monitoring
    // this.sendToSecurityService(event, sanitizedDetails);
  }

  /**
   * GDPR compliance audit log
   */
  audit(action, subject, details = {}) {
    const sanitizedDetails = this.sanitizeLogData(details);
    const timestamp = new Date().toISOString();

    const auditEntry = {
      timestamp,
      action,
      subject,
      details: sanitizedDetails,
      compliance: 'GDPR'
    };

    if (IS_DEV) {
      console.log(`📋 [AUDIT] ${action} on ${subject}`, sanitizedDetails);
    }

    // Store audit trail (in production, send to secure audit service)
    // this.storeAuditEntry(auditEntry);
  }
}

export default new Logger();
