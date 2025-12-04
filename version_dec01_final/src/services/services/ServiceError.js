/**
 * ServiceError - Szabványosított Hiba Osztály
 * Egységes hibakezelés minden szolgáltatáshoz
 * Követelmény: 3.3 - Konzisztens hibakezelés
 */

import Logger from './Logger';

export const ErrorCategory = {
  AUTHENTICATION: 'AUTHENTICATION',
  VALIDATION: 'VALIDATION',
  NETWORK: 'NETWORK',
  STORAGE: 'STORAGE',
  BUSINESS_LOGIC: 'BUSINESS_LOGIC',
  SYSTEM: 'SYSTEM',
  PERMISSION: 'PERMISSION',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT: 'RATE_LIMIT',
};

export const ErrorSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export class ServiceError extends Error {
  constructor({
    code,
    message,
    userMessage,
    category = ErrorCategory.SYSTEM,
    context = {},
    severity = ErrorSeverity.MEDIUM,
    originalError = null,
  }) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.userMessage = userMessage;
    this.category = category;
    this.context = context;
    this.severity = severity;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    
    if (originalError && originalError.stack) {
      this.stack = originalError.stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      category: this.category,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  log() {
    const logData = {
      code: this.code,
      category: this.category,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
    };

    switch (this.severity) {
      case ErrorSeverity.CRITICAL:
        Logger.error(`[CRITICAL] ${this.message}`, logData);
        break;
      case ErrorSeverity.HIGH:
        Logger.error(`[HIGH] ${this.message}`, logData);
        break;
      case ErrorSeverity.MEDIUM:
        Logger.warn(`[MEDIUM] ${this.message}`, logData);
        break;
      case ErrorSeverity.LOW:
        Logger.info(`[LOW] ${this.message}`, logData);
        break;
      default:
        Logger.error(this.message, logData);
    }
  }

  static isServiceError(error) {
    return error instanceof ServiceError;
  }
}

export const ErrorFactory = {
  authentication(message, userMessage, context = {}) {
    return new ServiceError({
      code: 'AUTH_ERROR',
      message,
      userMessage: userMessage || 'Hitelesítési hiba történt',
      category: ErrorCategory.AUTHENTICATION,
      context,
      severity: ErrorSeverity.HIGH,
    });
  },

  validation(message, userMessage, context = {}) {
    return new ServiceError({
      code: 'VALIDATION_ERROR',
      message,
      userMessage: userMessage || 'Az adatok érvénytelenek',
      category: ErrorCategory.VALIDATION,
      context,
      severity: ErrorSeverity.LOW,
    });
  },

  network(message, userMessage, context = {}) {
    return new ServiceError({
      code: 'NETWORK_ERROR',
      message,
      userMessage: userMessage || 'Hálózati hiba történt',
      category: ErrorCategory.NETWORK,
      context,
      severity: ErrorSeverity.MEDIUM,
    });
  },

  storage(message, userMessage, context = {}) {
    return new ServiceError({
      code: 'STORAGE_ERROR',
      message,
      userMessage: userMessage || 'Fájl feltöltési hiba',
      category: ErrorCategory.STORAGE,
      context,
      severity: ErrorSeverity.MEDIUM,
    });
  },

  businessLogic(message, userMessage, context = {}) {
    return new ServiceError({
      code: 'BUSINESS_LOGIC_ERROR',
      message,
      userMessage: userMessage || 'A művelet nem hajtható végre',
      category: ErrorCategory.BUSINESS_LOGIC,
      context,
      severity: ErrorSeverity.MEDIUM,
    });
  },

  system(message, userMessage, context = {}, originalError = null) {
    return new ServiceError({
      code: 'SYSTEM_ERROR',
      message,
      userMessage: userMessage || 'Váratlan hiba történt',
      category: ErrorCategory.SYSTEM,
      context,
      severity: ErrorSeverity.HIGH,
      originalError,
    });
  },

  permission(message, userMessage, context = {}) {
    return new ServiceError({
      code: 'PERMISSION_ERROR',
      message,
      userMessage: userMessage || 'Nincs jogosultságod',
      category: ErrorCategory.PERMISSION,
      context,
      severity: ErrorSeverity.MEDIUM,
    });
  },

  notFound(message, userMessage, context = {}) {
    return new ServiceError({
      code: 'NOT_FOUND_ERROR',
      message,
      userMessage: userMessage || 'Nem található',
      category: ErrorCategory.NOT_FOUND,
      context,
      severity: ErrorSeverity.LOW,
    });
  },

  rateLimit(message, userMessage, context = {}) {
    return new ServiceError({
      code: 'RATE_LIMIT_ERROR',
      message,
      userMessage: userMessage || 'Túl sok kérés',
      category: ErrorCategory.RATE_LIMIT,
      context,
      severity: ErrorSeverity.MEDIUM,
    });
  },

  fromError(error, userMessage = null, context = {}) {
    if (ServiceError.isServiceError(error)) {
      return error;
    }

    return new ServiceError({
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Ismeretlen hiba',
      userMessage: userMessage || 'Váratlan hiba történt',
      category: ErrorCategory.SYSTEM,
      context: {
        ...context,
        originalErrorName: error.name,
      },
      severity: ErrorSeverity.HIGH,
      originalError: error,
    });
  },
};

export default ServiceError;
