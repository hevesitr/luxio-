/**
 * NotificationContext - Értesítések state management
 * Implements Requirement 3.4
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import MessageService from '../services/MessageService';
import { supabase } from '../services/supabaseClient';
import Logger from '../services/Logger';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Olvasatlan üzenetek számának betöltése
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUnreadCount();
      subscribeToNotifications();
    } else {
      setUnreadCount(0);
      setNotifications([]);
    }

    return () => {
      unsubscribeFromNotifications();
    };
  }, [isAuthenticated, user]);

  /**
   * Olvasatlan üzenetek számának betöltése
   */
  const loadUnreadCount = async () => {
    try {
      const result = await MessageService.getUnreadCount(user.id);
      
      if (result.success) {
        setUnreadCount(result.count);
        Logger.debug('Unread count loaded', { count: result.count });
      }
    } catch (error) {
      Logger.error('Load unread count failed', error);
    }
  };

  /**
   * Értesítések betöltése
   */
  const loadNotifications = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data);
      Logger.debug('Notifications loaded', { count: data.length });
    } catch (error) {
      Logger.error('Load notifications failed', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Real-time értesítések figyelése
   */
  let notificationSubscription = null;

  const subscribeToNotifications = () => {
    if (!user) return;

    // Új üzenetek figyelése
    notificationSubscription = supabase
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
          handleNewNotification(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // Ellenőrizzük, hogy a felhasználó kapja-e az üzenetet
          checkIfMessageForUser(payload.new);
        }
      )
      .subscribe();

    Logger.debug('Subscribed to notifications', { userId: user.id });
  };

  /**
   * Értesítés figyelés leállítása
   */
  const unsubscribeFromNotifications = () => {
    if (notificationSubscription) {
      supabase.removeChannel(notificationSubscription);
      notificationSubscription = null;
      Logger.debug('Unsubscribed from notifications');
    }
  };

  /**
   * Új értesítés kezelése
   */
  const handleNewNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    
    // Olvasatlan számláló növelése, ha nem olvasott
    if (!notification.is_read) {
      setUnreadCount(prev => prev + 1);
    }

    Logger.debug('New notification received', { type: notification.type });
  };

  /**
   * Üzenet ellenőrzése - a felhasználónak szól-e
   */
  const checkIfMessageForUser = async (message) => {
    try {
      // Match lekérése
      const { data: match } = await supabase
        .from('matches')
        .select('user_id, matched_user_id')
        .eq('id', message.match_id)
        .single();

      if (!match) return;

      // Ha a felhasználó a címzett (nem a küldő)
      const isRecipient = 
        (match.user_id === user.id && message.sender_id !== user.id) ||
        (match.matched_user_id === user.id && message.sender_id !== user.id);

      if (isRecipient) {
        setUnreadCount(prev => prev + 1);
        Logger.debug('New message notification', { matchId: message.match_id });
      }
    } catch (error) {
      Logger.error('Check message for user failed', error);
    }
  };

  /**
   * Értesítés olvasottnak jelölése
   */
  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      // Lokális state frissítése
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );

      // Olvasatlan számláló csökkentése
      setUnreadCount(prev => Math.max(0, prev - 1));

      Logger.debug('Notification marked as read', { notificationId });
    } catch (error) {
      Logger.error('Mark notification as read failed', error);
    }
  };

  /**
   * Összes értesítés olvasottnak jelölése
   */
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      // Lokális state frissítése
      setNotifications(prev =>
        prev.map(n => ({
          ...n,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );

      setUnreadCount(0);

      Logger.success('All notifications marked as read', { userId: user.id });
    } catch (error) {
      Logger.error('Mark all as read failed', error);
    }
  };

  /**
   * Értesítés törlése
   */
  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      // Lokális state frissítése
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Ha olvasatlan volt, számláló csökkentése
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      Logger.debug('Notification deleted', { notificationId });
    } catch (error) {
      Logger.error('Delete notification failed', error);
    }
  };

  /**
   * Összes értesítés törlése
   */
  const clearAllNotifications = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);

      Logger.success('All notifications cleared', { userId: user.id });
    } catch (error) {
      Logger.error('Clear all notifications failed', error);
    }
  };

  /**
   * Értesítés küldése (helper)
   */
  const sendNotification = async (recipientId, type, data = {}) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: type,
          data: data,
          from_user_id: user?.id || null,
          created_at: new Date().toISOString(),
          is_read: false,
        });

      if (error) throw error;

      Logger.debug('Notification sent', { recipientId, type });
    } catch (error) {
      Logger.error('Send notification failed', error);
    }
  };

  const value = {
    unreadCount,
    notifications,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    sendNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook a NotificationContext használatához
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};

export default NotificationContext;
