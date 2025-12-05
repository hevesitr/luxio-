/**
 * Property-Based Tests for Error Handling Consistency
 *
 * **Feature: property-based-testing**
 *
 * These tests validate universal properties that should hold
 * for error handling behavior across the application.
 */

import fc from 'fast-check';
import ErrorHandler, { ErrorCodes } from '../../ErrorHandler';
import { ErrorFactory } from '../../ServiceError';

// Mock Logger to avoid console output during tests
jest.mock('../../Logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

describe('Error Handling Consistency Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 16: Error handling consistency', () => {
    /**
     * **Feature: property-based-testing, Property 16: Error handling consistency**
     * **Validates: Requirements 3.3**
     *
     * For any service operation that fails, the error response should be consistent
     * and contain the required fields (success, error, code).
     */
    it('should return consistent error structure for any failed operation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 50 }), // operation name
          fc.string({ minLength: 10, maxLength: 100 }), // error message
          fc.constantFrom(...Object.values(ErrorCodes)), // error code
          async (operation, errorMessage, errorCode) => {
            // Mock service that always throws an error
            const mockService = {
              async performOperation() {
                const error = new ErrorFactory.system(errorMessage, errorMessage);
                throw error;
              }
            };

            // Execute the operation with ErrorHandler wrapping
            const result = await ErrorHandler.wrapServiceCall(
              mockService.performOperation.bind(mockService),
              { operation }
            );

            // Verify consistent error structure
            expect(result).toHaveProperty('success');
            expect(result.success).toBe(false);
            expect(result).toHaveProperty('error');
            expect(result).toHaveProperty('code');
            expect(typeof result.error).toBe('string');
            expect(result.error.length).toBeGreaterThan(0);

            // Error code should be one of the defined ErrorCodes
            expect(Object.values(ErrorCodes)).toContain(result.code);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle any thrown error gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.string({ minLength: 5, maxLength: 50 }), // String error
            fc.record({ // Error object
              message: fc.string({ minLength: 5, maxLength: 50 }),
              code: fc.constantFrom(...Object.values(ErrorCodes)),
            }),
            fc.record({ // Generic error
              name: fc.constantFrom('Error', 'TypeError', 'ReferenceError'),
              message: fc.string({ minLength: 5, maxLength: 50 }),
            })
          ),
          async (errorInput) => {
            // Create a service that throws the generated error
            const mockService = {
              async performOperation() {
                if (typeof errorInput === 'string') {
                  throw new Error(errorInput);
                } else if (errorInput.code) {
                  throw ErrorFactory.system(errorInput.message, errorInput.message);
                } else {
                  const ErrorClass = global[errorInput.name] || Error;
                  throw new ErrorClass(errorInput.message);
                }
              }
            };

            // Should not throw unhandled errors
            const result = await ErrorHandler.wrapServiceCall(
              mockService.performOperation.bind(mockService)
            );

            // Should return consistent error structure
            expect(result).toHaveProperty('success', false);
            expect(result).toHaveProperty('error');
            expect(result).toHaveProperty('code');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve operation context in error responses', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }), // operation name
          fc.record({ // context object
            userId: fc.option(fc.string()),
            profileId: fc.option(fc.string()),
            matchId: fc.option(fc.string()),
          }),
          fc.string({ minLength: 5, maxLength: 30 }), // error message
          async (operation, context, errorMessage) => {
            const mockService = {
              async performOperation() {
                throw new Error(errorMessage);
              }
            };

            const result = await ErrorHandler.wrapServiceCall(
              mockService.performOperation.bind(mockService),
              { operation, ...context }
            );

            // Verify error structure
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.code).toBeDefined();

            // Context should be preserved in details.context (though sanitized for PII)
            expect(result.details.context).toHaveProperty('operation', operation);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle null/undefined operation results', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(null, undefined, '', 0, false), // Various falsy values
          async (resultValue) => {
            const mockService = {
              async performOperation() {
                return resultValue;
              }
            };

              const result = await ErrorHandler.wrapServiceCall(
                mockService.performOperation.bind(mockService)
              );

            // Should handle falsy results without throwing
            expect(result).toBeDefined();

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain error code consistency across similar operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              operation: fc.string({ minLength: 3, maxLength: 15 }),
              errorCode: fc.constantFrom(...Object.values(ErrorCodes)),
              errorMessage: fc.string({ minLength: 5, maxLength: 50 }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (operations) => {
            // Test multiple operations with similar error patterns
            const results = [];

            for (const op of operations) {
              const mockService = {
                async performOperation() {
                  throw ErrorFactory.system(op.errorMessage, op.errorMessage);
                }
              };

              const result = await ErrorHandler.wrapServiceCall(
                mockService.performOperation.bind(mockService),
                { operation: op.operation }
              );
              results.push(result);
            }

            // All results should have consistent structure
            results.forEach(result => {
              expect(result).toHaveProperty('success', false);
              expect(result).toHaveProperty('error');
              expect(result).toHaveProperty('code');
              expect(Object.values(ErrorCodes)).toContain(result.code);
            });

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
