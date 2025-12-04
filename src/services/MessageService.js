/**
 * MessageService - Üzenetek kezelése Supabase-zel
 */
import { supabase } from './supabaseClient';
import Logger from './Logger';
import ErrorHandler, { ErrorCodes } from './ErrorHandler';

class MessageService {
  /**
   * Üzenet küldése
   * Implements Requirement 4.5 - Delivery receipt generation
   */
  async sendMessage(matchId, senderId, content, type = 'text') {
    return ErrorHandler.wrapServiceCall(async () => {
      // Match aktív-e ellenőrzés
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('status, user_id, matched_user_id')
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;

      if (match.status !== 'active') {
        throw ErrorHandler.createError(
          ErrorCodes.BUSINESS_USER_BLOCKED,
          'Match is not active',
          { matchId, status: match.status }
        );
      }

      const now = new Date().toISOString();

      // Üzenet mentése
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: senderId,
          content: content,
          type: type,
          created_at: now,
          is_read: false,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Delivery receipt generálása - Requirement 4.5
      const recipientId = senderId === match.user_id ? match.matched_user_id : match.user_id;

      const { data: receipt, error: receiptError } = await supabase
        .from('message_receipts')
        .insert({
          message_id: message.id,
          recipient_id: recipientId,
          status: 'delivered',
          delivered_at: now,
        })
        .select()
        .single();

      if (receiptError) {
        Logger.warn('Failed to create delivery receipt', { messageId: message.id, error: receiptError });
        // Ne szakítsuk meg az üzenetküldést receipt hiba miatt
      } else {
        Logger.debug('Delivery receipt created', { messageId: message.id, receiptId: receipt.id });
      }

      // Match last_message_at frissítése
      await supabase
        .from('matches')
        .update({ last_message_at: now })
        .eq('id', matchId);

      Logger.success('Message sent with delivery receipt', { matchId, type, messageId: message.id });
      return {
        ...message,
        delivery_receipt: receipt || null
      };
    }, { operation: 'sendMessage', matchId, senderId });
  }

