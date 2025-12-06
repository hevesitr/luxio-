/**
 * RateLimitService - Rate limiting és brute force védelem
 * Követelmény: 4.3 - Brute force védelem, API throttling
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import Logger from './Logger';
import ErrorHandler from './ErrorHandler';

class RateLimitService {
  // Rate limit konstansok
  static LIMITS = {
    // Bejelentkezés
    LOGIN_ATTEMPTS: 5,
    LOGIN_WINDOW_MINUTES: 15,

    // Swipe műveletek
    SWIPE_ACTIONS: 100, // per óra
    SWIPE_WINDOW_MINUTES: 60,

    // Üzenetek küldése
    MESSAGES_SENT: 50, // per óra
    MESSAGES_WINDOW_MINUTES: 60,

    // Match kérések
    MATCH_REQUESTS: 200, // per nap
    MATCH_WINDOW_MINUTES: 1440,

    // API hívások
    API_CALLS: 1000, // per óra
    API_WINDOW_MINUTES: 60,
  };

  // Blokkolási idők (percek)
  static BLOCK_DURATIONS = {
    LOGIN_BLOCK: 30, // 30 perc brute force után
    API_BLOCK: 15,   // 15 perc API abuse után
    PERMANENT_BLOCK: 1440, // 24 óra súlyos abuse esetén
  };

  constructor() {
    this.localCache = new Map();
    this.blockedUsers = new Set();
    this.cleanupInterval = null;
  }

  async initialize() {
    Logger.info('Initializing RateLimitService...');

    // Lokális cache betöltése
    await this.loadLocalCache();

    // Blokkolási lista betöltése
    await this.loadBlockedUsers();

    // Automatikus takarítás indítása
    this.startCleanupInterval();

    Logger.success('RateLimitService initialized');
  }

  async cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Lokális cache mentése
    await this.saveLocalCache();
  }

  /**
   * Bejelentkezési kísérletek ellenőrzése
   */
  async checkLoginAttempts(identifier) {
    return this.executeOperation(async () => {
      const key = `login_attempts_${identifier}`;
      const attempts = await this.getAttempts(key, this.LIMITS.LOGIN_WINDOW_MINUTES);

      if (attempts >= this.LIMITS.LOGIN_ATTEMPTS) {
        // Blokkolás aktiválása
        await this.blockUser(identifier, 'login_brute_force', this.BLOCK_DURATIONS.LOGIN_BLOCK);

        Logger.warn('Login brute force detected', { identifier, attempts });
        return {
          allowed: false,
          reason: 'too_many_attempts',
          blockDuration: this.BLOCK_DURATIONS.LOGIN_BLOCK,
          remainingTime: await this.getBlockRemainingTime(identifier)
        };
      }

      return { allowed: true, attempts: attempts + 1 };
    }, 'checkLoginAttempts', { identifier });
  }

  /**
   * Sikertelen bejelentkezés regisztrálása
   */
  async recordFailedLogin(identifier) {
    const key = `login_attempts_${identifier}`;
    await this.incrementAttempts(key);
    Logger.debug('Failed login recorded', { identifier });
  }

  /**
   * Sikeres bejelentkezés - számláló visszaállítása
   */
  async recordSuccessfulLogin(identifier) {
    const key = `login_attempts_${identifier}`;
    await this.resetAttempts(key);
    Logger.debug('Successful login recorded', { identifier });
  }

  /**
   * Swipe műveletek ellenőrzése
   */
  async checkSwipeAction(userId) {
    return this.executeOperation(async () => {
      const key = `swipe_actions_${userId}`;
      const attempts = await this.getAttempts(key, this.LIMITS.SWIPE_WINDOW_MINUTES);

      if (attempts >= this.LIMITS.SWIPE_ACTIONS) {
        Logger.warn('Swipe rate limit exceeded', { userId, attempts });
        return {
          allowed: false,
          reason: 'rate_limit_exceeded',
          limit: this.LIMITS.SWIPE_ACTIONS,
          window: this.LIMITS.SWIPE_WINDOW_MINUTES,
          resetIn: await this.getResetTime(key, this.LIMITS.SWIPE_WINDOW_MINUTES)
        };
      }

      await this.incrementAttempts(key);
      return { allowed: true, remaining: this.LIMITS.SWIPE_ACTIONS - attempts - 1 };
    }, 'checkSwipeAction', { userId });
  }

  /**
   * Üzenetküldés ellenőrzése
   */
  async checkMessageSend(userId) {
    return this.executeOperation(async () => {
      const key = `messages_sent_${userId}`;
      const attempts = await this.getAttempts(key, this.LIMITS.MESSAGES_WINDOW_MINUTES);

      if (attempts >= this.LIMITS.MESSAGES_SENT) {
        Logger.warn('Message rate limit exceeded', { userId, attempts });
        return {
          allowed: false,
          reason: 'rate_limit_exceeded',
          limit: this.LIMITS.MESSAGES_SENT,
          window: this.LIMITS.MESSAGES_WINDOW_MINUTES,
          resetIn: await this.getResetTime(key, this.LIMITS.MESSAGES_WINDOW_MINUTES)
        };
      }

      await this.incrementAttempts(key);
      return { allowed: true, remaining: this.LIMITS.MESSAGES_SENT - attempts - 1 };
    }, 'checkMessageSend', { userId });
  }

  /**
   * Match kérések ellenőrzése
   */
  async checkMatchRequest(userId) {
    return this.executeOperation(async () => {
      const key = `match_requests_${userId}`;
      const attempts = await this.getAttempts(key, this.LIMITS.MATCH_WINDOW_MINUTES);

      if (attempts >= this.LIMITS.MATCH_REQUESTS) {
        Logger.warn('Match request rate limit exceeded', { userId, attempts });
        return {
          allowed: false,
          reason: 'rate_limit_exceeded',
          limit: this.LIMITS.MATCH_REQUESTS,
          window: this.LIMITS.MATCH_WINDOW_MINUTES,
          resetIn: await this.getResetTime(key, this.LIMITS.MATCH_WINDOW_MINUTES)
        };
      }

      await this.incrementAttempts(key);
      return { allowed: true, remaining: this.LIMITS.MATCH_REQUESTS - attempts - 1 };
    }, 'checkMatchRequest', { userId });
  }

  /**
   * Általános API hívások ellenőrzése
   */
  async checkApiCall(userId, endpoint) {
    return this.executeOperation(async () => {
      const key = `api_calls_${userId}_${endpoint}`;
      const attempts = await this.getAttempts(key, this.LIMITS.API_WINDOW_MINUTES);

      if (attempts >= this.LIMITS.API_CALLS) {
        // API abuse esetén blokkolás
        await this.blockUser(userId, 'api_abuse', this.BLOCK_DURATIONS.API_BLOCK);

        Logger.warn('API rate limit exceeded', { userId, endpoint, attempts });
        return {
          allowed: false,
          reason: 'api_abuse',
          blockDuration: this.BLOCK_DURATIONS.API_BLOCK,
          resetIn: await this.getResetTime(key, this.LIMITS.API_WINDOW_MINUTES)
        };
      }

      await this.incrementAttempts(key);
      return { allowed: true, remaining: this.LIMITS.API_CALLS - attempts - 1 };
    }, 'checkApiCall', { userId, endpoint });
  }

  /**
   * Felhasználó blokkolása
   */
  async blockUser(identifier, reason, durationMinutes) {
    const blockUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

    try {
      // Supabase mentés
      const { error } = await supabase
        .from('user_blocks')
        .upsert({
          identifier,
          reason,
          blocked_until: blockUntil.toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) {
        Logger.error('Failed to save block to Supabase', error);
      }

      // Lokális cache frissítés
      this.blockedUsers.add(identifier);

      // AsyncStorage mentés backup-ként
      const blockData = {
        identifier,
        reason,
        blocked_until: blockUntil.toISOString()
      };
      await AsyncStorage.setItem(`block_${identifier}`, JSON.stringify(blockData));

      Logger.info('User blocked', { identifier, reason, durationMinutes });

    } catch (error) {
      Logger.error('Exception in blockUser', error);
    }
  }

  /**
   * Blokkolás ellenőrzése
   */
  async isUserBlocked(identifier) {
    try {
      // Először lokális cache ellenőrzés
      if (this.blockedUsers.has(identifier)) {
        const remaining = await this.getBlockRemainingTime(identifier);
        if (remaining > 0) {
          return { blocked: true, remainingTime: remaining };
        } else {
          // Blokkolás lejárt, eltávolítás
          this.blockedUsers.delete(identifier);
          await AsyncStorage.removeItem(`block_${identifier}`);
        }
      }

      // Supabase ellenőrzés
      const { data, error } = await supabase
        .from('user_blocks')
        .select('*')
        .eq('identifier', identifier)
        .gt('blocked_until', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        Logger.error('Failed to check block status', error);
        return { blocked: false };
      }

      if (data) {
        const remaining = Math.max(0, new Date(data.blocked_until) - new Date());
        this.blockedUsers.add(identifier);
        return { blocked: true, remainingTime: Math.ceil(remaining / (1000 * 60)) };
      }

      return { blocked: false };

    } catch (error) {
      Logger.error('Exception in isUserBlocked', error);
      return { blocked: false };
    }
  }

  /**
   * Blokkolás hátralévő ideje
   */
  async getBlockRemainingTime(identifier) {
    try {
      const blockData = await AsyncStorage.getItem(`block_${identifier}`);
      if (!blockData) return 0;

      const { blocked_until } = JSON.parse(blockData);
      const remaining = Math.max(0, new Date(blocked_until) - new Date());
      return Math.ceil(remaining / (1000 * 60)); // percekben
    } catch (error) {
      Logger.error('Failed to get block remaining time', error);
      return 0;
    }
  }

  /**
   * Kísérletek számának lekérése időablakon belül
   */
  async getAttempts(key, windowMinutes) {
    try {
      const data = this.localCache.get(key);
      if (!data) return 0;

      // Lejárt kísérletek eltávolítása
      const cutoffTime = Date.now() - (windowMinutes * 60 * 1000);
      const validAttempts = data.filter(timestamp => timestamp > cutoffTime);

      if (validAttempts.length !== data.length) {
        this.localCache.set(key, validAttempts);
      }

      return validAttempts.length;
    } catch (error) {
      Logger.error('Failed to get attempts', error);
      return 0;
    }
  }

  /**
   * Kísérletek számlálójának növelése
   */
  async incrementAttempts(key) {
    const data = this.localCache.get(key) || [];
    data.push(Date.now());
    this.localCache.set(key, data);
  }

  /**
   * Kísérletek számlálójának visszaállítása
   */
  async resetAttempts(key) {
    this.localCache.delete(key);
  }

  /**
   * Reset idő lekérése
   */
  async getResetTime(key, windowMinutes) {
    const data = this.localCache.get(key);
    if (!data || data.length === 0) return 0;

    const oldestAttempt = Math.min(...data);
    const resetTime = oldestAttempt + (windowMinutes * 60 * 1000) - Date.now();
    return Math.max(0, Math.ceil(resetTime / (1000 * 60))); // percekben
  }

  /**
   * Lokális cache betöltése AsyncStorage-ból
   */
  async loadLocalCache() {
    try {
      const cacheData = await AsyncStorage.getItem('rate_limit_cache');
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        // Timestamp-ek visszaalakítása
        for (const [key, timestamps] of Object.entries(parsed)) {
          this.localCache.set(key, timestamps);
        }
        Logger.debug('Rate limit cache loaded', { entries: this.localCache.size });
      }
    } catch (error) {
      Logger.error('Failed to load rate limit cache', error);
    }
  }

  /**
   * Lokális cache mentése AsyncStorage-ba
   */
  async saveLocalCache() {
    try {
      const cacheData = {};
      for (const [key, timestamps] of this.localCache.entries()) {
        cacheData[key] = timestamps;
      }
      await AsyncStorage.setItem('rate_limit_cache', JSON.stringify(cacheData));
    } catch (error) {
      Logger.error('Failed to save rate limit cache', error);
    }
  }

  /**
   * Blokkolási lista betöltése
   */
  async loadBlockedUsers() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const blockKeys = keys.filter(key => key.startsWith('block_'));

      for (const key of blockKeys) {
        const blockData = await AsyncStorage.getItem(key);
        if (blockData) {
          const { identifier, blocked_until } = JSON.parse(blockData);
          if (new Date(blocked_until) > new Date()) {
            this.blockedUsers.add(identifier);
          } else {
            // Lejárt blokkolás törlése
            await AsyncStorage.removeItem(key);
          }
        }
      }

      Logger.debug('Blocked users loaded', { count: this.blockedUsers.size });
    } catch (error) {
      Logger.error('Failed to load blocked users', error);
    }
  }

  /**
   * Automatikus takarítás indítása
   */
  startCleanupInterval() {
    // Minden 5 percben takarít
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  /**
   * Lejárt bejegyzések takarítása
   */
  async cleanupExpiredEntries() {
    try {
      const now = Date.now();
      let cleanedCount = 0;

      // Rate limit cache takarítása
      for (const [key, timestamps] of this.localCache.entries()) {
        const windowMatch = key.match(/(\w+)_window_(\d+)/);
        let windowMinutes = 60; // alapértelmezett

        if (windowMatch) {
          windowMinutes = parseInt(windowMatch[2]);
        }

        const cutoffTime = now - (windowMinutes * 60 * 1000);
        const originalLength = timestamps.length;
        const validTimestamps = timestamps.filter(timestamp => timestamp > cutoffTime);

        if (validTimestamps.length !== originalLength) {
          if (validTimestamps.length === 0) {
            this.localCache.delete(key);
          } else {
            this.localCache.set(key, validTimestamps);
          }
          cleanedCount++;
        }
      }

      // Blokkolási lista takarítása
      const expiredBlocks = [];
      for (const identifier of this.blockedUsers) {
        const remaining = await this.getBlockRemainingTime(identifier);
        if (remaining <= 0) {
          expiredBlocks.push(identifier);
        }
      }

      for (const identifier of expiredBlocks) {
        this.blockedUsers.delete(identifier);
        await AsyncStorage.removeItem(`block_${identifier}`);
        cleanedCount++;
      }

      if (cleanedCount > 0) {
        Logger.debug('Cleaned expired rate limit entries', { cleanedCount });
      }

    } catch (error) {
      Logger.error('Failed to cleanup expired entries', error);
    }
  }

  /**
   * Admin funkció: összes blokkolás feloldása
   */
  async unblockUser(identifier) {
    return this.executeOperation(async () => {
      // Supabase törlés
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('identifier', identifier);

      if (error) {
        Logger.error('Failed to unblock user in Supabase', error);
      }

      // Lokális törlés
      this.blockedUsers.delete(identifier);
      await AsyncStorage.removeItem(`block_${identifier}`);

      Logger.info('User unblocked', { identifier });
      return { success: true };
    }, 'unblockUser', { identifier });
  }

  /**
   * Wrapper for error handling
   */
  async executeOperation(operation, operationName, context = {}) {
    return ErrorHandler.wrapServiceCall(operation, {
      operation: operationName,
      service: 'RateLimitService',
      ...context
    });
  }
}

export default RateLimitService;
