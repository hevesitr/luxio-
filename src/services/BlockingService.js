/**
 * BlockingService - Felhasználók blokkolása és tiltása
 * Követelmény: 8.1 Create BlockingService
 */
import { supabase } from './supabaseClient';
import Logger from './Logger';
import ErrorHandler, { ErrorCodes } from './ErrorHandler';

class BlockingService {
  constructor() {
    this.BLOCK_TYPES = {
      USER_BLOCK: 'user_block',
      MUTUAL_BLOCK: 'mutual_block',
    };

    this.BLOCK_REASONS = {
      HARASSMENT: 'harassment',
      INAPPROPRIATE_CONTENT: 'inappropriate_content',
      SPAM: 'spam',
      FAKE_PROFILE: 'fake_profile',
      OTHER: 'other',
    };
  }

  /**
   * Felhasználó blokkolása
   * @param {string} blockerId - Blokkoló felhasználó ID
   * @param {string} blockedId - Blokkolandó felhasználó ID
   * @param {string} reason - Blokkolás oka
   * @param {string} details - Részletek (opcionális)
   */
  async blockUser(blockerId, blockedId, reason = 'other', details = '') {
    return ErrorHandler.wrapServiceCall(async () => {
      // Validáció
      if (blockerId === blockedId) {
        throw ErrorHandler.createError(
          ErrorCodes.BUSINESS_USER_BLOCKED,
          'Cannot block yourself'
        );
      }

      // Ellenőrizzük, hogy már blokkolva van-e
      const existingBlock = await this.getBlockStatus(blockerId, blockedId);
      if (existingBlock.isBlocked) {
        throw ErrorHandler.createError(
          ErrorCodes.BUSINESS_USER_BLOCKED,
          'User is already blocked'
        );
      }

      const now = new Date().toISOString();

      // Blokkolás mentése
      const { data, error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: blockerId,
          blocked_id: blockedId,
          block_type: this.BLOCK_TYPES.USER_BLOCK,
          reason: reason,
          details: details,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        // Ha már létezik, akkor frissítjük
        if (error.code === '23505') { // Unique violation
          const { data: updateData, error: updateError } = await supabase
            .from('blocked_users')
            .update({
              reason: reason,
              details: details,
              updated_at: now,
            })
            .eq('blocker_id', blockerId)
            .eq('blocked_id', blockedId)
            .select()
            .single();

          if (updateError) throw updateError;
          Logger.success('User block updated', { blockerId, blockedId, reason });
          return { success: true, data: updateData };
        }
        throw error;
      }

      Logger.success('User blocked', { blockerId, blockedId, reason });

      // Esemény loggolása
      await this.logBlockEvent('USER_BLOCKED', blockerId, blockedId, { reason, details });

      return { success: true, data };
    }, {
      operation: 'blockUser',
      blockerId,
      blockedId,
      reason,
    });
  }

  /**
   * Blokkolás feloldása
   * @param {string} blockerId - Blokkoló felhasználó ID
   * @param {string} blockedId - Blokkolandó felhasználó ID
   */
  async unblockUser(blockerId, blockedId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId)
        .select()
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        Logger.success('User unblocked', { blockerId, blockedId });

