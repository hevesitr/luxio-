/**
 * EmailService - Email küldés és verifikáció kezelése
 * Követelmény: 6.1, 6.2, 6.3, 6.4, 6.5
 */
import { supabase } from './supabaseClient';
import Logger from './Logger';
import ErrorHandler, { ErrorCodes } from './ErrorHandler';

class EmailService {
  constructor() {
    // Rate limiting beállítások
    this.RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 óra
    this.MAX_EMAILS_PER_HOUR = 3;

    // Storage kulcsok
    this.STORAGE_KEYS = {
      EMAIL_HISTORY: '@email_service_history',
    };
  }

  /**
   * Email verifikáció küldése
   * @param {string} email - Email cím
   * @param {Object} options - Opcionális paraméterek
   */
  async sendVerificationEmail(email, options = {}) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Rate limiting ellenőrzés
      await this.checkRateLimit(email);

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          ...options,
        }
      });

      if (error) {
        Logger.error('Email verification send failed', error);
        throw ErrorHandler.createError(
          ErrorCodes.SERVICE_EMAIL_ERROR,
          'Failed to send verification email',
          { email, error: error.message }
        );
      }

      // Rate limiting frissítés
      await this.updateRateLimit(email);

      Logger.success('Verification email sent', { email });

      return {
        success: true,
        message: 'Verification email sent successfully'
      };
    }, {
      operation: 'sendVerificationEmail',
      email
    });
  }

  /**
   * Email verifikáció újraküldése
   * @param {string} email - Email cím
   */
  async resendVerificationEmail(email) {
    return this.sendVerificationEmail(email, {
      captchaToken: null // Expo esetében nem szükséges
    });
  }

  /**
   * Password reset email küldése
   * @param {string} email - Email cím
   */
  async sendPasswordResetEmail(email) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Rate limiting ellenőrzés
      await this.checkRateLimit(email);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/callback`
      });

      if (error) {
        Logger.error('Password reset email failed', error);
        throw ErrorHandler.createError(
          ErrorCodes.SERVICE_EMAIL_ERROR,
          'Failed to send password reset email',
          { email, error: error.message }
        );
      }

      // Rate limiting frissítés
      await this.updateRateLimit(email);

      Logger.success('Password reset email sent', { email });

      return {
        success: true,
        message: 'Password reset email sent successfully'
      };
    }, {
      operation: 'sendPasswordResetEmail',
      email
    });
  }

  /**
   * Email verifikáció ellenőrzése (token alapján)
   * @param {string} token - Verifikációs token
   */
  async verifyEmailToken(token) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (error) {
        Logger.error('Email verification failed', error);
        throw ErrorHandler.createError(
          ErrorCodes.AUTH_VERIFICATION_FAILED,
          'Email verification failed',
          { error: error.message }
        );
      }

      Logger.success('Email verified successfully', {
        userId: data.user?.id
      });

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    }, {
      operation: 'verifyEmailToken'
    });
  }

  /**
   * Email verifikáció státuszának ellenőrzése
   */
  async checkEmailVerificationStatus() {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        Logger.error('Failed to check email verification status', error);
        return { verified: false, error: error.message };
      }

      const verified = data.user?.email_confirmed_at != null;

      return {
        verified,
        emailConfirmedAt: data.user?.email_confirmed_at
      };
    } catch (error) {
      Logger.error('Error checking email verification status', error);
      return { verified: false, error: error.message };
    }
  }

  /**
   * Rate limiting ellenőrzés
   * @param {string} email - Email cím
   */
  async checkRateLimit(email) {
    try {
      const history = await this.getEmailHistory();

      // Szűrjük az elmúlt 1 órában küldött emaileket
      const oneHourAgo = Date.now() - this.RATE_LIMIT_WINDOW;
      const recentEmails = history.filter(
        entry => entry.email === email && entry.timestamp > oneHourAgo
      );

      if (recentEmails.length >= this.MAX_EMAILS_PER_HOUR) {
        throw ErrorHandler.createError(
          ErrorCodes.SERVICE_RATE_LIMIT_EXCEEDED,
          `Too many emails sent. Maximum ${this.MAX_EMAILS_PER_HOUR} per hour.`,
          { email, sentCount: recentEmails.length }
        );
      }
    } catch (error) {
      if (error.code === ErrorCodes.SERVICE_RATE_LIMIT_EXCEEDED) {
        throw error;
      }
      // Ha storage hiba, akkor engedjük tovább (nem blokkoljuk)
      Logger.warn('Rate limiting check failed, allowing request', { error: error.message });
    }
  }

  /**
   * Rate limiting frissítés
   * @param {string} email - Email cím
   */
  async updateRateLimit(email) {
    try {
      const history = await this.getEmailHistory();

      // Új entry hozzáadása
      history.push({
        email,
        timestamp: Date.now(),
        type: 'verification'
      });

      // Régi entry-k törlése (1 óránál régebbiek)
      const oneHourAgo = Date.now() - this.RATE_LIMIT_WINDOW;
      const filteredHistory = history.filter(entry => entry.timestamp > oneHourAgo);

      // Storage mentés
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.EMAIL_HISTORY,
        JSON.stringify(filteredHistory)
      );
    } catch (error) {
      // Ha storage hiba, nem blokkoljuk a funkciót
      Logger.warn('Rate limiting update failed', { error: error.message });
    }
  }

  /**
   * Email history lekérése
   */
  async getEmailHistory() {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.EMAIL_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      Logger.warn('Failed to load email history', { error: error.message });
      return [];
    }
  }

  /**
   * Email history tisztítása (karbantartás)
   */
  async clearEmailHistory() {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.EMAIL_HISTORY);
      Logger.info('Email history cleared');
      return { success: true };
    } catch (error) {
      Logger.error('Failed to clear email history', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Account notification email küldése
   * @param {string} email - Email cím
   * @param {string} type - Notification típusa
   * @param {Object} data - Notification adatok
   */
  async sendAccountNotification(email, type, data = {}) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Ez egy placeholder - valós implementációban külső email szolgáltatást használnánk
      Logger.info('Account notification would be sent', {
        email,
        type,
        data
      });

      // Supabase esetében ez általában az auth eseményeken keresztül történik
      // vagy külső email szolgáltatással

      return {
        success: true,
        message: `Account notification queued for ${email}`
      };
    }, {
      operation: 'sendAccountNotification',
      email,
      type
    });
  }
}

// AsyncStorage import (késleltetett import, hogy elkerüljük circular dependency-t)
import AsyncStorage from '@react-native-async-storage/async-storage';

export default new EmailService();
