/**
 * SafetyService - Biztonság és moderáció
 * Implements Requirements 9.1, 9.2, 9.3, 9.4, 9.5
 */
import { supabase } from './supabaseClient';
import Logger from './Logger';
import ErrorHandler, { ErrorCodes } from './ErrorHandler';

class SafetyService {
  constructor() {
    // Profanity szótár (egyszerűsített)
    this.profanityWords = [
      // Magyar káromkodások
      'kurva', 'fasz', 'pina', 'segg', 'geci',
      // Angol káromkodások
      'fuck', 'shit', 'bitch', 'ass', 'dick', 'pussy',
    ];

    // Report kategóriák
    this.reportReasons = {
      INAPPROPRIATE_CONTENT: 'inappropriate_content',
      HARASSMENT: 'harassment',
      SPAM: 'spam',
      FAKE_PROFILE: 'fake_profile',
      UNDERAGE: 'underage',
      SCAM: 'scam',
      OTHER: 'other',
    };
  }

  /**
   * Felhasználó jelentése
   * Implements Requirement 9.1
   */
  async reportUser(reporterId, reportedUserId, reason, evidence = null, description = null) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Ellenőrzés: nem jelentheti saját magát
      if (reporterId === reportedUserId) {
        throw new Error('Cannot report yourself');
      }

