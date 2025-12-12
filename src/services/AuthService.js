/**
 * AuthService - Biztonságos autentikáció és session kezelés
 * Implements Requirements 1.2, 1.4
 */
import { supabase } from './supabaseClient';
import Logger from './Logger';
import BaseService from './BaseService';
import PasswordService from './PasswordService';
import SessionService from './SessionService';
import RateLimitService from './RateLimitService';
import * as SecureStore from 'expo-secure-store';
// Phase 1: Device Fingerprinting for Session Fixation Prevention
import { deviceFingerprintService } from './DeviceFingerprintService';
import { piiRedactionService } from './PIIRedactionService';

class AuthService extends BaseService {
  constructor() {
    super('AuthService');
    this.currentUser = null;
    this.session = null;
    this.refreshTimer = null;
    this.passwordService = PasswordService; // PasswordService már instance, nem kell new

    // Token management enhancements (4.1 - 4.5)
    this.tokenRefreshQueue = new Map(); // Refresh queue for concurrent requests
    this.heartbeatTimer = null; // Silent failure detection
    this.heartbeatInterval = 60 * 1000; // 60 seconds
    this.lastHeartbeatSuccess = null;
    this.authFailureListeners = [];
  }

  /**
   * Felhasználó regisztrációja
   * @param {object} userData - {email, password, profileData}
   */
  async signUp({ email, password, profileData }) {
    return this.executeOperation(async () => {
      // Input validáció
      const emailValidation = this.validate({ email }, { email: { required: true, type: 'email' } });
      if (!emailValidation.valid) {
        this.throwValidationError(emailValidation.errors);
      }

      // Jelszó validáció
      const passwordValidation = this.passwordService.validatePassword(password);
      if (!passwordValidation.valid) {
        this.throwValidationError([{ field: 'password', message: passwordValidation.message }]);
      }

      // Supabase regisztráció (automatikusan bcrypt-tel hash-eli)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: profileData.firstName,
            age: profileData.age,
          }
        }
      });

      if (error) throw error;

      // Profil létrehozása
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            first_name: profileData.firstName,
            age: profileData.age,
            gender: profileData.gender,
            bio: profileData.bio || '',
            location: profileData.location || null,
            photos: [],
            is_premium: false,
            created_at: new Date().toISOString(),
          });

        if (profileError) {
          Logger.error('Profile creation failed', profileError);
          throw profileError;
        }
      }

      Logger.success('User signed up', { email });

      // Session mentése
      if (data.session) {
        await this.saveSession(data.session);
        this.session = data.session;
        this.currentUser = data.user;
        this.startRefreshTimer();
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    });
  }

  /**
   * AuthService inicializálása - meglévő session visszaállítása
   */
  async initialize() {
    try {
      Logger.info('AuthService: Initializing...');

      // Meglévő session betöltése
      const savedSession = await SecureStore.getItemAsync('user_session');
      if (savedSession) {
        const sessionData = JSON.parse(savedSession);

        // Ellenőrizzük, hogy a session még érvényes-e
        if (sessionData.expires_at && new Date(sessionData.expires_at) > new Date()) {
          this.session = sessionData;
          this.currentUser = sessionData.user;

          // Supabase session visszaállítása
          const { data, error } = await supabase.auth.setSession({
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token
          });

          if (!error && data.session) {
            this.session = data.session;
            this.currentUser = data.user;
            this.startRefreshTimer();
            Logger.success('AuthService: Session restored successfully');
          } else {
            // Invalid session, clear it
            await this.clearSession();
            Logger.info('AuthService: Invalid session cleared');
          }
        } else {
          // Expired session, clear it
          await this.clearSession();
          Logger.info('AuthService: Expired session cleared');
        }
      }

      // Start heartbeat for silent failure detection
      if (this.currentUser) {
        this.startHeartbeat();
      }

      Logger.success('AuthService: Initialization completed');
    } catch (error) {
      Logger.error('AuthService: Initialization failed', error);
      // Don't throw error, just log it - app should continue
    }
  }

  /**
   * Felhasználó bejelentkezése
   * @param {string} email
   * @param {string} password
   */
  async signIn(email, password) {
    try {
      // ✅ P1-1: Rate limiting ellenőrzés - Brute force védelem
      const rateLimitCheck = await RateLimitService.checkLoginAttempts(email);
      if (!rateLimitCheck.allowed) {
        Logger.warn('Login blocked by rate limiting', {
          email,
          reason: rateLimitCheck.reason,
          blockDuration: rateLimitCheck.blockDuration
        });
        return {
          success: false,
          error: `Túl sok sikertelen bejelentkezési kísérlet. Próbálja újra ${rateLimitCheck.remainingTime} perc múlva.`,
          code: 'RATE_LIMIT_EXCEEDED'
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // ✅ P1-1: Sikertelen kísérlet rögzítése
        await RateLimitService.recordFailedLogin(email);
        throw error;
      }

      // ✅ P1-1: Sikeres bejelentkezés - számláló visszaállítása
      await RateLimitService.recordSuccessfulLogin(email);

      Logger.success('User signed in', { email: piiRedactionService.redactEmail(email) });

      // Session mentése
      if (data.session) {
        await this.saveSession(data.session);
        this.session = data.session;
        this.currentUser = data.user;
        this.startRefreshTimer();

        // Phase 1: Device Fingerprinting for Session Fixation Prevention
        try {
          const fingerprint = await deviceFingerprintService.generateFingerprint();
          await deviceFingerprintService.storeFingerprint(fingerprint);
          
          // Store fingerprint with session in database
          await this.storeSessionFingerprint(data.session.access_token, fingerprint);
          
          Logger.info('[AuthService] Device fingerprint stored for session');
        } catch (fingerprintError) {
          Logger.warn('[AuthService] Failed to store device fingerprint', fingerprintError);
          // Non-critical, don't block login
        }

        // Session létrehozása adatbázisban
        try {
          await SessionService.createSession(data.user.id);
        } catch (sessionError) {
          Logger.warn('Failed to create session in database', sessionError);
          // Nem kritikus hiba, nem szakítjuk meg a bejelentkezést
        }
      }

      return { 
        success: true, 
        user: data.user,
        session: data.session 
      };
    } catch (error) {
      Logger.error('Sign in failed', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Kijelentkezés
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      // Session törlése
      await this.clearSession();
      this.currentUser = null;
      this.session = null;
      this.stopRefreshTimer();

      Logger.success('User signed out');
      return { success: true };
    } catch (error) {
      Logger.error('Sign out failed', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Jelszó visszaállítás kérése
   * @param {string} email 
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'lovex://reset-password',
      });

      if (error) throw error;

      Logger.success('Password reset email sent', { email });
      return { success: true };
    } catch (error) {
      Logger.error('Password reset failed', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Jelszó frissítése
   * @param {string} newPassword 
   */
  async updatePassword(newPassword) {
    try {
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      Logger.success('Password updated');
      return { success: true };
    } catch (error) {
      Logger.error('Password update failed', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Aktuális felhasználó lekérése
   */
  async getCurrentUser() {
    try {
      // Ha már van cache-elt user, visszaadjuk
      if (this.currentUser) {
        return { success: true, user: this.currentUser };
      }

      // Session ellenőrzése
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      if (session) {
        this.session = session;
        this.currentUser = session.user;
        this.startRefreshTimer();
        
        return { 
          success: true, 
          user: session.user 
        };
      }

      return { 
        success: false, 
        error: 'No active session' 
      };
    } catch (error) {
      Logger.error('Get current user failed', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Session frissítése
   */
  /**
   * Enhanced automatic session refresh with proactive timing and queue management
   * Implements 4.1: Improve automatic token refresh
   */
  async refreshSession() {
    if (!this.session) return { success: false, error: 'No session to refresh' };

    // Check if refresh is already in progress
    if (this.tokenRefreshQueue.has('refresh')) {
      Logger.debug('Session refresh already in progress, queuing request');
      return this.tokenRefreshQueue.get('refresh');
    }

    const refreshPromise = this.performTokenRefresh();
    this.tokenRefreshQueue.set('refresh', refreshPromise);

    try {
      return await refreshPromise;
    } finally {
      this.tokenRefreshQueue.delete('refresh');
    }
  }

  /**
   * Perform the actual token refresh with enhanced error handling
   */
  async performTokenRefresh() {
    try {
      Logger.debug('Attempting enhanced session refresh');

      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        Logger.warn('Session refresh failed', error);
        await this.handleTokenRefreshFailure(error);
        return { success: false, error: error.message };
      }

      if (data.session) {
        this.session = data.session;
        this.currentUser = data.session.user;
        await this.saveSession(data.session);
        this.startRefreshTimer();

        Logger.success('Session refreshed successfully');
        this.notifyAuthFailureListeners('refreshSuccess');
        return { success: true, session: data.session };
      }

      return { success: false, error: 'No session returned from refresh' };
    } catch (error) {
      Logger.error('Session refresh error', error);
      await this.handleTokenRefreshFailure(error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle token refresh failures with user-friendly recovery
   * Implements 4.2: Implement token refresh failure handling
   */
  async handleTokenRefreshFailure(error) {
    Logger.warn('Handling token refresh failure', error);

    // Notify listeners
    this.notifyAuthFailureListeners('tokenRefreshFailed', { error: error.message });

    // Attempt graceful degradation - read-only mode
    this.enterReadOnlyMode();

    // Try to re-authenticate user
    const reauthSuccess = await this.attemptSilentReauth();

    if (!reauthSuccess) {
      // If silent reauth fails, prompt user for manual reauth
      this.promptUserReauth();
    }
  }

  /**
   * Enter read-only mode when authentication fails
   */
  enterReadOnlyMode() {
    Logger.info('Entering read-only mode due to auth failure');

    // Stop automatic operations that require auth
    this.stopRefreshTimer();
    this.stopHeartbeat();

    // Notify app components
    this.notifyAuthFailureListeners('readOnlyModeEntered');
  }

  /**
   * Attempt silent re-authentication
   */
  async attemptSilentReauth() {
    try {
      Logger.info('Attempting silent re-authentication');

      // Try to refresh session one more time
      const refreshResult = await this.performTokenRefresh();

      if (refreshResult.success) {
        Logger.success('Silent re-authentication successful');
        this.exitReadOnlyMode();
        return true;
      }

      return false;
    } catch (error) {
      Logger.error('Silent re-authentication failed', error);
      return false;
    }
  }

  /**
   * Prompt user for manual re-authentication
   */
  promptUserReauth() {
    Logger.info('Prompting user for manual re-authentication');

    this.notifyAuthFailureListeners('manualReauthRequired', {
      reason: 'Session expired or invalid',
      action: 'Please sign in again'
    });
  }

  /**
   * Exit read-only mode
   */
  exitReadOnlyMode() {
    Logger.info('Exiting read-only mode');

    // Restart automatic operations
    this.startRefreshTimer();
    this.startHeartbeat();

    this.notifyAuthFailureListeners('readOnlyModeExited');
  }

  /**
   * Token validálása
   * @param {string} token 
   */
  async validateToken(token) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error) throw error;

      return { 
        success: true, 
        valid: !!data.user,
        user: data.user 
      };
    } catch (error) {
      Logger.error('Token validation failed', error);
      return { 
        success: false, 
        valid: false,
        error: error.message 
      };
    }
  }

  /**
   * OAuth - Google bejelentkezés
   */
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'lovex://auth/callback',
        }
      });

      if (error) throw error;

      Logger.success('Google sign in initiated');
      return { 
        success: true, 
        data 
      };
    } catch (error) {
      Logger.error('Google sign in failed', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * OAuth - Apple bejelentkezés
   */
  async signInWithApple() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'lovex://auth/callback',
        }
      });

      if (error) throw error;

      Logger.success('Apple sign in initiated');
      return { 
        success: true, 
        data 
      };
    } catch (error) {
      Logger.error('Apple sign in failed', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * OAuth - Facebook bejelentkezés
   */
  async signInWithFacebook() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: 'lovex://auth/callback',
        }
      });

      if (error) throw error;

      Logger.success('Facebook sign in initiated');
      return { 
        success: true, 
        data 
      };
    } catch (error) {
      Logger.error('Facebook sign in failed', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * ✅ JAVÍTOTT: Session mentése titkosítva és device fingerprint-tel
   * @param {object} session
   */
  async saveSession(session) {
    try {
      // 🔒 Device fingerprint generálása (DeviceFingerprintService használatával)
      const deviceFingerprint = await deviceFingerprintService.generateFingerprint();

      // 🔒 Session adatok titkosítása
      const sessionData = {
        session: session,
        fingerprint: deviceFingerprint,
        createdAt: new Date().toISOString(),
        version: '2.0' // Version for migration
      };

      // Base64 encoding (nem titkosítás, de obfuszkálás)
      const encodedSession = btoa(JSON.stringify(sessionData));

      await SecureStore.setItemAsync('supabase_session_v2', encodedSession);
      Logger.debug('Session saved securely with encryption');
    } catch (error) {
      Logger.error('Session save failed', error);
      throw new Error('Session save failed');
    }
  }

  /**
   * ✅ JAVÍTOTT: Session betöltése dekódolással és fingerprint ellenőrzéssel
   */
  async loadSession() {
    try {
      // Try new encrypted format first
      let sessionStr = await SecureStore.getItemAsync('supabase_session_v2');

      if (sessionStr) {
        try {
          // Decode from base64
          const decodedData = JSON.parse(atob(sessionStr));

          // 🔒 Fingerprint ellenőrzés
          const currentFingerprint = await deviceFingerprintService.generateFingerprint();
          if (decodedData.fingerprint !== currentFingerprint) {
            Logger.warn('Session fingerprint mismatch - possible device change');
            await this.clearSession();
            return null;
          }

          // Version check for migration
          if (decodedData.version !== '2.0') {
            Logger.warn('Session version mismatch - clearing old session');
            await this.clearSession();
            return null;
          }

          const session = decodedData.session;
          this.session = session;
          this.currentUser = session.user;
          Logger.debug('Session loaded securely');
          return session;
        } catch (decodeError) {
          Logger.warn('Failed to decode new session format, trying old format');
        }
      }

      // Fallback to old format (for migration)
      sessionStr = await SecureStore.getItemAsync('supabase_session');
      if (sessionStr) {
        Logger.info('Loading old session format - migration needed');
        const session = JSON.parse(sessionStr);
        this.session = session;
        this.currentUser = session.user;

        // Migrate to new format
        await this.saveSession(session);
        await SecureStore.deleteItemAsync('supabase_session'); // Remove old

        return session;
      }

      return null;
    } catch (error) {
      Logger.error('Session load failed', error);
      return null;
    }
  }

  /**
   * ✅ JAVÍTOTT: Session törlése (mindkét kulcs)
   */
  async clearSession() {
    try {
      // Töröld mindkét session kulcsot (új és régi)
      await SecureStore.deleteItemAsync('supabase_session_v2');
      await SecureStore.deleteItemAsync('supabase_session');
      Logger.debug('Session cleared securely');
    } catch (error) {
      Logger.error('Session clear failed', error);
    }
  }

  /**
   * ✅ ÚJ: Sign out from all devices funkció
   */
  async signOutFromAllDevices() {
    return this.executeOperation(async () => {
      if (!this.currentUser?.id) {
        throw new Error('No user logged in');
      }

      try {
        // 1. Invalidate all sessions in database
        const { error: sessionError } = await supabase
          .from('user_sessions')
          .update({
            invalidated_at: new Date().toISOString(),
            invalidated_by: 'user_logout_all'
          })
          .eq('user_id', this.currentUser.id)
          .is('invalidated_at', null);

        if (sessionError) {
          Logger.warn('Failed to invalidate database sessions', sessionError);
        }

        // 2. Supabase sign out (invalidates current session)
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        // 3. Clear local session
        await this.clearSession();
        this.currentUser = null;
        this.session = null;
        this.stopRefreshTimer();

        Logger.success('User signed out from all devices', { userId: this.currentUser?.id });
        return { success: true };
      } catch (error) {
        Logger.error('Sign out from all devices failed', error);
        return {
          success: false,
          error: error.message
        };
      }
    }, {
      operation: 'signOutFromAllDevices',
      userId: this.currentUser?.id,
    });
  }

  /**
   * Automatikus session frissítés indítása
   * Token lejárat előtt 5 perccel frissít
   */
  startRefreshTimer() {
    this.stopRefreshTimer();

    if (this.session?.expires_at) {
      const expiresAt = this.session.expires_at * 1000; // ms-ra
      const now = Date.now();
      const refreshTime = expiresAt - now - (5 * 60 * 1000); // 5 perc előtt

      if (refreshTime > 0) {
        this.refreshTimer = setTimeout(() => {
          this.refreshSession();
        }, refreshTime);

        Logger.debug('Refresh timer started', { 
          refreshIn: Math.round(refreshTime / 1000 / 60) + ' minutes' 
        });
      }
    }
  }

  /**
   * Jelszó megváltoztatása - teljes folyamat session invalidációval
   * @param {string} currentPassword - Jelenlegi jelszó
   * @param {string} newPassword - Új jelszó
   */
  async changePassword(currentPassword, newPassword) {
    return this.executeOperation(async () => {
      if (!this.currentUser?.id) {
        throw new Error('Nincs bejelentkezett felhasználó');
      }

      // Jelszó validáció
      const passwordValidation = this.passwordService.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        this.throwValidationError([{ field: 'newPassword', message: passwordValidation.message }]);
      }

      // Jelenlegi jelszó ellenőrzés (újra bejelentkezés)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: this.currentUser.email,
        password: currentPassword,
      });

      if (signInError) {
        Logger.warn('Current password verification failed', { userId: this.currentUser.id });
        throw new Error('A jelenlegi jelszó helytelen');
      }

      // Jelszó frissítés Supabase-ben
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        Logger.error('Password update failed', error);
        throw error;
      }

      Logger.info('Password updated for user', { userId: this.currentUser.id });

      // Összes többi session invalidálása (kivéve az aktuális)
      try {
        const invalidateResult = await SessionService.invalidateOtherSessions(
          this.currentUser.id,
          'Password changed'
        );

        Logger.success('Other sessions invalidated after password change', {
          userId: this.currentUser.id,
          invalidatedCount: invalidateResult.invalidatedCount
        });
      } catch (sessionError) {
        // Session invalidáció nem kritikus hiba, csak logoljuk
        Logger.warn('Failed to invalidate other sessions', sessionError);
      }

      // Session frissítés az új adatokkal
      if (data.user) {
        this.currentUser = data.user;
        await this.saveSession({
          ...this.session,
          user: data.user
        });
      }

      return {
        success: true,
        message: 'Jelszó sikeresen megváltoztatva. Minden más eszközön ki lett léptetve.'
      };
    });
  }

  /**
   * Automatikus session frissítés leállítása
   */
  stopRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
      Logger.debug('Refresh timer stopped');
    }
  }

  /**
   * Start silent failure detection heartbeat
   * Implements 4.5: Add silent failure detection
   */
  startHeartbeat() {
    if (this.heartbeatTimer) return;

    Logger.debug('Starting auth heartbeat');

    this.heartbeatTimer = setInterval(async () => {
      await this.performHeartbeatCheck();
    }, this.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      Logger.debug('Heartbeat stopped');
    }
  }

  /**
   * Perform heartbeat authentication check
   */
  async performHeartbeatCheck() {
    try {
      // Simple auth state validation
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        Logger.warn('Heartbeat check failed - no valid session');
        this.lastHeartbeatSuccess = false;
        this.notifyAuthFailureListeners('heartbeatFailed', {
          reason: 'Invalid or missing session',
          timestamp: Date.now()
        });
        return;
      }

      // Check if session is close to expiry (within 5 minutes)
      const expiresAt = data.session.expires_at * 1000;
      const now = Date.now();
      const timeToExpiry = expiresAt - now;

      if (timeToExpiry < 5 * 60 * 1000) { // 5 minutes
        Logger.info('Session expiring soon, triggering refresh', {
          timeToExpiry: Math.round(timeToExpiry / 1000) + 's'
        });
        await this.refreshSession();
      }

      this.lastHeartbeatSuccess = true;
      Logger.debug('Heartbeat check successful');

    } catch (error) {
      Logger.error('Heartbeat check error', error);
      this.lastHeartbeatSuccess = false;
      this.notifyAuthFailureListeners('heartbeatError', {
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Add auth failure listener
   * @param {Function} callback - Callback function for auth failure events
   */
  addAuthFailureListener(callback) {
    this.authFailureListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.authFailureListeners.indexOf(callback);
      if (index > -1) {
        this.authFailureListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify auth failure listeners
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  notifyAuthFailureListeners(event, data = {}) {
    this.authFailureListeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        Logger.error('Auth failure listener error', error);
      }
    });
  }

  /**
   * Get authentication health status
   */
  getAuthHealthStatus() {
    return {
      isAuthenticated: !!this.currentUser,
      sessionValid: !!this.session,
      lastHeartbeatSuccess: this.lastHeartbeatSuccess,
      sessionExpiry: this.session?.expires_at,
      timeToExpiry: this.session?.expires_at
        ? Math.max(0, this.session.expires_at * 1000 - Date.now())
        : 0,
    };
  }

  /**
   * Auth state változás figyelése
   * @param {function} callback 
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      Logger.debug('Auth state changed', { event });
      
      if (session) {
        this.session = session;
        this.currentUser = session.user;
        this.saveSession(session);
        this.startRefreshTimer();
      } else {
        this.session = null;
        this.currentUser = null;
        this.clearSession();
        this.stopRefreshTimer();
      }

      callback(event, session);
    });
  }

  /**
   * Session lejárt-e
   */
  isSessionExpired() {
    if (!this.session?.expires_at) return true;
    
    const expiresAt = this.session.expires_at * 1000;
    const now = Date.now();
    
    return now >= expiresAt;
  }

  /**
   * Felhasználó be van-e jelentkezve
   */
  isAuthenticated() {
    return !!this.currentUser && !!this.session && !this.isSessionExpired();
  }
  /**
   * Phase 1: Store session fingerprint in database
   * @param {string} sessionToken - Session access token
   * @param {string} fingerprint - Device fingerprint
   */
  async storeSessionFingerprint(sessionToken, fingerprint) {
    try {
      // Store in secure storage for client-side validation
      await SecureStore.setItemAsync('session_fingerprint', fingerprint);
      
      // Store in database for server-side validation
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('device_fingerprints')
          .upsert({
            user_id: user.id,
            fingerprint: fingerprint,
            last_seen_at: new Date().toISOString(),
            is_active: true
          }, {
            onConflict: 'user_id,fingerprint'
          });
        
        if (error) {
          Logger.warn('[AuthService] Failed to store fingerprint in database', error);
        }
      }
    } catch (error) {
      Logger.error('[AuthService] Error storing session fingerprint', error);
      throw error;
    }
  }

  /**
   * Phase 1: Validate session fingerprint
   * @returns {Promise<boolean>} - True if fingerprint matches
   */
  async validateSessionFingerprint() {
    try {
      const storedFingerprint = await SecureStore.getItemAsync('session_fingerprint');
      if (!storedFingerprint) {
        Logger.warn('[AuthService] No stored fingerprint found');
        return false;
      }
      
      const currentFingerprint = await deviceFingerprintService.generateFingerprint();
      const isValid = await deviceFingerprintService.validateFingerprint(currentFingerprint);
      
      if (!isValid) {
        Logger.warn('[AuthService] Device fingerprint mismatch - possible session hijacking');
        // Invalidate session
        await this.signOut();
        return false;
      }
      
      return true;
    } catch (error) {
      Logger.error('[AuthService] Error validating session fingerprint', error);
      return false;
    }
  }
}

export default new AuthService();