  /**
   * Üzenetek lekérése egy match-hez (egyszerű verzió)
   * Returns most recent messages without pagination
   */
  async getMessages(matchId, limit = 50) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name, avatar_url)
        `)
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      Logger.debug('Messages fetched', { matchId, count: data.length });
      return data;
    }, { operation: 'getMessages', matchId });
  }

  /**
   * Üzenet olvasottnak jelölése - Read receipt generation
   * Implements Requirement 4.5
   */
  async markAsRead(messageId, userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const now = new Date().toISOString();

      // Üzenet olvasottnak jelölése
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: now })
        .eq('id', messageId)
        .select()
        .single();

      if (messageError) throw messageError;

      // Read receipt generálása - Requirement 4.5
      const { data: receipt, error: receiptError } = await supabase
        .from('message_receipts')
        .upsert({
          message_id: messageId,
          recipient_id: userId,
          status: 'read',
          read_at: now,
        }, {
          onConflict: 'message_id,recipient_id'
        })
        .select()
        .single();

      if (receiptError) {
        Logger.warn('Failed to create read receipt', { messageId, error: receiptError });
      } else {
        Logger.debug('Read receipt created', { messageId, receiptId: receipt.id });
      }

      Logger.success('Message marked as read', { messageId });
      return {
        ...message,
        read_receipt: receipt || null
      };
    }, { operation: 'markAsRead', messageId, userId });
  }

  /**
   * Összes üzenet olvasottnak jelölése egy match-ben
   */
  async markAllAsRead(matchId, userId) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('match_id', matchId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      Logger.debug('All messages marked as read', { matchId });
      return { success: true };
    } catch (error) {
      Logger.error('Mark all as read failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Olvasatlan üzenetek száma
   */
  async getUnreadCount(userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Először lekérjük a felhasználó match-eit
      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (matchError) throw matchError;

      const matchIds = matches.map(m => m.id);

      // Olvasatlan üzenetek száma
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('match_id', matchIds)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      Logger.debug('Unread count fetched', { userId, count });
      return count || 0;
    }, { operation: 'getUnreadCount', userId });
  }

  /**
   * Üzenet törlése
   */
  async deleteMessage(messageId, userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Ellenőrizzük, hogy a felhasználó saját üzenete-e
      const { data: message, error: checkError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single();

      if (checkError) throw checkError;

      if (message.sender_id !== userId) {
        throw ErrorHandler.createError(
          ErrorCodes.PERMISSION_ERROR,
          'Cannot delete other users messages',
          { messageId, userId }
        );
      }

      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      Logger.success('Message deleted', { messageId });
      return true;
    }, { operation: 'deleteMessage', messageId, userId });
  }

  /**
   * Real-time üzenet figyelés - Implements Requirement 4.2
   */
  subscribeToMessages(matchId, callback) {
    const subscription = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          Logger.debug('New message received', { matchId, messageId: payload.new.id });
          callback(payload.new);
        }
      )
      .subscribe();

    Logger.info('Subscribed to real-time messages', { matchId });
    return subscription;
  }

  /**
   * Real-time üzenet figyelés leállítása
   */
  unsubscribeFromMessages(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
      Logger.info('Unsubscribed from real-time messages');
    }
  }

  /**
   * Hangüzenet feltöltése
   */
  async sendVoiceMessage(matchId, senderId, audioUri) {
    return ErrorHandler.wrapServiceCall(async () => {
      const SupabaseStorageService = require('./SupabaseStorageService').default;

      // Feltöltés a Storage-ba
      const uploadResult = await SupabaseStorageService.uploadFile(
        audioUri,
        'voice-messages',
        `${matchId}/voice_${Date.now()}.m4a`,
        'audio/m4a'
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Üzenet mentése
      const messageResult = await this.sendMessage(
        matchId,
        senderId,
        uploadResult.url,
        'voice'
      );

      Logger.success('Voice message sent', { matchId, messageId: messageResult.id });
      return messageResult;
    }, { operation: 'sendVoiceMessage', matchId, senderId });
  }

  /**
   * Videóüzenet feltöltése
   */
  async sendVideoMessage(matchId, senderId, videoUri) {
    return ErrorHandler.wrapServiceCall(async () => {
      const SupabaseStorageService = require('./SupabaseStorageService').default;

      // Feltöltés a Storage-ba
      const uploadResult = await SupabaseStorageService.uploadVideo(
        videoUri,
        'video-messages',
        `${matchId}/video_${Date.now()}.mp4`
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Üzenet mentése
      const messageResult = await this.sendMessage(
        matchId,
        senderId,
        uploadResult.url,
        'video'
      );

      Logger.success('Video message sent', { matchId, messageId: messageResult.id });
      return messageResult;
    }, { operation: 'sendVideoMessage', matchId, senderId });
  }

  /**
   * Typing indicator küldése
   * Implements Requirement 4.4 - Real-time typing indicators
   */
  async sendTypingIndicator(matchId, userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Presence channel használata - real-time typing indicators
      const channel = supabase.channel(`match:${matchId}`);

      await channel.track({
        user_id: userId,
        typing: true,
        timestamp: new Date().toISOString(),
      });

      // Automatikus leállítás 3 másodperc után
      setTimeout(() => {
        this.stopTypingIndicator(matchId, userId).catch(err =>
          Logger.warn('Auto-stop typing failed', err)
        );
      }, 3000);

      Logger.debug('Typing indicator sent', { matchId, userId });
      return true;
    }, { operation: 'sendTypingIndicator', matchId, userId });
  }

  /**
   * Typing indicator leállítása
   */
  async stopTypingIndicator(matchId, userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const channel = supabase.channel(`match:${matchId}`);

      await channel.track({
        user_id: userId,
        typing: false,
        timestamp: new Date().toISOString(),
      });

      Logger.debug('Typing indicator stopped', { matchId, userId });
      return true;
    }, { operation: 'stopTypingIndicator', matchId, userId });
  }

  /**
   * Presence tracking - ki van online
   * Implements Requirement 4.4 - Typing indicators and presence
   */
  subscribeToPresence(matchId, callback) {
    const channel = supabase.channel(`match:${matchId}`, {
      config: {
        presence: {
          key: matchId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        Logger.debug('Presence synced', { matchId, userCount: Object.keys(state).length });
        callback({ type: 'sync', state });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        Logger.debug('User joined', { matchId, userId: newPresences[0]?.user_id });
        callback({ type: 'join', presences: newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        Logger.debug('User left', { matchId, userId: leftPresences[0]?.user_id });
        callback({ type: 'leave', presences: leftPresences });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          Logger.info('Presence tracking active', { matchId });
        }
      });

    return channel;
  }

  /**
   * Üzenet cursor-based pagination - régebbi üzenetek betöltése
   * Implements Requirement 4.3 - Cursor-based pagination for infinite scroll
   */
  async getMessagesPaginated(matchId, limit = 50, cursor = null) {
    return ErrorHandler.wrapServiceCall(async () => {
      let query = supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('match_id', matchId)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Cursor-based pagination - sokkal hatékonyabb offset-nél
      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Fordított sorrend (legrégebbi elől a UI számára)
      const messages = data.reverse();

      // Következő cursor az utolsó üzenet időbélyege
      const nextCursor = messages.length > 0 ? messages[messages.length - 1].created_at : null;
      const hasMore = messages.length === limit;

      Logger.debug('Messages cursor-paginated', {
        matchId,
        count: messages.length,
        total: count,
        cursor,
        nextCursor,
        hasMore
      });

      return {
        messages,
        total: count,
        hasMore,
        nextCursor,
      };
    }, { operation: 'getMessagesPaginated', matchId });
  }

  /**
   * Üzenet szerkesztése
   */
  async editMessage(messageId, newContent) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('messages')
        .update({
          content: newContent,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;

      Logger.success('Message edited', { messageId });
      return data;
    }, { operation: 'editMessage', messageId });
  }

  /**
   * Üzenet reakció hozzáadása
   */
  async addReaction(messageId, userId, emoji) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: userId,
          emoji: emoji,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      Logger.success('Reaction added', { messageId, emoji });
      return data;
    }, { operation: 'addReaction', messageId });
  }

  /**
   * Üzenet reakció törlése
   */
  async removeReaction(reactionId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('id', reactionId);

      if (error) throw error;

      Logger.success('Reaction removed', { reactionId });
      return true;
    }, { operation: 'removeReaction', reactionId });
  }

  /**
   * Conversation metadata lekérése
   */
  async getConversationMetadata(matchId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          user1:profiles!matches_user_id_fkey(*),
          user2:profiles!matches_matched_user_id_fkey(*)
        `)
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;

      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', matchId);

      Logger.debug('Conversation metadata fetched', { matchId });

      return {
        match,
        messageCount: messageCount || 0,
      };
    }, { operation: 'getConversationMetadata', matchId });
  }

  /**
   * Bulk message operations - több üzenet törlése
   */
  async deleteMessages(messageIds, userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Ellenőrizzük, hogy minden üzenet a felhasználó sajátja-e
      const { data: messages, error: checkError } = await supabase
        .from('messages')
        .select('id, sender_id')
        .in('id', messageIds);

      if (checkError) throw checkError;

      const invalidMessages = messages.filter(msg => msg.sender_id !== userId);
      if (invalidMessages.length > 0) {
        throw ErrorHandler.createError(
          ErrorCodes.PERMISSION_ERROR,
          'Cannot delete other users messages',
          { invalidMessages: invalidMessages.length }
        );
      }

      const { error } = await supabase
        .from('messages')
        .delete()
        .in('id', messageIds);

      if (error) throw error;

      Logger.success('Messages deleted', { count: messageIds.length });
      return true;
    }, { operation: 'deleteMessages', count: messageIds.length, userId });
  }

  /**
   * Message search - üzenetek keresése
   */
  async searchMessages(matchId, query, userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Ellenőrizzük, hogy a felhasználó hozzáférhet-e ehhez a match-hez
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('user_id, matched_user_id')
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;

      if (match.user_id !== userId && match.matched_user_id !== userId) {
        throw ErrorHandler.createError(
          ErrorCodes.PERMISSION_ERROR,
          'Access denied to this conversation',
          { matchId, userId }
        );
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      Logger.debug('Messages searched', { matchId, query, count: data.length });
      return data;
    }, { operation: 'searchMessages', matchId, query, userId });
  }
}

export default new MessageService();
