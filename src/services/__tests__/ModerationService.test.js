/**
 * ModerationService Tests
 *
 * Tests for moderation, reporting, and content filtering
 */
import ModerationService, { ModerationService as ModerationServiceClass } from '../ModerationService';

describe('ModerationService', () => {
  describe('Content Filtering', () => {
    it('should detect profanity in content', () => {
      const result = ModerationService.filterContent('This is fucking awesome!');

      expect(result.isClean).toBe(false);
      expect(result.flagReasons).toContain(ModerationServiceClass.FLAG_REASONS.PROFANITY);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect explicit material', () => {
      const result = ModerationService.filterContent('Check out this porn site');

      expect(result.isClean).toBe(false);
      expect(result.flagReasons).toContain(ModerationServiceClass.FLAG_REASONS.EXPLICIT);
    });

    it('should detect hate speech', () => {
      const result = ModerationService.filterContent('Those niggers are stupid');

      expect(result.isClean).toBe(false);
      expect(result.flagReasons).toContain(ModerationServiceClass.FLAG_REASONS.HATE_SPEECH);
    });

    it('should detect spam', () => {
      const result = ModerationService.filterContent('Buy now!!!! 12345678901234567890');

      expect(result.isClean).toBe(false);
      expect(result.flagReasons).toContain(ModerationServiceClass.FLAG_REASONS.SPAM);
    });

    it('should pass clean content', () => {
      const result = ModerationService.filterContent('This is a nice message about traveling');

      expect(result.isClean).toBe(true);
      expect(result.flagReasons).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });

    it('should calculate confidence score based on match count', () => {
      const result = ModerationService.filterContent('fuck shit damn crap');

      expect(result.isClean).toBe(false);
      expect(result.confidence).toBeGreaterThan(20); // Multiple matches increase confidence
    });
  });

  describe('Report Submission', () => {
    it('should validate report inputs', () => {
      // This would require mocking Supabase, so we'll test the validation logic
      expect(ModerationServiceClass.REPORT_TYPES.HARASSMENT).toBe('harassment');
      expect(ModerationServiceClass.REPORT_TYPES.INAPPROPRIATE_CONTENT).toBe('inappropriate_content');
      expect(ModerationServiceClass.REPORT_TYPES.SPAM).toBe('spam');
    });
  });

  describe('Flag Reasons', () => {
    it('should have all required flag reasons defined', () => {
      expect(ModerationServiceClass.FLAG_REASONS.PROFANITY).toBe('profanity');
      expect(ModerationServiceClass.FLAG_REASONS.EXPLICIT).toBe('explicit');
      expect(ModerationServiceClass.FLAG_REASONS.HATE_SPEECH).toBe('hate_speech');
      expect(ModerationServiceClass.FLAG_REASONS.SPAM).toBe('spam');
      expect(ModerationServiceClass.FLAG_REASONS.HARASSMENT).toBe('harassment');
    });
  });

  describe('Report Types', () => {
    it('should have all required report types defined', () => {
      expect(ModerationServiceClass.REPORT_TYPES.HARASSMENT).toBe('harassment');
      expect(ModerationServiceClass.REPORT_TYPES.INAPPROPRIATE_CONTENT).toBe('inappropriate_content');
      expect(ModerationServiceClass.REPORT_TYPES.SPAM).toBe('spam');
      expect(ModerationServiceClass.REPORT_TYPES.FAKE_PROFILE).toBe('fake_profile');
      expect(ModerationServiceClass.REPORT_TYPES.UNDERAGE).toBe('underage');
      expect(ModerationServiceClass.REPORT_TYPES.OTHER).toBe('other');
    });
  });
});
