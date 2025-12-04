/**
 * BaseService - Alap Szolgáltatás Osztály
 * Minden szolgáltatás ebből származik
 */

import Logger from './Logger';
import { ServiceError, ErrorFactory } from './ServiceError';

export class BaseService {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) {
      Logger.warn(`${this.serviceName} already initialized`);
      return;
    }
    Logger.info(`Initializing ${this.serviceName}...`);
    this.initialized = true;
  }

  ensureInitialized() {
    if (!this.initialized) {
      throw ErrorFactory.system(
        `${this.serviceName} not initialized`,
        'A szolgáltatás még nem inicializálódott',
        { serviceName: this.serviceName }
      );
    }
  }

  async executeOperation(operation, operationName, context = {}) {
    const startTime = Date.now();
    
    try {
      Logger.debug(`${this.serviceName}.${operationName} started`, context);
      const result = await operation();
      const duration = Date.now() - startTime;
      Logger.info(`${this.serviceName}.${operationName} completed`, {
        ...context,
        duration: `${duration}ms`,
      });
      
      return { success: true, data: result };
    } catch (error) {
      const duration = Date.now() - startTime;
      let serviceError;
      
      if (ServiceError.isServiceError(error)) {
        serviceError = error;
      } else {
        serviceError = ErrorFactory.fromError(
          error,
          'Váratlan hiba történt',
          { ...context, serviceName: this.serviceName, operationName }
        );
      }
      
      serviceError.log();
      Logger.error(`${this.serviceName}.${operationName} failed`, {
        ...context,
        duration: `${duration}ms`,
        errorCode: serviceError.code,
      });
      
      return { success: false, error: serviceError };
    }
  }

  validate(data, rules) {
    const errors = [];

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = data[field];

      if (fieldRules.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          message: fieldRules.requiredMessage || `${field} kötelező`,
        });
        continue;
      }

      if (value === undefined || value === null || value === '') continue;

      if (fieldRules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== fieldRules.type) {
          errors.push({
            field,
            message: fieldRules.typeMessage || `${field} típusa nem megfelelő`,
          });
          continue;
        }
      }

      if (fieldRules.minLength && value.length < fieldRules.minLength) {
        errors.push({
          field,
          message: fieldRules.minLengthMessage || 
            `${field} minimum ${fieldRules.minLength} karakter`,
        });
      }

      if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
        errors.push({
          field,
          message: fieldRules.maxLengthMessage || 
            `${field} maximum ${fieldRules.maxLength} karakter`,
        });
      }

      if (fieldRules.min !== undefined && value < fieldRules.min) {
        errors.push({
          field,
          message: fieldRules.minMessage || `${field} minimum ${fieldRules.min}`,
        });
      }

      if (fieldRules.max !== undefined && value > fieldRules.max) {
        errors.push({
          field,
          message: fieldRules.maxMessage || `${field} maximum ${fieldRules.max}`,
        });
      }

      if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
        errors.push({
          field,
          message: fieldRules.patternMessage || `${field} formátuma nem megfelelő`,
        });
      }

      if (fieldRules.validator) {
        const customError = fieldRules.validator(value, data);
        if (customError) {
          errors.push({ field, message: customError });
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  throwValidationError(errors, context = {}) {
    const errorMessages = errors.map(e => e.message).join(', ');
    throw ErrorFactory.validation(
      `Validation failed: ${errorMessages}`,
      errors[0]?.message || 'Az adatok érvénytelenek',
      { ...context, validationErrors: errors }
    );
  }

  async retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          Logger.warn(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }
    throw lastError;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async batchProcess(items, operation, batchSize = 10) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(item => operation(item)));
      results.push(...batchResults);
    }
    return results;
  }

  log = {
    info: (message, context = {}) => Logger.info(`${this.serviceName}: ${message}`, context),
    debug: (message, context = {}) => Logger.debug(`${this.serviceName}: ${message}`, context),
    warn: (message, context = {}) => Logger.warn(`${this.serviceName}: ${message}`, context),
    error: (message, context = {}) => Logger.error(`${this.serviceName}: ${message}`, context),
    success: (message, context = {}) => Logger.success(`${this.serviceName}: ${message}`, context),
  };
}

export default BaseService;
