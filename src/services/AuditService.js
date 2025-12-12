/**
 * Audit Service
 * Provides immutable audit logging for security and compliance
 * 
 * Property: Property 17 - Audit Log Immutability
 * Validates: Requirements 18 (Audit Logging)
 */

import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUDIT_CACHE_KEY = '@audit_cache';
const MAX_CACHE_SIZE = 100;

class AuditService {
  constructor() {
    this.cache = [];
    this.initialized = false;
  }

  /**
   * Initialize service
   */
  async initialize() {
    try {
      if (this.initialized) return;

      // Load cache from storage
      const stored = await AsyncStorage.getItem(AUDIT_CACHE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.cache = Array.isArray(parsed) ? parsed : [];
        } catch (parseError) {
          console.warn('[Audit] Invalid cache data, resetting to empty array');
          this.cache = [];
        }
      }

      this.initialized = true;
      console.log('[Audit] Service initialized');
    } catch (error) {
      console.error('[Audit] Error initializing:', error);
    }
  }

  /**
   * Log user action
   */
  async logAction(userId, action, details = {}) {
    try {
      await this.initialize();

      const entry = {
        user_id: userId,
        action,
        details: JSON.stringify(details),
        timestamp: new Date().toISOString(),
        ip_address: await this.getIPAddress(),
        user_agent: await this.getUserAgent(),
      };

      // Add to cache
      this.cache.push(entry);

      // Persist to database
      const { error } = await supabase
        .from('audit_logs')
        .insert([entry]);

      if (error) {
        console.error('[Audit] Error logging action:', error);
        // Keep in cache for retry
      } else {
        // Remove from cache on success
        if (Array.isArray(this.cache)) {
          this.cache = this.cache.filter(e => e !== entry);
        } else {
          console.warn('[Audit] Cache is not an array, resetting');
          this.cache = [];
        }
      }

      // Persist cache
      await this.persistCache();

      console.log(`[Audit] Action logged: ${action} by ${userId}`);
    } catch (error) {
      console.error('[Audit] Error logging action:', error);
    }
  }

  /**
   * Log data modification
   */
  async logDataModification(userId, table, changes = {}) {
    try {
      const details = {
        table,
        changes,
        operation: changes.operation || 'update',
      };

      await this.logAction(userId, 'data_modification', details);
    } catch (error) {
      console.error('[Audit] Error logging data modification:', error);
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(userId, event, details = {}) {
    try {
      const securityDetails = {
        event,
        severity: details.severity || 'medium',
        ...details,
      };

      await this.logAction(userId, 'security_event', securityDetails);

      // Alert on high severity
      if (details.severity === 'high' || details.severity === 'critical') {
        console.warn(`[Audit] HIGH SEVERITY SECURITY EVENT: ${event}`, details);
      }
    } catch (error) {
      console.error('[Audit] Error logging security event:', error);
    }
  }

  /**
   * Log authentication event
   */
  async logAuthEvent(userId, event, success = true, details = {}) {
    try {
      const authDetails = {
        event,
        success,
        ...details,
      };

      await this.logAction(userId, 'auth_event', authDetails);
    } catch (error) {
      console.error('[Audit] Error logging auth event:', error);
    }
  }

  /**
   * Log payment event
   */
  async logPaymentEvent(userId, event, amount, details = {}) {
    try {
      const paymentDetails = {
        event,
        amount,
        currency: details.currency || 'USD',
        ...details,
      };

      await this.logAction(userId, 'payment_event', paymentDetails);
    } catch (error) {
      console.error('[Audit] Error logging payment event:', error);
    }
  }

  /**
   * Get audit log for user
   */
  async getAuditLog(userId, startDate = null, endDate = null) {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (startDate) {
        query = query.gte('timestamp', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('timestamp', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Audit] Error fetching audit log:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[Audit] Error getting audit log:', error);
      return [];
    }
  }

  /**
   * Get security events
   */
  async getSecurityEvents(userId, severity = null) {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('action', 'security_event')
        .order('timestamp', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('[Audit] Error fetching security events:', error);
        return [];
      }

      let events = data || [];

      // Filter by severity if specified
      if (severity) {
        events = events.filter(e => {
          try {
            const details = JSON.parse(e.details);
            return details.severity === severity;
          } catch {
            return false;
          }
        });
      }

      return events;
    } catch (error) {
      console.error('[Audit] Error getting security events:', error);
      return [];
    }
  }

  /**
   * Get IP address
   */
  async getIPAddress() {
    try {
      // In production, get from server or network info
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get user agent
   */
  async getUserAgent() {
    try {
      const { Platform } = require('react-native');
      return `${Platform.OS} ${Platform.Version}`;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Persist cache to storage
   */
  async persistCache() {
    try {
      // Keep only last MAX_CACHE_SIZE entries
      if (this.cache.length > MAX_CACHE_SIZE) {
        this.cache = this.cache.slice(-MAX_CACHE_SIZE);
      }

      await AsyncStorage.setItem(AUDIT_CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.error('[Audit] Error persisting cache:', error);
    }
  }

  /**
   * Flush cache to database
   */
  async flushCache() {
    try {
      if (this.cache.length === 0) {
        return { flushed: 0 };
      }

      console.log(`[Audit] Flushing ${this.cache.length} cached entries`);

      const { error } = await supabase
        .from('audit_logs')
        .insert(this.cache);

      if (error) {
        console.error('[Audit] Error flushing cache:', error);
        return { flushed: 0, error: error.message };
      }

      const flushed = this.cache.length;
      this.cache = [];
      await this.persistCache();

      console.log(`[Audit] Flushed ${flushed} entries`);

      return { flushed };
    } catch (error) {
      console.error('[Audit] Error flushing cache:', error);
      return { flushed: 0, error: error.message };
    }
  }

  /**
   * Export audit log
   */
  async exportAuditLog(userId, format = 'json') {
    try {
      const logs = await this.getAuditLog(userId);

      if (format === 'json') {
        return JSON.stringify(logs, null, 2);
      }

      if (format === 'csv') {
        const headers = ['timestamp', 'action', 'details', 'ip_address', 'user_agent'];
        const rows = logs.map(log => [
          log.timestamp,
          log.action,
          log.details,
          log.ip_address,
          log.user_agent,
        ]);

        return [headers, ...rows]
          .map(row => row.join(','))
          .join('\n');
      }

      throw new Error(`Unsupported format: ${format}`);
    } catch (error) {
      console.error('[Audit] Error exporting audit log:', error);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(userId) {
    try {
      const logs = await this.getAuditLog(userId);

      const stats = {
        total: logs.length,
        byAction: {},
        byDate: {},
        securityEvents: 0,
        authEvents: 0,
        paymentEvents: 0,
      };

      logs.forEach(log => {
        // Count by action
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

        // Count by date
        const date = log.timestamp.split('T')[0];
        stats.byDate[date] = (stats.byDate[date] || 0) + 1;

        // Count specific events
        if (log.action === 'security_event') stats.securityEvents++;
        if (log.action === 'auth_event') stats.authEvents++;
        if (log.action === 'payment_event') stats.paymentEvents++;
      });

      return stats;
    } catch (error) {
      console.error('[Audit] Error getting statistics:', error);
      return null;
    }
  }
}

// Export singleton instance
export const auditService = new AuditService();
export default AuditService;
