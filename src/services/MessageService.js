/**
 * MessageService - Üzenetek kezelése Supabase-zel
 */
import { supabase } from './supabaseClient';
import Logger from './Logger';
import ErrorHandler, { ErrorCodes } from './ErrorHandler';

class MessageService {
  /**
   * Üzenet küldése
   * Implements Requirement 4.5
   */
  async sendMessage(matchId, senderId, content, type = 'text') {
    return ErrorHandler.wrapServiceCall(async () => {
      // Match aktív-e ellenőrzés
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('status')
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

      // Üzenet mentése
      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: senderId,
          content: content,
          type: type,
          created_at: new Date().toISOString(),
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Match last_message_at frissítése
      await supabase
        .from('matches')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', matchId);

      Logger.success('Message sent', { matchId, type });
      return data;
    }, { operation: 'sendMessage', matchId, senderId });
  }

  /**
   * Üzenetek lekérése egy match-hez
   */
  async getMessages(matchId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      Logger.debug('Messages fetched', { matchId, count: data.length });
      return { success: true, data };
    } catch (error) {
      Logger.error('Messages fetch failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Üzenet olvasottnak jelölése
   */
  async markAsRead(messageId) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;

      Logger.debug('Message marked as read', { messageId });
      return { success: true };
    } catch (error) {
      Logger.error('Mark as read failed', error);
      return { success: false, error: error.message };
    }
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
    try {
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
      return { success: true, count: count || 0 };
    } catch (error) {
      Logger.error('Unread count fetch failed', error);
      return { success: false, error: error.message, count: 0 };
    }
  }

  /**
   * Üzenet törlése
   */
  async deleteMessage(messageId) {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      Logger.success('Message deleted', { messageId });
      return { success: true };
    } catch (error) {
      Logger.error('Message deletion failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Real-time üzenet figyelés
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
          Logger.debug('New message received', { matchId });
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Real-time üzenet figyelés leállítása
   */
  unsubscribeFromMessages(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
      Logger.debug('Unsubscribed from messages');
    }
  }

  /**
   * Hangüzenet feltöltése
   */
  async sendVoiceMessage(matchId, senderId, audioUri) {
    try {
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

      if (!messageResult.success) {
        throw new Error(messageResult.error);
      }

      Logger.success('Voice message sent', { matchId });
      return { success: true, data: messageResult.data };
    } catch (error) {
      Logger.error('Voice message send failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Videóüzenet feltöltése
   */
  async sendVideoMessage(matchId, senderId, videoUri) {
    try {
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

      if (!messageResult.success) {
        throw new Error(messageResult.error);
      }

      Logger.success('Video message sent', { matchId });
      return { success: true, data: messageResult.data };
    } catch (error) {
      Logger.error('Video message send failed', error);
      return { success: false, error: error.message };
    }
  }
}

export default new MessageService();


  /**
   * Typing indicator küldése
   * Implements Requirement 4.4
   */
  async sendTypingIndicator(matchId, userId) {
    try {
      // Presence channel használata
      const channel = supabase.channel(`match:${matchId}`);
      
      await channel.track({
        user_id: userId,
        typing: true,
        timestamp: new Date().toISOString(),
      });

      Logger.debug('Typing indicator sent', { matchId, userId });
      return { success: true };
    } catch (error) {
      Logger.error('Typing indicator failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Typing indicator leállítása
   */
  async stopTypingIndicator(matchId, userId) {
    try {
      const channel = supabase.channel(`match:${matchId}`);
      
      await channel.track({
        user_id: userId,
        typing: false,
        timestamp: new Date().toISOString(),
      });

      Logger.debug('Typing indicator stopped', { matchId, userId });
      return { success: true };
    } catch (error) {
      Logger.error('Stop typing indicator failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Presence tracking - ki van online
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
        Logger.debug('Presence synced', { matchId, state });
        callback({ type: 'sync', state });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        Logger.debug('User joined', { matchId, newPresences });
        callback({ type: 'join', presences: newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        Logger.debug('User left', { matchId, leftPresences });
        callback({ type: 'leave', presences: leftPresences });
      })
      .subscribe();

    return channel;
  }

  /**
   * Üzenet pagination - régebbi üzenetek betöltése
   * Implements Requirement 4.3
   */
  async getMessagesPaginated(matchId, limit = 50, offset = 0) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('match_id', matchId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Fordított sorrend (legrégebbi elől)
      const messages = data.reverse();

      Logger.debug('Messages paginated', { 
        matchId, 
        count: messages.length,
        total: count,
        offset 
      });

      return {
        messages,
        total: count,
        hasMore: offset + limit < count,
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
  async deleteMessages(messageIds) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .in('id', messageIds);

      if (error) throw error;

      Logger.success('Messages deleted', { count: messageIds.length });
      return true;
    }, { operation: 'deleteMessages', count: messageIds.length });
  }

  /**
   * Message search - üzenetek keresése
   */
  async searchMessages(matchId, query) {
    return ErrorHandler.wrapServiceCall(async () => {
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
    }, { operation: 'searchMessages', matchId, query });
  }
}

export default new MessageService();