        // Esemény loggolása
        await this.logBlockEvent('USER_UNBLOCKED', blockerId, blockedId);
      } else {
        Logger.warn('No block found to unblock', { blockerId, blockedId });
      }

      return { success: true, data };
    }, {
      operation: 'unblockUser',
      blockerId,
      blockedId,
    });
  }

  /**
   * Blokkolás státuszának ellenőrzése két felhasználó között
   * @param {string} userId1 - Első felhasználó ID
   * @param {string} userId2 - Második felhasználó ID
   */
  async getBlockStatus(userId1, userId2) {
    try {
      // Ellenőrizzük mindkét irányban
      const { data, error } = await supabase
        .from('blocked_users')
        .select('*')
        .or(`and(blocker_id.eq.${userId1},blocked_id.eq.${userId2}),and(blocker_id.eq.${userId2},blocked_id.eq.${userId1})`)
        .eq('is_active', true);

      if (error) throw error;

      const isBlocked = data && data.length > 0;
      const blockInfo = isBlocked ? data[0] : null;

      // Meghatározzuk, hogy ki blokkolt kit
      let blockerId = null;
      let blockedId = null;
      let blockDirection = null;

      if (isBlocked) {
        if (blockInfo.blocker_id === userId1) {
          blockerId = userId1;
          blockedId = userId2;
          blockDirection = 'outgoing'; // userId1 blokkolta userId2-t
        } else {
          blockerId = userId2;
          blockedId = userId1;
          blockDirection = 'incoming'; // userId2 blokkolta userId1-et
        }
      }

      return {
        isBlocked,
        blockInfo,
        blockerId,
        blockedId,
        blockDirection,
        reason: blockInfo?.reason,
        details: blockInfo?.details,
        blockedAt: blockInfo?.created_at,
      };
    } catch (error) {
      Logger.error('Failed to get block status', error);
      return { isBlocked: false, error: error.message };
    }
  }

  /**
   * Felhasználó által blokkolt felhasználók listája
   * @param {string} userId - Felhasználó ID
   */
  async getBlockedUsers(userId) {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          *,
          blocked_user:profiles!blocked_users_blocked_id_fkey (
            id,
            first_name,
            photos,
            bio
          )
        `)
        .eq('blocker_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      Logger.error('Failed to get blocked users', error);
      return [];
    }
  }

  /**
   * Blokkoló felhasználók listája (ki blokkol engem)
   * @param {string} userId - Felhasználó ID
   */
  async getUsersWhoBlockedMe(userId) {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          *,
          blocker_user:profiles!blocked_users_blocker_id_fkey (
            id,
            first_name,
            photos,
            bio
          )
        `)
        .eq('blocked_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      Logger.error('Failed to get users who blocked me', error);
      return [];
    }
  }

  /**
   * Profil láthatóságának ellenőrzése
   * @param {string} viewerId - Megtekintő felhasználó ID
   * @param {string} profileOwnerId - Profil tulajdonos ID
   */
  async canViewProfile(viewerId, profileOwnerId) {
    try {
      const blockStatus = await this.getBlockStatus(viewerId, profileOwnerId);
      return !blockStatus.isBlocked;
    } catch (error) {
      Logger.error('Failed to check profile visibility', error);
      // Biztonságból false-t adunk vissza (nem látható)
      return false;
    }
  }

  /**
   * Üzenetküldés engedélyezésének ellenőrzése
   * @param {string} senderId - Küldő felhasználó ID
   * @param {string} receiverId - Fogadó felhasználó ID
   */
  async canSendMessage(senderId, receiverId) {
    return this.canViewProfile(senderId, receiverId);
  }

  /**
   * Felfedezés feed szűrése blokkolt felhasználókra
   * @param {string} userId - Felhasználó ID
   * @param {Array} profiles - Profil lista
   */
  async filterBlockedUsersFromFeed(userId, profiles) {
    if (!profiles || !Array.isArray(profiles)) {
      return [];
    }

    const filteredProfiles = [];

    for (const profile of profiles) {
      const canView = await this.canViewProfile(userId, profile.id);
      if (canView) {
        filteredProfiles.push(profile);
      }
    }

    return filteredProfiles;
  }

  /**
   * Blokkolás eseményének loggolása
   * @param {string} eventType - Esemény típusa
   * @param {string} blockerId - Blokkoló ID
   * @param {string} blockedId - Blokkolandó ID
   * @param {Object} metadata - További adatok
   */
  async logBlockEvent(eventType, blockerId, blockedId, metadata = {}) {
    try {
      await supabase
        .from('audit_log')
        .insert({
          user_id: blockerId,
          action: eventType,
          details: {
            blocked_user_id: blockedId,
            ...metadata,
          },
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      Logger.error('Failed to log block event', error);
      // Nem kritikus hiba, nem szakítjuk meg a fő folyamatot
    }
  }

  /**
   * Blokkolások statisztikáinak lekérése
   * @param {string} userId - Felhasználó ID
   */
  async getBlockingStats(userId) {
    try {
      const [blockedUsers, usersWhoBlockedMe] = await Promise.all([
        this.getBlockedUsers(userId),
        this.getUsersWhoBlockedMe(userId),
      ]);

      return {
        blockedCount: blockedUsers.length,
        blockedByCount: usersWhoBlockedMe.length,
        totalBlocks: blockedUsers.length + usersWhoBlockedMe.length,
      };
    } catch (error) {
      Logger.error('Failed to get blocking stats', error);
      return {
        blockedCount: 0,
        blockedByCount: 0,
        totalBlocks: 0,
      };
    }
  }

  /**
   * Blokkolás részleteinek lekérése
   * @param {string} blockerId - Blokkoló ID
   * @param {string} blockedId - Blokkolandó ID
   */
  async getBlockDetails(blockerId, blockedId) {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      Logger.error('Failed to get block details', error);
      return null;
    }
  }
}

// Singleton instance
const blockingService = new BlockingService();
export default blockingService;
