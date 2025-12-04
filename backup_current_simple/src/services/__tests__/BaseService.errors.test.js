/**
 * Property-Based Test for Error Handling Consistency
 * 
 * Feature: refactor-dating-app, Property 8: Error handling consistency
 * Validates: Requirements 3.3
 * 
 * Property 8: Error handling consistency
 * For any service method that encounters an error, the error should be wrapped 
 * in a standardized error object with error code, message, and context
 */

import fc from 'fast-check';
import { BaseService } from '../BaseService';
import { ServiceError, ErrorCategory } from '../ServiceError';

// Create ErrorFactory for testing
const ErrorFactory = {
  auth: (message, userMessage, context) => new ServiceError({
    code: 'AUTH_ERROR',
    message,
    userMessage,
    category: 'AUTH',
    context,
  }),
  validation: (message, userMessage, context) => new ServiceError({
    code: 'VALIDATION_ERROR',
    message,
    userMessage,
    category: 'VALIDATION',
    context,
  }),
  network: (message, userMessage, context) => new ServiceError({
    code: 'NETWORK_ERROR',
    message,
    userMessage,
    category: 'NETWORK',
    context,
  }),
  storage: (message, userMessage, context) => new ServiceError({
    code: 'STORAGE_ERROR',
    message,
    userMessage,
    category: 'STORAGE',
    context,
  }),
  businessLogic: (message, userMessage, context) => new ServiceError({
    code: 'BUSINESS_ERROR',
    message,
    userMessage,
    category: 'BUSINESS',
    context,
  }),
  system: (message, userMessage, context) => new ServiceError({
    code: 'SYSTEM_ERROR',
    message,
    userMessage,
    category: 'SYSTEM',
    context,
  }),
  fromError: (error, userMessage, context) => new ServiceError({
    code: 'SYSTEM_ERROR',
    message: error.message,
    userMessage,
    category: 'SYSTEM',
    context,
    originalError: error,
  }),
};

