/**
 * AnalyticsService Tests
 *
 * Tests for analytics event tracking and error logging
 */
import AnalyticsService from '../AnalyticsService';

// Mock dependencies
jest.mock('../supabaseClient');
jest.mock('../Logger');

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset AnalyticsService state
    AnalyticsService.userId = null;
    AnalyticsService.sessionId = null;
    AnalyticsService.sessionStartTime = null;
  });

  describe('trackEvent', () => {
    it('should track event successfully', async () => {
      AnalyticsService.userId = 'user-123';
      AnalyticsService.sessionId = 'session-456';

      const result = await AnalyticsService.trackEvent('test_event', {
        property1: 'value1',
      });

      expect(result.success).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const saveEventSpy = jest.spyOn(AnalyticsService, 'saveEvent').mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await AnalyticsService.trackEvent('test_event');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');

      saveEventSpy.mockRestore();
    });
  });

  describe('trackScreen', () => {
    it('should track screen view event', async () => {
      const trackEventSpy = jest.spyOn(AnalyticsService, 'trackEvent').mockResolvedValue({ success: true });

      const result = await AnalyticsService.trackScreen('HomeScreen');

      expect(trackEventSpy).toHaveBeenCalledWith(
        AnalyticsService.eventTypes.SCREEN_VIEWED,
        expect.objectContaining({ screen_name: 'HomeScreen' })
      );
      expect(result.success).toBe(true);

      trackEventSpy.mockRestore();
    });
  });

  describe('setUserProperties', () => {
    it('should set user properties successfully', async () => {
      const result = await AnalyticsService.setUserProperties('user-123', {
        age: 25,
        interests: ['music', 'sports'],
      });

      expect(result.success).toBe(true);
    });
  });

  describe('getUserProperties', () => {
    it('should return user properties successfully', async () => {
      const result = await AnalyticsService.getUserProperties('user-123');

      expect(result.success).toBe(true);
      expect(result.properties).toEqual({});
    });
  });

  describe('logError', () => {
    it('should log error with context', async () => {
      const testError = new Error('Test error');
      testError.code = 'TEST_ERROR';

      AnalyticsService.userId = 'user-123';
      AnalyticsService.sessionId = 'session-456';

      const result = await AnalyticsService.logError(testError, {
        screen: 'HomeScreen',
        action: 'swipe',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('session management', () => {
    it('should initialize analytics session', () => {
      AnalyticsService.initSession('user-123');

      expect(AnalyticsService.userId).toBe('user-123');
      expect(AnalyticsService.sessionId).toBeDefined();
      expect(AnalyticsService.sessionStartTime).toBeDefined();
    });

    it('should end analytics session', () => {
      AnalyticsService.initSession('user-123');
      AnalyticsService.endSession();

      expect(AnalyticsService.userId).toBeNull();
      expect(AnalyticsService.sessionId).toBeNull();
      expect(AnalyticsService.sessionStartTime).toBeNull();
    });
  });

  describe('PII sanitization', () => {
    it('should sanitize email addresses', () => {
      const result = AnalyticsService.sanitizePII({
        email: 'test@example.com',
        name: 'John Doe',
      });

      expect(result.email).toBe('[REDACTED]');
      expect(result.name).toBe('John Doe');
    });

    it('should handle nested objects', () => {
      const result = AnalyticsService.sanitizePII({
        user: {
          email: 'test@example.com',
          profile: {
            phone: '+1234567890',
          },
        },
        normalField: 'normal_value',
      });

      expect(result.user.email).toBe('[REDACTED]');
      expect(result.user.profile.phone).toBe('[REDACTED]');
      expect(result.normalField).toBe('normal_value');
    });
  });

  describe('event types', () => {
    it('should have all required event types defined', () => {
      expect(AnalyticsService.eventTypes.USER_SIGNED_UP).toBe('user_signed_up');
      expect(AnalyticsService.eventTypes.USER_SIGNED_IN).toBe('user_signed_in');
      expect(AnalyticsService.eventTypes.ERROR_OCCURRED).toBe('error_occurred');
      expect(AnalyticsService.eventTypes.SCREEN_VIEWED).toBe('screen_viewed');
    });
  });
});
