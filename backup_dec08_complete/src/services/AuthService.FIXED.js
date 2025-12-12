import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { Platform, Dimensions } from 'react-native';
import { supabase } from '../config/supabase';
import { Logger } from './Logger';
import { ServiceError } from './ServiceError';
import crypto from 'crypto';

/**
 * AuthService - Fixed version with proper device fingerprinting
 * P0 Fix: Session Fixation vulnerability
 */
export class AuthService {
  constructor() {
    this.SESSION_KEY = '@auth_session';
    this.DEVICE_FINGERPRINT_KEY = '@device_fingerprint';
    this.TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
    this.SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Generate strong device fingerprint
   * P0 Fix: Proper device binding instead of just date
   */
  async generateDeviceFingerprint() {
    try {
      const deviceInfo = {
        // Device identifiers
        platform: Platform.OS,
        osVersion: Platform.Version,
        deviceId: await Device.getDeviceIdAsync(),
        
        // Screen info
        screenResolution: `${Dimensions.get('window').width}x${Dimensions.get('window').height}`,
        screenScale: Dimensions.get('window').scale,
        
        // Locale info
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale,
        
        // Device model
        deviceName: await Device.getDeviceNameAsync(),
        deviceBrand: Device.brand,
        deviceModel: Device.modelName,
        
        // Timestamp (full, not just date)
        timestamp: new Date().toISOString()
      };

      // Create SHA-256 hash
      const fingerprintString = JSON.stringify(deviceInfo);
      const hash = crypto
        .createHash('sha256')
        .update(fingerprintString)
        .digest('hex');

      return {
        hash,
        deviceInfo,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      Logger.error('Failed to generate device fingerprint', { error });
      throw new ServiceError(
        'FINGERPRINT_GENERATION_FAILED',
        'Could not generate device fingerprint',
        'AUTH'
      );
    }
  }

  /**
   * Validate device fingerprint
   * Ensures session is being used on the same device
   */
  async validateDeviceFingerprint(storedFingerprint) {
    try {
      const currentFingerprint = await this.generateDeviceFingerprint();
      
      // Compare hashes
      if (currentFingerprint.hash !== storedFingerprint.hash) {
        Logger.warn('Device fingerprint mismatch - possible device theft', {
          stored: storedFingerprint.hash,
          current: currentFingerprint.hash
        });
        
        return {
          valid: false,
          reason: 'DEVICE_MISMATCH',
          message: 'This session is being accessed from a different device'
        };
      }

      // Check if fingerprint is too old (> 30 days)
      const fingerprintAge = Date.now() - new Date(storedFingerprint.createdAt).getTime();
      if (fingerprintAge > 30 * 24 * 60 * 60 * 1000) {
        Logger.warn('Device fingerprint expired', { age: fingerprintAge });
        
        return {
          valid: false,
          reason: 'FINGERPRINT_EXPIRED',
          message: 'Device fingerprint has expired'
        };
      }

      return { valid: true };
    } catch (error) {
      Logger.error('Failed to validate device fingerprint', { error });
      return { valid: false, reason: 'VALIDATION_ERROR' };
    }
  }

  /**
   * Register with email and password
   */
  async register(email, password, userData) {
    try {
      // Validate password strength
      this.validatePasswordStrength(password);

      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) throw error;

      // Generate device fingerprint
      const fingerprint = await this.generateDeviceFingerprint();

      // Store session with fingerprint
      await this.storeSession(data.session, fingerprint);

      Logger.info('User registered successfully', { email });
      return data;
    } catch (error) {
      Logger.error('Registration failed', { error, email });
      throw new ServiceError(
        'REGISTRATION_FAILED',
        error.message,
        'AUTH'
      );
    }
  }

  /**
   * Login with email and password
   */
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Generate device fingerprint
      const fingerprint = await this.generateDeviceFingerprint();

      // Store session with fingerprint
      await this.storeSession(data.session, fingerprint);

      Logger.info('User logged in successfully', { email });
      return data;
    } catch (error) {
      Logger.error('Login failed', { error, email });
      throw new ServiceError(
        'LOGIN_FAILED',
        'Invalid email or password',
        'AUTH'
      );
    }
  }

  /**
   * Store session securely with device fingerprint
   */
  async storeSession(session, fingerprint) {
    try {
      const sessionData = {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: new Date(Date.now() + session.expires_in * 1000).toISOString(),
        deviceFingerprint: fingerprint,
        createdAt: new Date().toISOString()
      };

      // Store in secure storage
      await SecureStore.setItemAsync(
        this.SESSION_KEY,
        JSON.stringify(sessionData)
      );

      // Also store fingerprint separately for quick validation
      await SecureStore.setItemAsync(
        this.DEVICE_FINGERPRINT_KEY,
        JSON.stringify(fingerprint)
      );

      Logger.info('Session stored securely');
    } catch (error) {
      Logger.error('Failed to store session', { error });
      throw new ServiceError(
        'SESSION_STORAGE_FAILED',
        'Could not store session',
        'AUTH'
      );
    }
  }

  /**
   * Load session and validate device fingerprint
   */
  async loadSession() {
    try {
      const sessionJson = await SecureStore.getItemAsync(this.SESSION_KEY);
      if (!sessionJson) return null;

      const sessionData = JSON.parse(sessionJson);

      // Validate device fingerprint
      const fingerprintValidation = await this.validateDeviceFingerprint(
        sessionData.deviceFingerprint
      );

      if (!fingerprintValidation.valid) {
        Logger.warn('Session device fingerprint validation failed', fingerprintValidation);
        
        // Clear session if device mismatch
        await this.clearSession();
        
        // Notify user
        throw new ServiceError(
          'SESSION_DEVICE_MISMATCH',
          fingerprintValidation.message,
          'AUTH'
        );
      }

      // Check if session is expired
      if (new Date(sessionData.expiresAt) < new Date()) {
        Logger.warn('Session expired');
        await this.clearSession();
        return null;
      }

      // Check if session is about to expire (within 5 minutes)
      const timeUntilExpiry = new Date(sessionData.expiresAt) - new Date();
      if (timeUntilExpiry < 5 * 60 * 1000) {
        Logger.info('Session expiring soon, refreshing');
        await this.refreshSession(sessionData.refreshToken);
      }

      return sessionData;
    } catch (error) {
      Logger.error('Failed to load session', { error });
      return null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshSession(refreshToken) {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error) throw error;

      // Get stored fingerprint
      const fingerprintJson = await SecureStore.getItemAsync(
        this.DEVICE_FINGERPRINT_KEY
      );
      const fingerprint = fingerprintJson ? JSON.parse(fingerprintJson) : null;

      // Store new session with same fingerprint
      await this.storeSession(data.session, fingerprint);

      Logger.info('Session refreshed successfully');
      return data.session;
    } catch (error) {
      Logger.error('Failed to refresh session', { error });
      await this.clearSession();
      throw new ServiceError(
        'SESSION_REFRESH_FAILED',
        'Could not refresh session',
        'AUTH'
      );
    }
  }

  /**
   * Logout
   */
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      await this.clearSession();
      Logger.info('User logged out successfully');
    } catch (error) {
      Logger.error('Logout failed', { error });
      throw new ServiceError(
        'LOGOUT_FAILED',
        'Could not logout',
        'AUTH'
      );
    }
  }

  /**
   * Clear session
   */
  async clearSession() {
    try {
      await SecureStore.deleteItemAsync(this.SESSION_KEY);
      await SecureStore.deleteItemAsync(this.DEVICE_FINGERPRINT_KEY);
      Logger.info('Session cleared');
    } catch (error) {
      Logger.error('Failed to clear session', { error });
    }
  }

  /**
   * Validate password strength
   * P0 Fix: Ensure strong passwords
   */
  validatePasswordStrength(password) {
    const minLength = 12;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (password.length < minLength) {
      throw new ServiceError(
        'WEAK_PASSWORD',
        `Password must be at least ${minLength} characters`,
        'AUTH'
      );
    }

    if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecialChar) {
      throw new ServiceError(
        'WEAK_PASSWORD',
        'Password must contain uppercase, lowercase, numbers, and special characters',
        'AUTH'
      );
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    } catch (error) {
      Logger.error('Failed to get current user', { error });
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const session = await this.loadSession();
    return !!session;
  }
}

export const authService = new AuthService();
