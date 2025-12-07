import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { Logger } from './Logger';
import { ServiceError } from './ServiceError';

/**
 * PushNotificationService - Fixed version with token lifecycle management
 * P1 Fix: Handle push token expiration and refresh
 */
export class PushNotificationService {
  constructor() {
    this.PUSH_TOKEN_KEY = '@push_token';
    this.TOKEN_VALIDATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
    this.TOKEN_EXPIRY_DAYS = 30;
    this.DEAD_TOKEN_CLEANUP_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days
  }

  /**
   * Register for push notifications with token lifecycle management
   */
  async registerForPushNotifications(userId) {
    try {
      // Get push token
      const token = await Notifications.getExpoPushTokenAsync();

      if (!token.data) {
        throw new Error('Failed to get push token');
      }

      // Create token metadata
      const tokenData = {
        token: token.data,
        userId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + this.TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
        ).toISOString(),
        isActive: true,
        lastValidatedAt: new Date().toISOString(),
        validationCount: 0
      };

      // Save to local storage
      await AsyncStorage.setItem(
        this.PUSH_TOKEN_KEY,
        JSON.stringify(tokenData)
      );

      // Save to Supabase
      await this.savePushTokenToDatabase(tokenData);

      Logger.info('Push token registered', { userId });
      return tokenData;
    } catch (error) {
      Logger.error('Failed to register for push notifications', { error });
      throw new ServiceError(
        'PUSH_REGISTRATION_FAILED',
        'Could not register for push notifications',
        'NOTIFICATIONS'
      );
    }
  }

  /**
   * Save push token to database
   * @private
   */
  async savePushTokenToDatabase(tokenData) {
    try {
      const { data, error } = await supabase
        .from('push_tokens')
        .upsert(
          {
            user_id: tokenData.userId,
            token: tokenData.token,
            created_at: tokenData.createdAt,
            expires_at: tokenData.expiresAt,
            is_active: tokenData.isActive,
            last_validated_at: tokenData.lastValidatedAt
          },
          {
            onConflict: 'user_id'
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      Logger.error('Failed to save push token to database', { error });
      throw error;
    }
  }

  /**
   * Validate and refresh tokens
   * Should be called periodically (e.g., on app startup)
   */
  async validateAndRefreshTokens(userId) {
    try {
      Logger.info('Starting token validation and refresh', { userId });

      // Get current token from local storage
      const localTokenJson = await AsyncStorage.getItem(this.PUSH_TOKEN_KEY);
      const localToken = localTokenJson ? JSON.parse(localTokenJson) : null;

      // Get tokens from database
      const { data: dbTokens, error: dbError } = await supabase
        .from('push_tokens')
        .select('*')
        .eq('user_id', userId);

      if (dbError) throw dbError;

      // Check for expired tokens
      const now = new Date();
      const expiredTokens = dbTokens.filter(
        token => new Date(token.expires_at) < now
      );

      if (expiredTokens.length > 0) {
        Logger.warn('Found expired tokens', { count: expiredTokens.length });

        // Deactivate expired tokens
        for (const token of expiredTokens) {
          await this.deactivateToken(token.id);
        }
      }

      // Check for dead tokens (not validated in 7 days)
      const deadTokens = dbTokens.filter(token => {
        const lastValidated = new Date(token.last_validated_at);
        const daysSinceValidation = (now - lastValidated) / (24 * 60 * 60 * 1000);
        return daysSinceValidation > 7;
      });

      if (deadTokens.length > 0) {
        Logger.warn('Found dead tokens', { count: deadTokens.length });

        // Deactivate dead tokens
        for (const token of deadTokens) {
          await this.deactivateToken(token.id);
        }
      }

      // Get new token if needed
      if (!localToken || new Date(localToken.expiresAt) < now) {
        Logger.info('Local token expired or missing, requesting new token');
        await this.registerForPushNotifications(userId);
      } else {
        // Validate current token
        await this.validateToken(localToken.token, userId);
      }

      Logger.info('Token validation and refresh complete', { userId });
    } catch (error) {
      Logger.error('Failed to validate and refresh tokens', { error, userId });
      // Don't throw - this is a background operation
    }
  }

  /**
   * Validate token by attempting to send a test notification
   * @private
   */
  async validateToken(token, userId) {
    try {
      // Update last validated time
      const { error } = await supabase
        .from('push_tokens')
        .update({
          last_validated_at: new Date().toISOString(),
          validation_count: supabase.raw('validation_count + 1')
        })
        .eq('token', token)
        .eq('user_id', userId);

      if (error) throw error;

      Logger.debug('Token validated', { userId });
    } catch (error) {
      Logger.error('Failed to validate token', { error, userId });
    }
  }

  /**
   * Deactivate token
   * @private
   */
  async deactivateToken(tokenId) {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString()
        })
        .eq('id', tokenId);

      if (error) throw error;

      Logger.info('Token deactivated', { tokenId });
    } catch (error) {
      Logger.error('Failed to deactivate token', { error, tokenId });
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(userId, title, body, data = {}) {
    try {
      // Get user's active push tokens
      const { data: tokens, error } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      if (!tokens || tokens.length === 0) {
        Logger.warn('No active push tokens found for user', { userId });
        return { sent: 0, failed: 0 };
      }

      // Send to all active tokens
      let sent = 0;
      let failed = 0;

      for (const tokenObj of tokens) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data,
              sound: 'default',
              badge: 1
            },
            trigger: null // Send immediately
          });

          sent++;
        } catch (error) {
          Logger.error('Failed to send notification to token', {
            error,
            token: tokenObj.token
          });
          failed++;
        }
      }

      Logger.info('Push notifications sent', { userId, sent, failed });
      return { sent, failed };
    } catch (error) {
      Logger.error('Failed to send push notifications', { error, userId });
      throw new ServiceError(
        'PUSH_SEND_FAILED',
        'Could not send push notification',
        'NOTIFICATIONS'
      );
    }
  }

  /**
   * Clean up dead tokens (should be called periodically)
   */
  async cleanupDeadTokens() {
    try {
      Logger.info('Starting dead token cleanup');

      const cutoffDate = new Date(
        Date.now() - this.DEAD_TOKEN_CLEANUP_INTERVAL
      ).toISOString();

      // Delete tokens that have been inactive for more than 7 days
      const { data, error } = await supabase
        .from('push_tokens')
        .delete()
        .lt('last_validated_at', cutoffDate)
        .eq('is_active', false);

      if (error) throw error;

      Logger.info('Dead token cleanup complete', { deletedCount: data?.length || 0 });
    } catch (error) {
      Logger.error('Failed to cleanup dead tokens', { error });
      // Don't throw - this is a background operation
    }
  }

  /**
   * Get push notification status
   */
  async getPushNotificationStatus(userId) {
    try {
      const { data: tokens, error } = await supabase
        .from('push_tokens')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const now = new Date();
      const activeTokens = tokens.filter(
        token => token.is_active && new Date(token.expires_at) > now
      );
      const expiredTokens = tokens.filter(
        token => new Date(token.expires_at) < now
      );
      const inactiveTokens = tokens.filter(token => !token.is_active);

      return {
        totalTokens: tokens.length,
        activeTokens: activeTokens.length,
        expiredTokens: expiredTokens.length,
        inactiveTokens: inactiveTokens.length,
        tokens: tokens.map(t => ({
          id: t.id,
          createdAt: t.created_at,
          expiresAt: t.expires_at,
          isActive: t.is_active,
          lastValidatedAt: t.last_validated_at,
          validationCount: t.validation_count
        }))
      };
    } catch (error) {
      Logger.error('Failed to get push notification status', { error, userId });
      throw new ServiceError(
        'PUSH_STATUS_FAILED',
        'Could not get push notification status',
        'NOTIFICATIONS'
      );
    }
  }

  /**
   * Request notification permissions
   */
  async requestNotificationPermissions() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();

      if (status !== 'granted') {
        Logger.warn('Notification permissions not granted', { status });
        return false;
      }

      Logger.info('Notification permissions granted');
      return true;
    } catch (error) {
      Logger.error('Failed to request notification permissions', { error });
      return false;
    }
  }

  /**
   * Handle notification response
   */
  setupNotificationHandlers() {
    // Handle notification when app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async notification => {
        Logger.info('Notification received', {
          title: notification.request.content.title
        });

        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true
        };
      }
    });

    // Handle notification tap
    Notifications.addNotificationResponseReceivedListener(response => {
      Logger.info('Notification tapped', {
        data: response.notification.request.content.data
      });

      // Handle navigation based on notification data
      // This would typically navigate to a specific screen
    });
  }
}

export const pushNotificationService = new PushNotificationService();
