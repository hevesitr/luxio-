/**
 * NotificationContext - Értesítések kezelése
 * 
 * Funkciók:
 * - Olvasatlan értesítések számlálása
 * - Értesítések listája
 * - Real-time értesítés feliratkozások
 * - Olvasottnak jelölés (egy/összes)
 * - Értesítések törlése
 * - Értesítés küldés helper
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import Logger from '../services/Logger';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Értesítések listája
  const [notifications, setNotifications] = useState([]);
  
  // Olvasatlan értesítések száma
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Betöltési állapot
  const [isLoading, setIsLoading] = useState(false);
  
  // Real-time subscription
  const [subscription, setSubscription] = useState(null);

  // Értesítések betöltése amikor a user bejelentkezik
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      subscribeToNotifications();
    } else {
      // User kijelentkezésekor tisztítás
      setNotifications([]);
      setUnreadCount(0);
      if (subscription) {
        subscription.unsubscribe();
        setSubscription(null);
      }
    }

    // Cleanup
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user?.id]);

  /**
   * Értesítések betöltése
   */
  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      setNotifications(data || []);
      
      // Olvasatlan értesítések számlálása
      const unread = (data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);

      Logger.info('NotificationContext: Notifications loaded', { 
        count: data?.length || 0,
        unread 
      });
    } catch (error) {
      Logger.error('NotificationContext: Error loading notifications', { 
        error: error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Real-time értesítés feliratkozás
   */
  const subscribeToNotifications = () => {
    if (!user?.id) return;

    try {
      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            Logger.info('NotificationContext: New notification received', { 
              notification: payload.new 
            });

            // Új értesítés hozzáadása a listához
            setNotifications(prev => [payload.new, ...prev]);
            
            // Olvasatlan számláló növelése
            setUnreadCount(prev => prev + 1);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            Logger.info('NotificationContext: Notification updated', { 
              notification: payload.new 
            });

            // Értesítés frissítése a listában
            setNotifications(prev =>
              prev.map(n => (n.id === payload.new.id ? payload.new : n))
            );

            // Olvasatlan számláló újraszámolása
            recalculateUnreadCount();
          }
        )
        .subscribe();

      setSubscription(channel);

      Logger.info('NotificationContext: Subscribed to notifications', { userId: user.id });
    } catch (error) {
      Logger.error('NotificationContext: Error subscribing to notifications', { 
        error: error.message 
      });
    }
  };

  /**
   * Olvasatlan számláló újraszámolása
   */
  const recalculateUnreadCount = () => {
    const unread = Array.isArray(notifications) ? notifications.filter(n => !n.is_read).length : 0;
    setUnreadCount(unread);
  };

  /**
   * Értesítés olvasottnak jelölése
   */
  const markAsRead = async (notificationId) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Helyi állapot frissítése
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );

      // Olvasatlan számláló csökkentése
      setUnreadCount(prev => Math.max(0, prev - 1));

      Logger.info('NotificationContext: Notification marked as read', { notificationId });

      return { success: true };
    } catch (error) {
      Logger.error('NotificationContext: Error marking notification as read', { 
        error: error.message,
        notificationId 
      });
      return { success: false, error: error.message };
    }
  };

  /**
   * Összes értesítés olvasottnak jelölése
   */
  const markAllAsRead = async () => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      // Helyi állapot frissítése
      setNotifications(prev =>
        prev.map(n => ({
          ...n,
          is_read: true,
          read_at: n.read_at || new Date().toISOString(),
        }))
      );

      // Olvasatlan számláló nullázása
      setUnreadCount(0);

      Logger.info('NotificationContext: All notifications marked as read');

      return { success: true };
    } catch (error) {
      Logger.error('NotificationContext: Error marking all as read', { 
        error: error.message 
      });
      return { success: false, error: error.message };
    }
  };

  /**
   * Értesítés törlése
   */
  const deleteNotification = async (notificationId) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Helyi állapot frissítése
      const notification = Array.isArray(notifications) ? notifications.find(n => n.id === notificationId) : null;
      setNotifications(prev => Array.isArray(prev) ? prev.filter(n => n.id !== notificationId) : []);

      // Ha olvasatlan volt, csökkentjük a számlálót
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      Logger.info('NotificationContext: Notification deleted', { notificationId });

      return { success: true };
    } catch (error) {
      Logger.error('NotificationContext: Error deleting notification', { 
        error: error.message,
        notificationId 
      });
      return { success: false, error: error.message };
    }
  };

  /**
   * Összes értesítés törlése
   */
  const deleteAllNotifications = async () => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Helyi állapot frissítése
      setNotifications([]);
      setUnreadCount(0);

      Logger.info('NotificationContext: All notifications deleted');

      return { success: true };
    } catch (error) {
      Logger.error('NotificationContext: Error deleting all notifications', { 
        error: error.message 
      });
      return { success: false, error: error.message };
    }
  };

  /**
   * Értesítés küldése (helper funkció)
   */
  const sendNotification = async (targetUserId, type, title, message, data = {}) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type, // 'match', 'message', 'like', 'super_like', 'system'
          title,
          message,
          data,
          is_read: false,
          created_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      Logger.info('NotificationContext: Notification sent', { 
        targetUserId,
        type,
        title 
      });

      return { success: true };
    } catch (error) {
      Logger.error('NotificationContext: Error sending notification', { 
        error: error.message,
        targetUserId,
        type 
      });
      return { success: false, error: error.message };
    }
  };

  /**
   * Értesítések szűrése típus szerint
   */
  const getNotificationsByType = (type) => {
    return Array.isArray(notifications) ? notifications.filter(n => n.type === type) : [];
  };

  /**
   * Olvasatlan értesítések lekérése
   */
  const getUnreadNotifications = () => {
    return Array.isArray(notifications) ? notifications.filter(n => !n.is_read) : [];
  };

  const value = {
    // Értesítések
    notifications,
    unreadCount,
    isLoading,

    // Műveletek
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    sendNotification,

    // Szűrők
    getNotificationsByType,
    getUnreadNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook a context használatához
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
