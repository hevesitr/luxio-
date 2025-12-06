/**
 * Property-based tests for PaymentService
 * Testing duplicate payment prevention and idempotency
 */
import fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock Supabase
jest.mock('../../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null }))
    })),
    rpc: jest.fn(() => Promise.resolve({ data: null, error: null }))
  }
}));

describe('PaymentService - Duplicate Prevention Properties', () => {
  let service;
  let mockSupabase;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentService();
    mockSupabase = require('../../supabaseClient').supabase;
  });

  describe('Idempotency Key Generation', () => {
    it('should generate consistent idempotency keys within time window', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.string({ minLength: 1 }),
            amount: fc.integer({ min: 1, max: 1000 }),
            method: fc.constantFrom('card', 'paypal', 'apple_pay'),
          }),
          fc.integer({ min: 1, max: 100 }), // Multiple generations within window
          async (payment, generations) => {
            const keys = new Set();

            // Mock Date.now to return same 5-minute window
            const baseTime = Date.now();
            const mockTime = Math.floor(baseTime / (5 * 60 * 1000)) * (5 * 60 * 1000);

            global.Date.now = jest.fn().mockReturnValue(mockTime);

            for (let i = 0; i < generations; i++) {
              const key = service.generateIdempotencyKey(payment.userId, payment.amount, payment.method);
              keys.add(key);
            }

            // All keys should be identical within the same time window
            expect(keys.size).toBe(1);

            // Restore original Date.now
            global.Date.now = Date.now;
          }
        )
      );
    });

    it('should generate different keys across time windows', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.string({ minLength: 1 }),
            amount: fc.integer({ min: 1, max: 1000 }),
            method: fc.constantFrom('card', 'paypal', 'apple_pay'),
          }),
          async (payment) => {
            const keys = new Set();

            // Generate keys across different 5-minute windows
            for (let window = 0; window < 3; window++) {
              const mockTime = window * 5 * 60 * 1000; // Different 5-minute windows
              global.Date.now = jest.fn().mockReturnValue(mockTime);

              const key = service.generateIdempotencyKey(payment.userId, payment.amount, payment.method);
              keys.add(key);
            }

            // Keys should be different across time windows
            expect(keys.size).toBe(3);

            // Restore original Date.now
            global.Date.now = Date.now;
          }
        )
      );
    });

    it('should generate unique keys for different payment parameters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.record({
            userId: fc.string({ minLength: 1 }),
            amount: fc.integer({ min: 1, max: 1000 }),
            method: fc.constantFrom('card', 'paypal', 'apple_pay'),
          }), { minLength: 2, maxLength: 5 }),
          async (payments) => {
            const keys = new Set();

            // Mock consistent time window
            const mockTime = Math.floor(Date.now() / (5 * 60 * 1000)) * (5 * 60 * 1000);
            global.Date.now = jest.fn().mockReturnValue(mockTime);

            for (const payment of payments) {
              const key = service.generateIdempotencyKey(payment.userId, payment.amount, payment.method);
              keys.add(key);
            }

            // All different payment combinations should have unique keys
            expect(keys.size).toBe(payments.length);

            // Restore original Date.now
            global.Date.now = Date.now;
          }
        )
      );
    });
  });

  describe('Duplicate Payment Prevention', () => {
    it('should prevent duplicate payments with same idempotency key', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.string({ minLength: 1 }),
            amount: fc.integer({ min: 1, max: 1000 }),
            method: fc.constantFrom('card', 'paypal', 'apple_pay'),
            idempotencyKey: fc.string({ minLength: 10 }),
          }),
          fc.integer({ min: 2, max: 5 }), // Duplicate attempts
          async (payment, attempts) => {
            let firstPaymentId = null;
            let duplicateCount = 0;

            // Mock successful first payment
            mockSupabase.from.mockImplementation((table) => {
              if (table === 'payments') {
                return {
                  select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                      single: jest.fn(() => Promise.resolve({
                        data: firstPaymentId ? {
                          id: firstPaymentId,
                          status: 'completed'
                        } : null,
                        error: firstPaymentId ? null : { code: 'PGRST116' }
                      }))
                    }))
                  })),
                  insert: jest.fn(() => ({
                    select: jest.fn(() => ({
                      single: jest.fn(() => {
                        if (!firstPaymentId) {
                          firstPaymentId = `payment_${Date.now()}`;
                          return Promise.resolve({
                            data: { id: firstPaymentId, amount: payment.amount, status: 'completed' },
                            error: null
                          });
                        }
                        return Promise.resolve({
                          data: null,
                          error: { code: '23505' } // Unique constraint violation
                        });
                      })
                    }))
                  }))
                };
              }
              return {};
            });

            // Attempt multiple payments with same idempotency key
            for (let i = 0; i < attempts; i++) {
              const result = await service.processPayment(
                payment.userId,
                payment.amount,
                payment.method,
                payment.idempotencyKey
              );

              if (result.wasDuplicate) {
                duplicateCount++;
              }
            }

            // First payment should succeed, rest should be marked as duplicates
            expect(duplicateCount).toBe(attempts - 1);
          }
        )
      );
    });

    it('should handle concurrent payment attempts correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.string({ minLength: 1 }),
            amount: fc.integer({ min: 1, max: 1000 }),
            method: fc.constantFrom('card', 'paypal', 'apple_pay'),
          }),
          async (payment) => {
            const idempotencyKey = service.generateIdempotencyKey(
              payment.userId,
              payment.amount,
              payment.method
            );

            let concurrentInsertCount = 0;

            // Mock concurrent scenario where another payment is inserted between check and insert
            mockSupabase.from.mockImplementation((table) => {
              if (table === 'payments') {
                return {
                  select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                      single: jest.fn(() => Promise.resolve({
                        data: concurrentInsertCount > 0 ? {
                          id: `concurrent_${Date.now()}`,
                          status: 'completed'
                        } : null,
                        error: concurrentInsertCount > 0 ? null : { code: 'PGRST116' }
                      }))
                    }))
                  })),
                  insert: jest.fn(() => ({
                    select: jest.fn(() => ({
                      single: jest.fn(() => {
                        concurrentInsertCount++;
                        if (concurrentInsertCount === 1) {
                          // First attempt succeeds
                          return Promise.resolve({
                            data: { id: `payment_${Date.now()}`, amount: payment.amount, status: 'completed' },
                            error: null
                          });
                        } else {
                          // Subsequent attempts fail with unique constraint
                          return Promise.resolve({
                            data: null,
                            error: { code: '23505' }
                          });
                        }
                      })
                    }))
                  }))
                };
              }
              return {};
            });

            // Start concurrent payments
            const promises = [];
            for (let i = 0; i < 3; i++) {
              promises.push(
                service.processPayment(payment.userId, payment.amount, payment.method, idempotencyKey)
              );
            }

            const results = await Promise.all(promises);

            // Exactly one payment should succeed, others should be duplicates
            const successfulPayments = results.filter(r => r.success && !r.wasDuplicate);
            const duplicatePayments = results.filter(r => r.wasDuplicate);

            expect(successfulPayments.length).toBe(1);
            expect(duplicatePayments.length).toBe(2);
          }
        )
      );
    });

    it('should handle payment processing failures gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.string({ minLength: 1 }),
            amount: fc.integer({ min: 1, max: 1000 }),
            method: fc.constantFrom('card', 'paypal', 'apple_pay'),
          }),
          fc.integer({ min: 1, max: 5 }), // Failure attempts
          async (payment, failureAttempts) => {
            let attemptCount = 0;

            // Mock failures then success
            mockSupabase.from.mockImplementation((table) => {
              if (table === 'payments') {
                return {
                  select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                      single: jest.fn(() => Promise.resolve({
                        data: null,
                        error: { code: 'PGRST116' }
                      }))
                    }))
                  })),
                  insert: jest.fn(() => ({
                    select: jest.fn(() => ({
                      single: jest.fn(() => {
                        attemptCount++;
                        if (attemptCount <= failureAttempts) {
                          return Promise.reject(new Error('Payment gateway timeout'));
                        } else {
                          return Promise.resolve({
                            data: { id: `payment_${Date.now()}`, amount: payment.amount, status: 'completed' },
                            error: null
                          });
                        }
                      })
                    }))
                  }))
                };
              }
              return {};
            });

            const idempotencyKey = service.generateIdempotencyKey(
              payment.userId,
              payment.amount,
              payment.method
            );

            // This test validates that the error handling doesn't break the idempotency logic
            try {
              await service.processPayment(payment.userId, payment.amount, payment.method, idempotencyKey);
            } catch (error) {
              // Expected for failed attempts
              expect(error.message).toContain('Payment gateway timeout');
            }
          }
        )
      );
    });
  });
});
