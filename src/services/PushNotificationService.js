/**
 * PushNotificationService - Push értesítések kezelése
 * Követelmény: 4.2 - Push értesítések
 */
import BaseService from './BaseService';
import { supabase } from './supabaseClient';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logger from './Logger';

class PushNotificationService extends BaseService {
  constructor() {
    super('PushNotificationService');
    this.expoPushToken = null;
  }

  async initialize() {
    await super.initialize();

    // Értesítési handler-ek beállítása
    this.setupNotificationHandlers();

    // Push token regisztrálása
    await this.registerForPushNotifications();

    this.log.success('PushNotificationService initialized');
  }

  /**
   * Expo push értesítések regisztrálása
   */
  async registerForPushNotifications() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        this.log.warn('Push notification permission denied');
        return;
      }

      // Expo push token lekérése - biztonságos hívás
      try {
        const token = await Notifications.getExpoPushTokenAsync();
        this.expoPushToken = token.data;
      } catch (tokenError) {
        this.log.error('PushNotificationService: Failed to get push token', {
          message: tokenError?.message || 'Token retrieval failed',
          context: { existingStatus, finalStatus }
        });
        // Ne állítsuk le a folyamatot, csak logoljuk a hibát
        return;
      }

      // Token mentése lokálisan és Supabase-be
      await this.savePushToken(this.expoPushToken);

      this.log.success('Push notifications registered', { token: this.expoPushToken });

    } catch (error) {
      this.log.error('Failed to register push notifications', error);
    }
  }

  /**
   * Push token mentése Supabase-be
   */
  async savePushToken(token) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Token mentése lokális cache-be
      await AsyncStorage.setItem('push_token', token);

      // Supabase mentés (feltételezve, hogy van push_tokens tábla)
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token: token,
          device_type: 'expo',
          is_active: true,
          updated_at: new Date().toISOString()
        });

      if (error) {
        this.log.error('Failed to save push token to Supabase', error);
      } else {
        this.log.debug('Push token saved to Supabase');
      }

    } catch (error) {
      this.log.error('Exception in savePushToken', error);
    }
  }

  /**
   * Értesítési handler-ek beállítása
   */
  setupNotificationHandlers() {
    // Értesítés megérkezésekor
    Notifications.addNotificationReceivedListener(notification => {
      this.log.debug('Notification received', {
        title: notification.request.content.title,
        body: notification.request.content.body
      });

      // Értesítés feldolgozása (pl. badge szám frissítés)
      this.handleNotificationReceived(notification);
    });

    // Értesítésre való érintéskor
    Notifications.addNotificationResponseReceivedListener(response => {
      this.log.debug('Notification response received', {
        action: response.actionIdentifier,
        notification: response.notification.request.content.title
      });

      this.handleNotificationResponse(response);
    });

    this.log.info('Notification handlers set up');
  }

  /**
   * Match értesítés küldése
   */
  async sendMatchNotification(matchData) {
    return this.executeOperation(async () => {
      const { matchedUserId, currentUserId, matchId } = matchData;

      // Fogadó felhasználó token-je
      const token = await this.getUserPushToken(matchedUserId);
      if (!token) {
        this.log.warn('No push token found for user', { userId: matchedUserId });
        return { success: false, reason: 'no_token' };
      }

      // Értesítés küldése Expo-n keresztül
      const message = {
        to: token,
        sound: 'default',
        title: '🎉 Új match!',
        body: `${matchData.currentUserName} match-elt veled!`,
        data: {
          type: 'match',
          matchId: matchId,
          userId: currentUserId
        },
        priority: 'high'
      };

      const result = await this.sendExpoNotification(message);

      if (result.success) {
        // Értesítés log-olása Supabase-be
        await this.logNotification({
          type: 'match',
          recipient_id: matchedUserId,
          sender_id: currentUserId,
          message: message.body,
          sent_at: new Date().toISOString()
        });
      }

      return result;

    }, 'sendMatchNotification', { matchId: matchData.matchId });
  }

  /**
   * Üzenet értesítés küldése
   */
  async sendMessageNotification(messageData) {
    return this.executeOperation(async () => {
      const { conversationId, senderId, receiverId, content, type } = messageData;

      // Fogadó felhasználó token-je
      const token = await this.getUserPushToken(receiverId);
      if (!token) {
        this.log.debug('No push token for message notification', { receiverId });
        return { success: false, reason: 'no_token' };
      }

      // Értesítés tartalma típus alapján
      let title, body;
      switch (type) {
        case 'voice':
          title = '🎙️ Hangüzenet';
          body = 'Új hangüzenetet kaptál';
          break;
        case 'video':
          title = '🎥 Videóüzenet';
          body = 'Új videóüzenetet kaptál';
          break;
        case 'image':
          title = '📷 Képüzenet';
          body = 'Új képüzenetet kaptál';
          break;
        default:
          title = '💬 Új üzenet';
          body = content.length > 50 ? content.substring(0, 47) + '...' : content;
      }

      const message = {
        to: token,
        sound: 'default',
        title,
        body,
        data: {
          type: 'message',
          conversationId,
          senderId,
          messageType: type
        },
        priority: 'default'
      };

      const result = await this.sendExpoNotification(message);

      if (result.success) {
        await this.logNotification({
          type: 'message',
          recipient_id: receiverId,
          sender_id: senderId,
          conversation_id: conversationId,
          message: body,
          sent_at: new Date().toISOString()
        });
      }

      return result;

    }, 'sendMessageNotification', { conversationId, receiverId });
  }

  /**
   * Expo push értesítés küldése
   */
  async sendExpoNotification(message) {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorData = await response.text();
        this.log.error('Expo push notification failed', {
          status: response.status,
          error: errorData
        });
        return { success: false, error: errorData };
      }

      const data = await response.json();

      // Expo válasz feldolgozása
      if (data.data && data.data.status === 'error') {
        this.log.error('Expo push notification error', { error: data.data.message });
        return { success: false, error: data.data.message };
      }

      this.log.success('Expo push notification sent', { ticket: data.data?.id });
      return { success: true, ticket: data.data };

    } catch (error) {
      this.log.error('Exception in sendExpoNotification', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Felhasználó push token-je Supabase-ből
   */
  async getUserPushToken(userId) {
    try {
      const { data, error } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return data.token;

    } catch (error) {
      this.log.error('Failed to get user push token', error);
      return null;
    }
  }

  /**
   * Értesítés log-olása
   */
  async logNotification(notificationData) {
    try {
      await supabase
        .from('notification_logs')
        .insert(notificationData);

    } catch (error) {
      this.log.error('Failed to log notification', error);
    }
  }

  /**
   * Értesítés megérkezése kezelése
   */
  handleNotificationReceived(notification) {
    // Badge szám növelése
    Notifications.setBadgeCountAsync(1);

    // Egyéb app-specifikus logika
    const data = notification.request.content.data;
    if (data?.type === 'match') {
      // Match értesítés - gamification pontok, stb.
      this.log.info('Match notification received', { matchId: data.matchId });
    }
  }

  /**
   * Értesítésre való érintés kezelése
   */
  handleNotificationResponse(response) {
    const data = response.notification.request.content.data;

    // App navigáció kezelése az értesítés típusa alapján
    if (data?.type === 'match') {
      // Navigálás a match-hez
      // this.navigateToMatch(data.matchId);
    } else if (data?.type === 'message') {
      // Navigálás a beszélgetéshez
      // this.navigateToConversation(data.conversationId);
    }

    // Badge szám visszaállítása
    Notifications.setBadgeCountAsync(0);
  }

  /**
   * Push token törlése (logout esetén)
   */
  async removePushToken() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Supabase-ből törlés
      await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Lokális törlés
      await AsyncStorage.removeItem('push_token');

      this.log.info('Push token removed');

    } catch (error) {
      this.log.error('Failed to remove push token', error);
    }
  }

  /**
   * Értesítési beállítások kezelése
   */
  async updateNotificationSettings(settings) {
    return this.executeOperation(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          matches_enabled: settings.matches ?? true,
          messages_enabled: settings.messages ?? true,
          marketing_enabled: settings.marketing ?? false,
          updated_at: new Date().toISOString()
        });

      if (error) {
        this.log.error('Failed to update notification settings', error);
        return { success: false, error };
      }

      this.log.success('Notification settings updated');
      return { success: true };

    }, 'updateNotificationSettings');
  }

  /**
   * Értesítési beállítások lekérése
   */
  async getNotificationSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        this.log.error('Failed to get notification settings', error);
        return null;
      }

      return data || {
        matches_enabled: true,
        messages_enabled: true,
        marketing_enabled: false
      };

    } catch (error) {
      this.log.error('Exception in getNotificationSettings', error);
      return null;
    }
  }
}

export default PushNotificationService;
