/**
 * BoostService Tests
 *
 * Tests for boost functionality and profile visibility enhancement
 */
import BoostService from '../BoostService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('BoostService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any stored data
    BoostService.deactivateBoost();
  });

  describe('activateBoost', () => {
    beforeEach(() => {
      const { setItem } = require('@react-native-async-storage/async-storage');
      setItem.mockResolvedValue();
    });

    it('should activate boost successfully', async () => {
      const result = await BoostService.activateBoost();

      expect(result).toHaveProperty('isActive', true);
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('endTime');
      expect(result).toHaveProperty('profileViews', 0);

      // Check that endTime is 30 minutes after startTime
      expect(result.endTime - result.startTime).toBe(30 * 60 * 1000);
    });

    it('should store boost data in AsyncStorage', async () => {
      const { setItem } = require('@react-native-async-storage/async-storage');

      await BoostService.activateBoost();

      expect(setItem).toHaveBeenCalledWith(
        '@boost_data',
        expect.stringContaining('"isActive":true')
      );
    });

    it('should return null on storage error', async () => {
      const { setItem } = require('@react-native-async-storage/async-storage');
      setItem.mockRejectedValue(new Error('Storage error'));

      const result = await BoostService.activateBoost();
      expect(result).toBeNull();
    });
  });

  describe('getActiveBoost', () => {
    it('should return null when no boost is active', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(null);

      const result = await BoostService.getActiveBoost();
      expect(result).toBeNull();
    });

    it('should return active boost data', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      const boostData = {
        isActive: true,
        startTime: Date.now(),
        endTime: Date.now() + 30 * 60 * 1000,
        profileViews: 5,
      };
      getItem.mockResolvedValue(JSON.stringify(boostData));

      const result = await BoostService.getActiveBoost();
      expect(result).toEqual(boostData);
    });

    it('should deactivate expired boost', async () => {
      const { getItem, removeItem } = require('@react-native-async-storage/async-storage');
      const expiredBoost = {
        isActive: true,
        startTime: Date.now() - 60 * 60 * 1000, // 1 hour ago
        endTime: Date.now() - 30 * 60 * 1000, // 30 minutes ago
        profileViews: 10,
      };
      getItem.mockResolvedValue(JSON.stringify(expiredBoost));
      removeItem.mockResolvedValue();

      const result = await BoostService.getActiveBoost();

      expect(result).toBeNull();
      expect(removeItem).toHaveBeenCalledWith('@boost_data');
    });

    it('should return null on parse error', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue('invalid json');

      const result = await BoostService.getActiveBoost();
      expect(result).toBeNull();
    });
  });

  describe('deactivateBoost', () => {
    it('should deactivate boost successfully', async () => {
      const { removeItem } = require('@react-native-async-storage/async-storage');
      removeItem.mockResolvedValue();

      const result = await BoostService.deactivateBoost();
      expect(result).toBe(true);
      expect(removeItem).toHaveBeenCalledWith('@boost_data');
    });

    it('should return false on error', async () => {
      const { removeItem } = require('@react-native-async-storage/async-storage');
      removeItem.mockRejectedValue(new Error('Storage error'));

      const result = await BoostService.deactivateBoost();
      expect(result).toBe(false);
    });
  });

  describe('isBoostActive', () => {
    it('should return true when boost is active', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      const boostData = {
        isActive: true,
        startTime: Date.now(),
        endTime: Date.now() + 30 * 60 * 1000,
        profileViews: 5,
      };
      getItem.mockResolvedValue(JSON.stringify(boostData));

      const result = await BoostService.isBoostActive();
      expect(result).toBe(true);
    });

    it('should return false when no boost is active', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(null);

      const result = await BoostService.isBoostActive();
      expect(result).toBe(false);
    });
  });

  describe('getRemainingTime', () => {
    it('should return remaining time for active boost', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      const boostData = {
        isActive: true,
        startTime: Date.now(),
        endTime: Date.now() + 15 * 60 * 1000, // 15 minutes from now
        profileViews: 5,
      };
      getItem.mockResolvedValue(JSON.stringify(boostData));

      const result = await BoostService.getRemainingTime();
      expect(result).toBeGreaterThan(14 * 60 * 1000); // Should be close to 15 minutes
      expect(result).toBeLessThanOrEqual(15 * 60 * 1000);
    });

    it('should return 0 when no boost is active', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(null);

      const result = await BoostService.getRemainingTime();
      expect(result).toBe(0);
    });
  });

  describe('formatRemainingTime', () => {
    it('should format time correctly', () => {
      expect(BoostService.formatRemainingTime(5 * 60 * 1000 + 30 * 1000)).toBe('5:30');
      expect(BoostService.formatRemainingTime(10 * 60 * 1000)).toBe('10:00');
      expect(BoostService.formatRemainingTime(45 * 1000)).toBe('0:45');
      expect(BoostService.formatRemainingTime(0)).toBe('0:00');
    });

    it('should handle large time values', () => {
      expect(BoostService.formatRemainingTime(90 * 60 * 1000)).toBe('90:00');
    });
  });

  describe('incrementViews', () => {
    beforeEach(() => {
      const { getItem, setItem } = require('@react-native-async-storage/async-storage');
      setItem.mockResolvedValue();
    });

    it('should increment views for active boost', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      const boostData = {
        isActive: true,
        startTime: Date.now(),
        endTime: Date.now() + 30 * 60 * 1000,
        profileViews: 3,
      };
      getItem.mockResolvedValue(JSON.stringify(boostData));

      const result = await BoostService.incrementViews();
      expect(result).toBe(4);
    });

    it('should return 0 when no boost is active', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(null);

      const result = await BoostService.incrementViews();
      expect(result).toBe(0);
    });

    it('should handle storage errors', async () => {
      const { getItem, setItem } = require('@react-native-async-storage/async-storage');
      const boostData = {
        isActive: true,
        startTime: Date.now(),
        endTime: Date.now() + 30 * 60 * 1000,
        profileViews: 1,
      };
      getItem.mockResolvedValue(JSON.stringify(boostData));
      setItem.mockRejectedValue(new Error('Storage error'));

      const result = await BoostService.incrementViews();
      expect(result).toBe(0);
    });
  });

  describe('getBoostStats', () => {
    it('should return stats for active boost', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      const boostData = {
        isActive: true,
        startTime: Date.now(),
        endTime: Date.now() + 15 * 60 * 1000,
        profileViews: 7,
      };
      getItem.mockResolvedValue(JSON.stringify(boostData));

      const stats = await BoostService.getBoostStats();

      expect(stats.isActive).toBe(true);
      expect(stats.profileViews).toBe(7);
      // remainingTime is a Promise, so we need to await it
      expect(await stats.remainingTime).toBeGreaterThan(0);
      expect(stats.startTime).toBe(boostData.startTime);
      expect(stats.endTime).toBe(boostData.endTime);
    });

    it('should return default stats when no boost is active', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(null);

      const stats = await BoostService.getBoostStats();

      expect(stats.isActive).toBe(false);
      expect(stats.profileViews).toBe(0);
      expect(stats.remainingTime).toBe(0);
    });
  });
});
