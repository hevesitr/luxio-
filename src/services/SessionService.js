/**
 * SessionService - Session kezelés és invalidáció
 * Követelmény: 5.3 Session invalidation on password change
 */
import { supabase } from './supabaseClient';
import Logger from './Logger';
import ErrorHandler, { ErrorCodes } from './ErrorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SessionService {
  constructor() {
    this.STORAGE_KEYS = {
      CURRENT_SESSION_TOKEN: '@session_service_current_token',
      DEVICE_ID: '@session_service_device_id',
    };

    this.deviceId = null;
    this.currentSessionToken = null;
  }

  /**
   * Service inicializálása
   */
  async initialize() {
    try {
      // Device ID generálás/lekérése
      this.deviceId = await this.getOrCreateDeviceId();

      // Aktuális session token lekérése
      this.currentSessionToken = await AsyncStorage.getItem(this.STORAGE_KEYS.CURRENT_SESSION_TOKEN);

      Logger.info('SessionService initialized', {
        deviceId: this.deviceId,
        hasSessionToken: !!this.currentSessionToken
      });

    } catch (error) {
      Logger.error('SessionService initialization failed', error);
    }
  }

  /**
   * Device ID generálás vagy lekérése
   */
  async getOrCreateDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem(this.STORAGE_KEYS.DEVICE_ID);

      if (!deviceId) {
        // Új device ID generálás
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem(this.STORAGE_KEYS.DEVICE_ID, deviceId);
        Logger.info('New device ID generated', { deviceId });
      }

      return deviceId;
    } catch (error) {
      Logger.error('Failed to get/create device ID', error);
      // Fallback device ID
      return `fallback_${Date.now()}`;
    }
  }

  /**
   * Új session létrehozása bejelentkezéskor
   * @param {string} userId - Felhasználó ID
   */
  async createSession(userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      try {
        // Session létrehozása adatbázisban
        const { data, error } = await supabase.rpc('create_user_session', {
          p_user_id: userId,
          p_device_id: this.deviceId,
          p_device_name: this.getDeviceName(),
          p_ip_address: null, // Client-side nem elérhető
          p_user_agent: 'LoveX Mobile App',
        });

        if (error) {
          throw error;
        }

        const sessionId = data;
        Logger.info('Session created in database', { sessionId, userId });

        // Session token generálás és tárolás
        const sessionToken = `session_${sessionId}_${Date.now()}`;
        this.currentSessionToken = sessionToken;

        await AsyncStorage.setItem(this.STORAGE_KEYS.CURRENT_SESSION_TOKEN, sessionToken);

        return {
          success: true,
          sessionId,
          sessionToken,
        };

      } catch (error) {
        Logger.error('Failed to create session', error);
        throw ErrorHandler.createError(
          ErrorCodes.SERVICE_SESSION_ERROR,
          'Failed to create user session',
          { error: error.message }
        );
      }
    }, {
      operation: 'createSession',
      userId,
    });
  }

  /**
   * Session megszüntetése kijelentkezéskor
   */
  async destroySession() {
    try {
      if (this.currentSessionToken) {
        // Session inaktiválás adatbázisban (opcionális, mivel expires_at alapján is lejár)
        Logger.info('Session destroyed locally', { sessionToken: this.currentSessionToken });

        // Local storage törlés
        await AsyncStorage.removeItem(this.STORAGE_KEYS.CURRENT_SESSION_TOKEN);
        this.currentSessionToken = null;
      }
    } catch (error) {
      Logger.error('Failed to destroy session', error);
      // Nem kritikus hiba, csak logoljuk
    }
  }

  /**
   * Összes többi session invalidálása (jelszóváltoztatáskor)
   * @param {string} userId - Felhasználó ID
   * @param {string} reason - Invalidálás oka
   */
  async invalidateOtherSessions(userId, reason = 'Password changed') {
    return ErrorHandler.wrapServiceCall(async () => {
      try {
        // Adatbázis függvény hívás
        const { data, error } = await supabase.rpc('invalidate_user_sessions', {
          p_user_id: userId,
          p_current_session_token: this.currentSessionToken,
          p_reason: reason,
        });

        if (error) {
          throw error;
        }

        const invalidatedCount = data;
        Logger.success('Other sessions invalidated', {
          userId,
          invalidatedCount,
          currentSessionPreserved: !!this.currentSessionToken,
          reason,
        });

        return {
          success: true,
          invalidatedCount,
        };

      } catch (error) {
        Logger.error('Failed to invalidate other sessions', error);
        throw ErrorHandler.createError(
          ErrorCodes.SERVICE_SESSION_ERROR,
          'Failed to invalidate other sessions',
          { error: error.message }
        );
      }
    }, {
      operation: 'invalidateOtherSessions',
      userId,
      reason,
    });
  }

  /**
   * Session validáció
   * @param {string} sessionToken - Session token
   */
  async validateSession(sessionToken) {
    try {
      const { data, error } = await supabase.rpc('validate_user_session', {
        p_session_token: sessionToken,
      });

      if (error || !data || data.length === 0) {
        return { isValid: false };
      }

      const session = data[0];
      return {
        isValid: session.is_valid,
        sessionId: session.session_id,
        userId: session.user_id,
        expiresAt: session.expires_at,
      };

    } catch (error) {
      Logger.error('Session validation failed', error);
      return { isValid: false };
    }
  }

  /**
   * Aktív session-ek lekérése felhasználóhoz
   * @param {string} userId - Felhasználó ID
   */
  async getActiveSessions(userId) {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      Logger.error('Failed to get active sessions', error);
      return [];
    }
  }

  /**
   * Device name generálás
   */
  getDeviceName() {
    // Platform specifikus device name
    const platform = 'Mobile App'; // Expo esetében általános
    const timestamp = new Date().toLocaleDateString();
    return `${platform} - ${timestamp}`;
  }

  /**
   * Session cleanup (lejárt session-ek törlése)
   */
  async cleanupExpiredSessions() {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_sessions');

      if (error) {
        throw error;
      }

      const deletedCount = data;
      Logger.info('Expired sessions cleaned up', { deletedCount });

      return { success: true, deletedCount };
    } catch (error) {
      Logger.error('Failed to cleanup expired sessions', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Session aktivitás frissítés
   */
  async updateActivity() {
    if (!this.currentSessionToken) return;

    try {
      // Ez automatikusan történik a validate_user_session függvényben
      // amikor API hívások történnek
      Logger.debug('Session activity updated', { sessionToken: this.currentSessionToken });
    } catch (error) {
      Logger.error('Failed to update session activity', error);
    }
  }

  /**
   * Getter-ek
   */
  get currentSessionToken() {
    return this.currentSessionToken;
  }

  get deviceId() {
    return this.deviceId;
  }
}

// Singleton instance
const sessionService = new SessionService();
export default sessionService;