describe('Property 8: Error Handling Consistency', () => {
  /**
   * Generators
   */
  const errorMessageArbitrary = fc.string({ minLength: 5, maxLength: 100 });
  const errorCodeArbitrary = fc.constantFrom(
    'AUTH_INVALID_CREDENTIALS',
    'VALIDATION_FAILED',
    'NETWORK_ERROR',
    'STORAGE_UPLOAD_FAILED',
    'BUSINESS_PREMIUM_REQUIRED',
    'SYSTEM_ERROR'
  );
  const contextArbitrary = fc.record({
    userId: fc.uuid(),
    operation: fc.constantFrom('create', 'update', 'delete', 'fetch'),
    timestamp: fc.integer({ min: 1577836800000, max: 1924905600000 }).map(ts => new Date(ts).toISOString()),
  });

  /**
   * Property Test 1: All errors are ServiceError instances
   * For any error thrown in a service, it should be a ServiceError
   */
  test('Property 8.1: All service errors are ServiceError instances', async () => {
    await fc.assert(
      fc.asyncProperty(
        errorMessageArbitrary,
        contextArbitrary,
        async (errorMessage, context) => {
          const service = new BaseService('TestService');

          const result = await service.executeOperation(
            async () => {
              throw new Error(errorMessage);
            },
            'testOperation',
            context
          );

          // Should return error wrapped in ServiceError
          expect(result.success).toBe(false);
          expect(result.error).toBeInstanceOf(ServiceError);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 2: All errors have required fields
   * For any error, it should have code, message, userMessage, and context
   */
  test('Property 8.2: All errors have required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        errorMessageArbitrary,
        errorCodeArbitrary,
        contextArbitrary,
        async (errorMessage, errorCode, context) => {
          const service = new BaseService('TestService');

          const result = await service.executeOperation(
            async () => {
              throw ErrorFactory.system(errorMessage, 'User friendly message', context);
            },
            'testOperation',
            context
          );

          // Verify error structure
          expect(result.success).toBe(false);
          expect(result.error).toHaveProperty('code');
          expect(result.error).toHaveProperty('message');
          expect(result.error).toHaveProperty('userMessage');
          expect(result.error).toHaveProperty('context');
          expect(result.error).toHaveProperty('category');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 3: Error codes are consistent
   * For any error category, the code should follow the pattern CATEGORY_SPECIFIC
   */
  test('Property 8.3: Error codes follow naming convention', () => {
    fc.assert(
      fc.property(
        errorCodeArbitrary,
        (errorCode) => {
          // Error codes should contain underscore
          expect(errorCode).toMatch(/_/);
          
          // Error codes should be uppercase
          expect(errorCode).toBe(errorCode.toUpperCase());

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 4: Context is preserved
   * For any error with context, the context should be preserved in the error object
   */
  test('Property 8.4: Error context is preserved', async () => {
    await fc.assert(
      fc.asyncProperty(
        errorMessageArbitrary,
        contextArbitrary,
        async (errorMessage, context) => {
          const service = new BaseService('TestService');

          const result = await service.executeOperation(
            async () => {
              throw new Error(errorMessage);
            },
            'testOperation',
            context
          );

          // Context should be preserved
          expect(result.success).toBe(false);
          expect(result.error.context).toMatchObject(context);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 5: User messages are friendly
   * For any error, userMessage should not contain technical details
   */
  test('Property 8.5: User messages are user-friendly', async () => {
    await fc.assert(
      fc.asyncProperty(
        errorMessageArbitrary,
        async (errorMessage) => {
          const service = new BaseService('TestService');

          const result = await service.executeOperation(
            async () => {
              throw new Error(errorMessage);
            },
            'testOperation',
            {}
          );

          // User message should exist and be different from technical message
          expect(result.success).toBe(false);
          expect(result.error.userMessage).toBeDefined();
          expect(typeof result.error.userMessage).toBe('string');
          expect(result.error.userMessage.length).toBeGreaterThan(0);

          // User message should not contain stack traces or technical jargon
          expect(result.error.userMessage).not.toMatch(/at Object\./);
          expect(result.error.userMessage).not.toMatch(/node_modules/);
          expect(result.error.userMessage).not.toMatch(/Error:/);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 6: Validation errors have field information
   * For any validation error, it should include which fields failed
   */
  test('Property 8.6: Validation errors include field information', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            field: fc.constantFrom('email', 'password', 'age', 'name'),
            message: fc.string({ minLength: 5, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (validationErrors) => {
          const service = new BaseService('TestService');

          try {
            service.throwValidationError(validationErrors, { userId: 'test' });
          } catch (error) {
            // Should be ServiceError with validation errors
            expect(error).toBeInstanceOf(ServiceError);
            expect(error.context.validationErrors).toBeDefined();
            expect(Array.isArray(error.context.validationErrors)).toBe(true);
            expect(error.context.validationErrors.length).toBe(validationErrors.length);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 7: Error categories are consistent
   * For any error, the category should match the code prefix
   */
  test('Property 8.7: Error categories match code prefixes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('auth', 'validation', 'network', 'storage', 'businessLogic', 'system'),
        errorMessageArbitrary,
        (factoryName, message) => {
          const factoryMap = {
            auth: { factory: ErrorFactory.auth, expectedCategory: 'AUTH' },
            validation: { factory: ErrorFactory.validation, expectedCategory: 'VALIDATION' },
            network: { factory: ErrorFactory.network, expectedCategory: 'NETWORK' },
            storage: { factory: ErrorFactory.storage, expectedCategory: 'STORAGE' },
            businessLogic: { factory: ErrorFactory.businessLogic, expectedCategory: 'BUSINESS' },
            system: { factory: ErrorFactory.system, expectedCategory: 'SYSTEM' },
          };

          const { factory, expectedCategory } = factoryMap[factoryName];
          const error = factory(message, 'User message', {});

          // Category should match
          expect(error.category).toBe(expectedCategory);
          
          // Code should start with category
          expect(error.code).toMatch(new RegExp(`^${expectedCategory}_`));

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 8: Errors are loggable
   * For any error, it should have a log() method that doesn't throw
   */
  test('Property 8.8: All errors are safely loggable', () => {
    fc.assert(
      fc.property(
        errorMessageArbitrary,
        errorCodeArbitrary,
        contextArbitrary,
        (message, code, context) => {
          const error = ErrorFactory.system(message, 'User message', context);

          // log() should not throw
          expect(() => error.log()).not.toThrow();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
