/**
 * GamificationService Tests
 *
 * Tests for gamification features like streaks, badges, and stats
 */
import GamificationService from '../GamificationService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('GamificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentStreak', () => {
    it('should return default streak when none stored', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(null);

      const streak = await GamificationService.getCurrentStreak();
      expect(streak).toEqual({ days: 0, lastDate: null });
    });

    it('should return parsed streak data', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      const mockStreak = { days: 5, lastDate: '2024-01-01' };
      getItem.mockResolvedValue(JSON.stringify(mockStreak));

      const streak = await GamificationService.getCurrentStreak();
      expect(streak).toEqual(mockStreak);
    });

    it('should return default on parse error', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue('invalid json');

      const streak = await GamificationService.getCurrentStreak();
      expect(streak).toEqual({ days: 0, lastDate: null });
    });
  });

  describe('updateStreak', () => {
    beforeEach(() => {
      const { getItem, setItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(null);
      setItem.mockResolvedValue();
    });

    it('should start new streak for first day', async () => {
      const result = await GamificationService.updateStreak();

      expect(result.days).toBe(1);
      expect(result.lastDate).toBe(new Date().toDateString());
    });

    it('should maintain streak for same day', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      const today = new Date().toDateString();
      getItem.mockResolvedValue(JSON.stringify({ days: 3, lastDate: today }));

      const result = await GamificationService.updateStreak();

      expect(result.days).toBe(3);
      expect(result.lastDate).toBe(today);
    });

    it('should increment streak for consecutive days', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      getItem.mockResolvedValue(JSON.stringify({ days: 3, lastDate: yesterday }));

      const result = await GamificationService.updateStreak();

      expect(result.days).toBe(4);
      expect(result.lastDate).toBe(new Date().toDateString());
    });

    it('should reset streak for non-consecutive days', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toDateString();
      getItem.mockResolvedValue(JSON.stringify({ days: 5, lastDate: twoDaysAgo }));

      const result = await GamificationService.updateStreak();

      expect(result.days).toBe(1);
      expect(result.lastDate).toBe(new Date().toDateString());
    });
  });

  describe('getBadges', () => {
    it('should return empty array when no badges stored', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(null);

      const badges = await GamificationService.getBadges();
      expect(badges).toEqual([]);
    });

    it('should return parsed badges array', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      const mockBadges = [{ id: 'test', name: 'Test Badge' }];
      getItem.mockResolvedValue(JSON.stringify(mockBadges));

      const badges = await GamificationService.getBadges();
      expect(badges).toEqual(mockBadges);
    });
  });

  describe('addBadge', () => {
    beforeEach(() => {
      const { getItem, setItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue('[]');
      setItem.mockResolvedValue();
    });

    it('should add new badge successfully', async () => {
      const badges = await GamificationService.addBadge('test', 'Test Badge', 'star', 'Test description');

      expect(badges).toHaveLength(1);
      expect(badges[0]).toEqual({
        id: 'test',
        name: 'Test Badge',
        icon: 'star',
        description: 'Test description',
        earnedAt: expect.any(String),
      });
    });

    it('should not add duplicate badge', async () => {
      // Mock existing badge
      const { getItem, setItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(JSON.stringify([{ id: 'test', name: 'Existing Badge' }]));
      setItem.mockResolvedValue();

      // Try to add existing badge
      const badges = await GamificationService.addBadge('test', 'Test Badge', 'star', 'Test');

      expect(badges).toHaveLength(1);
      expect(badges[0].id).toBe('test');
      expect(badges[0].name).toBe('Existing Badge'); // Should keep existing
      expect(setItem).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return default stats when none stored', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(null);

      const stats = await GamificationService.getStats();
      expect(stats).toEqual({
        totalMatches: 0,
        totalMessages: 0,
        totalLikes: 0,
        profileViews: 0,
        lastUpdated: null,
      });
    });

    it('should return parsed stats', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      const mockStats = {
        totalMatches: 10,
        totalMessages: 50,
        totalLikes: 25,
        profileViews: 100,
        lastUpdated: '2024-01-01T00:00:00.000Z',
      };
      getItem.mockResolvedValue(JSON.stringify(mockStats));

      const stats = await GamificationService.getStats();
      expect(stats).toEqual(mockStats);
    });
  });

  describe('updateStats', () => {
    beforeEach(() => {
      const { getItem, setItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(JSON.stringify({
        totalMatches: 5,
        totalMessages: 20,
        totalLikes: 10,
        profileViews: 50,
      }));
      setItem.mockResolvedValue();
    });

    it('should update stats successfully', async () => {
      const updates = { totalMatches: 6, totalMessages: 25 };
      const newStats = await GamificationService.updateStats(updates);

      expect(newStats.totalMatches).toBe(6);
      expect(newStats.totalMessages).toBe(25);
      expect(newStats.totalLikes).toBe(10); // Unchanged
      expect(newStats.lastUpdated).toBeDefined();
    });
  });

  describe('increment functions', () => {
    beforeEach(() => {
      const { getItem, setItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(JSON.stringify({
        totalMatches: 5,
        totalMessages: 20,
        totalLikes: 10,
        profileViews: 50,
      }));
      setItem.mockResolvedValue();
    });

    it('should increment matches', async () => {
      const result = await GamificationService.incrementMatch();

      expect(result.stats.totalMatches).toBe(6);
      expect(result.newBadges).toEqual([]); // No new badges at 6 matches
    });

    it('should increment messages', async () => {
      const result = await GamificationService.incrementMessage();

      expect(result.stats.totalMessages).toBe(21);
    });

    it('should increment likes', async () => {
      const result = await GamificationService.incrementLike();

      expect(result.stats.totalLikes).toBe(11);
    });

    it('should increment profile views', async () => {
      const result = await GamificationService.incrementProfileView();

      expect(result.stats.profileViews).toBe(51);
    });
  });

  describe('checkAndAwardBadges', () => {
    beforeEach(() => {
      const { getItem, setItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue('[]'); // No existing badges
      setItem.mockResolvedValue();
    });

    it('should award match badges', async () => {
      const stats = { totalMatches: 15 };

      const newBadges = await GamificationService.checkAndAwardBadges(stats);

      expect(newBadges).toContain('matches_10');
      expect(newBadges).not.toContain('matches_50'); // Not enough
    });

    it('should award streak badges', async () => {
      // Mock streak
      GamificationService.getCurrentStreak = jest.fn().mockResolvedValue({ days: 10 });

      const stats = { totalMatches: 1 };
      const newBadges = await GamificationService.checkAndAwardBadges(stats);

      expect(newBadges).toContain('streak_7');
    });

    it('should not award duplicate badges', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(JSON.stringify([{ id: 'matches_10' }]));

      const stats = { totalMatches: 15 };
      const newBadges = await GamificationService.checkAndAwardBadges(stats);

      expect(newBadges).not.toContain('matches_10');
    });
  });

  describe('checkDailyActivity', () => {
    beforeEach(() => {
      const { getItem, setItem } = require('@react-native-async-storage/async-storage');
      setItem.mockResolvedValue();
    });

    it('should update streak on first daily activity', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(null); // No previous activity

      GamificationService.updateStreak = jest.fn().mockResolvedValue({ days: 1 });

      const result = await GamificationService.checkDailyActivity();

      expect(result.days).toBe(1);
    });

    it('should return existing streak for same day', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      const today = new Date().toDateString();
      getItem.mockResolvedValue(today); // Already active today

      GamificationService.getCurrentStreak = jest.fn().mockResolvedValue({ days: 3 });

      const result = await GamificationService.checkDailyActivity();

      expect(result.days).toBe(3);
      expect(GamificationService.updateStreak).not.toHaveBeenCalled();
    });
  });
});
