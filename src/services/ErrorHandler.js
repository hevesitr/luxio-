/**
 * ErrorHandler - Standardizált hibakezelés
 * Implements Requirement 3.3
 */
import Logger from './Logger';

/**
 * Szabványos hiba osztály
 */
export class ServiceError extends Error {
  constructor(code, message, userMessage, context = {}, statusCode = 500) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.userMessage = userMessage;
    this.context = context;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      context: this.context,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Hiba kategóriák
 */
export const ErrorCodes = {
  // Authentication Errors (1xxx)
  AUTH_INVALID_CREDENTIALS: 'AUTH_1001',
  AUTH_TOKEN_EXPIRED: 'AUTH_1002',
  AUTH_UNAUTHORIZED: 'AUTH_1003',
  AUTH_SESSION_EXPIRED: 'AUTH_1004',
  AUTH_WEAK_PASSWORD: 'AUTH_1005',
  AUTH_EMAIL_EXISTS: 'AUTH_1006',

  // Validation Errors (2xxx)
  VALIDATION_REQUIRED_FIELD: 'VAL_2001',
  VALIDATION_INVALID_FORMAT: 'VAL_2002',
  VALIDATION_OUT_OF_RANGE: 'VAL_2003',
  VALIDATION_FILE_TOO_LARGE: 'VAL_2004',
  VALIDATION_INVALID_FILE_TYPE: 'VAL_2005',

  // Network Errors (3xxx)
  NETWORK_CONNECTION_FAILED: 'NET_3001',
  NETWORK_TIMEOUT: 'NET_3002',
  NETWORK_API_ERROR: 'NET_3003',
  NETWORK_OFFLINE: 'NET_3004',

  // Storage Errors (4xxx)
  STORAGE_UPLOAD_FAILED: 'STOR_4001',
  STORAGE_DOWNLOAD_FAILED: 'STOR_4002',
  STORAGE_DELETE_FAILED: 'STOR_4003',
  STORAGE_INSUFFICIENT_SPACE: 'STOR_4004',

  // Business Logic Errors (5xxx)
  BUSINESS_DAILY_LIMIT_EXCEEDED: 'BUS_5001',
  BUSINESS_PREMIUM_REQUIRED: 'BUS_5002',
  BUSINESS_USER_BLOCKED: 'BUS_5003',
  BUSINESS_ALREADY_MATCHED: 'BUS_5004',
  BUSINESS_PROFILE_INCOMPLETE: 'BUS_5005',

  // System Errors (6xxx)
  SYSTEM_DATABASE_ERROR: 'SYS_6001',
  SYSTEM_UNEXPECTED_ERROR: 'SYS_6002',
  SYSTEM_SERVICE_UNAVAILABLE: 'SYS_6003',
};

/**
 * User-friendly hibaüzenetek
 */
const ErrorMessages = {
  // Authentication
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: {
    user: 'Hibás email vagy jelszó. Kérlek próbáld újra.',
    dev: 'Invalid email or password provided',
  },
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: {
    user: 'A munkameneted lejárt. Kérlek jelentkezz be újra.',
    dev: 'Authentication token has expired',
  },
  [ErrorCodes.AUTH_UNAUTHORIZED]: {
    user: 'Nincs jogosultságod ehhez a művelethez.',
    dev: 'User is not authorized for this action',
  },
  [ErrorCodes.AUTH_SESSION_EXPIRED]: {
    user: 'A munkameneted lejárt. Kérlek jelentkezz be újra.',
    dev: 'User session has expired',
  },
  [ErrorCodes.AUTH_WEAK_PASSWORD]: {
    user: 'A jelszó túl gyenge. Használj legalább 8 karaktert.',
    dev: 'Password does not meet security requirements',
  },
  [ErrorCodes.AUTH_EMAIL_EXISTS]: {
    user: 'Ez az email cím már használatban van.',
    dev: 'Email address already registered',
  },

  // Validation
  [ErrorCodes.VALIDATION_REQUIRED_FIELD]: {
    user: 'Kérlek töltsd ki az összes kötelező mezőt.',
    dev: 'Required field is missing',
  },
  [ErrorCodes.VALIDATION_INVALID_FORMAT]: {
    user: 'Érvénytelen formátum. Kérlek ellenőrizd az adatokat.',
    dev: 'Data format is invalid',
  },
  [ErrorCodes.VALIDATION_OUT_OF_RANGE]: {
    user: 'Az érték kívül esik az elfogadható tartományon.',
    dev: 'Value is out of acceptable range',
  },
  [ErrorCodes.VALIDATION_FILE_TOO_LARGE]: {
    user: 'A fájl túl nagy. Maximum méret: 5MB.',
    dev: 'File size exceeds maximum allowed',
  },
  [ErrorCodes.VALIDATION_INVALID_FILE_TYPE]: {
    user: 'Érvénytelen fájl típus. Csak JPEG és PNG engedélyezett.',
    dev: 'File type is not supported',
  },

  // Network
  [ErrorCodes.NETWORK_CONNECTION_FAILED]: {
    user: 'Nem sikerült csatlakozni. Ellenőrizd az internet kapcsolatot.',
    dev: 'Network connection failed',
  },
  [ErrorCodes.NETWORK_TIMEOUT]: {
    user: 'A kérés túl sokáig tartott. Próbáld újra.',
    dev: 'Network request timed out',
  },
  [ErrorCodes.NETWORK_API_ERROR]: {
    user: 'Szerver hiba történt. Próbáld újra később.',
    dev: 'API returned an error',
  },
  [ErrorCodes.NETWORK_OFFLINE]: {
    user: 'Nincs internet kapcsolat. Ellenőrizd a hálózatot.',
    dev: 'Device is offline',
  },

  // Storage
  [ErrorCodes.STORAGE_UPLOAD_FAILED]: {
    user: 'A feltöltés sikertelen. Próbáld újra.',
    dev: 'File upload failed',
  },
  [ErrorCodes.STORAGE_DOWNLOAD_FAILED]: {
    user: 'A letöltés sikertelen. Próbáld újra.',
    dev: 'File download failed',
  },
  [ErrorCodes.STORAGE_DELETE_FAILED]: {
    user: 'A törlés sikertelen. Próbáld újra.',
    dev: 'File deletion failed',
  },
  [ErrorCodes.STORAGE_INSUFFICIENT_SPACE]: {
    user: 'Nincs elég tárhely. Törölj néhány fájlt.',
    dev: 'Insufficient storage space',
  },

  // Business Logic
  [ErrorCodes.BUSINESS_DAILY_LIMIT_EXCEEDED]: {
    user: 'Elérted a napi limitet. Próbáld holnap újra vagy válts prémiumra.',
    dev: 'Daily action limit exceeded',
  },
  [ErrorCodes.BUSINESS_PREMIUM_REQUIRED]: {
    user: 'Ez a funkció csak prémium tagoknak érhető el.',
    dev: 'Premium subscription required',
  },
  [ErrorCodes.BUSINESS_USER_BLOCKED]: {
    user: 'Ez a felhasználó blokkolt téged vagy te blokkoltad őt.',
    dev: 'User is blocked',
  },
  [ErrorCodes.BUSINESS_ALREADY_MATCHED]: {
    user: 'Már match-eltél ezzel a felhasználóval.',
    dev: 'Users are already matched',
  },
  [ErrorCodes.BUSINESS_PROFILE_INCOMPLETE]: {
    user: 'Töltsd ki a profilodat a folytatáshoz.',
    dev: 'User profile is incomplete',
  },

  // System
  [ErrorCodes.SYSTEM_DATABASE_ERROR]: {
    user: 'Adatbázis hiba történt. Próbáld újra később.',
    dev: 'Database operation failed',
  },
  [ErrorCodes.SYSTEM_UNEXPECTED_ERROR]: {
    user: 'Váratlan hiba történt. Próbáld újra.',
    dev: 'Unexpected system error occurred',
  },
  [ErrorCodes.SYSTEM_SERVICE_UNAVAILABLE]: {
    user: 'A szolgáltatás jelenleg nem elérhető. Próbáld később.',
    dev: 'Service is temporarily unavailable',
  },
};

/**
 * ErrorHandler osztály
 */
class ErrorHandler {
  /**
   * Hiba kezelése
   * @param {Error} error 
   * @param {object} context 
   * @returns {ServiceError}
   */
  handle(error, context = {}) {
    // Ha már ServiceError, csak logoljuk
    if (error instanceof ServiceError) {
      this.logError(error);
      return error;
    }

    // Supabase hibák kezelése
    if (error.code) {
      return this.handleSupabaseError(error, context);
    }

    // Network hibák
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return this.createError(
        ErrorCodes.NETWORK_CONNECTION_FAILED,
        error.message,
        context
      );
    }

