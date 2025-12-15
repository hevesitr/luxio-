/**
 * MessagingService - Real-time üzenetek kezelése
 * Követelmény: 4.1 - Real-time messaging rendszer
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import BaseService from './BaseService';
import { supabase } from './supabaseClient';
import Logger from './Logger';
import PushNotificationService from './PushNotificationService';
import OfflineQueueService from './OfflineQueueService';

class MessagingService extends BaseService {
  constructor() {
    super('MessagingService');
    this.messageSubscriptions = new Map();
    this.typingSubscriptions = new Map();
    this.isOnline = true;
    this.pushService = new PushNotificationService();
    this.offlineQueue = new OfflineQueueService();
  }

  async initialize() {
    await super.initialize();

    // Initialize offline queue service
    await this.offlineQueue.initialize();

    // Offline állapot figyelése
    this.setupNetworkMonitoring();

    // Start processing offline queue
    this.processOfflineQueue();

    this.log.success('MessagingService initialized with SQLite offline queue');
  }

  /**
   * Üzenet küldése
   * @param {string} conversationId - Beszélgetés ID
   * @param {string} senderId - Küldő ID
   * @param {string} receiverId - Fogadó ID
   * @param {object} messageData - Üzenet adatok
   */
  async sendMessage(conversationId, senderId, receiverId, messageData) {
    return this.executeOperation(async () => {
      const message = {
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        content: messageData.content || '',
        type: messageData.type || 'text',
        metadata: messageData.metadata || {},
        status: 'sending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Lokális cache mentése azonnali UI frissítéshez
      await this.saveMessageLocally(message);

      if (this.isOnline) {
        // Online küldés
        const result = await this.sendMessageOnline(message);
        if (result.success) {
          // Sikeres küldés esetén státusz frissítés
          await this.updateMessageStatus(message.id, 'sent');
          this.log.success('Message sent successfully', { messageId: message.id });
          return result;
        } else {
          // Sikertelen küldés esetén offline queue
          await this.addToOfflineQueue(message);
          return result;
        }
      } else {
        // Offline queue
        await this.addToOfflineQueue(message);
        this.log.info('Message added to offline queue', { messageId: message.id });
        return { success: true, queued: true };
      }

    }, 'sendMessage', { conversationId, senderId, receiverId });
  }

  /**
   * Üzenet küldése online (Supabase)
   */
  async sendMessageOnline(message) {
    try {
      // Check if we're in demo mode (__DEV__ environment or missing Supabase)
      const isDemoMode = __DEV__ || !supabase || typeof supabase.from !== 'function';
      console.log('MessagingService: sendMessageOnline - isDemoMode:', isDemoMode, '__DEV__:', __DEV__, 'supabase exists:', !!supabase);

      if (isDemoMode) {
        this.log.debug('sendMessageOnline skipped in demo mode', { messageId: message.id });
        // Simulate successful send in demo mode
        await this.updateMessageLocally({ ...message, status: 'sent' });
        return { success: true, message };
      }

        const { data, error } = await supabase
          .from('messages')
          .insert([message])
          .select()
          .single();

        if (error) {
          this.log.error('Failed to send message online', { error });
          return { success: false, error };
        }

        // Lokális cache frissítés a Supabase ID-vel
        await this.updateMessageLocally({ ...message, id: data.id, status: 'sent' });

        // Push értesítés küldése (háttérben)
        this.sendPushNotificationForMessage({
          conversationId: message.conversation_id,
          senderId: message.sender_id,
          receiverId: message.receiver_id,
          content: message.content,
          type: message.type
        }).catch(error => {
          this.log.warn('Failed to send push notification for message', error);
        });

        return { success: true, message: data };

      } catch (supabaseError) {
        this.log.error('Exception in sendMessageOnline Supabase call', supabaseError);
        return { success: false, error: supabaseError };
      }
  }

  /**
   * Beszélgetés üzeneteinek betöltése
   * @param {string} conversationId
   * @param {object} options - { limit, offset, before, after }
   */
  async loadMessages(conversationId, options = {}) {
    return this.executeOperation(async () => {
      const { limit = 50, offset = 0, before, after } = options;

      // Először lokális cache-ből
      const cachedMessages = await this.loadMessagesLocally(conversationId, options);

      if (cachedMessages.length > 0) {
        // Háttérben frissítés Supabase-ből
        this.syncMessagesInBackground(conversationId);
        return cachedMessages;
      }

      // Ha nincs cache, Supabase-ből
      const result = await this.loadMessagesOnline(conversationId, options);

      if (result.success && result.messages) {
        // Cache mentése
        await this.saveMessagesLocally(result.messages);
        return result.messages;
      }

      return [];

    }, 'loadMessages', { conversationId, options });
  }

  /**
   * Üzenetek betöltése Supabase-ből
   */
  async loadMessagesOnline(conversationId, options = {}) {
    try {
      // Check if we're in demo mode (__DEV__ environment or missing Supabase)
      const isDemoMode = __DEV__ || !supabase || typeof supabase.from !== 'function';
      if (isDemoMode) {
        this.log.debug('loadMessagesOnline skipped in demo mode', { conversationId });
        return { success: true, messages: [] };
      }

      const { limit = 50, offset = 0, before, after } = options;

      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(id, full_name, avatar_url),
          receiver:profiles!receiver_id(id, full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (offset > 0) {
        query = query.range(offset, offset + limit - 1);
      }

      if (before) {
        query = query.lt('created_at', before);
      }

      if (after) {
        query = query.gt('created_at', after);
      }

      const { data, error } = await query;

      if (error) {
        this.log.error('Failed to load messages online', { error, conversationId });
        return { success: false, error };
      }

      // Üzenetek visszafordítása időrendi sorrendbe
      const messages = data.reverse();

      this.log.info('Messages loaded from Supabase', {
        conversationId,
        count: messages.length
      });

      return { success: true, messages };

    } catch (error) {
      this.log.error('Exception in loadMessagesOnline', error);
      return { success: false, error };
    }
  }

  /**
   * Real-time üzenet figyelés feliratkozása
   * @param {string} conversationId
   * @param {function} callback - (message) => void
   */
  subscribeToMessages(conversationId, callback) {
    if (this.messageSubscriptions.has(conversationId)) {
      this.unsubscribeFromMessages(conversationId);
    }

    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        this.log.debug('Real-time message received', {
          conversationId,
          messageId: payload.new.id
        });

        // Lokális cache frissítés
        this.saveMessageLocally(payload.new);

        // Callback hívás
        callback(payload.new);
      })
      .subscribe();

    this.messageSubscriptions.set(conversationId, subscription);

    this.log.success('Subscribed to real-time messages', { conversationId });
  }

  /**
   * Real-time üzenet figyelés leiratkozása
   */
  unsubscribeFromMessages(conversationId) {
    const subscription = this.messageSubscriptions.get(conversationId);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.messageSubscriptions.delete(conversationId);
      this.log.info('Unsubscribed from messages', { conversationId });
    }
  }

  /**
   * Typing indikátor kezelése
   * @param {string} conversationId
   * @param {string} userId
   * @param {boolean} isTyping
   */
  async setTypingStatus(conversationId, userId, isTyping) {
    try {
      // Skip typing status updates in demo mode
      const isDemoMode = !supabase || typeof supabase.from !== 'function';
      if (isDemoMode) {
        this.log.debug('Typing status skipped in demo mode', { conversationId, userId, isTyping });
        return;
      }

      if (isTyping) {
        await supabase
          .from('typing_indicators')
          .upsert({
            conversation_id: conversationId,
            user_id: userId,
            last_typed: new Date().toISOString()
          });
      } else {
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', userId);
      }

      this.log.debug('Typing status updated', { conversationId, userId, isTyping });

    } catch (error) {
      this.log.error('Failed to update typing status', error);
    }
  }

  /**
   * Typing indikátor figyelése
   * @param {string} conversationId
   * @param {function} callback - (typingUsers) => void
   */
  subscribeToTyping(conversationId, callback) {
    if (this.typingSubscriptions.has(conversationId)) {
      this.unsubscribeFromTyping(conversationId);
    }

    // Skip subscription in demo mode
    const isDemoMode = !supabase || typeof supabase.from !== 'function';
    if (isDemoMode) {
      this.log.debug('Typing subscription skipped in demo mode', { conversationId });
      // Create a mock subscription object
      const mockSubscription = {
        unsubscribe: () => this.log.debug('Mock typing subscription unsubscribed', { conversationId })
      };
      this.typingSubscriptions.set(conversationId, mockSubscription);
      return;
    }

    const subscription = supabase
      .channel(`typing:${conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `conversation_id=eq.${conversationId}`
      }, async () => {
        // Aktív typing felhasználók lekérése
        const typingUsers = await this.getActiveTypingUsers(conversationId);
        callback(typingUsers);
      })
      .subscribe();

    this.typingSubscriptions.set(conversationId, subscription);

    this.log.success('Subscribed to typing indicators', { conversationId });
  }

  /**
   * Typing indikátor leiratkozása
   */
  unsubscribeFromTyping(conversationId) {
    const subscription = this.typingSubscriptions.get(conversationId);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.typingSubscriptions.delete(conversationId);
      this.log.info('Unsubscribed from typing', { conversationId });
    }
  }

  /**
   * Aktív typing felhasználók lekérése
   */
  async getActiveTypingUsers(conversationId) {
    try {
      // Return empty array in demo mode
      const isDemoMode = !supabase || typeof supabase.from !== 'function';
      if (isDemoMode) {
        this.log.debug('getActiveTypingUsers skipped in demo mode', { conversationId });
        return [];
      }

      const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();

      const { data, error } = await supabase
        .from('typing_indicators')
        .select(`
          user_id,
          profiles!user_id(id, full_name)
        `)
        .eq('conversation_id', conversationId)
        .gt('last_typed', fiveSecondsAgo);

      if (error) {
        this.log.error('Failed to get typing users', error);
        return [];
      }

      return data.map(item => item.profiles);

    } catch (error) {
      this.log.error('Exception in getActiveTypingUsers', error);
      return [];
    }
  }

  /**
   * Üzenet státusz frissítése
   * @param {string} messageId
   * @param {string} status - 'sent', 'delivered', 'read'
   */
  async updateMessageStatus(messageId, status) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === 'read') {
        updateData.read_at = new Date().toISOString();
      }

      // Supabase frissítés
      const { error } = await supabase
        .from('messages')
        .update(updateData)
        .eq('id', messageId);

      if (error) {
        this.log.error('Failed to update message status', { error, messageId, status });
        return { success: false, error };
      }

      // Lokális cache frissítés
      await this.updateMessageLocally({ id: messageId, ...updateData });

      this.log.debug('Message status updated', { messageId, status });

      return { success: true };

    } catch (error) {
      this.log.error('Exception in updateMessageStatus', error);
      return { success: false, error };
    }
  }

  /**
   * Üzenetek olvasottnak jelölése
   * @param {string} conversationId
   * @param {string} userId - Az olvasó felhasználó ID
   */
  async markMessagesAsRead(conversationId, userId) {
    return this.executeOperation(async () => {
      const { error } = await supabase
        .from('messages')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .neq('status', 'read');

      if (error) {
        this.log.error('Failed to mark messages as read', error);
        return { success: false, error };
      }

      // Lokális cache frissítés
      await this.markMessagesAsReadLocally(conversationId, userId);

      this.log.success('Messages marked as read', { conversationId, userId });

      return { success: true };

    }, 'markMessagesAsRead', { conversationId, userId });
  }

  // === LOKÁLIS CACHE METÓDUSOK ===

  async saveMessageLocally(message) {
    try {
      const key = `messages_${message.conversation_id}`;
      const messages = await this.loadMessagesLocally(message.conversation_id);

      // Duplikáció ellenőrzés
      const existingIndex = messages.findIndex(m => m.id === message.id);
      if (existingIndex >= 0) {
        messages[existingIndex] = message;
      } else {
        messages.push(message);
      }

      await AsyncStorage.setItem(key, JSON.stringify(messages));
    } catch (error) {
      this.log.error('Failed to save message locally', error);
    }
  }

  async saveMessagesLocally(messages) {
    try {
      if (!messages || messages.length === 0) return;

      // Csoportosítás conversation_id szerint
      const messagesByConversation = messages.reduce((acc, message) => {
        const key = message.conversation_id;
        if (!acc[key]) acc[key] = [];
        acc[key].push(message);
        return acc;
      }, {});

      // Minden conversation-hez mentés
      for (const [conversationId, conversationMessages] of Object.entries(messagesByConversation)) {
        const key = `messages_${conversationId}`;
        const existingMessages = await this.loadMessagesLocally(conversationId);

        // Összefésülés és duplikáció eltávolítás
        const mergedMessages = [...existingMessages];
        conversationMessages.forEach(newMessage => {
          const existingIndex = mergedMessages.findIndex(m => m.id === newMessage.id);
          if (existingIndex >= 0) {
            mergedMessages[existingIndex] = newMessage;
          } else {
            mergedMessages.push(newMessage);
          }
        });

        await AsyncStorage.setItem(key, JSON.stringify(mergedMessages));
      }
    } catch (error) {
      this.log.error('Failed to save messages locally', error);
    }
  }

  async loadMessagesLocally(conversationId, options = {}) {
    try {
      const key = `messages_${conversationId}`;
      const data = await AsyncStorage.getItem(key);

      if (!data) return [];

      let messages = JSON.parse(data);

      // Sorrend és limit alkalmazása
      messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      const { limit = 50, offset = 0 } = options;
      messages = messages.slice(offset, offset + limit);

      return messages;
    } catch (error) {
      this.log.error('Failed to load messages locally', error);
      return [];
    }
  }

  async updateMessageLocally(updateData) {
    // Implementáció hasonló a saveMessageLocally-hoz
    // Frissíti a meglévő üzenetet
  }

  async markMessagesAsReadLocally(conversationId, userId) {
    // Implementáció a lokális olvasott státusz frissítéshez
  }

  // === PUSH ÉRTESÍTÉSEK ===

  async sendPushNotificationForMessage(messageData) {
    try {
      await this.pushService.sendMessageNotification(messageData);
    } catch (error) {
      this.log.error('Failed to send push notification for message', error);
    }
  }

  // === OFFLINE QUEUE METÓDUSOK ===

  async addToOfflineQueue(message) {
    try {
      const result = await this.offlineQueue.addMessage(message, {
        messageType: 'chat_message',
        priority: message.priority || 1
      });

      if (!result.success) {
        this.log.warn('Message not added to offline queue', { reason: result.reason, messageId: message.id });
        return result;
      }

      this.log.info('Message added to SQLite offline queue', { messageId: result.messageId });
      return result;
    } catch (error) {
      this.log.error('Failed to add message to offline queue', error);
      throw error;
    }
  }


  async processOfflineQueue() {
    if (!this.isOnline) return;

    try {
      const batch = await this.offlineQueue.getNextBatch(5); // Process in small batches

      if (batch.length === 0) return;

      this.log.info('Processing offline message batch', { count: batch.length });

      let successCount = 0;
      let failCount = 0;

      for (const queuedMessage of batch) {
        try {
          // Mark as processing
          await this.offlineQueue.markAsProcessing(queuedMessage.dbId);

          // Send message online
          const result = await this.sendMessageOnline(queuedMessage);

          if (result.success) {
            await this.offlineQueue.markAsCompleted(queuedMessage.dbId);
            successCount++;
            this.log.success('Offline message processed successfully', { messageId: queuedMessage.id });
          } else {
            await this.offlineQueue.markAsFailed(queuedMessage.dbId, result.error);
            failCount++;
            this.log.warn('Offline message processing failed', {
              messageId: queuedMessage.id,
              error: result.error
            });
          }
        } catch (error) {
          await this.offlineQueue.markAsFailed(queuedMessage.dbId, error.message);
          failCount++;
          this.log.error('Failed to process offline message', {
            messageId: queuedMessage.id,
            error: error.message
          });
        }
      }

      this.log.success('Offline queue batch processing completed', {
        processed: batch.length,
        successful: successCount,
        failed: failCount
      });

      // Schedule next batch processing
      if (successCount + failCount > 0) {
        setTimeout(() => this.processOfflineQueue(), 1000);
      }

    } catch (error) {
      this.log.error('Failed to process offline queue batch', error);
    }
  }

  setupNetworkMonitoring() {
    // Network állapot figyelése
    // Ez egy egyszerű implementáció - valós app-ban használj library-t
    const checkOnlineStatus = async () => {
      try {
        await fetch('https://www.google.com', { method: 'HEAD', cache: 'no-cache' });
        if (!this.isOnline) {
          this.isOnline = true;
          this.log.info('Network connection restored');
          this.processOfflineQueue();
        }
      } catch {
        if (this.isOnline) {
          this.isOnline = false;
          this.log.warn('Network connection lost');
        }
      }
    };

    // Időszakos ellenőrzés
    setInterval(checkOnlineStatus, 30000);
    checkOnlineStatus(); // Kezdeti ellenőrzés
  }

  // === SEGÉD METÓDUSOK ===

  async cleanup() {
    // Leiratkozás minden subscription-ról
    this.messageSubscriptions.forEach((sub, conversationId) => {
      this.unsubscribeFromMessages(conversationId);
    });
    this.typingSubscriptions.forEach((sub, conversationId) => {
      this.unsubscribeFromTyping(conversationId);
    });

    this.log.info('MessagingService cleaned up');
  }
}

export default MessagingService;
