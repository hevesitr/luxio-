/**
 * DeepLinkingService - Deep link kezelés email verification és password reset esetén
 * Követelmény: 6.3 Supabase Auth integráció
 */
import * as Linking from 'expo-linking';
import { supabase } from './supabaseClient';
import Logger from './Logger';

class DeepLinkingService {
  constructor() {
    this.isInitialized = false;
    this.listeners = [];
  }

  /**
   * Service inicializálása
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Deep link listener beállítása
      Linking.addEventListener('url', this.handleDeepLink.bind(this));

      // Kezdeti URL ellenőrzés (app megnyitásakor)
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await this.handleDeepLink({ url: initialUrl });
      }

      this.isInitialized = true;
      Logger.info('DeepLinkingService initialized');
    } catch (error) {
      Logger.error('Failed to initialize DeepLinkingService', error);
    }
  }

  /**
   * Deep link esemény kezelése
   * @param {Object} event - Linking event
   */
  async handleDeepLink(event) {
    try {
      const { url } = event;
      Logger.info('Deep link received', { url });

      // URL parsing
      const parsedUrl = Linking.parse(url);

      if (!parsedUrl) {
        Logger.warn('Invalid deep link URL', { url });
        return;
      }

      // Supabase auth callback kezelése
      if (parsedUrl.hostname === 'your-project.supabase.co' ||
          parsedUrl.hostname?.includes('supabase.co')) {

        // Email verification callback
        if (parsedUrl.path?.includes('/auth/callback')) {
          await this.handleAuthCallback(parsedUrl);
        }
      }

      // Custom scheme kezelés
      if (parsedUrl.scheme === 'lovex') {
        await this.handleCustomScheme(parsedUrl);
      }

      // Listener-ek értesítése
      this.notifyListeners('deepLinkReceived', { url, parsedUrl });

    } catch (error) {
      Logger.error('Failed to handle deep link', error);
      this.notifyListeners('deepLinkError', { url: event.url, error: error.message });
    }
  }

  /**
   * Supabase auth callback kezelése
   * @param {Object} parsedUrl - Parsed URL object
   */
  async handleAuthCallback(parsedUrl) {
    try {
      const params = parsedUrl.queryParams || {};

      // Token hash ellenőrzés (email verification)
      if (params.token_hash && params.type === 'email') {
        const result = await supabase.auth.verifyOtp({
          token_hash: params.token_hash,
          type: 'email'
        });

        if (result.error) {
          throw result.error;
        }

        Logger.success('Email verification successful via deep link', {
          userId: result.data.user?.id
        });

        this.notifyListeners('emailVerified', {
          user: result.data.user,
          session: result.data.session
        });

        return;
      }

      // Password recovery
      if (params.access_token && params.refresh_token) {
        const result = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token
        });

        if (result.error) {
          throw result.error;
        }

        Logger.success('Password reset session established', {
          userId: result.data.user?.id
        });

        this.notifyListeners('passwordResetReady', {
          user: result.data.user,
          session: result.data.session
        });
      }

    } catch (error) {
      Logger.error('Auth callback handling failed', error);
      this.notifyListeners('authCallbackError', { error: error.message });
    }
  }

  /**
   * Custom scheme kezelés
   * @param {Object} parsedUrl - Parsed URL object
   */
  async handleCustomScheme(parsedUrl) {
    try {
      const { path, queryParams } = parsedUrl;

      switch (path) {
        case '/verify-email':
          this.notifyListeners('navigateToEmailVerification', queryParams);
          break;

        case '/reset-password':
          this.notifyListeners('navigateToPasswordReset', queryParams);
          break;

        default:
          Logger.warn('Unknown custom scheme path', { path });
      }
    } catch (error) {
      Logger.error('Custom scheme handling failed', error);
    }
  }

  /**
   * Event listener hozzáadása
   * @param {Function} callback - Callback function
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Listener-ek értesítése
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        Logger.error('Deep link listener error', error);
      }
    });
  }

  /**
   * Email verification deep link generálása
   * @param {string} userId - User ID
   */
  generateVerificationLink(userId) {
    const baseUrl = Linking.createURL('/');
    return `${baseUrl}verify-email?userId=${userId}&timestamp=${Date.now()}`;
  }

  /**
   * Password reset deep link generálása
   * @param {string} userId - User ID
   */
  generatePasswordResetLink(userId) {
    const baseUrl = Linking.createURL('/');
    return `${baseUrl}reset-password?userId=${userId}&timestamp=${Date.now()}`;
  }

  /**
   * Service leállítása
   */
  destroy() {
    this.listeners = [];
    this.isInitialized = false;
    Logger.info('DeepLinkingService destroyed');
  }
}

export default new DeepLinkingService();
