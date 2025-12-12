/**
 * Idempotency Service
 * Manages idempotency keys to prevent duplicate operations
 * 
 * Property: Property 3 - Payment Idempotency
 * Validates: Requirements 4
 */

import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

const IDEMPOTENCY_CACHE_KEY = '@idempotency_cache';
const IDEMPOTENCY_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

class IdempotencyService {
  constructor() {
    this.cache = new Map(); // In-memory cache for performance
    this.initialized = false;
  }

  /**
   * Initialize service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      if (this.initialized) return;

      // Load cache from storage
      const stored = await AsyncStorage.getItem(IDEMPOTENCY_CACHE_KEY);
      if (stored) {
        const entries = JSON.parse(stored);
        entries.forEach(([key, value]) => {
          // Only load non-expired entries
          if (Date.now() - value.timestamp < IDEMPOTENCY_TIMEOUT) {
            this.cache.set(key, value);
          }
        });
      }

      this.initialized = true;
      console.log('[Idempotency] Service initialized');
    } catch (error) {
      console.error('[Idempotency] Error initializing service:', error);
    }
  }

  /**
   * Generate idempotency key
   * @returns {string} Unique idempotency key
   */
  generateKey() {
    return uuidv4();
  }

  /**
   * Check if operation with this key already exists
   * @param {string} key - Idempotency key
   * @returns {Promise<object|null>} Cached result or null
   */
  async checkKey(key) {
    try {
      // Check in-memory cache first
      if (this.cache.has(key)) {
        const cached = this.cache.get(key);
        
        // Check if expired
        if (Date.now() - cached.timestamp < IDEMPOTENCY_TIMEOUT) {
          console.log('[Idempotency] Key found in cache:', key.substring(0, 8) + '...');
          return cached.result;
        } else {
          // Remove expired entry
          this.cache.delete(key);
        }
      }

      // Check in database
      const { data, error } = await supabase
        .from('idempotency_keys')
        .select('result')
        .eq('key', key)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found, which is expected
        console.error('[Idempotency] Error checking key in database:', error);
      }

      if (data) {
        console.log('[Idempotency] Key found in database:', key.substring(0, 8) + '...');
        return data.result;
      }

      return null;
    } catch (error) {
      console.error('[Idempotency] Error checking key:', error);
      return null;
    }
  }

  /**
   * Store idempotency key with result
   * @param {string} key - Idempotency key
   * @param {object} result - Operation result
   * @returns {Promise<void>}
   */
  async storeKey(key, result) {
    try {
      const entry = {
        key,
        result,
        timestamp: Date.now(),
        expiresAt: new Date(Date.now() + IDEMPOTENCY_TIMEOUT).toISOString(),
      };

      // Store in memory cache
      this.cache.set(key, entry);

      // Store in database
      const { error } = await supabase
        .from('idempotency_keys')
        .insert([{
          key,
          result: JSON.stringify(result),
          created_at: new Date().toISOString(),
          expires_at: entry.expiresAt,
        }]);

      if (error) {
        console.error('[Idempotency] Error storing key in database:', error);
        // Continue anyway - in-memory cache is sufficient
      }

      // Persist cache to storage
      await this.persistCache();

      console.log('[Idempotency] Key stored:', key.substring(0, 8) + '...');
    } catch (error) {
      console.error('[Idempotency] Error storing key:', error);
    }
  }

  /**
   * Execute operation with idempotency
   * @param {string} key - Idempotency key
   * @param {Function} operation - Operation to execute
   * @returns {Promise<object>} Operation result
   */
  async executeWithIdempotency(key, operation) {
    try {
      // Check if already executed
      const cached = await this.checkKey(key);
      if (cached) {
        console.log('[Idempotency] Returning cached result for key:', key.substring(0, 8) + '...');
        return cached;
      }

      // Execute operation
      console.log('[Idempotency] Executing operation with key:', key.substring(0, 8) + '...');
      const result = await operation();

      // Store result
      await this.storeKey(key, result);

      return result;
    } catch (error) {
      console.error('[Idempotency] Error executing operation:', error);
      throw error;
    }
  }

  /**
   * Persist cache to storage
   * @private
   */
  async persistCache() {
    try {
      const entries = Array.from(this.cache.entries());
      await AsyncStorage.setItem(IDEMPOTENCY_CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('[Idempotency] Error persisting cache:', error);
    }
  }

  /**
   * Clear expired keys
   * @returns {Promise<void>}
   */
  async clearExpired() {
    try {
      const now = Date.now();
      let cleared = 0;

      // Clear from memory cache
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp >= IDEMPOTENCY_TIMEOUT) {
          this.cache.delete(key);
          cleared++;
        }
      }

      // Clear from database (only if table exists)
      try {
        const { error } = await supabase
          .from('idempotency_keys')
          .delete()
          .lt('expires_at', new Date().toISOString());

        if (error) {
          // Table might not exist yet (Phase 1 not deployed)
          if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
            console.log('[Idempotency] Idempotency keys table not found - Phase 1 deployment needed');
          } else {
            console.error('[Idempotency] Error clearing expired keys from database:', error);
          }
        }
      } catch (dbError) {
        // Handle database errors gracefully
        if (dbError.code === 'PGRST205' || dbError.message?.includes('Could not find the table')) {
          console.log('[Idempotency] Idempotency keys table not found - Phase 1 deployment needed');
        } else {
          console.error('[Idempotency] Database error clearing expired keys:', dbError);
        }
      }

      // Persist updated cache
      await this.persistCache();

      console.log('[Idempotency] Cleared', cleared, 'expired keys');
    } catch (error) {
      console.error('[Idempotency] Error clearing expired keys:', error);
    }
  }

  /**
   * Clear all keys
   * @returns {Promise<void>}
   */
  async clearAll() {
    try {
      this.cache.clear();
      await AsyncStorage.removeItem(IDEMPOTENCY_CACHE_KEY);

      const { error } = await supabase
        .from('idempotency_keys')
        .delete()
        .neq('key', ''); // Delete all

      if (error) {
        console.error('[Idempotency] Error clearing all keys from database:', error);
      }

      console.log('[Idempotency] All keys cleared');
    } catch (error) {
      console.error('[Idempotency] Error clearing all keys:', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      initialized: this.initialized,
      timeout: IDEMPOTENCY_TIMEOUT,
    };
  }

  /**
   * Export cache for debugging
   * @returns {object} Cache data
   */
  exportCache() {
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key: key.substring(0, 8) + '...',
      timestamp: new Date(value.timestamp).toISOString(),
      expiresAt: value.expiresAt,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}

// Export singleton instance
export const idempotencyService = new IdempotencyService();
export default IdempotencyService;
