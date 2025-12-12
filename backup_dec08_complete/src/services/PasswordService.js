/**
 * PasswordService - Jelszó Validáció és Biztonság
 * Követelmény: 1.3 - Password encryption with bcrypt
 */

import Logger from './Logger';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

class PasswordServiceClass {
  validatePassword(password) {
    const errors = [];

    if (!password) {
      errors.push('Password is required');
      return { valid: false, errors };
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }

    if (password.length > PASSWORD_MAX_LENGTH) {
      errors.push(`Password must be less than ${PASSWORD_MAX_LENGTH} characters`);
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUpperCase) errors.push('Password must contain uppercase letter');
    if (!hasLowerCase) errors.push('Password must contain lowercase letter');
    if (!hasNumber) errors.push('Password must contain number');
    if (!hasSpecialChar) errors.push('Password must contain special character');

    if (this.isCommonPassword(password)) {
      errors.push('This password is too common');
    }

    return { valid: errors.length === 0, errors };
  }

  calculatePasswordStrength(password) {
    if (!password) {
      return { score: 0, strength: 'very-weak', feedback: 'Password required' };
    }

    let score = 0;
    const feedback = [];

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      score += 1;
      feedback.push('Good: Mixed case');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
      feedback.push('Good: Contains numbers');
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
      feedback.push('Good: Contains special characters');
    }

    if (this.hasRepeatingCharacters(password)) {
      score -= 1;
      feedback.push('Avoid repeating characters');
    }

    if (this.isCommonPassword(password)) {
      score -= 2;
      feedback.push('This is a common password');
    }

    score = Math.max(0, Math.min(4, score));

    const strengthLevels = {
      0: 'very-weak',
      1: 'weak',
      2: 'fair',
      3: 'strong',
      4: 'very-strong',
    };

    return {
      score,
      strength: strengthLevels[score],
      feedback: feedback.join('. '),
      meetsMinimum: score >= 3,
    };
  }

  hasRepeatingCharacters(password) {
    return /(.)\1{2,}/.test(password);
  }

  isCommonPassword(password) {
    const commonPasswords = [
      'password', '12345678', 'qwerty', 'abc123', 'monkey',
      '1234567890', 'letmein', 'trustno1', 'dragon', 'baseball',
      '111111', 'iloveyou', 'master', 'sunshine', 'ashley',
    ];
    return commonPasswords.includes(password.toLowerCase());
  }

  generatePassword(length = 16) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + special;

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  validatePasswordConfirmation(password, confirmation) {
    if (!confirmation) {
      return { valid: false, error: 'Password confirmation required' };
    }
    if (password !== confirmation) {
      return { valid: false, error: 'Passwords do not match' };
    }
    return { valid: true, error: null };
  }

  getPasswordRequirements() {
    return [
      `At least ${PASSWORD_MIN_LENGTH} characters`,
      'Contains uppercase letters (A-Z)',
      'Contains lowercase letters (a-z)',
      'Contains numbers (0-9)',
      'Contains special characters (!@#$%^&*)',
      'Not a common password',
    ];
  }
}

const PasswordService = new PasswordServiceClass();
export default PasswordService;
