/**
 * Rate Limit Service
 * Manages API request rate limiting per user and endpoint
 * 
 * Property: Property 13 - Rate Limit Enforcement
 * Validates: Requirements 14 (Rate Limiting)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const RATE_LIMIT_KEY = '@rate_limits';
const WINDOW_SIZE = 60000; // 1 minute in milliseconds

class RateLimitService {
  // Static constants for tests
  static LIMITS = {
    LOGIN_ATTEMPTS: 5,
    LOGIN_WINDOW_MINUTES: 15,
    SWIPE_ACTIONS: 100,
    SWIPE_WINDOW_MINUTES: 60,
    MESSAGES_SENT: 50,
    MESSAGES_WINDOW_MINUTES: 60,
  };

  static BLOCK_DURATIONS = {
    LOGIN_BLOCK: 30, // minutes
    API_BLOCK: 15, // minutes
    PERMANENT_BLOCK: 1440, // minutes (24 hours)
  };

  constructor() {
    this.limits = new Map();
    this.localCache = new Map();
    this.initialized = false;

    // Default rate limits per endpoint
    this.defaultLimits = {
      // Free tier limits
      free: {
        'swipe': { requests: 100, window: WINDOW_SIZE },
        'message': { requests: 50, window: WINDOW_SIZE },
        'profile_view': { requests: 200, window: WINDOW_SIZE },
        'search': { requests: 20, window: WINDOW_SIZE },
        'upload': { requests: 10, window: WINDOW_SIZE },
      },
      // Basic tier limits
      basic: {
        'swipe': { requests: 200, window: WINDOW_SIZE },
        'message': { requests: 100, window: WINDOW_SIZE },
        'profile_view': { requests: 500, window: WINDOW_SIZE },
        'search': { requests: 50, window: WINDOW_SIZE },
        'upload': { requests: 20, window: WINDOW_SIZE },
      },
      // Premium tier limits
      premium: {
        'swipe': { requests: Infinity, window: WINDOW_SIZE },
        'message': { requests: 500, window: WINDOW_SIZE },
        'profile_view': { requests: 2000, window: WINDOW_SIZE },
        'search': { requests: 200, window: WINDOW_SIZE },
        'upload': { requests: 50, window: WINDOW_SIZE },
      },
      // VIP tier limits
      vip: {
        'swipe': { requests: Infinity, window: WINDOW_SIZE },
        'message': { requests: Infinity, window: WINDOW_SIZE },
        'profile_view': { requests: Infinity, window: WINDOW_SIZE },
        'search': { requests: Infinity, window: WINDOW_SIZE },
        'upload': { requests: 100, window: WINDOW_SIZE },
      },
    };
  }

  /**
   * Initialize service
   */
  async initialize() {
    try {
      if (this.initialized) return;

      const stored = await AsyncStorage.getItem(RATE_LIMIT_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.limits = new Map(Object.entries(data));
      }

      this.initialized = true;
      console.log('[RateLimit] Service initialized');
    } catch (error) {
      console.error('[RateLimit] Error initializing:', error);
    }
  }

  /**
   * Get rate limit for user and endpoint
   */
  getLimit(userId, endpoint, tier = 'free') {
    const tierLimits = this.defaultLimits[tier] || this.defaultLimits.free;
    return tierLimits[endpoint] || { requests: 100, window: WINDOW_SIZE };
  }

  /**
   * Get user's current usage
   */
  getUsage(userId, endpoint) {
    const key = `${userId}:${endpoint}`;
    const usage = this.limits.get(key);

    if (!usage) {
      return {
        count: 0,
        resetAt: Date.now() + WINDOW_SIZE,
        requests: [],
      };
    }

    // Clean up old requests outside the window
    const now = Date.now();
    const validRequests = usage.requests.filter(
      timestamp => now - timestamp < WINDOW_SIZE
    );

    return {
      count: validRequests.length,
      resetAt: usage.resetAt,
      requests: validRequests,
    };
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(userId, endpoint, tier = 'free') {
    try {
      await this.initialize();

      const limit = this.getLimit(userId, endpoint, tier);
      const usage = this.getUsage(userId, endpoint);

      // Infinite limit
      if (limit.requests === Infinity) {
        return {
          allowed: true,
          remaining: Infinity,
          resetAt: usage.resetAt,
          limit: Infinity,
        };
      }

      // Check if limit exceeded
      const allowed = usage.count < limit.requests;

      return {
        allowed,
        remaining: Math.max(0, limit.requests - usage.count),
        resetAt: usage.resetAt,
        limit: limit.requests,
        current: usage.count,
      };
    } catch (error) {
      console.error('[RateLimit] Error checking limit:', error);
      // Allow request on error to avoid blocking users
      return {
        allowed: true,
        remaining: 0,
        resetAt: Date.now() + WINDOW_SIZE,
        limit: 0,
        error: error.message,
      };
    }
  }

  /**
   * Increment request counter
   */
  async incrementCounter(userId, endpoint) {
    try {
      await this.initialize();

      const key = `${userId}:${endpoint}`;
      const now = Date.now();
      const usage = this.getUsage(userId, endpoint);

      // Add new request timestamp
      const newRequests = [...usage.requests, now];

      // Update limits map
      this.limits.set(key, {
        requests: newRequests,
        resetAt: usage.resetAt,
      });

      // Persist to storage
      await this.persistLimits();

      console.log(`[RateLimit] Incremented counter for ${userId}:${endpoint} (${newRequests.length} requests)`);
    } catch (error) {
      console.error('[RateLimit] Error incrementing counter:', error);
    }
  }

  /**
   * Reset counter for user and endpoint
   */
  async resetCounter(userId, endpoint) {
    try {
      const key = `${userId}:${endpoint}`;
      this.limits.delete(key);
      await this.persistLimits();
      console.log(`[RateLimit] Reset counter for ${userId}:${endpoint}`);
    } catch (error) {
      console.error('[RateLimit] Error resetting counter:', error);
    }
  }

  /**
   * Reset all counters for user
   */
  async resetAllCounters(userId) {
    try {
      const keysToDelete = [];
      for (const key of this.limits.keys()) {
        if (key.startsWith(`${userId}:`)) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => this.limits.delete(key));
      await this.persistLimits();
      console.log(`[RateLimit] Reset all counters for ${userId}`);
    } catch (error) {
      console.error('[RateLimit] Error resetting all counters:', error);
    }
  }

  /**
   * Get premium limit for endpoint
   */
  getPremiumLimit(userId, endpoint) {
    return this.getLimit(userId, endpoint, 'premium');
  }

  /**
   * Get standard limit for endpoint
   */
  getStandardLimit(userId, endpoint) {
    return this.getLimit(userId, endpoint, 'free');
  }

  /**
   * Persist limits to storage
   */
  async persistLimits() {
    try {
      const data = Object.fromEntries(this.limits);
      await AsyncStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[RateLimit] Error persisting limits:', error);
    }
  }

  /**
   * Clean up expired entries
   */
  async cleanup() {
    try {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, usage] of this.limits.entries()) {
        const validRequests = usage.requests.filter(
          timestamp => now - timestamp < WINDOW_SIZE
        );

        if (validRequests.length === 0) {
          this.limits.delete(key);
          cleaned++;
        } else if (validRequests.length < usage.requests.length) {
          this.limits.set(key, {
            ...usage,
            requests: validRequests,
          });
        }
      }

      if (cleaned > 0) {
        await this.persistLimits();
        console.log(`[RateLimit] Cleaned up ${cleaned} expired entries`);
      }
    } catch (error) {
      console.error('[RateLimit] Error cleaning up:', error);
    }
  }

  /**
   * Get all limits for user
   */
  getUserLimits(userId, tier = 'free') {
    const tierLimits = this.defaultLimits[tier] || this.defaultLimits.free;
    const result = {};

    for (const [endpoint, limit] of Object.entries(tierLimits)) {
      const usage = this.getUsage(userId, endpoint);
      result[endpoint] = {
        limit: limit.requests,
        current: usage.count,
        remaining: limit.requests === Infinity 
          ? Infinity 
          : Math.max(0, limit.requests - usage.count),
        resetAt: usage.resetAt,
      };
    }

    return result;
  }

  /**
   * Export limits for debugging
   */
  exportLimits() {
    return {
      size: this.limits.size,
      limits: Object.fromEntries(this.limits),
      defaultLimits: this.defaultLimits,
    };
  }

  // ========================================
  // Additional Methods for Test Compatibility
  // ========================================

  /**
   * Check login attempts for email
   */
  static async checkLoginAttempts(email) {
    const key = `login_attempts_${email}`;
    const attempts = await this.getAttempts(key, RateLimitService.LIMITS.LOGIN_WINDOW_MINUTES);
    
    const allowed = attempts.length < RateLimitService.LIMITS.LOGIN_ATTEMPTS;
    const remaining = Math.max(0, RateLimitService.LIMITS.LOGIN_ATTEMPTS - attempts.length);

    return {
      allowed,
      remaining,
      attempts: attempts.length,
      resetAt: Date.now() + (RateLimitService.LIMITS.LOGIN_WINDOW_MINUTES * 60 * 1000),
    };
  }

  /**
   * Record failed login attempt
   */
  static async recordFailedLogin(email) {
    const key = `login_attempts_${email}`;
    await this.addAttempt(key, RateLimitService.LIMITS.LOGIN_WINDOW_MINUTES);
  }

  /**
   * Record successful login (reset attempts)
   */
  static async recordSuccessfulLogin(email) {
    const key = `login_attempts_${email}`;
    await AsyncStorage.removeItem(key);
  }

  /**
   * Check swipe action limit
   */
  static async checkSwipeAction(userId) {
    const key = `swipe_actions_${userId}`;
    const attempts = await this.getAttempts(key, RateLimitService.LIMITS.SWIPE_WINDOW_MINUTES);

    const allowed = attempts.length < RateLimitService.LIMITS.SWIPE_ACTIONS;
    let remaining = Math.max(0, RateLimitService.LIMITS.SWIPE_ACTIONS - attempts.length);

    if (allowed) {
      await this.addAttempt(key, RateLimitService.LIMITS.SWIPE_WINDOW_MINUTES);
      remaining = Math.max(0, remaining - 1); // Update remaining after adding attempt
    }

    return {
      allowed,
      remaining,
      attempts: attempts.length,
      resetAt: Date.now() + (RateLimitService.LIMITS.SWIPE_WINDOW_MINUTES * 60 * 1000),
    };
  }

  /**
   * Check message send limit
   */
  static async checkMessageSend(userId) {
    const key = `message_sends_${userId}`;
    const attempts = await this.getAttempts(key, RateLimitService.LIMITS.MESSAGES_WINDOW_MINUTES);

    const allowed = attempts.length < RateLimitService.LIMITS.MESSAGES_SENT;
    let remaining = Math.max(0, RateLimitService.LIMITS.MESSAGES_SENT - attempts.length);

    if (allowed) {
      await this.addAttempt(key, RateLimitService.LIMITS.MESSAGES_WINDOW_MINUTES);
      remaining = Math.max(0, remaining - 1); // Update remaining after adding attempt
    }

    return {
      allowed,
      remaining,
      attempts: attempts.length,
      resetAt: Date.now() + (RateLimitService.LIMITS.MESSAGES_WINDOW_MINUTES * 60 * 1000),
    };
  }

  /**
   * Block user for specified duration
   */
  static async blockUser(userId, reason, durationMinutes) {
    const key = `user_blocked_${userId}`;
    const blockData = {
      reason,
      blockedAt: Date.now(),
      expiresAt: Date.now() + (durationMinutes * 60 * 1000),
      durationMinutes,
    };
    await AsyncStorage.setItem(key, JSON.stringify(blockData));
  }

  /**
   * Unblock user
   */
  static async unblockUser(userId) {
    const key = `user_blocked_${userId}`;
    await AsyncStorage.removeItem(key);
  }

  /**
   * Check if user is blocked
   */
  static async isUserBlocked(userId) {
    const key = `user_blocked_${userId}`;
    const data = await AsyncStorage.getItem(key);
    
    if (!data) {
      return { blocked: false };
    }

    const blockData = JSON.parse(data);
    const now = Date.now();

    // Check if block has expired
    if (now >= blockData.expiresAt) {
      await this.unblockUser(userId);
      return { blocked: false };
    }

    return {
      blocked: true,
      reason: blockData.reason,
      expiresAt: blockData.expiresAt,
      remainingMinutes: Math.ceil((blockData.expiresAt - now) / (60 * 1000)),
    };
  }

  /**
   * Get attempts for a key within window
   */
  static async getAttempts(key, windowMinutes) {
    try {
      const data = await AsyncStorage.getItem(key);
      if (!data) return [];

      const attempts = JSON.parse(data);
      const now = Date.now();
      const windowMs = windowMinutes * 60 * 1000;

      // Filter out expired attempts
      const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs);

      // Save filtered attempts back
      if (validAttempts.length !== attempts.length) {
        await AsyncStorage.setItem(key, JSON.stringify(validAttempts));
      }

      return validAttempts;
    } catch (error) {
      console.error('[RateLimit] Error getting attempts:', error);
      return [];
    }
  }

  /**
   * Add attempt to key
   */
  static async addAttempt(key, windowMinutes) {
    try {
      const attempts = await this.getAttempts(key, windowMinutes);
      attempts.push(Date.now());
      await AsyncStorage.setItem(key, JSON.stringify(attempts));
    } catch (error) {
      console.error('[RateLimit] Error adding attempt:', error);
    }
  }

  /**
   * Load local cache from storage
   */
  static async loadLocalCache() {
    try {
      const data = await AsyncStorage.getItem(RATE_LIMIT_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.localCache = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('[RateLimit] Error loading local cache:', error);
    }
  }

  /**
   * Save local cache to storage
   */
  static async saveLocalCache() {
    try {
      const data = Object.fromEntries(this.localCache);
      await AsyncStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[RateLimit] Error saving local cache:', error);
    }
  }

  /**
   * Cleanup expired entries from cache
   */
  static async cleanupExpiredEntries() {
    try {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, value] of this.localCache.entries()) {
        if (Array.isArray(value)) {
          // It's a list of timestamps
          const validTimestamps = value.filter(ts => now - ts < 60 * 60 * 1000); // 1 hour window
          if (validTimestamps.length === 0) {
            this.localCache.delete(key);
            cleaned++;
          } else if (validTimestamps.length !== value.length) {
            this.localCache.set(key, validTimestamps);
          }
        }
      }

      if (cleaned > 0) {
        await this.saveLocalCache();
      }
    } catch (error) {
      console.error('[RateLimit] Error cleaning up expired entries:', error);
    }
  }
}

// Export singleton instance
export const rateLimitService = new RateLimitService();
export default RateLimitService;
