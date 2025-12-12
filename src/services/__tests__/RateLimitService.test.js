/**
 * RateLimitService Unit Tests
 * Tests rate limiting, brute force protection, and API throttling
 */
import RateLimitService from '../RateLimitService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage with in-memory storage
const mockStorage = new Map();
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key) => Promise.resolve(mockStorage.get(key) || null)),
  setItem: jest.fn((key, value) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn((key) => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Array.from(mockStorage.keys()))),
}));

jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      upsert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            gt: jest.fn(() => ({
              single: jest.fn(() => ({ data: null, error: null })),
            })),
          })),
        })),
      })),
    })),
  },
}));

describe('RateLimitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
    // Reset RateLimitService state before each test to prevent state leakage
    RateLimitService.localCache = new Map();
    RateLimitService.blockedUsers = new Set();
  });

  describe('Login Attempts', () => {
    it('should allow login attempts within limits', async () => {
      const result1 = await RateLimitService.checkLoginAttempts('user@example.com');
      const result2 = await RateLimitService.checkLoginAttempts('user@example.com');
      const result3 = await RateLimitService.checkLoginAttempts('user@example.com');

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(true);
    });

    it('should block login attempts after limit exceeded', async () => {
      // Use unique email for this test
      const email = 'test_block@example.com';

      // Exceed the limit by calling checkLoginAttempts 6 times (limit is 5)
      for (let i = 0; i < 5; i++) {
        const result = await RateLimitService.checkLoginAttempts(email);
        expect(result.allowed).toBe(true); // First 5 should be allowed
      }

      // 6th attempt should be blocked
      const finalResult = await RateLimitService.checkLoginAttempts(email);
      expect(finalResult.allowed).toBe(false);
      expect(finalResult.reason).toBe('too_many_attempts');
    });

    it('should record failed login attempts', async () => {
      await RateLimitService.recordFailedLogin('user@example.com');

      // Should increment the attempts counter
      const attempts = await RateLimitService.getAttempts('login_attempts_user@example.com', 15);
      expect(attempts.length).toBe(1);
    });

    it('should reset login attempts after successful login', async () => {
      await RateLimitService.recordFailedLogin('user@example.com');
      await RateLimitService.recordSuccessfulLogin('user@example.com');

      const attempts = await RateLimitService.getAttempts('login_attempts_user@example.com', 15);
      expect(attempts.length).toBe(0);
    });
  });

  describe('Swipe Actions', () => {
    it('should allow swipe actions within daily limits', async () => {
      const result = await RateLimitService.checkSwipeAction('user123');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99); // 100 - 1 after consumption
    });

    it('should block swipe actions after daily limit exceeded', async () => {
      // Exceed the daily limit (100 swipes)
      for (let i = 0; i < 101; i++) {
        await RateLimitService.checkSwipeAction('user123');
      }

      const result = await RateLimitService.checkSwipeAction('user123');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('rate_limit_exceeded');
      expect(result.limit).toBe(100);
    });
  });

  describe('Message Sending', () => {
    it('should allow message sending within hourly limits', async () => {
      const result = await RateLimitService.checkMessageSend('user123');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(49); // 50 - 1 after consumption
    });

    it('should block message sending after hourly limit exceeded', async () => {
      // Exceed the hourly limit (50 messages)
      for (let i = 0; i < 51; i++) {
        await RateLimitService.checkMessageSend('user123');
      }

      const result = await RateLimitService.checkMessageSend('user123');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('rate_limit_exceeded');
      expect(result.limit).toBe(50);
    });
  });

  describe('User Blocking', () => {
    it('should block users for specified duration', async () => {
      await RateLimitService.blockUser('user123', 'test_block', 60); // 60 minutes

      const isBlocked = await RateLimitService.isUserBlocked('user123');
      expect(isBlocked.blocked).toBe(true);
      expect(isBlocked.remainingMinutes).toBeLessThanOrEqual(60);
    });

    it('should allow unblocking users', async () => {

      await RateLimitService.blockUser('user123', 'test_block', 60);
      await RateLimitService.unblockUser('user123');

      const isBlocked = await RateLimitService.isUserBlocked('user123');
      expect(isBlocked.blocked).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should load and save local cache', async () => {
      const mockCache = {
        'login_attempts_user@example.com': [Date.now()],
      };

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockCache));

      await RateLimitService.loadLocalCache();
      expect(RateLimitService.localCache.size).toBe(1);

      await RateLimitService.saveLocalCache();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@rate_limits',
        expect.any(String)
      );
    });

    it('should cleanup expired entries', async () => {
      const oldTimestamp = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
      const recentTimestamp = Date.now() - (30 * 60 * 1000); // 30 minutes ago

      RateLimitService.localCache.set('old_key', [oldTimestamp]);
      RateLimitService.localCache.set('recent_key', [recentTimestamp]);

      await RateLimitService.cleanupExpiredEntries();

      // Old entries should be cleaned up
      expect(RateLimitService.localCache.has('old_key')).toBe(false);
      expect(RateLimitService.localCache.has('recent_key')).toBe(true);
    });
  });

  describe('Rate Limit Constants', () => {
    it('should have correct limit constants', () => {
      expect(RateLimitService.LIMITS.LOGIN_ATTEMPTS).toBe(5);
      expect(RateLimitService.LIMITS.LOGIN_WINDOW_MINUTES).toBe(15);
      expect(RateLimitService.LIMITS.SWIPE_ACTIONS).toBe(100);
      expect(RateLimitService.LIMITS.SWIPE_WINDOW_MINUTES).toBe(60);
      expect(RateLimitService.LIMITS.MESSAGES_SENT).toBe(50);
      expect(RateLimitService.LIMITS.MESSAGES_WINDOW_MINUTES).toBe(60);
    });

    it('should have correct block durations', () => {
      expect(RateLimitService.BLOCK_DURATIONS.LOGIN_BLOCK).toBe(30);
      expect(RateLimitService.BLOCK_DURATIONS.API_BLOCK).toBe(15);
      expect(RateLimitService.BLOCK_DURATIONS.PERMANENT_BLOCK).toBe(1440);
    });
  });
});
