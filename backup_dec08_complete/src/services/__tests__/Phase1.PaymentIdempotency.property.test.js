/**
 * Property-Based Tests for Payment Idempotency
 * 
 * **Feature: history-recovery, Property 3: Payment Idempotency**
 * 
 * For any payment with the same idempotency key, only one charge must be processed regardless of retry count.
 * 
 * Validates: Requirements 4 (Payment Idempotency)
 */

import fc from 'fast-check';
import { idempotencyService } from '../IdempotencyService';

describe('Phase1.PaymentIdempotency.property', () => {
  beforeEach(async () => {
    // Initialize service before each test
    await idempotencyService.initialize();
    await idempotencyService.clearAll();
  });

  afterEach(async () => {
    // Clean up after each test
    await idempotencyService.clearAll();
  });

  /**
   * Property 3: Idempotency Key Uniqueness
   * Each generated key should be unique
   */
  test('should generate unique idempotency keys', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          // Generate multiple keys
          const key1 = idempotencyService.generateKey();
          const key2 = idempotencyService.generateKey();
          const key3 = idempotencyService.generateKey();

          // All should be unique
          expect(key1).not.toBe(key2);
          expect(key2).not.toBe(key3);
          expect(key1).not.toBe(key3);

          // All should be valid UUIDs
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          expect(key1).toMatch(uuidRegex);
          expect(key2).toMatch(uuidRegex);
          expect(key3).toMatch(uuidRegex);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Idempotency Key Storage and Retrieval
   * Stored key should return cached result
   */
  test('should store and retrieve idempotency results', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          amount: fc.integer({ min: 100, max: 100000 }),
          currency: fc.constantFrom('USD', 'EUR', 'GBP'),
          status: fc.constantFrom('success', 'pending', 'failed'),
        }),
        async (result) => {
          // Generate key and store result
          const key = idempotencyService.generateKey();
          await idempotencyService.storeKey(key, result);

          // Retrieve result
          const cached = await idempotencyService.checkKey(key);

          // Should match
          expect(cached).toEqual(result);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Idempotency Enforcement
   * Same key should return same result without re-execution
   */
  test('should enforce idempotency for duplicate operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          amount: fc.integer({ min: 100, max: 100000 }),
          userId: fc.uuid(),
        }),
        async (payment) => {
          let executionCount = 0;
          const key = idempotencyService.generateKey();

          // Operation that increments counter
          const operation = async () => {
            executionCount++;
            return {
              success: true,
              amount: payment.amount,
              userId: payment.userId,
              executionCount,
            };
          };

          // Execute multiple times with same key
          const result1 = await idempotencyService.executeWithIdempotency(key, operation);
          const result2 = await idempotencyService.executeWithIdempotency(key, operation);
          const result3 = await idempotencyService.executeWithIdempotency(key, operation);

          // Operation should only execute once
          expect(executionCount).toBe(1);

          // All results should be identical
          expect(result1).toEqual(result2);
          expect(result2).toEqual(result3);
          expect(result1.executionCount).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Non-existent Key Check
   * Checking non-existent key should return null
   */
  test('should return null for non-existent keys', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (randomKey) => {
          // Check key that was never stored
          const result = await idempotencyService.checkKey(randomKey);

          // Should be null
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Multiple Keys Independence
   * Different keys should store different results independently
   */
  test('should handle multiple independent keys', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            amount: fc.integer({ min: 100, max: 100000 }),
            status: fc.constantFrom('success', 'pending', 'failed'),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (results) => {
          // Store multiple results with different keys
          const keys = [];
          for (const result of results) {
            const key = idempotencyService.generateKey();
            keys.push(key);
            await idempotencyService.storeKey(key, result);
          }

          // Retrieve all results
          for (let i = 0; i < keys.length; i++) {
            const cached = await idempotencyService.checkKey(keys[i]);
            expect(cached).toEqual(results[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Cache Statistics
   * Cache stats should reflect stored keys
   */
  test('should maintain accurate cache statistics', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (count) => {
          // Store multiple keys
          for (let i = 0; i < count; i++) {
            const key = idempotencyService.generateKey();
            await idempotencyService.storeKey(key, { index: i });
          }

          // Check stats
          const stats = idempotencyService.getStats();
          expect(stats.cacheSize).toBe(count);
          expect(stats.initialized).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
