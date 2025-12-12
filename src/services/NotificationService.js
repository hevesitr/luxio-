/**
 * NotificationService - Push notification management
 * 
 * Handles push notifications and local notifications
 */

import * as Notifications from 'expo-notifications';
import Logger from './Logger';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  static isInitialized = false;
  static expoPushToken = null;
  static notificationListener = null;
  static responseListener = null;

  /**
   * Initialize notification service
   */
  static async init() {
    if (this.isInitialized) {
      Logger.info('NotificationService: Already initialized');
      return;
    }

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Logger.warn('NotificationService: Permission not granted');
        return;
      }

      // Get push token
      this.expoPushToken = await this.getExpoPushToken();
      Logger.info('NotificationService: Push token obtained', { token: this.expoPushToken });

      // Setup listeners
      this.setupListeners();

      this.isInitialized = true;
      Logger.info('NotificationService: Initialized');
    } catch (error) {
      Logger.error('NotificationService: Initialization failed', error);
    }
  }

  /**
   * Get Expo push token
   */
  static async getExpoPushToken() {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      Logger.error('NotificationService: Failed to get push token', error);
      return null;
    }
  }

  /**
   * Setup notification listeners
   */
  static setupListeners() {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      Logger.info('NotificationService: Notification received', notification);
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      Logger.info('NotificationService: Notification tapped', response);
      // TODO: Handle notification tap (navigate to relevant screen)
    });
  }

  /**
   * Schedule local notification
   */
  static async scheduleNotification(title, body, data = {}, trigger = null) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: trigger || null, // null = immediate
      });

      Logger.info('NotificationService: Notification scheduled', { notificationId });
      return notificationId;
    } catch (error) {
      Logger.error('NotificationService: Failed to schedule notification', error);
      return null;
    }
  }

  /**
   * Cancel notification
   */
  static async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      Logger.info('NotificationService: Notification cancelled', { notificationId });
    } catch (error) {
      Logger.error('NotificationService: Failed to cancel notification', error);
    }
  }

  /**
   * Cancel all notifications
   */
  static async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      Logger.info('NotificationService: All notifications cancelled');
    } catch (error) {
      Logger.error('NotificationService: Failed to cancel all notifications', error);
    }
  }

  /**
   * Get badge count
   */
  static async getBadgeCount() {
    try {
      const count = await Notifications.getBadgeCountAsync();
      return count;
    } catch (error) {
      Logger.error('NotificationService: Failed to get badge count', error);
      return 0;
    }
  }

  /**
   * Set badge count
   */
  static async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
      Logger.info('NotificationService: Badge count set', { count });
    } catch (error) {
      Logger.error('NotificationService: Failed to set badge count', error);
    }
  }

  /**
   * Cleanup
   */
  static cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
    Logger.info('NotificationService: Cleaned up');
  }
}

export default NotificationService;
