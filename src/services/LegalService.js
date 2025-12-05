import AsyncStorage from '@react-native-async-storage/async-storage';
import ServiceError from './ServiceError';
import ErrorHandler from './ErrorHandler';

class LegalService {
  constructor() {
    this.CONSENT_STORAGE_KEY = '@user_consents';
    this.DOCUMENT_VERSIONS_KEY = '@legal_document_versions';
    this.CONSENT_HISTORY_KEY = '@consent_history';

    // Jogi dokumentumok verziói (ezeket frissíteni kell, amikor új jogi szöveg érkezik)
    this.DOCUMENT_VERSIONS = {
      terms_of_service: '1.0.0',
      privacy_policy: '1.0.0',
      safety_guidelines: '1.0.0',
      community_guidelines: '1.0.0'
    };

    // Dokumentum URL-ek
    this.DOCUMENT_URLS = {
      terms_of_service: 'https://hevesitr.github.io/lovex-/web/terms-of-service.html',
      privacy_policy: 'https://hevesitr.github.io/lovex-/web/privacy-policy.html',
      safety_guidelines: 'https://hevesitr.github.io/lovex-/web/safety-guidelines.html',
      community_guidelines: 'https://hevesitr.github.io/lovex-/web/community-guidelines.html'
    };

    // Kötelező dokumentumok regisztrációhoz
    this.REQUIRED_DOCUMENTS = ['terms_of_service', 'privacy_policy'];
  }

  /**
   * Felhasználó consent állapotának lekérése
   */
  async getUserConsents(userId = null) {
    try {
      const consents = await AsyncStorage.getItem(this.CONSENT_STORAGE_KEY);
      if (!consents) {
        return this._getDefaultConsents();
      }

      const parsedConsents = JSON.parse(consents);

      // Ha van userId, akkor user-specifikus consent-eket keresünk
      if (userId && parsedConsents[userId]) {
        return parsedConsents[userId];
      }

      // Ha nincs userId vagy nincs user-specifikus consent, akkor általános consent-eket adunk vissza
      return parsedConsents.general || this._getDefaultConsents();

    } catch (error) {
      console.error('Error getting user consents:', error);
      return this._getDefaultConsents();
    }
  }

  /**
   * Felhasználó consent állapotának mentése
   */
  async saveUserConsents(userId, consents, options = {}) {
    try {
      const { isRegistration = false, consentType = null } = options;

      // Validáció
      const validationResult = this._validateConsents(consents, isRegistration);
      if (!validationResult.success) {
        throw new ServiceError(
          'CONSENT_VALIDATION_FAILED',
          validationResult.message,
          { consents, isRegistration }
        );
      }

      // Meglévő consent-ek betöltése
      const allConsents = await AsyncStorage.getItem(this.CONSENT_STORAGE_KEY);
      const parsedConsents = allConsents ? JSON.parse(allConsents) : {};

      // Consent mentése user-specifikusan
      if (!parsedConsents[userId]) {
        parsedConsents[userId] = {};
      }

      const now = new Date().toISOString();
      const consentEntry = {
        ...consents,
        lastUpdated: now,
        consentType,
        version: this.DOCUMENT_VERSIONS
      };

      parsedConsents[userId] = consentEntry;

      // Mentés
      await AsyncStorage.setItem(this.CONSENT_STORAGE_KEY, JSON.stringify(parsedConsents));

      // Consent history mentése
      await this._addToConsentHistory(userId, consents, options);

      return {
        success: true,
        message: 'Consent beállítások sikeresen mentve.',
        data: consentEntry
      };

    } catch (error) {
      return ErrorHandler.handleServiceError(
        error,
        'CONSENT_SAVE_FAILED',
        { userId, consents, options }
      );
    }
  }

  /**
   * Consent visszavonás
   */
  async revokeConsent(userId, consentType) {
    try {
      const consents = await this.getUserConsents(userId);

      if (!consents[consentType]) {
        throw new ServiceError(
          'CONSENT_NOT_FOUND',
          `A ${consentType} consent nem található.`,
          { userId, consentType }
        );
      }

      // Consent visszavonása
      consents[consentType] = false;
      consents.lastUpdated = new Date().toISOString();

      const result = await this.saveUserConsents(userId, consents, {
        consentType,
        revoked: true
      });

      // GDPR compliance: adat törlés ha szükséges
      if (consentType === 'privacy') {
        await this._handleDataDeletionRequest(userId);
      }

      return result;

    } catch (error) {
      return ErrorHandler.handleServiceError(
        error,
        'CONSENT_REVOKE_FAILED',
        { userId, consentType }
      );
    }
  }

