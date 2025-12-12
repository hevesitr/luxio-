/**
 * Rewind Service
 *
 * Manages swipe history and undo functionality
 */
import supabase from './supabaseClient';
import Logger from './Logger';

class RewindService {
  /**
   * Record a swipe action
   * @param {string} userId - User ID
   * @param {string} targetUserId - Target user ID
   * @param {string} action - Swipe action ('like', 'pass', 'super_like')
   * @returns {Promise<Object>} - Result object
   */
  async recordSwipe(userId, targetUserId, action) {
    try {
      const { data: swipe, error } = await supabase
        .from('swipe_history')
        .insert({
          user_id: userId,
          target_user_id: targetUserId,
          action: action,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      Logger.debug('RewindService: Swipe recorded', {
        userId,
        targetUserId,
        action,
        swipeId: swipe.id
      });

      return { success: true, swipe };
    } catch (error) {
      Logger.error('RewindService: Failed to record swipe', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user can rewind (premium feature)
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Whether user can rewind
   */
  async canRewind(userId) {
    try {
      // Check if user has active premium subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      return !!subscription && ['plus', 'gold', 'platinum'].includes(subscription.tier);
    } catch (error) {
      Logger.error('RewindService: Failed to check rewind permission', error);
      return false;
    }
  }

  /**
   * Get last swipe for rewinding
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Last swipe data or null
   */
  async getLastSwipe(userId) {
    try {
      const { data: swipe, error } = await supabase
        .from('swipe_history')
        .select(`
          id,
          target_user_id,
          action,
          created_at,
          profiles:target_user_id (
            id,
            name,
            photos
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Not found is ok

      return swipe || null;
    } catch (error) {
      Logger.error('RewindService: Failed to get last swipe', error);
      return null;
    }
  }

  /**
   * Rewind last swipe action
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result object
   */
  async rewindLastSwipe(userId) {
    try {
      // Check permission
      const canRewind = await this.canRewind(userId);
      if (!canRewind) {
        throw new Error('Premium subscription required for rewind');
      }

      // Get last swipe
      const lastSwipe = await this.getLastSwipe(userId);
      if (!lastSwipe) {
        throw new Error('No swipe to rewind');
      }

      // Remove from swipe history
      const { error: deleteError } = await supabase
        .from('swipe_history')
        .delete()
        .eq('id', lastSwipe.id);

      if (deleteError) throw deleteError;

      // If it was a like, remove from matches
      if (lastSwipe.action === 'like') {
        await this.removeMatchIfExists(userId, lastSwipe.target_user_id);
      }

      // If it was a super like, remove from super likes
      if (lastSwipe.action === 'super_like') {
        await this.removeSuperLikeIfExists(userId, lastSwipe.target_user_id);
      }

      Logger.success('RewindService: Swipe rewound successfully', {
        userId,
        targetUserId: lastSwipe.target_user_id,
        action: lastSwipe.action
      });

      return {
        success: true,
        rewoundSwipe: lastSwipe,
        profile: lastSwipe.profiles
      };

    } catch (error) {
      Logger.error('RewindService: Failed to rewind swipe', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove match if it exists between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<void>}
   */
  async removeMatchIfExists(userId1, userId2) {
    try {
      // Find match between the two users
      const { data: match } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user_id.eq.${userId1},matched_user_id.eq.${userId2}),and(user_id.eq.${userId2},matched_user_id.eq.${userId1})`)
        .single();

      if (match) {
        // Delete the match
        await supabase
          .from('matches')
          .delete()
          .eq('id', match.id);

        // Delete related messages
        await supabase
          .from('messages')
          .delete()
          .eq('match_id', match.id);

        Logger.info('RewindService: Match and messages removed', { matchId: match.id });
      }
    } catch (error) {
      Logger.error('RewindService: Failed to remove match', error);
    }
  }

  /**
   * Remove super like if it exists
   * @param {string} senderId - Sender user ID
   * @param {string} receiverId - Receiver user ID
   * @returns {Promise<void>}
   */
  async removeSuperLikeIfExists(senderId, receiverId) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('super_likes')
        .delete()
        .eq('sender_id', senderId)
        .eq('receiver_id', receiverId)
        .gte('created_at', today);

      if (!error) {
        Logger.info('RewindService: Super like removed', { senderId, receiverId });
      }
    } catch (error) {
      Logger.error('RewindService: Failed to remove super like', error);
    }
  }

  /**
   * Get swipe history for user
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to fetch
   * @returns {Promise<Array>} - Swipe history
   */
  async getSwipeHistory(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('swipe_history')
        .select(`
          id,
          target_user_id,
          action,
          created_at,
          profiles:target_user_id (
            id,
            name,
            photos
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      Logger.error('RewindService: Failed to get swipe history', error);
      return [];
    }
  }

  /**
   * Clean up old swipe history (keep last 1000 records per user)
   * @param {string} userId - User ID (optional, clean all if not provided)
   * @returns {Promise<void>}
   */
  async cleanupOldHistory(userId = null) {
    try {
      let query = supabase
        .from('swipe_history')
        .select('user_id, created_at')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: history } = await query;

      if (!history) return;

      // Group by user
      const userGroups = history.reduce((groups, record) => {
        if (!groups[record.user_id]) {
          groups[record.user_id] = [];
        }
        groups[record.user_id].push(record);
        return groups;
      }, {});

      // Delete old records for each user
      for (const [userIdKey, records] of Object.entries(userGroups)) {
        if (records.length > 1000) {
          const recordsToDelete = records.slice(1000);
          const idsToDelete = recordsToDelete.map(r => r.id);

          await supabase
            .from('swipe_history')
            .delete()
            .in('id', idsToDelete);

          Logger.info('RewindService: Old swipe history cleaned up', {
            userId: userIdKey,
            deletedCount: idsToDelete.length
          });
        }
      }

    } catch (error) {
      Logger.error('RewindService: Failed to cleanup old history', error);
    }
  }

  /**
   * Get rewind statistics for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Statistics object
   */
  async getRewindStats(userId) {
    try {
      const [history, lastSwipe] = await Promise.all([
        this.getSwipeHistory(userId, 1000),
        this.getLastSwipe(userId)
      ]);

      const stats = {
        totalSwipes: history.length,
        likesCount: history.filter(h => h.action === 'like').length,
        passesCount: history.filter(h => h.action === 'pass').length,
        superLikesCount: history.filter(h => h.action === 'super_like').length,
        canRewind: await this.canRewind(userId),
        lastSwipe: lastSwipe
      };

      return stats;
    } catch (error) {
      Logger.error('RewindService: Failed to get rewind stats', error);
      return {
        totalSwipes: 0,
        likesCount: 0,
        passesCount: 0,
        superLikesCount: 0,
        canRewind: false,
        lastSwipe: null
      };
    }
  }
}

export default new RewindService();
