/**
 * Property-based tests for Logger
 * Testing PII protection and data sanitization
 */
import fc from 'fast-check';
import Logger from '../../Logger';

// Mock console methods
const originalConsole = global.console;
beforeEach(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});

afterEach(() => {
  global.console = originalConsole;
});

describe('Logger - PII Protection Properties', () => {
  let logger;

  beforeEach(() => {
    logger = require('../../Logger').default;
  });

  describe('PII Redaction from Strings', () => {
    it('should redact email addresses from strings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            prefix: fc.string(),
            email: fc.emailAddress(),
            suffix: fc.string(),
          }),
          async (data) => {
            const testString = `${data.prefix} ${data.email} ${data.suffix}`;
            const redacted = logger.redactPIIFromString(testString);

            // Email should be redacted
            expect(redacted).not.toContain(data.email);
            expect(redacted).toContain('[EMAIL_REDACTED]');
          }
        )
      );
    });

    it('should redact phone numbers from strings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            prefix: fc.string(),
            phone: fc.oneof(
              fc.constant('(555) 123-4567'),
              fc.constant('555-123-4567'),
              fc.constant('555.123.4567'),
              fc.constant('555 123 4567'),
              fc.constant('+1-555-123-4567')
            ),
            suffix: fc.string(),
          }),
          async (data) => {
            const testString = `${data.prefix} ${data.phone} ${data.suffix}`;
            const redacted = logger.redactPIIFromString(testString);

            // Phone should be redacted
            expect(redacted).not.toContain(data.phone.replace(/[-\.\s\(\)]/g, ''));
            expect(redacted).toContain('[PHONE_REDACTED]');
          }
        )
      );
    });

    it('should redact credit card numbers from strings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            prefix: fc.string(),
            cardNumber: fc.oneof(
              fc.constant('4111 1111 1111 1111'),
              fc.constant('4111111111111111'),
              fc.constant('4111-1111-1111-1111')
            ),
            suffix: fc.string(),
          }),
          async (data) => {
            const testString = `${data.prefix} ${data.cardNumber} ${data.suffix}`;
            const redacted = logger.redactPIIFromString(testString);

            // Card number should be redacted
            expect(redacted).not.toContain(data.cardNumber.replace(/[-\s]/g, ''));
            expect(redacted).toContain('[CARD_REDACTED]');
          }
        )
      );
    });

    it('should handle multiple PII types in same string', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            phone: fc.constant('555-123-4567'),
            card: fc.constant('4111111111111111'),
          }),
          async (data) => {
            const testString = `Contact: ${data.email} at ${data.phone} with card ${data.card}`;
            const redacted = logger.redactPIIFromString(testString);

            // All PII should be redacted
            expect(redacted).not.toContain(data.email);
            expect(redacted).not.toContain(data.phone);
            expect(redacted).not.toContain(data.card);
            expect(redacted).toContain('[EMAIL_REDACTED]');
            expect(redacted).toContain('[PHONE_REDACTED]');
            expect(redacted).toContain('[CARD_REDACTED]');
          }
        )
      );
    });
  });

  describe('PII Redaction from Objects', () => {
    it('should redact PII fields by name', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            phone: fc.string(),
            name: fc.string(),
            safeField: fc.string(),
          }),
          async (data) => {
            const testObject = { ...data, otherData: 'safe' };
            const redacted = logger.redactPIIFromObject(testObject);

            // PII fields should be redacted
            expect(redacted.email).toBe('[REDACTED]');
            expect(redacted.phone).toBe('[REDACTED]');
            expect(redacted.name).toBe('[REDACTED]');

            // Safe fields should remain
            expect(redacted.safeField).toBe(data.safeField);
            expect(redacted.otherData).toBe('safe');
          }
        )
      );
    });

    it('should handle nested objects correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            user: fc.record({
              email: fc.emailAddress(),
              profile: fc.record({
                phone: fc.string(),
                address: fc.string(),
              }),
            }),
            safeData: fc.string(),
          }),
          async (data) => {
            const redacted = logger.redactPIIFromObject(data, 3, 0);

            // Nested PII should be redacted
            expect(redacted.user.email).toBe('[REDACTED]');
            expect(redacted.user.profile.phone).toBe('[REDACTED]');
            expect(redacted.user.profile.address).toBe('[REDACTED]');

            // Safe data should remain
            expect(redacted.safeData).toBe(data.safeData);
          }
        )
      );
    });

    it('should handle arrays correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.record({
            email: fc.emailAddress(),
            safeField: fc.string(),
          }), { minLength: 1, maxLength: 5 }),
          async (userArray) => {
            const testData = { users: userArray, total: userArray.length };
            const redacted = logger.redactPIIFromObject(testData);

            // All emails in array should be redacted
            redacted.users.forEach(user => {
              expect(user.email).toBe('[REDACTED]');
              expect(user.safeField).not.toBe('[REDACTED]');
            });

            // Safe fields should remain
            expect(redacted.total).toBe(userArray.length);
          }
        )
      );
    });

    it('should respect max depth to prevent infinite recursion', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }), // Test different depths
          async (depth) => {
            // Create deeply nested object
            let obj = { value: 'safe' };
            for (let i = 0; i < depth; i++) {
              obj = { nested: obj, email: 'test@example.com' };
            }

            const redacted = logger.redactPIIFromObject(obj, 3, 0);

            // Should not crash and should redact within depth limit
            expect(redacted).toBeDefined();
            // Root level email should be redacted
            expect(redacted.email).toBe('[REDACTED]');
          }
        )
      );
    });
  });

  describe('Log Data Sanitization', () => {
    it('should sanitize various data types correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            string: fc.string(),
            number: fc.integer(),
            boolean: fc.boolean(),
            nullValue: fc.constant(null),
            undefinedValue: fc.constant(undefined),
            object: fc.record({
              email: fc.emailAddress(),
              safe: fc.string(),
            }),
            array: fc.array(fc.record({
              phone: fc.string(),
              safe: fc.string(),
            })),
          }),
          async (testData) => {
            const sanitized = logger.sanitizeLogData(testData);

            // String should be processed for PII
            if (typeof testData.string === 'string') {
              // This might contain PII or not, but function should handle it
              expect(typeof sanitized.string).toBe('string');
            }

            // Other types should remain unchanged
            expect(sanitized.number).toBe(testData.number);
            expect(sanitized.boolean).toBe(testData.boolean);
            expect(sanitized.nullValue).toBe(null);
            expect(sanitized.undefinedValue).toBe(undefined);

            // Object PII should be redacted
            expect(sanitized.object.email).toBe('[REDACTED]');
            expect(sanitized.object.safe).toBe(testData.object.safe);

            // Array PII should be redacted
            sanitized.array.forEach((item, index) => {
              expect(item.phone).toBe('[REDACTED]');
              expect(item.safe).toBe(testData.array[index].safe);
            });
          }
        )
      );
    });
  });

  describe('GDPR Compliance', () => {
    it('should never log PII data in any context', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            message: fc.string(),
            context: fc.record({
              email: fc.emailAddress(),
              phone: fc.string(),
              name: fc.string(),
              safeData: fc.string(),
            }),
          }),
          async (logData) => {
            // Test all log levels
            const logLevels = ['debug', 'info', 'success', 'warn'];

            for (const level of logLevels) {
              // Clear console mocks
              console.log.mockClear();
              console.info.mockClear();
              console.warn.mockClear();

              // Call log method
              logger[level](logData.message, logData.context);

              // Check that PII was not logged
              const loggedCalls = console.log.mock.calls.concat(
                console.info.mock.calls,
                console.warn.mock.calls
              );

              loggedCalls.forEach(call => {
                const loggedContent = JSON.stringify(call);
                expect(loggedContent).not.toContain(logData.context.email);
                expect(loggedContent).not.toContain(logData.context.phone);
                expect(loggedContent).not.toContain(logData.context.name);
                // Safe data should still be there
                if (logData.context.safeData) {
                  expect(loggedContent).toContain(logData.context.safeData);
                }
              });
            }
          }
        )
      );
    });

    it('should handle sensitive operation logging', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            action: fc.constantFrom('login', 'signup', 'password_change', 'profile_update'),
            subject: fc.string(),
            details: fc.record({
              email: fc.emailAddress(),
              ip: fc.ipV4(),
              userAgent: fc.string(),
            }),
          }),
          async (auditData) => {
            console.log.mockClear();

            // Test audit logging
            logger.audit(auditData.action, auditData.subject, auditData.details);

            // Check that audit was logged but PII was redacted
            const loggedCalls = console.log.mock.calls;
            expect(loggedCalls.length).toBeGreaterThan(0);

            const loggedContent = JSON.stringify(loggedCalls);
            expect(loggedContent).not.toContain(auditData.details.email);
            expect(loggedContent).toContain('[REDACTED]');
          }
        )
      );
    });
  });
});