  /**
   * Regisztráció consent validáció
   */
  validateRegistrationConsents(consents) {
    try {
      const missingConsents = [];

      this.REQUIRED_DOCUMENTS.forEach(doc => {
        if (!consents[doc]) {
          missingConsents.push(doc);
        }
      });

      if (missingConsents.length > 0) {
        return {
          success: false,
          message: `A következő dokumentumok elfogadása kötelező: ${missingConsents.join(', ')}`,
          missingConsents
        };
      }

      return {
        success: true,
        message: 'Az összes kötelező consent elfogadva.'
      };

    } catch (error) {
      return {
        success: false,
        message: 'Hiba történt a consent validáció során.',
        error: error.message
      };
    }
  }

  /**
   * Jogi dokumentum frissítés ellenőrzés
   */
  async checkDocumentUpdates(userId) {
    try {
      const userVersions = await this._getUserDocumentVersions(userId);
      const updates = {};

      Object.entries(this.DOCUMENT_VERSIONS).forEach(([doc, currentVersion]) => {
        const userVersion = userVersions[doc];
        if (!userVersion || userVersion !== currentVersion) {
          updates[doc] = {
            currentVersion,
            userVersion,
            needsUpdate: true
          };
        }
      });

      return {
        success: true,
        hasUpdates: Object.keys(updates).length > 0,
        updates
      };

    } catch (error) {
      return ErrorHandler.handleServiceError(
        error,
        'DOCUMENT_UPDATE_CHECK_FAILED',
        { userId }
      );
    }
  }

  /**
   * Dokumentum frissítés elfogadása
   */
  async acceptDocumentUpdate(userId, documentType, version) {
    try {
      if (!this.DOCUMENT_VERSIONS[documentType]) {
        throw new ServiceError(
          'INVALID_DOCUMENT_TYPE',
          `Érvénytelen dokumentum típus: ${documentType}`,
          { userId, documentType, version }
        );
      }

      const versions = await this._getUserDocumentVersions(userId);
      versions[documentType] = version;

      await AsyncStorage.setItem(
        `${this.DOCUMENT_VERSIONS_KEY}_${userId}`,
        JSON.stringify(versions)
      );

      return {
        success: true,
        message: `${documentType} dokumentum frissítése elfogadva.`
      };

    } catch (error) {
      return ErrorHandler.handleServiceError(
        error,
        'DOCUMENT_UPDATE_ACCEPT_FAILED',
        { userId, documentType, version }
      );
    }
  }

