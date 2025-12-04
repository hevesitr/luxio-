/**
 * OnboardingValidationService Tests
 *
 * Tests for the onboarding validation logic
 */
import OnboardingValidationService from '../OnboardingValidationService';

describe('OnboardingValidationService', () => {
  describe('validateBasicInfo', () => {
    it('should pass valid basic info', () => {
      const data = {
        name: 'John Doe',
        birthday: '1990-01-01',
        gender: 'male'
      };

      const result = OnboardingValidationService.validateBasicInfo(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.completionPercentage).toBeGreaterThan(0);
    });

    it('should reject missing name', () => {
      const data = {
        birthday: '1990-01-01',
        gender: 'male'
      };

      const result = OnboardingValidationService.validateBasicInfo(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'name', type: 'required' })
      );
    });

    it('should reject invalid age', () => {
      const data = {
        name: 'John Doe',
        birthday: '2010-01-01', // Too young
        gender: 'male'
      };

      const result = OnboardingValidationService.validateBasicInfo(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'birthday', type: 'age' })
      );
    });
  });

  describe('validatePhotos', () => {
    it('should pass with minimum photos', () => {
      const photos = [
        { id: '1', uri: 'photo1.jpg' },
        { id: '2', uri: 'photo2.jpg' }
      ];

      const result = OnboardingValidationService.validatePhotos(photos);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject with too few photos', () => {
      const photos = [{ id: '1', uri: 'photo1.jpg' }];

      const result = OnboardingValidationService.validatePhotos(photos);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ type: 'minCount' })
      );
    });

    it('should show warning for recommended photos', () => {
      const photos = [
        { id: '1', uri: 'photo1.jpg' },
        { id: '2', uri: 'photo2.jpg' },
        { id: '3', uri: 'photo3.jpg' }
      ];

      const result = OnboardingValidationService.validatePhotos(photos);

      expect(result.warnings).toContainEqual(
        expect.objectContaining({ type: 'recommendation' })
      );
    });
  });

  describe('validateBioAndInterests', () => {
    it('should pass with valid bio and interests', () => {
      const data = {
        bio: 'This is a valid bio with enough content for the validation.',
        interests: ['Travel', 'Music', 'Sports']
      };

      const result = OnboardingValidationService.validateBioAndInterests(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject bio too short', () => {
      const data = {
        bio: 'Too short',
        interests: ['Travel']
      };

      const result = OnboardingValidationService.validateBioAndInterests(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'bio', type: 'minLength' })
      );
    });

    it('should show warning for no interests', () => {
      const data = {
        bio: 'This is a valid bio with enough content for the validation.',
        interests: []
      };

      const result = OnboardingValidationService.validateBioAndInterests(data);

      expect(result.warnings).toContainEqual(
        expect.objectContaining({ field: 'interests', type: 'recommendation' })
      );
    });
  });

  describe('validatePreferences', () => {
    it('should pass with valid preferences', () => {
      const data = {
        lookingFor: 'female',
        minAge: 20,
        maxAge: 35,
        maxDistance: 50
      };

      const result = OnboardingValidationService.validatePreferences(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid age range', () => {
      const data = {
        lookingFor: 'female',
        minAge: 40,
        maxAge: 30, // Min > Max
        maxDistance: 50
      };

      const result = OnboardingValidationService.validatePreferences(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'ageRange', type: 'range' })
      );
    });
  });

  describe('validateCompleteOnboarding', () => {
    it('should validate all steps together', () => {
      const data = {
        name: 'John Doe',
        birthday: '1990-01-01',
        gender: 'male',
        photos: [
          { id: '1', uri: 'photo1.jpg' },
          { id: '2', uri: 'photo2.jpg' }
        ],
        bio: 'This is a valid bio with enough content for validation.',
        interests: ['Travel', 'Music'],
        lookingFor: 'female',
        minAge: 20,
        maxAge: 35,
        maxDistance: 50
      };

      const result = OnboardingValidationService.validateCompleteOnboarding(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.stepValidations).toHaveProperty('step1');
      expect(result.stepValidations).toHaveProperty('step2');
      expect(result.stepValidations).toHaveProperty('step3');
      expect(result.stepValidations).toHaveProperty('step4');
    });
  });

  describe('calculateOverallCompletion', () => {
    it('should calculate completion percentage', () => {
      const data = {
        name: 'John',
        birthday: '1990-01-01',
        gender: 'male',
        photos: [{ id: '1', uri: 'photo1.jpg' }, { id: '2', uri: 'photo2.jpg' }],
        bio: 'Valid bio content here.',
        interests: ['Travel'],
        lookingFor: 'female',
        minAge: 20,
        maxAge: 30,
        maxDistance: 50
      };

      const completion = OnboardingValidationService.calculateOverallCompletion(data);

      expect(completion).toBeGreaterThanOrEqual(0);
      expect(completion).toBeLessThanOrEqual(100);
    });
  });

  describe('getValidationTips', () => {
    it('should return helpful tips', () => {
      const data = {
        photos: [{ id: '1', uri: 'photo1.jpg' }, { id: '2', uri: 'photo2.jpg' }],
        bio: 'Short bio'
      };

      const tips = OnboardingValidationService.getValidationTips(data);

      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBeGreaterThan(0);
      expect(tips[0]).toHaveProperty('title');
      expect(tips[0]).toHaveProperty('message');
      expect(tips[0]).toHaveProperty('type');
    });
  });
});
