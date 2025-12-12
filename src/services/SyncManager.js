/**
 * SyncManager - Data synchronization manager
 * 
 * Manages offline/online data synchronization
 */

import Logger from './Logger';
import OfflineQueueService from './OfflineQueueService';

class SyncManager {
  static isInitialized = false;
  static isSyncing = false;
  static syncInterval = null;

  /**
   * Initialize sync manager
   */
  static init(config = {}) {
    if (this.isInitialized) {
      Logger.info('SyncManager: Already initialized');
      return;
    }

    this.isInitialized = true;
    Logger.info('SyncManager: Initialized');

    // Auto-sync every 5 minutes if online
    if (config.autoSync !== false) {
      this.startAutoSync(config.syncIntervalMs || 300000); // 5 minutes
    }
  }

  /**
   * Start auto-sync
   */
  static startAutoSync(intervalMs = 300000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.syncAll();
    }, intervalMs);

    Logger.info('SyncManager: Auto-sync started', { intervalMs });
  }

  /**
   * Stop auto-sync
   */
  static stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      Logger.info('SyncManager: Auto-sync stopped');
    }
  }

  /**
   * Sync all pending data
   */
  static async syncAll() {
    if (this.isSyncing) {
      Logger.info('SyncManager: Sync already in progress');
      return;
    }

    try {
      this.isSyncing = true;
      Logger.info('SyncManager: Starting sync');

      // Process offline queue
      await OfflineQueueService.processQueue();

      Logger.info('SyncManager: Sync completed');
    } catch (error) {
      Logger.error('SyncManager: Sync failed', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Force sync now
   */
  static async forceSync() {
    Logger.info('SyncManager: Force sync requested');
    await this.syncAll();
  }

  /**
   * Get sync status
   */
  static getSyncStatus() {
    return {
      isInitialized: this.isInitialized,
      isSyncing: this.isSyncing,
      autoSyncEnabled: !!this.syncInterval,
    };
  }
}

export default SyncManager;
