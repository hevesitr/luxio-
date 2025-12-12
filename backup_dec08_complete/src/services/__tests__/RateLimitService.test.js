/**
 * RateLimitService Unit Tests
 * Tests rate limiting, brute force protection, and API throttling
 */
import RateLimitService from '../RateLimitService';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
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
    // Reset RateLimitService state
    RateLimitService.localCache = new Map();
    RateLimitService.blockedUsers = new Set();
  });

  describe('Login Attempts', () => {
    it('should allow login attempts within limits', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result1 = await RateLimitService.checkLoginAttempts('user@example.com');
      const result2 = await RateLimitService.checkLoginAttempts('user@example.com');
      const result3 = await RateLimitService.checkLoginAttempts('user@example.com');

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(true);
    });

    it('should block login attempts after limit exceeded', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      // Exceed the limit (5 attempts)
      for (let i = 0; i < 6; i++) {
        await RateLimitService.checkLoginAttempts('user@example.com');
      }

      const result = await RateLimitService.checkLoginAttempts('user@example.com');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('too_many_attempts');
    });

    it('should record failed login attempts', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      await RateLimitService.recordFailedLogin('user@example.com');

      // Should increment the attempts counter
      const attempts = await RateLimitService.getAttempts('login_attempts_user@example.com', 15);
      expect(attempts.length).toBe(1);
    });

    it('should reset login attempts after successful login', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      await RateLimitService.recordFailedLogin('user@example.com');
      await RateLimitService.recordSuccessfulLogin('user@example.com');

      const attempts = await RateLimitService.getAttempts('login_attempts_user@example.com', 15);
      expect(attempts.length).toBe(0);
    });
  });

  describe('Swipe Actions', () => {
    it('should allow swipe actions within daily limits', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await RateLimitService.checkSwipeAction('user123');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99); // 100 - 1 after consumption
    });

    it('should block swipe actions after daily limit exceeded', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

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
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await RateLimitService.checkMessageSend('user123');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(49); // 50 - 1
    });

    it('should block message sending after hourly limit exceeded', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

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
      AsyncStorage.setItem.mockResolvedValue();

      await RateLimitService.blockUser('user123', 'test_block', 60); // 60 minutes

      const isBlocked = await RateLimitService.isUserBlocked('user123');
      expect(isBlocked.blocked).toBe(true);
      expect(isBlocked.remainingMinutes).toBeLessThanOrEqual(60);
    });

    it('should allow unblocking users', async () => {
      AsyncStorage.setItem.mockResolvedValue();
      AsyncStorage.removeItem.mockResolvedValue();

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
