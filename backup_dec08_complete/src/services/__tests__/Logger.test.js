/**
 * Logger Service Tests
 *
 * Tests for error logging with PII protection
 */
import Logger from '../Logger';

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

global.console = mockConsole;

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PII Protection', () => {
    describe('redactPIIFromString', () => {
      it('should redact email addresses', () => {
        const text = 'User email is john.doe@example.com';
        const redacted = Logger.redactPIIFromString(text);

        expect(redacted).toBe('User email is [EMAIL_REDACTED]');
        expect(redacted).not.toContain('john.doe@example.com');
      });

      it('should redact phone numbers', () => {
        const text = 'Call me at 555-123-4567';
        const redacted = Logger.redactPIIFromString(text);

        expect(redacted).toBe('Call me at [PHONE_REDACTED]');
        expect(redacted).not.toContain('555-123-4567');
      });

      it('should redact multiple PII instances', () => {
        const text = 'Contact john@example.com or call 555-123-4567';
        const redacted = Logger.redactPIIFromString(text);

        expect(redacted).toContain('[EMAIL_REDACTED]');
        expect(redacted).toContain('[PHONE_REDACTED]');
        expect(redacted).not.toContain('john@example.com');
        expect(redacted).not.toContain('555-123-4567');
      });
    });

    describe('redactPIIFromObject', () => {
      it('should redact PII fields by name', () => {
        const obj = {
          email: 'test@example.com',
          name: 'John Doe',
          phone: '+1234567890',
          age: 25,
        };

        const redacted = Logger.redactPIIFromObject(obj);

        expect(redacted.email).toBe('[REDACTED]');
        expect(redacted.phone).toBe('[REDACTED]');
        expect(redacted.name).toBe('John Doe');
        expect(redacted.age).toBe(25);
      });

      it('should redact PII in nested objects', () => {
        const obj = {
          user: {
            email: 'test@example.com',
            profile: {
              phone: '+1234567890',
            },
          },
          normalField: 'normal_value',
        };

        const redacted = Logger.redactPIIFromObject(obj);

        expect(redacted.user.email).toBe('[REDACTED]');
        expect(redacted.user.profile.phone).toBe('[REDACTED]');
        expect(redacted.normalField).toBe('normal_value');
      });

      it('should redact PII in arrays', () => {
        const obj = {
          users: [
            { email: 'user1@example.com', name: 'User 1' },
            { email: 'user2@example.com', name: 'User 2' },
          ],
        };

        const redacted = Logger.redactPIIFromObject(obj);

        expect(redacted.users[0].email).toBe('[REDACTED]');
        expect(redacted.users[1].email).toBe('[REDACTED]');
        expect(redacted.users[0].name).toBe('User 1');
        expect(redacted.users[1].name).toBe('User 2');
      });

      it('should redact PII patterns in string values', () => {
        const obj = {
          message: 'Contact user@example.com or call 555-123-4567',
        };

        const redacted = Logger.redactPIIFromObject(obj);

        expect(redacted.message).toContain('[EMAIL_REDACTED]');
        expect(redacted.message).toContain('[PHONE_REDACTED]');
      });
    });

    describe('sanitizeLogData', () => {
      it('should sanitize string data', () => {
        const data = 'Email: test@example.com, Phone: 555-123-4567';
        const sanitized = Logger.sanitizeLogData(data);

        expect(sanitized).toContain('[EMAIL_REDACTED]');
        expect(sanitized).toContain('[PHONE_REDACTED]');
      });

      it('should sanitize object data', () => {
        const data = {
          email: 'test@example.com',
          phone: '+1234567890',
          name: 'John Doe',
        };

        const sanitized = Logger.sanitizeLogData(data);

        expect(sanitized.email).toBe('[REDACTED]');
        expect(sanitized.phone).toBe('[REDACTED]');
        expect(sanitized.name).toBe('John Doe');
      });

      it('should handle null and undefined', () => {
        expect(Logger.sanitizeLogData(null)).toBeNull();
        expect(Logger.sanitizeLogData(undefined)).toBeUndefined();
      });
    });
  });

  describe('logError with PII protection', () => {
    it('should redact PII from error messages', () => {
      const error = new Error('User failed');
      const context = {
        email: 'test@example.com',
        phone: '+1234567890',
        userId: 'user-123',
      };

      Logger.error('Error occurred', error, context);

      // Check that console.error was called with sanitized data
      expect(mockConsole.error).toHaveBeenCalled();
      const errorCall = mockConsole.error.mock.calls[0];

      // The error message and context should be sanitized
      expect(errorCall[1].error).toBe('User failed');
      expect(errorCall[1].context.email).toBe('[REDACTED]');
      expect(errorCall[1].context.phone).toBe('[REDACTED]');
      expect(errorCall[1].context.userId).toBe('user-123');
    });

    it('should redact PII from context', () => {
      const error = new Error('Test error');
      const context = {
        email: 'test@example.com',
        normalField: 'normal_value',
      };

      Logger.error('Test error', error, context);

      const errorCall = mockConsole.error.mock.calls[0];
      expect(errorCall[1].context.email).toBe('[REDACTED]');
      expect(errorCall[1].context.normalField).toBe('normal_value');
    });
  });

  describe('warn with PII protection', () => {
    it('should redact PII from warning messages', () => {
      const message = 'Warning for user test@example.com';
      const context = {
        email: 'test@example.com',
        level: 'warning',
      };

      Logger.warn(message, context);

      expect(mockConsole.warn).toHaveBeenCalled();
      const warnCall = mockConsole.warn.mock.calls[0];

      // Check that message and context are sanitized
      expect(warnCall[0]).toContain('[EMAIL_REDACTED]');
      expect(warnCall[1].context.email).toBe('[REDACTED]');
      expect(warnCall[1].context.level).toBe('warning');
    });
  });
});
