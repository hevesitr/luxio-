import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { Logger } from './Logger';
import { ServiceError } from './ServiceError';

/**
 * OfflineQueueService - Persistent offline queue for critical operations
 * Ensures no data loss when offline
 */
export class OfflineQueueService {
  constructor() {
    this.QUEUE_KEY = '@offline_queue';
    this.SYNCED_KEY = '@offline_queue_synced';
    this.queue = [];
    this.isSyncing = false;
  }

  /**
   * Add operation to offline queue
   * @param {string} action - Action type (like, pass, message, etc)
   * @param {object} data - Operation data
   * @param {string} userId - User ID
   * @returns {Promise<object>} Queue item with ID
   */
  async enqueue(action, data, userId) {
    try {
      const queueItem = {
        id: this.generateQueueId(userId, action, data),
        action,
        data,
        userId,
        timestamp: new Date().toISOString(),
        synced: false,
        retryCount: 0,
        maxRetries: 3
      };

      // Load existing queue
      const queue = await this.loadQueue();
      
      // Check for duplicates (idempotency)
      const isDuplicate = queue.some(item => item.id === queueItem.id);
      if (isDuplicate) {
        Logger.warn('Duplicate queue item detected', { id: queueItem.id });
        return queue.find(item => item.id === queueItem.id);
      }

      // Add to queue
      queue.push(queueItem);
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));

      Logger.info('Item enqueued', { action, id: queueItem.id });
      return queueItem;
    } catch (error) {
      Logger.error('Failed to enqueue item', { error, action });
      throw new ServiceError(
        'QUEUE_ENQUEUE_FAILED',
        'Failed to save offline operation',
        'OFFLINE_QUEUE'
      );
    }
  }

  /**
   * Sync queue with server
   * @returns {Promise<object>} Sync result
   */
  async syncQueue() {
    if (this.isSyncing) {
      Logger.warn('Sync already in progress');
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
      const queue = await this.loadQueue();
      const unsyncedItems = queue.filter(item => !item.synced);

      Logger.info('Starting queue sync', { count: unsyncedItems.length });

      for (const item of unsyncedItems) {
        try {
          await this.processQueueItem(item);
          synced++;
          
          // Mark as synced
          item.synced = true;
          item.syncedAt = new Date().toISOString();
        } catch (error) {
          failed++;
          item.retryCount++;
          
          if (item.retryCount >= item.maxRetries) {
            Logger.error('Queue item max retries exceeded', { id: item.id });
            item.failed = true;
            item.failureReason = error.message;
          }
        }
      }

      // Save updated queue
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
      
      // Clean up synced items
      await this.cleanupSyncedItems();

      Logger.info('Queue sync complete', { synced, failed });
      return { synced, failed };
    } catch (error) {
      Logger.error('Queue sync failed', { error });
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process individual queue item
   * @private
   */
  async processQueueItem(item) {
    const { action, data, userId } = item;

    switch (action) {
      case 'like':
        return await this.processLike(data, userId);
      case 'pass':
        return await this.processPass(data, userId);
      case 'message':
        return await this.processMessage(data, userId);
      case 'profile_update':
        return await this.processProfileUpdate(data, userId);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Process like action
   * @private
   */
  async processLike(data, userId) {
    const { targetUserId } = data;

    // Check for duplicate like
    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('liked_user_id', targetUserId)
      .single();

    if (existing) {
      Logger.warn('Like already exists', { userId, targetUserId });
      return existing;
    }

    const { data: like, error } = await supabase
      .from('likes')
      .insert({
        user_id: userId,
        liked_user_id: targetUserId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return like;
  }

  /**
   * Process pass action
   * @private
   */
  async processPass(data, userId) {
    const { targetUserId } = data;

    const { data: pass, error } = await supabase
      .from('passes')
      .insert({
        user_id: userId,
        passed_user_id: targetUserId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return pass;
  }

  /**
   * Process message action
   * @private
   */
  async processMessage(data, userId) {
    const { matchId, content } = data;

    // Use atomic RPC for message + receipt
    const { data: result, error } = await supabase.rpc('send_message_atomic', {
      p_match_id: matchId,
      p_sender_id: userId,
      p_content: content,
      p_timestamp: new Date().toISOString()
    });

    if (error) throw error;
    return result;
  }

  /**
   * Process profile update
   * @private
   */
  async processProfileUpdate(data, userId) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return profile;
  }

  /**
   * Load queue from storage
   * @private
   */
  async loadQueue() {
    try {
      const queueJson = await AsyncStorage.getItem(this.QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      Logger.error('Failed to load queue', { error });
      return [];
    }
  }

  /**
   * Clean up synced items
   * @private
   */
  async cleanupSyncedItems() {
    try {
      const queue = await this.loadQueue();
      const activeSyncedItems = queue.filter(item => item.synced && !item.failed);
      
      // Keep synced items for 24 hours for reference
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const itemsToKeep = queue.filter(item => 
        !item.synced || 
        item.failed || 
        (item.syncedAt && item.syncedAt > cutoffTime)
      );

      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(itemsToKeep));
    } catch (error) {
      Logger.error('Failed to cleanup queue', { error });
    }
  }

  /**
   * Generate unique queue ID (idempotency key)
   * @private
   */
  generateQueueId(userId, action, data) {
    const key = `${userId}_${action}_${JSON.stringify(data)}_${Math.floor(Date.now() / 1000)}`;
    return require('crypto').createHash('sha256').update(key).digest('hex');
  }

  /**
   * Get queue status
   */
  async getQueueStatus() {
    const queue = await this.loadQueue();
    return {
      total: queue.length,
      synced: queue.filter(item => item.synced).length,
      pending: queue.filter(item => !item.synced && !item.failed).length,
      failed: queue.filter(item => item.failed).length
    };
  }

  /**
   * Clear queue (for testing)
   */
  async clearQueue() {
    await AsyncStorage.removeItem(this.QUEUE_KEY);
    Logger.info('Queue cleared');
  }
}

export const offlineQueueService = new OfflineQueueService();
