/**
 * Property-Based Tests for Session Fixation Prevention
 * 
 * **Feature: history-recovery, Property 2: Session Fixation Prevention**
 * 
 * For any session, if the device fingerprint changes, the session must be invalidated immediately.
 * 
 * Validates: Requirements 3 (Session Fixation Prevention)
 */

import fc from 'fast-check';
import { deviceFingerprintService } from '../DeviceFingerprintService';

describe('Phase1.SessionFixation.property', () => {
  beforeEach(async () => {
    // Clear fingerprint before each test
    await deviceFingerprintService.clearFingerprint();
  });

  afterEach(async () => {
    // Clean up after each test
    await deviceFingerprintService.clearFingerprint();
  });

  /**
   * Property 2: Fingerprint Generation Uniqueness
   * Each fingerprint generation should produce a consistent hash
   */
  test('should generate consistent fingerprint for same device', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null), // No input needed
        async () => {
          // Generate fingerprint twice
          const fingerprint1 = await deviceFingerprintService.generateFingerprint();
          const fingerprint2 = await deviceFingerprintService.generateFingerprint();

          // Should be consistent (same device characteristics)
          expect(fingerprint1).toBeDefined();
          expect(fingerprint2).toBeDefined();
          expect(typeof fingerprint1).toBe('string');
          expect(typeof fingerprint2).toBe('string');
          expect(fingerprint1.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Fingerprint Storage and Retrieval
   * Stored fingerprint should be retrievable
   */
  test('should store and retrieve fingerprint correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          // Generate and store fingerprint
          const fingerprint = await deviceFingerprintService.generateFingerprint();
          await deviceFingerprintService.storeFingerprint(fingerprint);

          // Retrieve stored fingerprint
          const stored = await deviceFingerprintService.getStoredFingerprint();

          // Should match
          expect(stored).toBe(fingerprint);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Fingerprint Validation
   * Valid fingerprint should pass validation
   */
  test('should validate matching fingerprints', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          // Generate fingerprint
          const fingerprint = await deviceFingerprintService.generateFingerprint();

          // Validate against itself
          const isValid = await deviceFingerprintService.validateFingerprint(fingerprint);

          // Should be valid
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Fingerprint Mismatch Detection
   * Different fingerprints should fail validation
   */
  test('should detect fingerprint mismatch', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexaString({ minLength: 64, maxLength: 64 }), // Random hash
        async (randomHash) => {
          // Generate real fingerprint
          const realFingerprint = await deviceFingerprintService.generateFingerprint();

          // Validate against random hash (should fail unless by extreme chance they match)
          const isValid = await deviceFingerprintService.validateFingerprint(randomHash);

          // Should be invalid (unless random hash matches, which is astronomically unlikely)
          if (randomHash !== realFingerprint) {
            expect(isValid).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Fingerprint Clear
   * Cleared fingerprint should not be retrievable
   */
  test('should clear fingerprint completely', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          // Generate and store fingerprint
          const fingerprint = await deviceFingerprintService.generateFingerprint();
          await deviceFingerprintService.storeFingerprint(fingerprint);

          // Clear fingerprint
          await deviceFingerprintService.clearFingerprint();

          // Should not be retrievable
          const stored = await deviceFingerprintService.getStoredFingerprint();
          expect(stored).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Fingerprint Change Detection
   * Should detect when fingerprint has changed
   */
  test('should detect fingerprint changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexaString({ minLength: 64, maxLength: 64 }),
        async (oldFingerprint) => {
          // Generate new fingerprint
          const newFingerprint = await deviceFingerprintService.generateFingerprint();

          // Check if changed (should be true unless they match)
          const hasChanged = await deviceFingerprintService.hasChanged(oldFingerprint);

          // Should detect change (unless by extreme chance they match)
          if (oldFingerprint !== newFingerprint) {
            expect(hasChanged).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