  /**
   * GDPR adatkezelési kérelem kezelése
   */
  async handleDataRequest(userId, requestType) {
    try {
      const validTypes = ['access', 'rectification', 'erasure', 'portability'];
      if (!validTypes.includes(requestType)) {
        throw new ServiceError(
          'INVALID_REQUEST_TYPE',
          `Érvénytelen kérelem típus: ${requestType}`,
          { userId, requestType }
        );
      }

      // GDPR compliance log
      const request = {
        userId,
        requestType,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      // Backend API hívás (valós implementációban)
      // await this._submitGdprRequest(request);

      // Log mentése
      await this._logGdprRequest(request);

      return {
        success: true,
        message: `${requestType} kérelem sikeresen elküldve.`,
        requestId: `gdpr_${Date.now()}`
      };

    } catch (error) {
      return ErrorHandler.handleServiceError(
        error,
        'GDPR_REQUEST_FAILED',
        { userId, requestType }
      );
    }
  }

  /**
   * Adatvédelmi audit futtatása
   */
  async runPrivacyAudit(userId) {
    try {
      const audit = {
        timestamp: new Date().toISOString(),
        userId,
        checks: {}
      };

      // Consent állapot ellenőrzés
      const consents = await this.getUserConsents(userId);
      audit.checks.consentStatus = {
        hasRequiredConsents: this.REQUIRED_DOCUMENTS.every(doc => consents[doc]),
        marketingConsent: consents.marketing || false,
        analyticsConsent: consents.analytics || false
      };

      // Dokumentum verziók ellenőrzés
      const updates = await this.checkDocumentUpdates(userId);
      audit.checks.documentVersions = {
        upToDate: !updates.hasUpdates,
        pendingUpdates: updates.updates
      };

      // Adatkezelési előzmények
      const history = await this._getConsentHistory(userId);
      audit.checks.consentHistory = {
        totalEntries: history.length,
        lastUpdate: history.length > 0 ? history[history.length - 1].timestamp : null
      };

      // Compliance score számítás
      audit.complianceScore = this._calculateComplianceScore(audit.checks);

      return {
        success: true,
        audit
      };

    } catch (error) {
      return ErrorHandler.handleServiceError(
        error,
        'PRIVACY_AUDIT_FAILED',
        { userId }
      );
    }
  }

  /**
   * Dokumentum URL lekérése
   */
  getDocumentUrl(documentType) {
    if (!this.DOCUMENT_URLS[documentType]) {
      throw new ServiceError(
        'DOCUMENT_NOT_FOUND',
        `Dokumentum nem található: ${documentType}`
      );
    }

    return this.DOCUMENT_URLS[documentType];
  }

  /**
   * Összes dokumentum URL lekérése
   */
  getAllDocumentUrls() {
    return { ...this.DOCUMENT_URLS };
  }

  // === PRIVÁT METÓDUSOK ===

  _getDefaultConsents() {
    return {
      terms_of_service: false,
      privacy_policy: false,
      marketing: false,
      analytics: false,
      lastUpdated: null,
      version: this.DOCUMENT_VERSIONS
    };
  }

  _validateConsents(consents, isRegistration = false) {
    if (isRegistration) {
      const missingRequired = this.REQUIRED_DOCUMENTS.filter(doc => !consents[doc]);
      if (missingRequired.length > 0) {
        return {
          success: false,
          message: `Kötelező dokumentumok nincsenek elfogadva: ${missingRequired.join(', ')}`
        };
      }
    }

    return { success: true };
  }

  async _getUserDocumentVersions(userId) {
    try {
      const versions = await AsyncStorage.getItem(`${this.DOCUMENT_VERSIONS_KEY}_${userId}`);
      return versions ? JSON.parse(versions) : {};
    } catch (error) {
      console.error('Error getting user document versions:', error);
      return {};
    }
  }

  async _addToConsentHistory(userId, consents, options) {
    try {
      const history = await this._getConsentHistory(userId);
      const entry = {
        timestamp: new Date().toISOString(),
        consents: { ...consents },
        options
      };

      history.push(entry);

      // Maximum 50 bejegyzés megtartása
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }

      await AsyncStorage.setItem(
        `${this.CONSENT_HISTORY_KEY}_${userId}`,
        JSON.stringify(history)
      );

    } catch (error) {
      console.error('Error adding to consent history:', error);
    }
  }

  async _getConsentHistory(userId) {
    try {
      const history = await AsyncStorage.getItem(`${this.CONSENT_HISTORY_KEY}_${userId}`);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting consent history:', error);
      return [];
    }
  }

  async _handleDataDeletionRequest(userId) {
    // GDPR Article 17: Right to erasure
    // Ez egy placeholder - valós implementációban backend API hívás
    console.log(`GDPR data deletion requested for user: ${userId}`);

    // Log mentése
    await this._logGdprRequest({
      userId,
      requestType: 'erasure',
      timestamp: new Date().toISOString(),
      status: 'initiated'
    });
  }

  async _logGdprRequest(request) {
    // GDPR compliance log - valós implementációban biztonságos naplózás
    console.log('GDPR Request:', request);
  }

  _calculateComplianceScore(checks) {
    let score = 0;
    let maxScore = 0;

    // Consent állapot (40 pont)
    maxScore += 40;
    if (checks.consentStatus.hasRequiredConsents) {
      score += 40;
    }

    // Dokumentum verziók (30 pont)
    maxScore += 30;
    if (checks.documentVersions.upToDate) {
      score += 30;
    }

    // Consent history (30 pont)
    maxScore += 30;
    if (checks.consentHistory.totalEntries > 0) {
      score += Math.min(30, checks.consentHistory.totalEntries * 2);
    }

    return Math.round((score / maxScore) * 100);
  }
}

// Singleton export
export default new LegalService();
