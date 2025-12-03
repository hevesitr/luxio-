/**
 * MessageService - Üzenetek kezelése Supabase-zel
 */
import { supabase } from './supabaseClient';
import Logger from './Logger';

class MessageService {
  /**
   * Üzenet küldése
   */
  async sendMessage(matchId, senderId, content, type = 'text') {
    try {
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

      Logger.success('Message sent', { matchId, type });
      return { success: true, data };
    } catch (error) {
      Logger.error('Message send failed', error);
      return { success: false, error: error.message };
    }
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