      // Report mentése
      const { data, error } = await supabase
        .from('reports')
        .insert({
          reporter_id: reporterId,
          reported_user_id: reportedUserId,
          reason: reason,
          evidence: evidence,
          description: description,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Automatikus felfüggesztés ellenőrzése
      await this.checkAutoSuspension(reportedUserId);

      Logger.success('User reported', { reporterId, reportedUserId, reason });

      return data;
    }, { operation: 'reportUser', reporterId, reportedUserId });
  }

  /**
   * Felhasználó blokkolása
   * Implements Requirement 9.2
   */
  async blockUser(blockerId, blockedUserId) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Ellenőrzés: nem blokkolhatja saját magát
      if (blockerId === blockedUserId) {
        throw new Error('Cannot block yourself');
      }

      // Block mentése
      const { data, error } = await supabase
        .from('blocks')
        .insert({
          blocker_id: blockerId,
          blocked_id: blockedUserId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Match törlése, ha létezik
      await this.removeMatchBetweenUsers(blockerId, blockedUserId);

      // Beszélgetés törlése
      await this.deleteConversationBetweenUsers(blockerId, blockedUserId);

      Logger.success('User blocked', { blockerId, blockedUserId });

      return data;
    }, { operation: 'blockUser', blockerId, blockedUserId });
  }

  /**
   * Felhasználó blokkolásának feloldása
   */
  async unblockUser(blockerId, blockedUserId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedUserId);

      if (error) throw error;

      Logger.success('User unblocked', { blockerId, blockedUserId });
      return true;
    }, { operation: 'unblockUser', blockerId, blockedUserId });
  }

  /**
   * Blokkolt felhasználók listája
   */
  async getBlockedUsers(userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('blocks')
        .select(`
          *,
          blocked_profile:profiles!blocks_blocked_id_fkey(*)
        `)
        .eq('blocker_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      Logger.debug('Blocked users fetched', { userId, count: data.length });
      return data;
    }, { operation: 'getBlockedUsers', userId });
  }

  /**
   * Ellenőrzés: blokkolt-e a felhasználó
   */
  async isUserBlocked(userId, targetUserId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .or(`and(blocker_id.eq.${userId},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${userId})`)
        .limit(1);

      if (error) throw error;

      const isBlocked = data && data.length > 0;

      Logger.debug('Block status checked', { userId, targetUserId, isBlocked });
      return isBlocked;
    }, { operation: 'isUserBlocked', userId, targetUserId });
  }

  /**
   * Tartalom szűrése (profanity detection)
   * Implements Requirement 9.3
   */
  detectInappropriateContent(text) {
    if (!text || typeof text !== 'string') {
      return { inappropriate: false, words: [] };
    }

    const lowerText = text.toLowerCase();
    const foundWords = [];

    for (const word of this.profanityWords) {
      if (lowerText.includes(word)) {
        foundWords.push(word);
      }
    }

    const inappropriate = foundWords.length > 0;

    if (inappropriate) {
      Logger.warn('Inappropriate content detected', { words: foundWords });
    }

    return {
      inappropriate,
      words: foundWords,
      severity: foundWords.length > 2 ? 'high' : foundWords.length > 0 ? 'medium' : 'low',
    };
  }

  /**
   * Üzenet moderálása
   */
  async moderateMessage(messageId, content) {
    return ErrorHandler.wrapServiceCall(async () => {
      const detection = this.detectInappropriateContent(content);

      if (detection.inappropriate) {
        // Üzenet megjelölése moderációra
        const { error } = await supabase
          .from('messages')
          .update({
            flagged: true,
            flagged_reason: 'inappropriate_content',
            flagged_at: new Date().toISOString(),
          })
          .eq('id', messageId);

        if (error) throw error;

        // Moderációs queue-ba helyezés
        await supabase
          .from('moderation_queue')
          .insert({
            content_type: 'message',
            content_id: messageId,
            reason: 'inappropriate_content',
            severity: detection.severity,
            detected_words: detection.words,
            created_at: new Date().toISOString(),
          });

        Logger.warn('Message flagged for moderation', { messageId, words: detection.words });

        return {
          flagged: true,
          reason: 'inappropriate_content',
          severity: detection.severity,
        };
      }

      return {
        flagged: false,
      };
    }, { operation: 'moderateMessage', messageId });
  }

  /**
   * Automatikus felfüggesztés ellenőrzése
   * Implements Requirement 9.4
   */
  async checkAutoSuspension(userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Utolsó 24 óra report-jainak száma
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);

      const { count, error } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('reported_user_id', userId)
        .gte('created_at', yesterday.toISOString());

      if (error) throw error;

      // Ha 3 vagy több report 24 órán belül, felfüggesztés
      if (count >= 3) {
        await this.suspendUser(userId, 'auto_suspension', `Received ${count} reports in 24 hours`);
        
        Logger.warn('User auto-suspended', { userId, reportCount: count });

        return {
          suspended: true,
          reportCount: count,
        };
      }

      return {
        suspended: false,
        reportCount: count,
      };
    }, { operation: 'checkAutoSuspension', userId });
  }

  /**
   * Felhasználó felfüggesztése
   */
  async suspendUser(userId, reason, notes = null) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('suspensions')
        .insert({
          user_id: userId,
          reason: reason,
          notes: notes,
          status: 'active',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Profil frissítése
      await supabase
        .from('profiles')
        .update({
          is_suspended: true,
          suspended_at: new Date().toISOString(),
        })
        .eq('id', userId);

      Logger.success('User suspended', { userId, reason });

      return data;
    }, { operation: 'suspendUser', userId });
  }

  /**
   * Felfüggesztés feloldása
   */
  async unsuspendUser(userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Aktív felfüggesztések lezárása
      await supabase
        .from('suspensions')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      // Profil frissítése
      await supabase
        .from('profiles')
        .update({
          is_suspended: false,
          suspended_at: null,
        })
        .eq('id', userId);

      Logger.success('User unsuspended', { userId });
      return true;
    }, { operation: 'unsuspendUser', userId });
  }

  /**
   * Unmatch - match törlése
   * Implements Requirement 9.5
   */
  async unmatch(userId, matchId) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Match státusz frissítése
      const { error: matchError } = await supabase
        .from('matches')
        .update({
          status: 'unmatched',
          unmatched_at: new Date().toISOString(),
          unmatched_by: userId,
        })
        .eq('id', matchId);

      if (matchError) throw matchError;

      // Beszélgetés törlése
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('match_id', matchId);

      if (messagesError) throw messagesError;

      Logger.success('Unmatched', { userId, matchId });

      return true;
    }, { operation: 'unmatch', userId, matchId });
  }

  /**
   * Match törlése két felhasználó között (helper)
   */
  async removeMatchBetweenUsers(user1Id, user2Id) {
    try {
      await supabase
        .from('matches')
        .update({ status: 'blocked' })
        .or(`and(user_id.eq.${user1Id},matched_user_id.eq.${user2Id}),and(user_id.eq.${user2Id},matched_user_id.eq.${user1Id})`);

      Logger.debug('Match removed between users', { user1Id, user2Id });
    } catch (error) {
      Logger.error('Remove match failed', error);
    }
  }

  /**
   * Beszélgetés törlése két felhasználó között (helper)
   */
  async deleteConversationBetweenUsers(user1Id, user2Id) {
    try {
      // Match ID lekérése
      const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user_id.eq.${user1Id},matched_user_id.eq.${user2Id}),and(user_id.eq.${user2Id},matched_user_id.eq.${user1Id})`);

      if (matches && matches.length > 0) {
        const matchIds = matches.map(m => m.id);
        
        await supabase
          .from('messages')
          .delete()
          .in('match_id', matchIds);

        Logger.debug('Conversation deleted between users', { user1Id, user2Id });
      }
    } catch (error) {
      Logger.error('Delete conversation failed', error);
    }
  }

  /**
   * Report státusz frissítése (moderátor funkció)
   */
  async updateReportStatus(reportId, status, notes = null) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('reports')
        .update({
          status: status,
          moderator_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;

      Logger.success('Report status updated', { reportId, status });
      return data;
    }, { operation: 'updateReportStatus', reportId });
  }

  /**
   * Moderációs queue lekérése
   */
  async getModerationQueue(limit = 50) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('moderation_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      Logger.debug('Moderation queue fetched', { count: data.length });
      return data;
    }, { operation: 'getModerationQueue' });
  }

  /**
   * Report kategóriák lekérése
   */
  getReportReasons() {
    return {
      success: true,
      data: Object.entries(this.reportReasons).map(([key, value]) => ({
        id: value,
        label: key.replace(/_/g, ' ').toLowerCase(),
      })),
    };
  }
}

export default new SafetyService();
