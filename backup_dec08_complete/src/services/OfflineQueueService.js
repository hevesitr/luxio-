/**
 * Offline Queue Service
 * Manages queuing of actions when offline and syncing when online
 * 
 * Property: Property 1 - Offline Queue Atomicity
 * Validates: Requirements 1
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const QUEUE_KEY = '@offline_queue';
const PROCESSED_KEY = '@processed_actions';

class OfflineQueueService {
  constructor() {
    this.queue = [];
    this.processedActions = new Set();
    this.syncCallbacks = {
      onStart: null,
      onComplete: null,
      onError: null,
    };
    this.isSyncing = false;
    this.initialized = false;
  }

  /**
   * Initialize the service
   * Loads queue and processed actions from storage
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load queue from storage
      this.queue = await this.loadQueue();
      
      // Load processed actions from storage
      this.processedActions = await this.loadProcessed();
      
      this.initialized = true;
      console.log(`[OfflineQueue] Service initialized with ${this.queue.length} queued actions`);
    } catch (error) {
      console.error('[OfflineQueue] Error initializing service:', error);
      throw error;
    }
  }

  /**
   * Enqueue an action for later processing
   * @param {string} action - Action type (e.g., 'swipe', 'message')
   * @param {object} data - Action data
   * @param {string} userId - User ID
   * @returns {Promise<string>} Action ID
   */
  async enqueue(action, data, userId) {
    try {
      const actionId = uuidv4();
      const queuedAction = {
        id: actionId,
        action,
        data,
        userId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        syncedAt: null,
        error: null,
        retryCount: 0,
      };

      // Check for duplicates
      const isDuplicate = await this.isDuplicate(action, data, userId);
      if (isDuplicate) {
        console.warn(`[OfflineQueue] Duplicate action detected: ${action}`);
        return null;
      }

      // Load existing queue
      const existingQueue = await this.loadQueue();
      existingQueue.push(queuedAction);

      // Save to AsyncStorage
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(existingQueue));
      this.queue = existingQueue;

      console.log(`[OfflineQueue] Action queued: ${action} (${actionId})`);
      return actionId;
    } catch (error) {
      console.error('[OfflineQueue] Error enqueueing action:', error);
      throw error;
    }
  }

  /**
   * Dequeue actions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Queued actions
   */
  async dequeue(userId) {
    try {
      const queue = await this.loadQueue();
      return queue.filter(action => action.userId === userId && action.status === 'pending');
    } catch (error) {
      console.error('[OfflineQueue] Error dequeueing actions:', error);
      throw error;
    }
  }

  /**
   * Clear queue for a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async clearQueue(userId) {
    try {
      const queue = await this.loadQueue();
      const filtered = queue.filter(action => action.userId !== userId);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
      this.queue = filtered;
      console.log(`[OfflineQueue] Queue cleared for user: ${userId}`);
    } catch (error) {
      console.error('[OfflineQueue] Error clearing queue:', error);
      throw error;
    }
  }

  /**
   * Sync queue with server
   * @param {string} userId - User ID
   * @param {Function} syncFunction - Function to sync actions
   * @returns {Promise<object>} Sync result
   */
  async syncQueue(userId, syncFunction) {
    if (this.isSyncing) {
      console.warn('[OfflineQueue] Sync already in progress');
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    const result = { synced: 0, failed: 0, errors: [] };

    try {
      // Notify sync start
      if (this.syncCallbacks.onStart) {
        this.syncCallbacks.onStart();
      }

      const queue = await this.dequeue(userId);

      for (const action of queue) {
        try {
          // Call sync function
          await syncFunction(action);

          // Mark as synced
          action.status = 'synced';
          action.syncedAt = new Date().toISOString();
          result.synced++;

          // Mark as processed
          await this.markProcessed(action.action, action.data);

          console.log(`[OfflineQueue] Action synced: ${action.id}`);
        } catch (error) {
          action.status = 'failed';
          action.error = error.message;
          action.retryCount++;
          result.failed++;
          result.errors.push({
            actionId: action.id,
            error: error.message,
          });

          console.error(`[OfflineQueue] Error syncing action ${action.id}:`, error);
        }
      }

      // Save updated queue
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      this.queue = queue;

      // Notify sync complete
      if (this.syncCallbacks.onComplete) {
        this.syncCallbacks.onComplete(result);
      }

      console.log(`[OfflineQueue] Sync complete: ${result.synced} synced, ${result.failed} failed`);
      return result;
    } catch (error) {
      console.error('[OfflineQueue] Error syncing queue:', error);

      // Notify sync error
      if (this.syncCallbacks.onError) {
        this.syncCallbacks.onError(error);
      }

      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Check if action is duplicate
   * @param {string} action - Action type
   * @param {object} data - Action data
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Is duplicate
   */
  async isDuplicate(action, data, userId) {
    try {
      const queue = await this.loadQueue();
      const processed = await this.loadProcessed();

      // Check if already processed
      const actionKey = this.generateActionKey(action, data, userId);
      if (processed.has(actionKey)) {
        return true;
      }

      // Check if already in queue
      const inQueue = queue.some(
        q => q.action === action &&
             JSON.stringify(q.data) === JSON.stringify(data) &&
             q.userId === userId &&
             q.status === 'pending'
      );

      return inQueue;
    } catch (error) {
      console.error('[OfflineQueue] Error checking duplicate:', error);
      return false;
    }
  }

  /**
   * Mark action as processed
   * @param {string} action - Action type
   * @param {object} data - Action data
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async markProcessed(action, data, userId = '') {
    try {
      const processed = await this.loadProcessed();
      const actionKey = this.generateActionKey(action, data, userId);
      processed.add(actionKey);

      // Convert Set to Array for storage
      const processedArray = Array.from(processed);
      await AsyncStorage.setItem(PROCESSED_KEY, JSON.stringify(processedArray));
      this.processedActions = processed;

      console.log(`[OfflineQueue] Action marked as processed: ${actionKey}`);
    } catch (error) {
      console.error('[OfflineQueue] Error marking action as processed:', error);
    }
  }

  /**
   * Generate unique key for action
   * @private
   */
  generateActionKey(action, data, userId) {
    return `${userId}:${action}:${JSON.stringify(data)}`;
  }

  /**
   * Load queue from storage
   * @private
   */
  async loadQueue() {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[OfflineQueue] Error loading queue:', error);
      return [];
    }
  }

  /**
   * Load processed actions from storage
   * @private
   */
  async loadProcessed() {
    try {
      const stored = await AsyncStorage.getItem(PROCESSED_KEY);
      const array = stored ? JSON.parse(stored) : [];
      return new Set(array);
    } catch (error) {
      console.error('[OfflineQueue] Error loading processed actions:', error);
      return new Set();
    }
  }

  /**
   * Register sync callbacks
   */
  onSyncStart(callback) {
    this.syncCallbacks.onStart = callback;
  }

  onSyncComplete(callback) {
    this.syncCallbacks.onComplete = callback;
  }

  onSyncError(callback) {
    this.syncCallbacks.onError = callback;
  }

  /**
   * Get queue status
   */
  async getStatus(userId) {
    try {
      const queue = await this.loadQueue();
      const userQueue = queue.filter(q => q.userId === userId);

      return {
        total: userQueue.length,
        pending: userQueue.filter(q => q.status === 'pending').length,
        synced: userQueue.filter(q => q.status === 'synced').length,
        failed: userQueue.filter(q => q.status === 'failed').length,
        isSyncing: this.isSyncing,
      };
    } catch (error) {
      console.error('[OfflineQueue] Error getting status:', error);
      return { total: 0, pending: 0, synced: 0, failed: 0, isSyncing: false };
    }
  }

  /**
   * Clear all processed actions
   */
  async clearProcessed() {
    try {
      await AsyncStorage.removeItem(PROCESSED_KEY);
      this.processedActions = new Set();
      console.log('[OfflineQueue] Processed actions cleared');
    } catch (error) {
      console.error('[OfflineQueue] Error clearing processed actions:', error);
    }
  }

  /**
   * Export queue for debugging
   */
  async exportQueue() {
    try {
      const queue = await this.loadQueue();
      const processed = await this.loadProcessed();
      return {
        queue,
        processed: Array.from(processed),
        isSyncing: this.isSyncing,
      };
    } catch (error) {
      console.error('[OfflineQueue] Error exporting queue:', error);
      return null;
    }
  }
}

// Export singleton instance
export const offlineQueueService = new OfflineQueueService();
export default OfflineQueueService;
