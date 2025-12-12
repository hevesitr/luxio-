/**
 * ErrorMessageService Tests
 *
 * Tests for the error message mapping and user-friendly error handling
 */
import ErrorMessageService from '../ErrorMessageService';

describe('ErrorMessageService', () => {
  describe('getErrorMessage', () => {
    it('should return correct error message for known error codes', () => {
      const error = ErrorMessageService.getErrorMessage(
        ErrorMessageService.ERROR_CODES.AUTH_INVALID_CREDENTIALS
      );

      expect(error).toHaveProperty('title');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('action');
      expect(error).toHaveProperty('recoverySteps');
      expect(error.title).toBe('Hibás bejelentkezési adatok');
    });

    it('should return default error for unknown error codes', () => {
      const error = ErrorMessageService.getErrorMessage('UNKNOWN_ERROR');

      expect(error).toHaveProperty('title', 'Ismeretlen hiba');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('action');
      expect(error).toHaveProperty('recoverySteps');
    });
  });

  describe('mapErrorString', () => {
    it('should map authentication errors', () => {
      expect(
        ErrorMessageService.mapErrorString('invalid login credentials')
      ).toBe(ErrorMessageService.ERROR_CODES.AUTH_INVALID_CREDENTIALS);

      expect(
        ErrorMessageService.mapErrorString('user not found')
      ).toBe(ErrorMessageService.ERROR_CODES.AUTH_USER_NOT_FOUND);
    });

    it('should map validation errors', () => {
      expect(
        ErrorMessageService.mapErrorString('required')
      ).toBe(ErrorMessageService.ERROR_CODES.VALIDATION_REQUIRED_FIELD);

      expect(
        ErrorMessageService.mapErrorString('invalid email')
      ).toBe(ErrorMessageService.ERROR_CODES.VALIDATION_INVALID_EMAIL);
    });

    it('should map network errors', () => {
      expect(
        ErrorMessageService.mapErrorString('network connection failed')
      ).toBe(ErrorMessageService.ERROR_CODES.NETWORK_CONNECTION_FAILED);

      expect(
        ErrorMessageService.mapErrorString('timeout')
      ).toBe(ErrorMessageService.ERROR_CODES.NETWORK_TIMEOUT);
    });

    it('should return null for unmapped errors', () => {
      expect(
        ErrorMessageService.mapErrorString('some unknown error')
      ).toBeNull();
    });
  });

  describe('createUserFriendlyError', () => {
    it('should create user-friendly error from string', () => {
      const error = ErrorMessageService.createUserFriendlyError(
        'invalid login credentials'
      );

      expect(error).toHaveProperty('title', 'Hibás bejelentkezési adatok');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('action');
    });

    it('should create user-friendly error from error object', () => {
      const errorObj = new Error('invalid login credentials');
      const error = ErrorMessageService.createUserFriendlyError(errorObj);

      expect(error).toHaveProperty('title', 'Hibás bejelentkezési adatok');
    });

    it('should return default error for unmapped errors', () => {
      const error = ErrorMessageService.createUserFriendlyError(
        'some completely unknown error message'
      );

      expect(error).toHaveProperty('title', 'Hiba történt');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('action');
    });
  });

  describe('getOnboardingErrorMessage', () => {
    it('should return photo error for photo validation errors', () => {
      const errors = [
        { field: 'photos', message: 'Minimum 2 photos required', type: 'minCount' }
      ];

      const error = ErrorMessageService.getOnboardingErrorMessage(errors);

      expect(error).toHaveProperty('title');
      expect(error.title).toContain('Túl kevés');
    });

    it('should return bio error for bio validation errors', () => {
      const errors = [
        { field: 'bio', message: 'Bio too short', type: 'minLength' }
      ];

      const error = ErrorMessageService.getOnboardingErrorMessage(errors);

      expect(error).toHaveProperty('title');
      expect(error.title).toContain('rövid');
    });

    it('should return general onboarding error for other errors', () => {
      const errors = [
        { field: 'name', message: 'Name required', type: 'required' }
      ];

      const error = ErrorMessageService.getOnboardingErrorMessage(errors);

      expect(error).toHaveProperty('title');
      expect(error.title).toContain('Hiányos');
    });

    it('should return null for no errors', () => {
      const error = ErrorMessageService.getOnboardingErrorMessage([]);

      expect(error).toBeNull();
    });
  });

  describe('getOnboardingSuccessMessage', () => {
    it('should return appropriate success message for each step', () => {
      const step1Message = ErrorMessageService.getOnboardingSuccessMessage(1);
      const step2Message = ErrorMessageService.getOnboardingSuccessMessage(2);
      const step5Message = ErrorMessageService.getOnboardingSuccessMessage(5);

      expect(step1Message.title).toContain('Személyes adatok');
      expect(step2Message.title).toContain('Képek');
      expect(step5Message.title).toContain('Üdvözlünk');
    });

    it('should return default message for invalid step', () => {
      const message = ErrorMessageService.getOnboardingSuccessMessage(99);

      expect(message).toHaveProperty('title');
      expect(message).toHaveProperty('message');
    });
  });

  describe('ERROR_CODES', () => {
    it('should have all required error codes defined', () => {
      expect(ErrorMessageService.ERROR_CODES).toHaveProperty('AUTH_INVALID_CREDENTIALS');
      expect(ErrorMessageService.ERROR_CODES).toHaveProperty('VALIDATION_REQUIRED_FIELD');
      expect(ErrorMessageService.ERROR_CODES).toHaveProperty('NETWORK_CONNECTION_FAILED');
      expect(ErrorMessageService.ERROR_CODES).toHaveProperty('ONBOARDING_INCOMPLETE');
      expect(ErrorMessageService.ERROR_CODES).toHaveProperty('ONBOARDING_PHOTO_MINIMUM');
      expect(ErrorMessageService.ERROR_CODES).toHaveProperty('ONBOARDING_BIO_TOO_SHORT');
    });
  });
});
