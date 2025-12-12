import OnboardingValidationService from '../OnboardingValidationService';

describe('Simple Test', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });

  it('should import OnboardingValidationService', () => {
    expect(OnboardingValidationService).toBeDefined();
    expect(typeof OnboardingValidationService.validateBasicInfo).toBe('function');
  });
});
