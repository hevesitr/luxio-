import ABTestingService from '../ABTestingService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock ServiceError
jest.mock('../ServiceError', () => {
  return jest.fn().mockImplementation((code, message, details) => ({
    code,
    message,
    details,
  }));
});

// Mock ErrorHandler
jest.mock('../ErrorHandler', () => ({
  handleServiceError: jest.fn().mockImplementation((error, code, context) => ({
    success: false,
    error: error.message || 'Unknown error',
    code,
    context
  }))
}));

describe('ABTestingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.removeItem.mockResolvedValue();
  });

  describe('assignUserToExperiments', () => {
    it('should assign user to all experiments', async () => {
      const result = await ABTestingService.assignUserToExperiments('user123');

      expect(result.success).toBe(true);
      expect(result.assignments).toHaveProperty('onboarding_flow');
      expect(result.assignments).toHaveProperty('paywall_design');
      expect(result.assignments).toHaveProperty('onboarding_copy');
      expect(result.assignments).toHaveProperty('paywall_pricing');
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should assign variants based on user ID (consistent)', async () => {
      const result1 = await ABTestingService.assignUserToExperiments('user123');
      AsyncStorage.getItem.mockResolvedValue(null); // Reset
      const result2 = await ABTestingService.assignUserToExperiments('user123');

      // Same user should get same assignments
      expect(result1.assignments.onboarding_flow).toBe(result2.assignments.onboarding_flow);
    });
  });

  describe('getUserVariants', () => {
    it('should return assigned variants for existing user', async () => {
      const mockData = {
        assignments: {
          onboarding_flow: 'standard',
          paywall_design: 'minimal'
        }
      };

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockData));

      const result = await ABTestingService.getUserVariants('user123');

      expect(result.onboarding_flow).toBe('standard');
      expect(result.paywall_design).toBe('minimal');
    });

    it('should assign variants for new user', async () => {
      const result = await ABTestingService.getUserVariants('user456');

      expect(result).toHaveProperty('onboarding_flow');
      expect(result).toHaveProperty('paywall_design');
    });
  });

  describe('trackEvent', () => {
    it('should track valid experiment events', async () => {
      const result = await ABTestingService.trackEvent(
        'user123',
        'onboarding_flow',
        'standard',
        'onboarding_complete',
        { step: 5, timeSpent: 120 }
      );

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should reject invalid experiment', async () => {
      const result = await ABTestingService.trackEvent(
        'user123',
        'invalid_experiment',
        'standard',
        'test_event'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Ismeretlen kísérlet');
    });
  });

  describe('getExperimentResults', () => {
    beforeEach(() => {
      const mockEvents = [
        {
          userId: 'user1',
          experimentId: 'onboarding_flow',
          variant: 'standard',
          eventType: 'onboarding_complete',
          timestamp: new Date().toISOString()
        },
        {
          userId: 'user2',
          experimentId: 'onboarding_flow',
          variant: 'simplified',
          eventType: 'onboarding_started',
          timestamp: new Date().toISOString()
        }
      ];

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockEvents));
    });

    it('should calculate experiment results', async () => {
      const result = await ABTestingService.getExperimentResults('onboarding_flow');

      expect(result.success).toBe(true);
      expect(result.experiment).toHaveProperty('name');
      expect(result.results).toHaveProperty('standard');
      expect(result.results).toHaveProperty('simplified');
      expect(result.results.standard).toHaveProperty('conversionRate');
    });

    it('should reject invalid experiment', async () => {
      const result = await ABTestingService.getExperimentResults('invalid_experiment');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Ismeretlen kísérlet');
    });
  });

  describe('getVariantContent', () => {
    it('should return content for valid variant', async () => {
      const result = await ABTestingService.getVariantContent('onboarding_flow', 'simplified');

      expect(result.success).toBe(true);
      expect(result.content).toHaveProperty('title');
      expect(result.content.title).toBe('Kezdjük!');
    });

    it('should reject invalid experiment', async () => {
      const result = await ABTestingService.getVariantContent('invalid_experiment', 'variant');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Ismeretlen kísérlet');
    });
  });

  describe('resetUserAssignments', () => {
    it('should reset user assignments', async () => {
      const result = await ABTestingService.resetUserAssignments('user123');

      expect(result.success).toBe(true);
      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('Conversion tracking', () => {
    it('should identify onboarding completion as conversion', () => {
      const service = ABTestingService;
      const event = {
        experimentId: 'onboarding_flow',
        eventType: 'onboarding_complete'
      };

      // Test private method indirectly through results calculation
      expect(service._isConversionEvent('onboarding_flow', event)).toBe(true);
    });

    it('should identify subscription start as conversion', () => {
      const service = ABTestingService;
      const event = {
        experimentId: 'paywall_design',
        eventType: 'subscription_started'
      };

      expect(service._isConversionEvent('paywall_design', event)).toBe(true);
    });

    it('should not identify non-conversion events', () => {
      const service = ABTestingService;
      const event = {
        experimentId: 'onboarding_flow',
        eventType: 'step_viewed'
      };

      expect(service._isConversionEvent('onboarding_flow', event)).toBe(false);
    });
  });
});
