/**
 * SuperLike Service
 *
 * Manages super like allocation, usage, and notifications
 */
import supabase from './supabaseClient';
import Logger from './Logger';

class SuperLikeService {
  /**
   * Get user's current super like count
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Current super like count
   */
  async getSuperLikeCount(userId) {
    try {
      const { data, error } = await supabase
        .from('user_super_likes')
        .select('count')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      return data?.count || 0;
    } catch (error) {
      Logger.error('SuperLikeService: Failed to get super like count', error);
      return 0;
    }
  }

  /**
   * Check if user can send super like
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Whether user can send super like
   */
  async canSendSuperLike(userId) {
    const count = await this.getSuperLikeCount(userId);
    return count > 0;
  }

  /**
   * Send super like to a user
   * @param {string} senderId - Sender user ID
   * @param {string} receiverId - Receiver user ID
   * @returns {Promise<Object>} - Result object
   */
  async sendSuperLike(senderId, receiverId) {
    try {
      // Check if user has super likes available
      const canSend = await this.canSendSuperLike(senderId);
      if (!canSend) {
        throw new Error('No super likes available');
      }

      // Check if users are not the same
      if (senderId === receiverId) {
        throw new Error('Cannot send super like to yourself');
      }

      // Check if already sent super like today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingSuperLike } = await supabase
        .from('super_likes')
        .select('id')
        .eq('sender_id', senderId)
        .eq('receiver_id', receiverId)
        .gte('created_at', today)
        .single();

      if (existingSuperLike) {
        throw new Error('Already sent super like to this user today');
      }

      // Send super like
      const { data: superLike, error: superLikeError } = await supabase
        .from('super_likes')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (superLikeError) throw superLikeError;

      // Decrement user's super like count
      await this.decrementSuperLikeCount(senderId);

      // Create notification
      await this.createSuperLikeNotification(senderId, receiverId);

      Logger.success('SuperLikeService: Super like sent successfully', {
        senderId,
        receiverId,
        superLikeId: superLike.id
      });

      return {
        success: true,
        superLike,
        remainingCount: await this.getSuperLikeCount(senderId)
      };

    } catch (error) {
      Logger.error('SuperLikeService: Failed to send super like', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Decrement user's super like count
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async decrementSuperLikeCount(userId) {
    try {
      const { data: currentCount } = await supabase
        .from('user_super_likes')
        .select('count')
        .eq('user_id', userId)
        .single();

      const newCount = Math.max(0, (currentCount?.count || 0) - 1);

      await supabase
        .from('user_super_likes')
        .upsert({
          user_id: userId,
          count: newCount,
          updated_at: new Date().toISOString()
        });

    } catch (error) {
      Logger.error('SuperLikeService: Failed to decrement super like count', error);
    }
  }

  /**
   * Create notification for super like
   * @param {string} senderId - Sender user ID
   * @param {string} receiverId - Receiver user ID
   * @returns {Promise<void>}
   */
  async createSuperLikeNotification(senderId, receiverId) {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: receiverId,
          type: 'super_like',
          title: 'Super Like!',
          message: 'Valaki super like-ot küldött neked!',
          data: { senderId },
          created_at: new Date().toISOString(),
          read: false
        });
    } catch (error) {
      Logger.error('SuperLikeService: Failed to create notification', error);
    }
  }

  /**
   * Reset daily super likes based on subscription tier
   * @returns {Promise<void>}
   */
  async resetDailySuperLikes() {
    try {
      // Get all users with subscriptions
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('user_id, tier')
        .eq('status', 'active');

      if (!subscriptions) return;

      // Group by tier
      const tierCounts = {
        free: 1,
        plus: 5,
        gold: 10,
        platinum: 25
      };

      // Reset super likes for each user
      for (const subscription of subscriptions) {
        const count = tierCounts[subscription.tier] || 1;

        await supabase
          .from('user_super_likes')
          .upsert({
            user_id: subscription.user_id,
            count: count,
            updated_at: new Date().toISOString()
          });
      }

      Logger.info('SuperLikeService: Daily super likes reset completed', {
        userCount: subscriptions.length
      });

    } catch (error) {
      Logger.error('SuperLikeService: Failed to reset daily super likes', error);
    }
  }

  /**
   * Get super like history for user
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to fetch
   * @returns {Promise<Array>} - Super like history
   */
  async getSuperLikeHistory(userId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('super_likes')
        .select(`
          id,
          receiver_id,
          created_at,
          profiles:sender_id (
            id,
            name,
            photos
          )
        `)
        .eq('sender_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      Logger.error('SuperLikeService: Failed to get super like history', error);
      return [];
    }
  }

  /**
   * Check if user was super liked by someone
   * @param {string} userId - User ID
   * @param {string} otherUserId - Other user ID
   * @returns {Promise<boolean>} - Whether user was super liked
   */
  async wasSuperLikedBy(userId, otherUserId) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data } = await supabase
        .from('super_likes')
        .select('id')
        .eq('sender_id', otherUserId)
        .eq('receiver_id', userId)
        .gte('created_at', today)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  }
}

export default new SuperLikeService();
