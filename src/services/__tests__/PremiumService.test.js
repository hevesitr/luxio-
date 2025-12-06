/**
 * PremiumService Unit Tests
 * Tests premium features, tier management, and server-side validation
 */
import PremiumService from '../PremiumService';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
}));

// Mock supabase before importing PremiumService
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            gt: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: { tier: 'gold', expiry_date: new Date(Date.now() + 86400000).toISOString() },
                    error: null
                  })),
                })),
              })),
            })),
          })),
        })),
      })),
    })),
    rpc: jest.fn(() => ({
      data: { allowed: true },
      error: null,
    })),
  },
}));

describe('PremiumService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tier Management', () => {
    it('should get user tier from server when userId provided', async () => {
      const tier = await PremiumService.getUserTier('user123');
      expect(tier).toBe('gold');
    });

    it('should fallback to local storage when no server data', async () => {
      const mockSupabase = require('../supabaseClient').supabase;
      mockSupabase.from.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            eq: () => ({
              gt: () => ({
                order: () => ({
                  limit: () => ({
                    single: () => ({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ tier: 'plus' }));

      const tier = await PremiumService.getUserTier('user123');
      expect(tier).toBe('plus');
    });

    it('should return free tier by default', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const tier = await PremiumService.getUserTier();
      expect(tier).toBe('free');
    });

    it('should set user tier', async () => {
      AsyncStorage.setItem.mockResolvedValue();

      const success = await PremiumService.setUserTier('gold');
      expect(success).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Feature Access', () => {
    it('should get features for a tier', async () => {
      const features = await PremiumService.getFeatures('user123');
      expect(features).toHaveProperty('dailySwipes');
      expect(features).toHaveProperty('superLikesPerDay');
    });

    it('should check feature access', async () => {
      const hasFeature = await PremiumService.hasFeature('rewind', 'user123');
      expect(typeof hasFeature).toBe('boolean');
    });

    it('should check swipe limits', async () => {
      const canSwipe = await PremiumService.canSwipe('user123', 50);
      expect(typeof canSwipe).toBe('boolean');
    });

    it('should check super like limits', async () => {
      const canSuperLike = await PremiumService.canSuperLike('user123', 2);
      expect(typeof canSuperLike).toBe('boolean');
    });

    it('should check boost limits', async () => {
      const canBoost = await PremiumService.canBoost('user123', 0);
      expect(typeof canBoost).toBe('boolean');
    });
  });

  describe('Server-side Validation', () => {
    it('should check server limits', async () => {
      const result = await PremiumService.checkServerLimit('user123', 'swipe', 50);
      expect(result).toBe(true); // Server allows (from mock)
    });

    it('should fallback to local validation on server error', async () => {
      // Temporarily modify the mock to return error
      const mockSupabase = require('../supabaseClient').supabase;
      const originalRpc = mockSupabase.rpc;
      mockSupabase.rpc = jest.fn(() => Promise.resolve({
        data: null,
        error: { message: 'Server error' },
      }));

      const result = await PremiumService.checkServerLimit('user123', 'swipe', 50);
      expect(result).toBe(null); // Fallback to local

      // Restore original mock
      mockSupabase.rpc = originalRpc;
    });
  });

  describe('Tier Display', () => {
    it('should get tier display name', () => {
      expect(PremiumService.getTierDisplayName('free')).toBe('Ingyenes');
      expect(PremiumService.getTierDisplayName('plus')).toBe('Prémium Plus');
      expect(PremiumService.getTierDisplayName('gold')).toBe('Prémium Gold');
      expect(PremiumService.getTierDisplayName('platinum')).toBe('Prémium Platinum');
    });

    it('should get tier benefits', () => {
      const benefits = PremiumService.getTierBenefits('plus');
      expect(Array.isArray(benefits)).toBe(true);
      expect(benefits.length).toBeGreaterThan(0);
    });
  });

  describe('Daily Counters', () => {
    it('should get daily swipe count', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        count: 25,
        date: new Date().toDateString()
      }));

      const count = await PremiumService.getDailySwipeCount();
      expect(count).toBe(25);
    });

    it('should reset count for new day', async () => {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        count: 25,
        date: yesterday
      }));

      const count = await PremiumService.getDailySwipeCount();
      expect(count).toBe(0);
    });

    it('should increment daily swipe count', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.setItem.mockResolvedValue();

      const newCount = await PremiumService.incrementSwipeCount();
      expect(newCount).toBe(1);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should increment daily super like count', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.setItem.mockResolvedValue();

      const newCount = await PremiumService.incrementSuperLikeCount();
      expect(newCount).toBe(1);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Monthly Counters', () => {
    it('should get monthly boost count', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        count: 1,
        month: new Date().getMonth()
      }));

      const count = await PremiumService.getMonthlyBoostCount();
      expect(count).toBe(1);
    });

    it('should reset count for new month', async () => {
      const lastMonth = new Date().getMonth() - 1;
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        count: 1,
        month: lastMonth
      }));

      const count = await PremiumService.getMonthlyBoostCount();
      expect(count).toBe(0);
    });

    it('should increment monthly boost count', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.setItem.mockResolvedValue();

      const newCount = await PremiumService.incrementBoostCount();
      expect(newCount).toBe(1);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Constants', () => {
    it('should have correct tier constants', () => {
      expect(PremiumService.TIERS.FREE).toBe('free');
      expect(PremiumService.TIERS.PLUS).toBe('plus');
      expect(PremiumService.TIERS.GOLD).toBe('gold');
      expect(PremiumService.TIERS.PLATINUM).toBe('platinum');
    });

    it('should have correct pricing', () => {
      expect(PremiumService.PRICING[PremiumService.TIERS.PLUS]).toBe(3000);
      expect(PremiumService.PRICING[PremiumService.TIERS.GOLD]).toBe(5000);
      expect(PremiumService.PRICING[PremiumService.TIERS.PLATINUM]).toBe(7000);
    });
  });
});
