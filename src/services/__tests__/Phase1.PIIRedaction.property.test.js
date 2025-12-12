/**
 * Phase 1 Property Test: PII Redaction
 * Feature: history-recovery, Property 4: PII Redaction
 * 
 * Property: For any logged error containing PII, all sensitive fields
 * must be redacted before storage.
 * 
 * Validates: Requirements 5 (PII Logging Prevention)
 */

import fc from 'fast-check';
import { piiRedactionService } from '../PIIRedactionService';

describe('Property 4: PII Redaction', () => {
  /**
   * Property: Email addresses are always redacted
   */
  it('should redact all email addresses', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        fc.string({ minLength: 0, maxLength: 50 }),
        (email, prefix) => {
          const text = `${prefix} ${email}`;
          const redacted = piiRedactionService.redactString(text);
          
          // Email should be redacted
          expect(redacted).not.toContain(email);
          expect(redacted).toContain('[EMAIL_REDACTED]');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Phone numbers are always redacted
   */
  it('should redact all phone numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000000000, max: 9999999999 }),
        fc.string({ minLength: 0, maxLength: 50 }),
        (phone, prefix) => {
          const phoneStr = phone.toString();
          const text = `${prefix} ${phoneStr}`;
          const redacted = piiRedactionService.redactString(text);
          
          // Phone should be redacted
          expect(redacted).not.toContain(phoneStr);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Passwords are always redacted from objects
   */
  it('should redact passwords from objects', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 20 }),
        fc.record({
          username: fc.string(),
          email: fc.emailAddress()
        }),
        (password, userData) => {
          const obj = { ...userData, password };
          const redacted = piiRedactionService.redactObject(obj);
          
          // Password should be redacted
          expect(redacted.password).toBe('[REDACTED]');
          expect(redacted.password).not.toBe(password);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tokens are always redacted
   */
  it('should redact JWT tokens', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.char().filter(c => /[a-zA-Z0-9._-]/.test(c)), { minLength: 20, maxLength: 100 }),
        fc.string({ minLength: 0, maxLength: 50 }),
        (token, prefix) => {
          const text = `${prefix} Bearer ${token}`;
          const redacted = piiRedactionService.redactString(text);

          // Token should be redacted
          expect(redacted).not.toContain(token);
          expect(redacted).toContain('[TOKEN_REDACTED]');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple PII fields are all redacted
   */
  it('should redact multiple PII fields in objects', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8 }),
          phone: fc.integer({ min: 1000000000, max: 9999999999 }).map(String),
          name: fc.string(),
          age: fc.integer({ min: 18, max: 100 })
        }),
        (userData) => {
          const redacted = piiRedactionService.redactObject(userData);
          
          // All PII should be redacted
          expect(redacted.email).toBe('[REDACTED]');
          expect(redacted.password).toBe('[REDACTED]');
          expect(redacted.phone).toBe('[REDACTED]');
          
          // Non-PII should remain
          expect(redacted.name).toBe(userData.name);
          expect(redacted.age).toBe(userData.age);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Nested objects have PII redacted
   */
  it('should redact PII in nested objects', () => {
    fc.assert(
      fc.property(
        fc.record({
          user: fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8 }),
            profile: fc.record({
              name: fc.string(),
              phone: fc.integer({ min: 1000000000, max: 9999999999 }).map(String)
            })
          })
        }),
        (data) => {
          const redacted = piiRedactionService.redactObject(data);
          
          // All nested PII should be redacted
          expect(redacted.user.email).toBe('[REDACTED]');
          expect(redacted.user.password).toBe('[REDACTED]');
          expect(redacted.user.profile.phone).toBe('[REDACTED]');
          
          // Non-PII should remain
          expect(redacted.user.profile.name).toBe(data.user.profile.name);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error objects have PII redacted
   */
  it('should redact PII from error objects', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 100 }),
        (email, message) => {
          const error = new Error(`${message} for ${email}`);
          const redacted = piiRedactionService.redactError(error);
          
          // Email in error message should be redacted
          expect(redacted.message).not.toContain(email);
          expect(redacted.message).toContain('[EMAIL_REDACTED]');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Credit card numbers are redacted
   */
  it('should redact credit card numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 9999 }),
        fc.integer({ min: 1000, max: 9999 }),
        fc.integer({ min: 1000, max: 9999 }),
        fc.integer({ min: 1000, max: 9999 }),
        (a, b, c, d) => {
          const cc = `${a}-${b}-${c}-${d}`;
          const text = `Payment with card ${cc}`;
          const redacted = piiRedactionService.redactString(text);
          
          // Credit card should be redacted
          expect(redacted).not.toContain(cc);
          expect(redacted).toContain('[CARD_REDACTED]');
        }
      ),
      { numRuns: 100 }
    );
  });
});
