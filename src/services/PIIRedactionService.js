/**
 * PII Redaction Service
 * Redacts Personally Identifiable Information from logs and data
 * 
 * Property: Property 4 - PII Redaction
 * Validates: Requirements 5
 */

class PIIRedactionService {
  constructor() {
    // PII patterns to redact
    this.patterns = {
      email: {
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        replacement: '[EMAIL_REDACTED]',
      },
      password: {
        regex: /(password["\']?\s*[:=]\s*["\']?)([^"\'\\s]+)/gi,
        replacement: '$1[PASSWORD_REDACTED]',
      },
      token: {
        regex: /(token["\']?\s*[:=]\s*["\']?)([a-zA-Z0-9._-]+)/gi,
        replacement: '$1[TOKEN_REDACTED]',
      },
      apiKey: {
        regex: /(api[_-]?key["\']?\s*[:=]\s*["\']?)([a-zA-Z0-9._-]+)/gi,
        replacement: '$1[API_KEY_REDACTED]',
      },
      phoneNumber: {
        regex: /(\+?\d{1,3}[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\b/g,
        replacement: '[PHONE_REDACTED]',
      },
      creditCard: {
        regex: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
        replacement: '[CARD_REDACTED]',
      },
      ssn: {
        regex: /\b\d{3}-\d{2}-\d{4}\b/g,
        replacement: '[SSN_REDACTED]',
      },
      ipAddress: {
        regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
        replacement: '[IP_REDACTED]',
      },
      uuid: {
        regex: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
        replacement: '[UUID_REDACTED]',
      },
      bearerToken: {
        regex: /(Bearer\s+)([a-zA-Z0-9._-]+)/gi,
        replacement: '$1[TOKEN_REDACTED]',
      },
    };

    // Fields to redact
    // NOTE: userId, user_id, customerId, customer_id are NOT PII - they are identifiers
    // They should NOT be redacted as they are needed for debugging and audit trails
    this.sensitiveFields = [
      'email',
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'api_key',
      'secret',
      'secretKey',
      'secret_key',
      'phoneNumber',
      'phone_number',
      'phone',
      'creditCard',
      'credit_card',
      'cardNumber',
      'card_number',
      'ssn',
      'socialSecurityNumber',
      'social_security_number',
      'ipAddress',
      'ip_address',
      'ip',
      'authToken',
      'auth_token',
      'sessionId',
      'session_id',
    ];
  }

  /**
   * Redact PII from string
   * @param {string} text - Text to redact
   * @returns {string} Redacted text
   */
  redactString(text) {
    if (typeof text !== 'string') {
      return text;
    }

    let redacted = text;

    // Apply all patterns
    Object.values(this.patterns).forEach(({ regex, replacement }) => {
      redacted = redacted.replace(regex, replacement);
    });

    return redacted;
  }

  /**
   * Redact PII from object
   * @param {object} obj - Object to redact
   * @param {Array<string>} fieldsToRedact - Fields to redact (optional)
   * @returns {object} Redacted object
   */
  redactObject(obj, fieldsToRedact = this.sensitiveFields) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const redacted = Array.isArray(obj) ? [...obj] : { ...obj };

    const redactRecursive = (current) => {
      if (Array.isArray(current)) {
        return current.map(item => redactRecursive(item));
      }

      if (current && typeof current === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(current)) {
          // Check if field should be redacted
          const shouldRedact = fieldsToRedact.some(field =>
            key.toLowerCase().includes(field.toLowerCase())
          );

          if (shouldRedact) {
            result[key] = '[REDACTED]';
          } else if (typeof value === 'string') {
            result[key] = this.redactString(value);
          } else if (typeof value === 'object') {
            result[key] = redactRecursive(value);
          } else {
            result[key] = value;
          }
        }
        return result;
      }

      if (typeof current === 'string') {
        return this.redactString(current);
      }

      return current;
    };

    return redactRecursive(redacted);
  }

  /**
   * Redact PII from error
   * @param {Error} error - Error to redact
   * @returns {object} Redacted error object
   */
  redactError(error) {
    if (!error) {
      return error;
    }

    const redacted = {
      name: error.name,
      message: this.redactString(error.message),
      stack: error.stack ? this.redactString(error.stack) : undefined,
    };

    // Redact additional properties
    if (error.context) {
      redacted.context = this.redactObject(error.context);
    }

    if (error.data) {
      redacted.data = this.redactObject(error.data);
    }

    return redacted;
  }

  /**
   * Redact email address
   * @param {string} email - Email to redact
   * @returns {string} Redacted email
   */
  redactEmail(email) {
    if (!email || typeof email !== 'string') {
      return email;
    }

    const parts = email.split('@');
    if (parts.length !== 2) {
      return '[EMAIL_REDACTED]';
    }

    const [localPart, domain] = parts;
    const redactedLocal = localPart.substring(0, 2) + '*'.repeat(Math.max(0, localPart.length - 2));
    return `${redactedLocal}@${domain}`;
  }

  /**
   * Redact password
   * @param {string} password - Password to redact
   * @returns {string} Redacted password
   */
  redactPassword(password) {
    if (!password || typeof password !== 'string') {
      return '[PASSWORD_REDACTED]';
    }

    return '[PASSWORD_REDACTED]';
  }

  /**
   * Redact token
   * @param {string} token - Token to redact
   * @returns {string} Redacted token
   */
  redactToken(token) {
    if (!token || typeof token !== 'string') {
      return '[TOKEN_REDACTED]';
    }

    if (token.length <= 8) {
      return '[TOKEN_REDACTED]';
    }

    const start = token.substring(0, 4);
    const end = token.substring(token.length - 4);
    return `${start}...${end}`;
  }

  /**
   * Redact phone number
   * @param {string} phone - Phone number to redact
   * @returns {string} Redacted phone
   */
  redactPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
      return '[PHONE_REDACTED]';
    }

    // Keep only last 4 digits
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) {
      return '[PHONE_REDACTED]';
    }

    const lastFour = digits.substring(digits.length - 4);
    return `***-***-${lastFour}`;
  }

  /**
   * Check if string contains PII
   * @param {string} text - Text to check
   * @returns {boolean} True if PII found
   */
  containsPII(text) {
    if (typeof text !== 'string') {
      return false;
    }

    return Object.values(this.patterns).some(({ regex }) => {
      regex.lastIndex = 0; // Reset regex state
      return regex.test(text);
    });
  }

  /**
   * Get PII types found in string
   * @param {string} text - Text to analyze
   * @returns {Array<string>} PII types found
   */
  getPIITypes(text) {
    if (typeof text !== 'string') {
      return [];
    }

    const found = [];

    Object.entries(this.patterns).forEach(([type, { regex }]) => {
      regex.lastIndex = 0; // Reset regex state
      if (regex.test(text)) {
        found.push(type);
      }
    });

    return found;
  }

  /**
   * Test PII redaction
   * @returns {object} Test results
   */
  testPIIRedaction() {
    const testCases = {
      email: 'user@example.com',
      password: 'password: "mySecurePassword123"',
      token: 'token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"',
      phone: '+1 (555) 123-4567',
      creditCard: '4532-1234-5678-9010',
      ssn: '123-45-6789',
      ipAddress: '192.168.1.1',
      bearerToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    };

    const results = {};

    Object.entries(testCases).forEach(([type, testValue]) => {
      results[type] = {
        original: testValue,
        redacted: this.redactString(testValue),
        containsPII: this.containsPII(testValue),
        piiTypes: this.getPIITypes(testValue),
      };
    });

    return results;
  }
}

// Export singleton instance
export const piiRedactionService = new PIIRedactionService();
export default PIIRedactionService;
