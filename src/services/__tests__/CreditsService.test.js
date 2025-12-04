/**
 * CreditsService Tests
 *
 * Tests for credit management functionality
 */
import CreditsService, { CREDIT_COSTS, CREDIT_PACKAGES } from '../CreditsService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('CreditsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCredits', () => {
    it('should return default credits when none stored', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(null);

      const credits = await CreditsService.getCredits();
      expect(credits).toBe(100);
    });

    it('should return stored credits', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue('250');

      const credits = await CreditsService.getCredits();
      expect(credits).toBe(250);
    });

    it('should return default credits on error', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockRejectedValue(new Error('Storage error'));

      const credits = await CreditsService.getCredits();
      expect(credits).toBe(100);
    });
  });

  describe('setCredits', () => {
    it('should set credits successfully', async () => {
      const { setItem } = require('@react-native-async-storage/async-storage');
      setItem.mockResolvedValue();

      const result = await CreditsService.setCredits(150);
      expect(result).toBe(true);
      expect(setItem).toHaveBeenCalledWith('@dating_app_credits', '150');
    });

    it('should return false on error', async () => {
      const { setItem } = require('@react-native-async-storage/async-storage');
      setItem.mockRejectedValue(new Error('Storage error'));

      const result = await CreditsService.setCredits(150);
      expect(result).toBe(false);
    });
  });

  describe('addCredits', () => {
    beforeEach(() => {
      const { getItem, setItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue('100');
      setItem.mockResolvedValue();
    });

    it('should add credits successfully', async () => {
      const result = await CreditsService.addCredits(50, 'Test');

      expect(result).toBe(150);
    });

    it('should add to history', async () => {
      await CreditsService.addCredits(25, 'Bonus');

      // Check that addToHistory was called (we'll test addToHistory separately)
      expect(CreditsService.addToHistory).toHaveBeenCalled();
    });
  });

  describe('deductCredits', () => {
    beforeEach(() => {
      const { getItem, setItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue('100');
      setItem.mockResolvedValue();
    });

    it('should deduct credits successfully', async () => {
      const result = await CreditsService.deductCredits(30, 'Purchase');

      expect(result.success).toBe(true);
      expect(result.balance).toBe(70);
      expect(result.message).toBe('Kreditek levonva!');
    });

    it('should fail when insufficient credits', async () => {
      const result = await CreditsService.deductCredits(150, 'Purchase');

      expect(result.success).toBe(false);
      expect(result.balance).toBe(100);
      expect(result.message).toBe('Nincs elég kredit!');
    });
  });

  describe('hasEnoughCredits', () => {
    it('should return true when sufficient credits', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue('50');

      const result = await CreditsService.hasEnoughCredits(30);
      expect(result).toBe(true);
    });

    it('should return false when insufficient credits', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue('20');

      const result = await CreditsService.hasEnoughCredits(30);
      expect(result).toBe(false);
    });
  });

  describe('getHistory', () => {
    it('should return empty array when no history', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(null);

      const history = await CreditsService.getHistory();
      expect(history).toEqual([]);
    });

    it('should return parsed history', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      const mockHistory = [{ type: 'add', amount: 50 }];
      getItem.mockResolvedValue(JSON.stringify(mockHistory));

      const history = await CreditsService.getHistory();
      expect(history).toEqual(mockHistory);
    });

    it('should return empty array on parse error', async () => {
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue('invalid json');

      const history = await CreditsService.getHistory();
      expect(history).toEqual([]);
    });
  });

  describe('purchasePackage', () => {
    it('should purchase package successfully', async () => {
      const result = await CreditsService.purchasePackage(1);

      expect(result.success).toBe(true);
      expect(result.message).toContain('50 kredit hozzáadva');
      expect(result.balance).toBeDefined();
    });

    it('should fail for invalid package', async () => {
      const result = await CreditsService.purchasePackage(999);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Érvénytelen csomag!');
    });
  });

  describe('constants', () => {
    it('should export CREDIT_COSTS', () => {
      expect(CREDIT_COSTS).toBeDefined();
      expect(CREDIT_COSTS.sendGift).toBe(10);
      expect(CREDIT_COSTS.superLike).toBe(5);
    });

    it('should export CREDIT_PACKAGES', () => {
      expect(CREDIT_PACKAGES).toBeDefined();
      expect(CREDIT_PACKAGES.length).toBeGreaterThan(0);
      expect(CREDIT_PACKAGES[0]).toHaveProperty('id', 'credits', 'price');
    });
  });
});
