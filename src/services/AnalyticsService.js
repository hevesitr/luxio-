/**
 * AnalyticsService - Esemény követés és analytics
 * Implements Requirements 12.1, 12.2, 12.5
 */
import Logger from './Logger';
import ErrorHandler from './ErrorHandler';
import { supabase } from './supabaseClient';

class AnalyticsService {
  constructor() {
    this.userId = null;
    this.sessionId = null;
    this.sessionStartTime = null;
    
    // PII mezők, amiket ki kell szűrni
    this.piiFields = [
      'email',
      'phone',
      'phone_number',
      'full_name',
      'first_name',
      'last_name',
      'address',
      'credit_card',
      'ssn',
      'password',
    ];

    // Esemény típusok
    this.eventTypes = {
      // User events
      USER_SIGNED_UP: 'user_signed_up',
      USER_SIGNED_IN: 'user_signed_in',
      USER_SIGNED_OUT: 'user_signed_out',
      PROFILE_UPDATED: 'profile_updated',
      PROFILE_PHOTO_UPLOADED: 'profile_photo_uploaded',

      // Discovery events
      PROFILE_VIEWED: 'profile_viewed',
      PROFILE_SWIPED_RIGHT: 'profile_swiped_right',
      PROFILE_SWIPED_LEFT: 'profile_swiped_left',
      SUPER_LIKE_SENT: 'super_like_sent',
      MATCH_CREATED: 'match_created',

      // Messaging events
      MESSAGE_SENT: 'message_sent',
      MESSAGE_RECEIVED: 'message_received',
      CONVERSATION_OPENED: 'conversation_opened',

      // Premium events
      SUBSCRIPTION_STARTED: 'subscription_started',
      SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
      BOOST_ACTIVATED: 'boost_activated',
      REWIND_USED: 'rewind_used',

      // Safety events
      USER_REPORTED: 'user_reported',
      USER_BLOCKED: 'user_blocked',
      USER_UNMATCHED: 'user_unmatched',

      // Screen events
      SCREEN_VIEWED: 'screen_viewed',
      
      // Error events
      ERROR_OCCURRED: 'error_occurred',
    };
  }

  /**
   * Session inicializálása
   */
  initSession(userId) {
    this.userId = userId;
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date();

    Logger.debug('Analytics session initialized', {
      userId,
      sessionId: this.sessionId,
    });

    this.trackEvent(this.eventTypes.USER_SIGNED_IN, {
      timestamp: this.sessionStartTime.toISOString(),
    });
  }

  /**
   * Session lezárása
   */
  endSession() {
    if (this.sessionStartTime) {
      const duration = Date.now() - this.sessionStartTime.getTime();
      
      this.trackEvent(this.eventTypes.USER_SIGNED_OUT, {
        session_duration: duration,
        session_duration_minutes: Math.round(duration / 60000),
      });
    }

    this.userId = null;
    this.sessionId = null;
    this.sessionStartTime = null;

    Logger.debug('Analytics session ended');
  }

