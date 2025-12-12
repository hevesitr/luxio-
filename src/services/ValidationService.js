/**
 * Validation Service
 * Provides consistent input validation across the application
 * 
 * Property: Property 14 - Input Validation Consistency
 * Validates: Requirements 15 (Input Validation)
 */

class ValidationService {
  constructor() {
    // Validation patterns
    this.patterns = {
      email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/,
      phone: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
      url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
      username: /^[a-zA-Z0-9_]{3,20}$/,
      zipCode: /^\d{5}(-\d{4})?$/,
    };

    // Password requirements
    this.passwordRequirements = {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecial: false,
    };

    // Bio requirements
    this.bioRequirements = {
      minLength: 10,
      maxLength: 500,
      allowedCharacters: /^[a-zA-Z0-9\s\.,!?'"@#$%&*()_+\-=\[\]{};:\\|<>\/~`áéíóúÁÉÍÓÚüÜöÖőŐűŰ]*$/,
    };
  }

  /**
   * Validate email address
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return {
        valid: false,
        error: 'Email is required',
      };
    }

    const trimmed = email.trim();

    if (trimmed.length === 0) {
      return {
        valid: false,
        error: 'Email cannot be empty',
      };
    }

    if (!this.patterns.email.test(trimmed)) {
      return {
        valid: false,
        error: 'Invalid email format',
      };
    }

    return {
      valid: true,
      value: trimmed.toLowerCase(),
    };
  }

  /**
   * Validate password
   */
  validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return {
        valid: false,
        error: 'Password is required',
      };
    }

    const { minLength, maxLength, requireUppercase, requireLowercase, requireNumber, requireSpecial } = this.passwordRequirements;

    if (password.length < minLength) {
      return {
        valid: false,
        error: `Password must be at least ${minLength} characters`,
      };
    }

    if (password.length > maxLength) {
      return {
        valid: false,
        error: `Password must be less than ${maxLength} characters`,
      };
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      return {
        valid: false,
        error: 'Password must contain at least one uppercase letter',
      };
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      return {
        valid: false,
        error: 'Password must contain at least one lowercase letter',
      };
    }

    if (requireNumber && !/\d/.test(password)) {
      return {
        valid: false,
        error: 'Password must contain at least one number',
      };
    }

    if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return {
        valid: false,
        error: 'Password must contain at least one special character',
      };
    }

    return {
      valid: true,
      strength: this.calculatePasswordStrength(password),
    };
  }

  /**
   * Calculate password strength
   */
  calculatePasswordStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  }

  /**
   * Validate phone number
   */
  validatePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
      return {
        valid: false,
        error: 'Phone number is required',
      };
    }

    const trimmed = phone.trim();

    if (!this.patterns.phone.test(trimmed)) {
      return {
        valid: false,
        error: 'Invalid phone number format',
      };
    }

    return {
      valid: true,
      value: trimmed,
    };
  }

  /**
   * Validate bio
   */
  validateBio(bio) {
    if (!bio || typeof bio !== 'string') {
      return {
        valid: false,
        error: 'Bio is required',
      };
    }

    const trimmed = bio.trim();
    const { minLength, maxLength, allowedCharacters } = this.bioRequirements;

    if (trimmed.length < minLength) {
      return {
        valid: false,
        error: `Bio must be at least ${minLength} characters`,
      };
    }

    if (trimmed.length > maxLength) {
      return {
        valid: false,
        error: `Bio must be less than ${maxLength} characters`,
      };
    }

    if (!allowedCharacters.test(trimmed)) {
      return {
        valid: false,
        error: 'Bio contains invalid characters',
      };
    }

    return {
      valid: true,
      value: trimmed,
      length: trimmed.length,
    };
  }

  /**
   * Validate username
   */
  validateUsername(username) {
    if (!username || typeof username !== 'string') {
      return {
        valid: false,
        error: 'Username is required',
      };
    }

    const trimmed = username.trim();

    if (!this.patterns.username.test(trimmed)) {
      return {
        valid: false,
        error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores',
      };
    }

    return {
      valid: true,
      value: trimmed,
    };
  }

  /**
   * Validate URL
   */
  validateUrl(url) {
    if (!url || typeof url !== 'string') {
      return {
        valid: false,
        error: 'URL is required',
      };
    }

    const trimmed = url.trim();

    if (!this.patterns.url.test(trimmed)) {
      return {
        valid: false,
        error: 'Invalid URL format',
      };
    }

    return {
      valid: true,
      value: trimmed,
    };
  }

  /**
   * Validate age
   */
  validateAge(age) {
    if (age === null || age === undefined) {
      return {
        valid: false,
        error: 'Age is required',
      };
    }

    const numAge = Number(age);

    if (isNaN(numAge)) {
      return {
        valid: false,
        error: 'Age must be a number',
      };
    }

    if (numAge < 18) {
      return {
        valid: false,
        error: 'You must be at least 18 years old',
      };
    }

    if (numAge > 120) {
      return {
        valid: false,
        error: 'Invalid age',
      };
    }

    return {
      valid: true,
      value: numAge,
    };
  }

  /**
   * Validate object against schema
   */
  validate(data, schema) {
    const errors = {};
    const validated = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // Required check
      if (rules.required && (value === null || value === undefined || value === '')) {
        errors[field] = `${field} is required`;
        continue;
      }

      // Skip validation if not required and empty
      if (!rules.required && (value === null || value === undefined || value === '')) {
        continue;
      }

      // Type validation
      if (rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors[field] = `${field} must be of type ${rules.type}`;
          continue;
        }
      }

      // Custom validator
      if (rules.validator) {
        const result = rules.validator(value);
        if (!result.valid) {
          errors[field] = result.error;
          continue;
        }
        validated[field] = result.value !== undefined ? result.value : value;
      } else {
        validated[field] = value;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      data: validated,
    };
  }

  /**
   * Async validation
   */
  async validateAsync(data, schema) {
    const errors = {};
    const validated = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // Required check
      if (rules.required && (value === null || value === undefined || value === '')) {
        errors[field] = `${field} is required`;
        continue;
      }

      // Skip validation if not required and empty
      if (!rules.required && (value === null || value === undefined || value === '')) {
        continue;
      }

      // Async validator
      if (rules.asyncValidator) {
        try {
          const result = await rules.asyncValidator(value);
          if (!result.valid) {
            errors[field] = result.error;
            continue;
          }
          validated[field] = result.value !== undefined ? result.value : value;
        } catch (error) {
          errors[field] = error.message;
          continue;
        }
      } else if (rules.validator) {
        const result = rules.validator(value);
        if (!result.valid) {
          errors[field] = result.error;
          continue;
        }
        validated[field] = result.value !== undefined ? result.value : value;
      } else {
        validated[field] = value;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      data: validated,
    };
  }
}

// Export singleton instance
export const validationService = new ValidationService();
export default ValidationService;
