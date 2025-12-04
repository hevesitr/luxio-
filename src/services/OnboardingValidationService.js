/**
 * Onboarding Validation Service
 *
 * Handles validation logic for onboarding flow
 * Validates user inputs and provides user-friendly error messages
 */


class OnboardingValidationService {
  /**
   * Validate basic user info (step 1)
   * @param {Object} data - User data
   * @returns {Object} - Validation result
   */
  static validateBasicInfo(data) {
    const errors = [];

    // Name validation
    if (!data.name || data.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'A név megadása kötelező',
        type: 'required'
      });
    } else if (data.name.trim().length < 2) {
      errors.push({
        field: 'name',
        message: 'A névnek legalább 2 karakterből kell állnia',
        type: 'minLength'
      });
    } else if (data.name.trim().length > 50) {
      errors.push({
        field: 'name',
        message: 'A név maximum 50 karakter lehet',
        type: 'maxLength'
      });
    }

    // Birthday validation
    if (!data.birthday) {
      errors.push({
        field: 'birthday',
        message: 'A születési dátum megadása kötelező',
        type: 'required'
      });
    } else {
      const birthDate = new Date(data.birthday);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (isNaN(birthDate.getTime())) {
        errors.push({
          field: 'birthday',
          message: 'Érvénytelen dátum formátum',
          type: 'invalid'
        });
      } else if (age < 18) {
        errors.push({
          field: 'birthday',
          message: 'Minimum 18 évesnek kell lenned',
          type: 'age'
        });
      } else if (age > 99) {
        errors.push({
          field: 'birthday',
          message: 'Maximum 99 évesnek kell lenned',
          type: 'age'
        });
      }
    }

    // Gender validation
    if (!data.gender) {
      errors.push({
        field: 'gender',
        message: 'A nem kiválasztása kötelező',
        type: 'required'
      });
    } else if (!['male', 'female', 'non-binary', 'other'].includes(data.gender)) {
      errors.push({
        field: 'gender',
        message: 'Érvénytelen nem kiválasztás',
        type: 'invalid'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      completionPercentage: this.calculateStepCompletion(1, data, errors)
    };
  }

  /**
   * Validate photos (step 2)
   * @param {Array} photos - Array of photo objects
   * @returns {Object} - Validation result
   */
  static validatePhotos(photos = []) {
    const errors = [];
    const warnings = [];

    // Check minimum photos
    if (!photos || photos.length === 0) {
      errors.push({
        field: 'photos',
        message: 'Legalább 2 profilkép feltöltése kötelező',
        type: 'required'
      });
    } else if (photos.length < 2) {
      errors.push({
        field: 'photos',
        message: `Még ${2 - photos.length} kép feltöltése szükséges`,
        type: 'minCount'
      });
    }

    // Check recommended photos
    if (photos.length < 6) {
      warnings.push({
        field: 'photos',
        message: `Javasolt legalább 6 kép feltöltése (jelenleg ${photos.length})`,
        type: 'recommendation'
      });
    }

    // Check maximum photos
    if (photos.length > 9) {
      errors.push({
        field: 'photos',
        message: 'Maximum 9 kép tölthető fel',
        type: 'maxCount'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completionPercentage: this.calculateStepCompletion(2, photos, errors)
    };
  }

  /**
   * Validate bio and interests (step 3)
   * @param {Object} data - Bio and interests data
   * @returns {Object} - Validation result
   */
  static validateBioAndInterests(data) {
    const errors = [];
    const warnings = [];

    // Bio validation
    if (!data.bio || data.bio.trim().length === 0) {
      errors.push({
        field: 'bio',
        message: 'A bemutatkozás megírása kötelező',
        type: 'required'
      });
    } else if (data.bio.trim().length < 10) {
      errors.push({
        field: 'bio',
        message: `A bemutatkozásnak legalább 10 karakterből kell állnia (jelenleg ${data.bio.trim().length})`,
        type: 'minLength'
      });
    } else if (data.bio.trim().length > 500) {
      errors.push({
        field: 'bio',
        message: `A bemutatkozás maximum 500 karakter lehet (jelenleg ${data.bio.trim().length})`,
        type: 'maxLength'
      });
    }

    // Interests validation
    if (!data.interests || data.interests.length === 0) {
      warnings.push({
        field: 'interests',
        message: 'Javasolt érdeklődési körök hozzáadása a jobb match-ekért',
        type: 'recommendation'
      });
    } else if (data.interests.length > 10) {
      errors.push({
        field: 'interests',
        message: 'Maximum 10 érdeklődési kör választható',
        type: 'maxCount'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completionPercentage: this.calculateStepCompletion(3, data, errors)
    };
  }

  /**
   * Validate preferences (step 4)
   * @param {Object} data - Preferences data
   * @returns {Object} - Validation result
   */
  static validatePreferences(data) {
    const errors = [];

    // Looking for validation
    if (!data.lookingFor) {
      errors.push({
        field: 'lookingFor',
        message: 'A keresett partner nemének kiválasztása kötelező',
        type: 'required'
      });
    } else if (!['male', 'female', 'everyone'].includes(data.lookingFor)) {
      errors.push({
        field: 'lookingFor',
        message: 'Érvénytelen partner preferencia',
        type: 'invalid'
      });
    }

    // Age range validation
    if (!data.minAge || !data.maxAge) {
      errors.push({
        field: 'ageRange',
        message: 'Az életkor tartomány megadása kötelező',
        type: 'required'
      });
    } else {
      const minAge = parseInt(data.minAge);
      const maxAge = parseInt(data.maxAge);

      if (isNaN(minAge) || isNaN(maxAge)) {
        errors.push({
          field: 'ageRange',
          message: 'Érvénytelen életkor értékek',
          type: 'invalid'
        });
      } else if (minAge < 18 || maxAge > 99) {
        errors.push({
          field: 'ageRange',
          message: 'Az életkor tartománynak 18-99 év között kell lennie',
          type: 'range'
        });
      } else if (minAge >= maxAge) {
        errors.push({
          field: 'ageRange',
          message: 'A minimum életkor nem lehet nagyobb vagy egyenlő a maximum életkorral',
          type: 'range'
        });
      }
    }

    // Distance validation
    if (!data.maxDistance) {
      errors.push({
        field: 'maxDistance',
        message: 'A maximális távolság megadása kötelező',
        type: 'required'
      });
    } else {
      const distance = parseInt(data.maxDistance);
      if (isNaN(distance) || distance < 1 || distance > 100) {
        errors.push({
          field: 'maxDistance',
          message: 'A távolságnak 1-100 km között kell lennie',
          type: 'range'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      completionPercentage: this.calculateStepCompletion(4, data, errors)
    };
  }

  /**
   * Validate complete onboarding data
   * @param {Object} data - Complete onboarding data
   * @returns {Object} - Validation result
   */
  static validateCompleteOnboarding(data) {
    const step1Validation = this.validateBasicInfo({
      name: data.name,
      birthday: data.birthday,
      gender: data.gender
    });

    const step2Validation = this.validatePhotos(data.photos);

    const step3Validation = this.validateBioAndInterests({
      bio: data.bio,
      interests: data.interests
    });

    const step4Validation = this.validatePreferences({
      lookingFor: data.lookingFor,
      minAge: data.minAge,
      maxAge: data.maxAge,
      maxDistance: data.maxDistance
    });

    const allErrors = [
      ...step1Validation.errors,
      ...step2Validation.errors,
      ...step3Validation.errors,
      ...step4Validation.errors
    ];

    const allWarnings = [
      ...step2Validation.warnings,
      ...step3Validation.warnings
    ];

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      stepValidations: {
        step1: step1Validation,
        step2: step2Validation,
        step3: step3Validation,
        step4: step4Validation
      },
      completionPercentage: this.calculateOverallCompletion(data)
    };
  }

  /**
   * Calculate completion percentage for a step
   * @param {number} step - Step number (1-5)
   * @param {Object} data - Step data
   * @param {Array} errors - Validation errors
   * @returns {number} - Completion percentage
   */
  static calculateStepCompletion(step, data, errors = []) {
    let baseCompletion = 0;

    switch (step) {
      case 1: // Basic Info
        if (data.name) baseCompletion += 40;
        if (data.birthday) baseCompletion += 30;
        if (data.gender) baseCompletion += 30;
        break;

      case 2: // Photos
        if (data && data.length >= 2) baseCompletion += 70;
        if (data && data.length >= 6) baseCompletion += 30;
        break;

      case 3: // Bio & Interests
        if (data.bio && data.bio.length >= 10) baseCompletion += 60;
        if (data.interests && data.interests.length > 0) baseCompletion += 40;
        break;

      case 4: // Preferences
        if (data.lookingFor) baseCompletion += 40;
        if (data.minAge && data.maxAge) baseCompletion += 30;
        if (data.maxDistance) baseCompletion += 30;
        break;

      case 5: // Location
        baseCompletion = 100; // Assume complete if reached
        break;
    }

    // Reduce completion based on errors
    const errorPenalty = errors.length * 10;
    return Math.max(0, Math.min(100, baseCompletion - errorPenalty));
  }

  /**
   * Calculate overall onboarding completion
   * @param {Object} data - Complete onboarding data
   * @returns {number} - Overall completion percentage
   */
  static calculateOverallCompletion(data) {
    const validation = this.validateCompleteOnboarding(data);
    const stepCompletions = Object.values(validation.stepValidations).map(v => v.completionPercentage);
    const averageCompletion = stepCompletions.reduce((sum, comp) => sum + comp, 0) / stepCompletions.length;
    return Math.round(averageCompletion);
  }

  /**
   * Get validation tips for better profiles
   * @param {Object} data - Current onboarding data
   * @returns {Array} - Array of helpful tips
   */
  static getValidationTips(data) {
    const tips = [];

    // Photo tips
    if (!data.photos || data.photos.length < 6) {
      tips.push({
        type: 'photo',
        title: 'Több kép = több match!',
        message: 'Az emberek 6x nagyobb valószínűséggel nézik meg a több képet tartalmazó profilokat.'
      });
    }

    // Bio tips
    if (!data.bio || data.bio.length < 50) {
      tips.push({
        type: 'bio',
        title: 'Írj részletes bemutatkozást',
        message: 'A részletes bemutatkozások 3x nagyobb valószínűséggel vezetnek match-hez.'
      });
    }

    // Interests tips
    if (!data.interests || data.interests.length === 0) {
      tips.push({
        type: 'interests',
        title: 'Add érdeklődési köröket',
        message: 'A közös érdeklődések segítenek megtalálni a megfelelő partnert.'
      });
    }

    return tips;
  }
}

export default OnboardingValidationService;
