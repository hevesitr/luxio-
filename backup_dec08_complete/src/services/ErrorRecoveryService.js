/**
 * Error Recovery Service
 * Provides error recovery strategies with exponential backoff
 * 
 * Property: Property 15 - Error Recovery Success
 * Validates: Requirements 16 (Error Recovery)
 */

class ErrorRecoveryService {
  constructor() {
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second
    this.maxDelay = 30000; // 30 seconds
    
    // Recovery strategies by error type
    this.strategies = {
      NETWORK_ERROR: 'retry_with_backoff',
      TIMEOUT_ERROR: 'retry_with_backoff',
      AUTH_ERROR: 'refresh_token',
      VALIDATION_ERROR: 'no_retry',
      RATE_LIMIT_ERROR: 'wait_and_retry',
      SERVER_ERROR: 'retry_with_backoff',
      NOT_FOUND_ERROR: 'no_retry',
      CONFLICT_ERROR: 'no_retry',
    };
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateBackoff(attempt) {
    const delay = Math.min(
      this.baseDelay * Math.pow(2, attempt),
      this.maxDelay
    );
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return delay + jitter;
  }

  /**
   * Check if error is recoverable
   */
  canRecover(error) {
    if (!error) return false;

    const errorType = error.code || error.type || 'UNKNOWN_ERROR';
    const strategy = this.strategies[errorType];

    return strategy && strategy !== 'no_retry';
  }

  /**
   * Get recovery strategy for error
   */
  getStrategy(error) {
    if (!error) return 'no_retry';

    const errorType = error.code || error.type || 'UNKNOWN_ERROR';
    return this.strategies[errorType] || 'no_retry';
  }

  /**
   * Retry operation with exponential backoff
   */
  async retryWithBackoff(operation, options = {}) {
    const {
      maxRetries = this.maxRetries,
      onRetry = null,
      shouldRetry = null,
    } = options;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Execute operation
        const result = await operation();
        return {
          success: true,
          result,
          attempts: attempt + 1,
        };
      } catch (error) {
        lastError = error;

        // Check if should retry
        if (shouldRetry && !shouldRetry(error, attempt)) {
          throw error;
        }

        // Check if can recover
        if (!this.canRecover(error)) {
          throw error;
        }

        // Last attempt failed
        if (attempt === maxRetries) {
          throw error;
        }

        // Calculate backoff delay
        const delay = this.calculateBackoff(attempt);

        console.log(
          `[ErrorRecovery] Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`,
          error.message
        );

        // Notify retry callback
        if (onRetry) {
          onRetry(error, attempt, delay);
        }

        // Wait before retry
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Recover from error
   */
  async recover(error, operation, options = {}) {
    const strategy = this.getStrategy(error);

    console.log(`[ErrorRecovery] Recovering from error using strategy: ${strategy}`);

    switch (strategy) {
      case 'retry_with_backoff':
        return await this.retryWithBackoff(operation, options);

      case 'refresh_token':
        return await this.recoverFromAuthError(operation, options);

      case 'wait_and_retry':
        return await this.recoverFromRateLimit(error, operation, options);

      case 'no_retry':
      default:
        throw error;
    }
  }

  /**
   * Recover from authentication error
   */
  async recoverFromAuthError(operation, options = {}) {
    try {
      console.log('[ErrorRecovery] Attempting to refresh authentication token');

      // Import auth service dynamically to avoid circular dependency
      const { supabase } = await import('./supabaseClient');
      
      // Refresh session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw new Error('Failed to refresh session');
      }

      console.log('[ErrorRecovery] Token refreshed successfully');

      // Retry operation with new token
      return await operation();
    } catch (error) {
      console.error('[ErrorRecovery] Failed to recover from auth error:', error);
      throw error;
    }
  }

  /**
   * Recover from rate limit error
   */
  async recoverFromRateLimit(error, operation, options = {}) {
    try {
      // Extract retry-after from error
      const retryAfter = error.retryAfter || 60000; // Default 1 minute

      console.log(`[ErrorRecovery] Rate limited, waiting ${retryAfter}ms before retry`);

      // Wait for rate limit to reset
      await this.sleep(retryAfter);

      // Retry operation
      return await operation();
    } catch (error) {
      console.error('[ErrorRecovery] Failed to recover from rate limit:', error);
      throw error;
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error) {
    if (!error) return 'An unknown error occurred';

    const errorType = error.code || error.type || 'UNKNOWN_ERROR';

    const messages = {
      NETWORK_ERROR: 'Network connection lost. Please check your internet connection.',
      TIMEOUT_ERROR: 'Request timed out. Please try again.',
      AUTH_ERROR: 'Authentication failed. Please sign in again.',
      VALIDATION_ERROR: error.message || 'Invalid input. Please check your data.',
      RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment and try again.',
      SERVER_ERROR: 'Server error. Please try again later.',
      NOT_FOUND_ERROR: 'Resource not found.',
      CONFLICT_ERROR: 'Conflict detected. Please refresh and try again.',
      UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
    };

    return messages[errorType] || error.message || messages.UNKNOWN_ERROR;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wrap operation with error recovery
   */
  async withRecovery(operation, options = {}) {
    try {
      return await operation();
    } catch (error) {
      if (this.canRecover(error)) {
        return await this.recover(error, operation, options);
      }
      throw error;
    }
  }

  /**
   * Create recoverable operation
   */
  createRecoverableOperation(operation, options = {}) {
    return async (...args) => {
      return await this.withRecovery(
        () => operation(...args),
        options
      );
    };
  }
}

// Export singleton instance
export const errorRecoveryService = new ErrorRecoveryService();
export default ErrorRecoveryService;