  /**
   * Esemény követése
   * Implements Requirement 12.2
   */
  trackEvent(eventName, properties = {}) {
    try {
      // PII szűrése
      const sanitizedProperties = this.sanitizePII(properties);

      const event = {
        event_name: eventName,
        user_id: this.userId,
        session_id: this.sessionId,
        properties: sanitizedProperties,
        timestamp: new Date().toISOString(),
        platform: 'mobile',
      };

      // Esemény mentése adatbázisba
      this.saveEvent(event);

      Logger.debug('Event tracked', {
        event: eventName,
        properties: sanitizedProperties,
      });

      return { success: true };
    } catch (error) {
      Logger.error('Event tracking failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Screen tracking
   */
  trackScreen(screenName, properties = {}) {
    return this.trackEvent(this.eventTypes.SCREEN_VIEWED, {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * User properties beállítása
   */
  setUserProperties(userId, properties) {
    try {
      const sanitizedProperties = this.sanitizePII(properties);

      Logger.debug('User properties set', {
        userId,
        properties: sanitizedProperties,
      });

      // User properties mentése
      this.saveUserProperties(userId, sanitizedProperties);

      return { success: true };
    } catch (error) {
      Logger.error('Set user properties failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Hiba naplózása
   * Implements Requirement 12.1
   */
  logError(error, context = {}) {
    try {
      const sanitizedContext = this.sanitizePII(context);

      const errorLog = {
        error_message: error.message || String(error),
        error_stack: error.stack || null,
        error_code: error.code || null,
        user_id: this.userId,
        session_id: this.sessionId,
        context: sanitizedContext,
        timestamp: new Date().toISOString(),
        platform: 'mobile',
      };

      // Hiba mentése
      this.saveError(errorLog);

      // Esemény követése
      this.trackEvent(this.eventTypes.ERROR_OCCURRED, {
        error_message: error.message,
        error_code: error.code,
        ...sanitizedContext,
      });

      Logger.error('Error logged to analytics', errorLog);

      return { success: true };
    } catch (err) {
      Logger.error('Error logging failed', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Warning naplózása
   */
  logWarning(message, context = {}) {
    try {
      const sanitizedContext = this.sanitizePII(context);

      Logger.warn(message, sanitizedContext);

      this.trackEvent('warning_occurred', {
        warning_message: message,
        ...sanitizedContext,
      });

      return { success: true };
    } catch (error) {
      Logger.error('Warning logging failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Performance mérés
   */
  measurePerformance(metricName, duration, metadata = {}) {
    try {
      const sanitizedMetadata = this.sanitizePII(metadata);

      this.trackEvent('performance_metric', {
        metric_name: metricName,
        duration_ms: duration,
        ...sanitizedMetadata,
      });

      Logger.debug('Performance measured', {
        metric: metricName,
        duration: `${duration}ms`,
      });

      return { success: true };
    } catch (error) {
      Logger.error('Performance measurement failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * PII szűrése
   * Implements Requirement 12.5
   */
  sanitizePII(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      // PII mező ellenőrzése
      if (this.piiFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Email pattern ellenőrzése
      if (typeof value === 'string' && this.isEmail(value)) {
        sanitized[key] = '[REDACTED_EMAIL]';
        continue;
      }

      // Phone pattern ellenőrzése
      if (typeof value === 'string' && this.isPhoneNumber(value)) {
        sanitized[key] = '[REDACTED_PHONE]';
        continue;
      }

      // Rekurzív szűrés nested objektumokhoz
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizePII(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Email pattern ellenőrzése
   */
  isEmail(str) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(str);
  }

  /**
   * Telefonszám pattern ellenőrzése
   */
  isPhoneNumber(str) {
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(str);
  }

  /**
   * Esemény mentése adatbázisba
   */
  async saveEvent(event) {
    try {
      await supabase
        .from('analytics_events')
        .insert(event);
    } catch (error) {
      Logger.error('Save event failed', error);
    }
  }

  /**
   * Hiba mentése adatbázisba
   */
  async saveError(errorLog) {
    try {
      await supabase
        .from('error_logs')
        .insert(errorLog);
    } catch (error) {
      Logger.error('Save error log failed', error);
    }
  }

  /**
   * User properties mentése
   */
  async saveUserProperties(userId, properties) {
    try {
      await supabase
        .from('user_properties')
        .upsert({
          user_id: userId,
          properties: properties,
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      Logger.error('Save user properties failed', error);
    }
  }

  /**
   * Session ID generálása
   */
  generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Funnel tracking - konverziós tölcsér követése
   */
  trackFunnelStep(funnelName, stepName, properties = {}) {
    return this.trackEvent('funnel_step', {
      funnel_name: funnelName,
      step_name: stepName,
      ...properties,
    });
  }

  /**
   * A/B teszt tracking
   */
  trackExperiment(experimentName, variant, properties = {}) {
    return this.trackEvent('experiment_viewed', {
      experiment_name: experimentName,
      variant: variant,
      ...properties,
    });
  }

  /**
   * Revenue tracking
   */
  trackRevenue(amount, currency, productId, properties = {}) {
    return this.trackEvent('revenue', {
      amount: amount,
      currency: currency,
      product_id: productId,
      ...properties,
    });
  }

  /**
   * Engagement metrics
   */
  async getEngagementMetrics(userId, startDate, endDate) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);

      if (error) throw error;

      // Metrikák számítása
      const metrics = {
        total_events: data.length,
        unique_sessions: new Set(data.map(e => e.session_id)).size,
        swipes: data.filter(e => e.event_name.includes('swiped')).length,
        matches: data.filter(e => e.event_name === this.eventTypes.MATCH_CREATED).length,
        messages: data.filter(e => e.event_name === this.eventTypes.MESSAGE_SENT).length,
      };

      Logger.debug('Engagement metrics calculated', { userId, metrics });
      return metrics;
    }, { operation: 'getEngagementMetrics', userId });
  }
}

export default new AnalyticsService();
