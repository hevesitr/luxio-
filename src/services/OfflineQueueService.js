/**
 * OfflineQueueService - SQLite-based reliable offline queue
 * Replaces AsyncStorage with proper database persistence
 */
import * as SQLite from 'expo-sqlite';
import Logger from './Logger';
import ErrorHandler, { ErrorCodes } from './ErrorHandler';

class OfflineQueueService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.TABLE_NAME = 'offline_messages';
  }

  /**
   * Initialize SQLite database
   */
  async initialize() {
    try {
      this.db = SQLite.openDatabase('offline_queue.db');

      await this.createTables();
      await this.cleanupStaleMessages();

      this.isInitialized = true;
      Logger.success('OfflineQueueService initialized with SQLite');
    } catch (error) {
      Logger.error('Failed to initialize OfflineQueueService', error);
      throw ErrorHandler.createError(
        ErrorCodes.SERVICE_ERROR,
        'Failed to initialize offline queue database',
        { error: error.message }
      );
    }
  }

  /**
   * Create database tables
   */
  async createTables() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS ${this.TABLE_NAME} (
            id TEXT PRIMARY KEY,
            message_data TEXT NOT NULL,
            message_type TEXT DEFAULT 'message',
            priority INTEGER DEFAULT 1,
            status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
            retry_count INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT 3,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            next_retry_at DATETIME,
            error_message TEXT
          )`,
          [],
          () => {
            Logger.debug('Offline queue table created');
            resolve();
          },
          (tx, error) => {
            Logger.error('Failed to create offline queue table', error);
            reject(error);
          }
        );
      });
    });
  }

  /**
   * Add message to offline queue
   */
  async addMessage(message, options = {}) {
    if (!this.isInitialized) {
      throw new Error('OfflineQueueService not initialized');
    }

    const {
      priority = 1,
      messageType = 'message',
      maxRetries = 3
    } = options;

    const messageId = message.id || `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // Check for duplicates
        tx.executeSql(
          `SELECT id FROM ${this.TABLE_NAME} WHERE id = ?`,
          [messageId],
          (tx, result) => {
            if (result.rows.length > 0) {
              Logger.warn('Message already in offline queue', { messageId });
              resolve({ success: false, reason: 'duplicate' });
              return;
            }

            // Insert new message
            const messageData = JSON.stringify({
              ...message,
              id: messageId,
              queuedAt: new Date().toISOString()
            });

            tx.executeSql(
              `INSERT INTO ${this.TABLE_NAME} (id, message_data, message_type, priority, max_retries)
               VALUES (?, ?, ?, ?, ?)`,
              [messageId, messageData, messageType, priority, maxRetries],
              () => {
                Logger.info('Message added to offline queue', {
                  messageId,
                  type: messageType,
                  priority
                });
                resolve({ success: true, messageId });
              },
              (tx, error) => {
                Logger.error('Failed to add message to offline queue', error);
                reject(error);
              }
            );
          },
          (tx, error) => {
            Logger.error('Failed to check for duplicate message', error);
            reject(error);
          }
        );
      });
    });
  }

  /**
   * Get next batch of messages to process
   */
  async getNextBatch(batchSize = 10) {
    if (!this.isInitialized) {
      throw new Error('OfflineQueueService not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM ${this.TABLE_NAME}
           WHERE status = 'queued'
           AND (next_retry_at IS NULL OR next_retry_at <= datetime('now'))
           ORDER BY priority DESC, created_at ASC
           LIMIT ?`,
          [batchSize],
          (tx, result) => {
            const messages = [];
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              try {
                const messageData = JSON.parse(row.message_data);
                messages.push({
                  id: row.id,
                  ...messageData,
                  dbId: row.id,
                  status: row.status,
                  retryCount: row.retry_count,
                  maxRetries: row.max_retries,
                  priority: row.priority,
                  createdAt: row.created_at
                });
              } catch (error) {
                Logger.error('Failed to parse message data', { messageId: row.id, error });
              }
            }
            resolve(messages);
          },
          (tx, error) => {
            Logger.error('Failed to get next batch', error);
            reject(error);
          }
        );
      });
    });
  }

  /**
   * Mark message as processing
   */
  async markAsProcessing(messageId) {
    return this.updateMessageStatus(messageId, 'processing');
  }

  /**
   * Mark message as completed
   */
  async markAsCompleted(messageId) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `DELETE FROM ${this.TABLE_NAME} WHERE id = ?`,
          [messageId],
          () => {
            Logger.success('Message completed and removed from queue', { messageId });
            resolve({ success: true });
          },
          (tx, error) => {
            Logger.error('Failed to mark message as completed', error);
            reject(error);
          }
        );
      });
    });
  }

  /**
   * Mark message as failed with retry logic
   */
  async markAsFailed(messageId, errorMessage = null) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // First get current retry count
        tx.executeSql(
          `SELECT retry_count, max_retries FROM ${this.TABLE_NAME} WHERE id = ?`,
          [messageId],
          (tx, result) => {
            if (result.rows.length === 0) {
              resolve({ success: false, reason: 'not_found' });
              return;
            }

            const row = result.rows.item(0);
            const newRetryCount = row.retry_count + 1;
            const canRetry = newRetryCount < row.max_retries;

            if (canRetry) {
              // Schedule retry with exponential backoff
              const backoffMs = Math.min(1000 * Math.pow(2, newRetryCount), 300000); // Max 5 minutes
              const nextRetryAt = new Date(Date.now() + backoffMs).toISOString();

              tx.executeSql(
                `UPDATE ${this.TABLE_NAME}
                 SET status = 'queued', retry_count = ?, next_retry_at = ?, error_message = ?, updated_at = datetime('now')
                 WHERE id = ?`,
                [newRetryCount, nextRetryAt, errorMessage, messageId],
                () => {
                  Logger.info('Message scheduled for retry', {
                    messageId,
                    retryCount: newRetryCount,
                    nextRetryAt
                  });
                  resolve({ success: true, willRetry: true, nextRetryAt });
                },
                (tx, error) => {
                  Logger.error('Failed to schedule retry', error);
                  reject(error);
                }
              );
            } else {
              // Max retries exceeded
              tx.executeSql(
                `UPDATE ${this.TABLE_NAME}
                 SET status = 'failed', retry_count = ?, error_message = ?, updated_at = datetime('now')
                 WHERE id = ?`,
                [newRetryCount, errorMessage, messageId],
                () => {
                  Logger.warn('Message permanently failed', {
                    messageId,
                    finalRetryCount: newRetryCount
                  });
                  resolve({ success: true, willRetry: false, permanentlyFailed: true });
                },
                (tx, error) => {
                  Logger.error('Failed to mark message as permanently failed', error);
                  reject(error);
                }
              );
            }
          },
          (tx, error) => {
            Logger.error('Failed to get message retry info', error);
            reject(error);
          }
        );
      });
    });
  }

  /**
   * Update message status
   */
  async updateMessageStatus(messageId, status, additionalData = {}) {
    return new Promise((resolve, reject) => {
      const updates = ['status = ?'];
      const values = [status];

      if (additionalData.errorMessage) {
        updates.push('error_message = ?');
        values.push(additionalData.errorMessage);
      }

      updates.push('updated_at = datetime(\'now\')');
      values.push(messageId);

      this.db.transaction(tx => {
        tx.executeSql(
          `UPDATE ${this.TABLE_NAME} SET ${updates.join(', ')} WHERE id = ?`,
          values,
          () => {
            Logger.debug('Message status updated', { messageId, status });
            resolve({ success: true });
          },
          (tx, error) => {
            Logger.error('Failed to update message status', error);
            reject(error);
          }
        );
      });
    });
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    if (!this.isInitialized) {
      throw new Error('OfflineQueueService not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued,
            SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
           FROM ${this.TABLE_NAME}`,
          [],
          (tx, result) => {
            const stats = result.rows.item(0);
            resolve({
              total: stats.total || 0,
              queued: stats.queued || 0,
              processing: stats.processing || 0,
              failed: stats.failed || 0
            });
          },
          (tx, error) => {
            Logger.error('Failed to get queue stats', error);
            reject(error);
          }
        );
      });
    });
  }

  /**
   * Clean up stale messages
   */
  async cleanupStaleMessages(maxAgeHours = 24) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `DELETE FROM ${this.TABLE_NAME}
           WHERE status = 'failed'
           AND created_at < datetime('now', '-${maxAgeHours} hours')`,
          [],
          (tx, result) => {
            if (result.rowsAffected > 0) {
              Logger.info('Cleaned up stale failed messages', {
                deletedCount: result.rowsAffected,
                maxAgeHours
              });
            }
            resolve({ deletedCount: result.rowsAffected });
          },
          (tx, error) => {
            Logger.error('Failed to cleanup stale messages', error);
            reject(error);
          }
        );
      });
    });
  }

  /**
   * Clear entire queue (emergency)
   */
  async clearQueue() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `DELETE FROM ${this.TABLE_NAME}`,
          [],
          (tx, result) => {
            Logger.warn('Offline queue cleared', { deletedCount: result.rowsAffected });
            resolve({ deletedCount: result.rowsAffected });
          },
          (tx, error) => {
            Logger.error('Failed to clear queue', error);
            reject(error);
          }
        );
      });
    });
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.db) {
      this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
      Logger.info('OfflineQueueService database closed');
    }
  }
}

export default new OfflineQueueService();
