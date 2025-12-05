import LegalService from '../LegalService';
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

describe('LegalService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
  });

  describe('getUserConsents', () => {
    it('should return default consents when no stored data exists', async () => {
      const result = await LegalService.getUserConsents('user123');

      expect(result).toHaveProperty('terms_of_service', false);
      expect(result).toHaveProperty('privacy_policy', false);
      expect(result).toHaveProperty('marketing', false);
      expect(result).toHaveProperty('analytics', false);
    });

    it('should return stored consents when data exists', async () => {
      const mockConsents = {
        general: {
          terms_of_service: true,
          privacy_policy: true,
          marketing: false,
          analytics: true,
          lastUpdated: '2024-01-01T00:00:00.000Z'
        }
      };

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockConsents));

      const result = await LegalService.getUserConsents('user123');

      expect(result.terms_of_service).toBe(true);
      expect(result.privacy_policy).toBe(true);
      expect(result.marketing).toBe(false);
      expect(result.analytics).toBe(true);
    });

    it('should return user-specific consents when available', async () => {
      const mockConsents = {
        user123: {
          terms_of_service: true,
          privacy_policy: true,
          marketing: true,
          lastUpdated: '2024-01-01T00:00:00.000Z'
        }
      };

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockConsents));

      const result = await LegalService.getUserConsents('user123');

      expect(result.terms_of_service).toBe(true);
      expect(result.marketing).toBe(true);
    });
  });

  describe('saveUserConsents', () => {
    it('should save consents successfully', async () => {
      const consents = {
        terms_of_service: true,
        privacy_policy: true,
        marketing: false,
        analytics: true
      };

      const result = await LegalService.saveUserConsents('user123', consents);

      expect(result.success).toBe(true);
      expect(result.message).toContain('sikeresen mentve');
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should validate required consents for registration', async () => {
      const consents = {
        terms_of_service: false,
        privacy_policy: true,
        marketing: false,
        analytics: false
      };

      const result = await LegalService.saveUserConsents('user123', consents, { isRegistration: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Kötelező dokumentumok nincsenek elfogadva');
    });
  });

  describe('validateRegistrationConsents', () => {
    it('should pass validation when all required consents are accepted', () => {
      const consents = {
        terms_of_service: true,
        privacy_policy: true,
        marketing: false,
        analytics: false
      };

      const result = LegalService.validateRegistrationConsents(consents);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Az összes kötelező consent elfogadva');
    });

    it('should fail validation when required consents are missing', () => {
      const consents = {
        terms_of_service: false,
        privacy_policy: true,
        marketing: false,
        analytics: false
      };

      const result = LegalService.validateRegistrationConsents(consents);

      expect(result.success).toBe(false);
      expect(result.message).toContain('kötelező');
      expect(result.missingConsents).toContain('terms_of_service');
    });
  });

  describe('revokeConsent', () => {
    beforeEach(() => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        user123: {
          terms_of_service: true,
          privacy_policy: true,
          marketing: true,
          analytics: true
        }
      }));
    });

    it('should revoke consent successfully', async () => {
      const result = await LegalService.revokeConsent('user123', 'marketing');

      expect(result.success).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should handle data deletion for privacy consent revocation', async () => {
      const result = await LegalService.revokeConsent('user123', 'privacy_policy');

      expect(result.success).toBe(true);
      // Data deletion logic should be triggered
    });
  });

  describe('checkDocumentUpdates', () => {
    it('should detect when documents need updates', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        terms_of_service: '0.9.0'
      }));

      const result = await LegalService.checkDocumentUpdates('user123');

      expect(result.success).toBe(true);
      expect(result.hasUpdates).toBe(true);
      expect(result.updates.terms_of_service.needsUpdate).toBe(true);
    });

    it('should return no updates when all documents are current', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        terms_of_service: '1.0.0',
        privacy_policy: '1.0.0',
        safety_guidelines: '1.0.0',
        community_guidelines: '1.0.0'
      }));

      const result = await LegalService.checkDocumentUpdates('user123');

      expect(result.success).toBe(true);
      expect(result.hasUpdates).toBe(false);
    });
  });

  describe('acceptDocumentUpdate', () => {
    it('should accept document update successfully', async () => {
      const result = await LegalService.acceptDocumentUpdate('user123', 'terms_of_service', '1.0.0');

      expect(result.success).toBe(true);
      expect(result.message).toContain('frissítése elfogadva');
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should reject invalid document type', async () => {
      const result = await LegalService.acceptDocumentUpdate('user123', 'invalid_doc', '1.0.0');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Érvénytelen dokumentum típus');
    });
  });

  describe('handleDataRequest', () => {
    it('should handle valid GDPR request types', async () => {
      const result = await LegalService.handleDataRequest('user123', 'access');

      expect(result.success).toBe(true);
      expect(result.message).toContain('kérelem sikeresen elküldve');
      expect(result.requestId).toBeDefined();
    });

    it('should reject invalid request types', async () => {
      const result = await LegalService.handleDataRequest('user123', 'invalid_type');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Érvénytelen kérelem típus');
    });
  });

  describe('runPrivacyAudit', () => {
    beforeEach(() => {
      AsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify({
          user123: {
            terms_of_service: true,
            privacy_policy: true,
            marketing: false,
            analytics: true
          }
        }))
        .mockResolvedValueOnce(JSON.stringify({}))
        .mockResolvedValueOnce(JSON.stringify([]));
    });

    it('should run privacy audit successfully', async () => {
      const result = await LegalService.runPrivacyAudit('user123');

      expect(result.success).toBe(true);
      expect(result.audit).toHaveProperty('complianceScore');
      expect(result.audit.checks).toHaveProperty('consentStatus');
      expect(result.audit.checks).toHaveProperty('documentVersions');
      expect(result.audit.checks).toHaveProperty('consentHistory');
    });
  });

  describe('getDocumentUrl', () => {
    it('should return correct URL for valid document type', () => {
      const url = LegalService.getDocumentUrl('privacy_policy');

      expect(url).toContain('privacy-policy.html');
      expect(url).toContain('github.io');
    });

    it('should throw error for invalid document type', () => {
      expect(() => {
        LegalService.getDocumentUrl('invalid_doc');
      }).toThrow();
    });
  });

  describe('getAllDocumentUrls', () => {
    it('should return all document URLs', () => {
      const urls = LegalService.getAllDocumentUrls();

      expect(urls).toHaveProperty('terms_of_service');
      expect(urls).toHaveProperty('privacy_policy');
      expect(urls).toHaveProperty('safety_guidelines');
      expect(urls).toHaveProperty('community_guidelines');

      Object.values(urls).forEach(url => {
        expect(url).toContain('github.io');
        expect(url).toContain('.html');
      });
    });
  });
});
