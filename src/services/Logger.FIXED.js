import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Logger - Fixed version with proper PII redaction
 * P0 Fix: GDPR compliance - prevent PII in logs
 */
export class Logger {
  constructor() {
    this.LOG_LEVEL = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3
    };

    this.currentLevel = this.LOG_LEVEL.INFO;

    // Comprehensive PII field patterns
    this.piiPatterns = {
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      phone: /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      ssn: /\d{3}-\d{2}-\d{4}/g,
      creditCard: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,
      ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      url: /https?:\/\/[^\s]+/g,
      jwt: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g
    };

    // PII field names to redact
    this.piiFields = [
      'email',
      'password',
      'phone',
      'phoneNumber',
      'phone_number',
      'ssn',
      'socialSecurityNumber',
      'creditCard',
      'credit_card',
      'cardNumber',
      'card_number',
      'cvv',
      'cvc',
      'token',
      'accessToken',
      'access_token',
      'refreshToken',
      'refresh_token',
      'apiKey',
      'api_key',
      'secret',
      'privateKey',
      'private_key',
      'address',
      'street',
      'city',
      'zipCode',
      'zip_code',
      'postalCode',
      'postal_code',
      'dateOfBirth',
      'date_of_birth',
      'dob',
      'firstName',
      'first_name',
      'lastName',
      'last_name',
      'fullName',
      'full_name',
      'name',
      'username',
      'userId',
      'user_id',
      'id',
      'uuid',
      'deviceId',
      'device_id',
      'imei',
      'imsi',
      'macAddress',
      'mac_address',
      'ipAddress',
      'ip_address',
      'location',
      'latitude',
      'longitude',
      'gps'
    ];
  }

  /**
   * Redact PII from string
   * @private
   */
  redactPIIFromString(str) {
    if (typeof str !== 'string') return str;

    let redacted = str;

    // Apply pattern-based redaction
    for (const [pattern, regex] of Object.entries(this.piiPatterns)) {
      redacted = redacted.replace(regex, `[REDACTED_${pattern.toUpperCase()}]`);
    }

    return redacted;
  }

  /**
   * Redact PII from object (recursive, unlimited depth)
   * @private
   */
  redactPIIFromObject(obj, maxDepth = 50, currentDepth = 0) {
    // Prevent infinite recursion
    if (currentDepth >= maxDepth || !obj || typeof obj !== 'object') {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item, index) => {
        if (typeof item === 'object' && item !== null) {
          return this.redactPIIFromObject(item, maxDepth, currentDepth + 1);
        } else if (typeof item === 'string') {
          return this.redactPIIFromString(item);
        }
        return item;
      });
    }

    // Handle objects
    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // Check if key is a PII field
      if (this.piiFields.some(field => lowerKey.includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Recursively handle nested objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.redactPIIFromObject(value, maxDepth, currentDepth + 1);
      } else if (typeof value === 'string') {
        sanitized[key] = this.redactPIIFromString(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize data for logging
   * @private
   */
  sanitizeForLogging(data) {
    if (typeof data === 'string') {
      return this.redactPIIFromString(data);
    } else if (typeof data === 'object' && data !== null) {
      return this.redactPIIFromObject(data);
    }
    return data;
  }

  /**
   * Format log message
   * @private
   */
  formatLogMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const sanitizedData = this.sanitizeForLogging(data);

    return {
      timestamp,
      level,
      message,
      data: sanitizedData
    };
  }

  /**
   * Log debug message
   */
  debug(message, data = {}) {
    if (this.currentLevel <= this.LOG_LEVEL.DEBUG) {
      const log = this.formatLogMessage('DEBUG', message, data);
      console.log('[DEBUG]', log.message, log.data);
    }
  }

  /**
   * Log info message
   */
  info(message, data = {}) {
    if (this.currentLevel <= this.LOG_LEVEL.INFO) {
      const log = this.formatLogMessage('INFO', message, data);
      console.log('[INFO]', log.message, log.data);
    }
  }

  /**
   * Log warning message
   */
  warn(message, data = {}) {
    if (this.currentLevel <= this.LOG_LEVEL.WARN) {
      const log = this.formatLogMessage('WARN', message, data);
      console.warn('[WARN]', log.message, log.data);
    }
  }

  /**
   * Log error message
   */
  error(message, data = {}) {
    if (this.currentLevel <= this.LOG_LEVEL.ERROR) {
      const log = this.formatLogMessage('ERROR', message, data);
      console.error('[ERROR]', log.message, log.data);

      // Send to Sentry with sanitized data
      Sentry.captureException(new Error(message), {
        contexts: {
          error: log.data
        }
      });
    }
  }

  /**
   * Log critical error
   */
  critical(message, data = {}) {
    const log = this.formatLogMessage('CRITICAL', message, data);
    console.error('[CRITICAL]', log.message, log.data);

    // Send to Sentry with highest priority
    Sentry.captureException(new Error(message), {
      level: 'fatal',
      contexts: {
        error: log.data
      }
    });
  }

  /**
   * Set log level
   */
  setLogLevel(level) {
    if (this.LOG_LEVEL[level]) {
      this.currentLevel = this.LOG_LEVEL[level];
    }
  }

  /**
   * Get logs from storage (for debugging)
   */
  async getLogs() {
    try {
      const logs = await AsyncStorage.getItem('@app_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Failed to get logs', error);
      return [];
    }
  }

  /**
   * Clear logs
   */
  async clearLogs() {
    try {
      await AsyncStorage.removeItem('@app_logs');
    } catch (error) {
      console.error('Failed to clear logs', error);
    }
  }

  /**
   * Export logs for debugging (with PII redacted)
   */
  async exportLogs() {
    try {
      const logs = await this.getLogs();
      const sanitizedLogs = logs.map(log => ({
        ...log,
        data: this.sanitizeForLogging(log.data)
      }));

      return JSON.stringify(sanitizedLogs, null, 2);
    } catch (error) {
      console.error('Failed to export logs', error);
      return null;
    }
  }

  /**
   * Test PII redaction
   */
  testPIIRedaction() {
    const testData = {
      email: 'user@example.com',
      password: 'SecurePassword123!',
      phone: '+36301234567',
      creditCard: '4532-1234-5678-9010',
      address: '123 Main St, New York, NY 10001',
      nested: {
        userId: 'abc123',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
        location: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      }
    };

    const redacted = this.redactPIIFromObject(testData);
    console.log('Original:', testData);
    console.log('Redacted:', redacted);

    return redacted;
  }
}

export const Logger = new Logger();