    // Általános hiba
    return this.createError(
      ErrorCodes.SYSTEM_UNEXPECTED_ERROR,
      error.message,
      context
    );
  }

  /**
   * Supabase specifikus hibák kezelése
   */
  handleSupabaseError(error, context) {
    const code = error.code;
    const message = error.message;

    // Auth hibák
    if (code === 'invalid_credentials' || message?.includes('Invalid login')) {
      return this.createError(ErrorCodes.AUTH_INVALID_CREDENTIALS, message, context);
    }
    if (code === 'token_expired' || message?.includes('expired')) {
      return this.createError(ErrorCodes.AUTH_TOKEN_EXPIRED, message, context);
    }
    if (code === 'user_already_exists' || message?.includes('already registered')) {
      return this.createError(ErrorCodes.AUTH_EMAIL_EXISTS, message, context);
    }

    // Database hibák
    if (code?.startsWith('PGRST') || code?.startsWith('23')) {
      return this.createError(ErrorCodes.SYSTEM_DATABASE_ERROR, message, context);
    }

    // Általános Supabase hiba
    return this.createError(ErrorCodes.SYSTEM_UNEXPECTED_ERROR, message, context);
  }

  /**
   * ServiceError létrehozása
   */
  createError(code, devMessage, context = {}) {
    const messages = ErrorMessages[code] || {
      user: 'Hiba történt. Próbáld újra.',
      dev: devMessage,
    };

    const error = new ServiceError(
      code,
      messages.dev,
      messages.user,
      context
    );

    this.logError(error);
    return error;
  }

  /**
   * Hiba naplózása
   */
  logError(error) {
    if (error instanceof ServiceError) {
      Logger.error(error.message, {
        code: error.code,
        context: error.context,
        timestamp: error.timestamp,
      });
    } else {
      Logger.error('Unexpected error', error);
    }
  }

  /**
   * Try-catch wrapper service metódusokhoz
   */
  async wrapServiceCall(serviceCall, context = {}) {
    try {
      const result = await serviceCall();
      return { success: true, data: result };
    } catch (error) {
      const serviceError = this.handle(error, context);
      return {
        success: false,
        error: serviceError.userMessage,
        code: serviceError.code,
        details: serviceError,
      };
    }
  }

  /**
   * Validációs hiba létrehozása
   */
  validationError(field, message, context = {}) {
    return this.createError(
      ErrorCodes.VALIDATION_REQUIRED_FIELD,
      `Validation failed for field: ${field}`,
      { ...context, field, validationMessage: message }
    );
  }

  /**
   * Üzleti logika hiba létrehozása
   */
  businessError(code, message, context = {}) {
    return this.createError(code, message, context);
  }
}

export default new ErrorHandler();
