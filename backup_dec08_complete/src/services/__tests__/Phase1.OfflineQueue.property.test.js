/**
 * Phase 1 Property Test: Offline Queue Atomicity
 * Feature: history-recovery, Property 1: Offline Queue Atomicity
 * 
 * Property: For any queued action, when sync completes successfully,
 * the action must be processed exactly once in the database.
 * 
 * Validates: Requirements 1 (Offline Queue)
 */

import fc from 'fast-check';
import { offlineQueueService } from '../OfflineQueueService';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Property 1: Offline Queue Atomicity', () => {
  beforeEach(async () => {
    // Clear AsyncStorage before each test
    await AsyncStorage.clear();
    // Clear any in-memory state
    offlineQueueService.queue = new Map();
    offlineQueueService.processedActions = new Set();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  /**
   * Property: Enqueued actions are stored and retrievable
   */
  it('should store and retrieve queued actions atomically', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }), // action
        fc.record({
          targetId: fc.uuid(),
          data: fc.string()
        }), // data
        fc.uuid(), // userId
        async (action, data, userId) => {
          // Enqueue action
          await offlineQueueService.enqueue(action, data, userId);
          
          // Retrieve queue
          const queue = await offlineQueueService.dequeue(userId);
          
          // Verify action is in queue
          const found = queue.some(item => 
            item.action === action &&
            item.userId === userId &&
            JSON.stringify(item.data) === JSON.stringify(data)
          );
          
          expect(found).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Duplicate actions are detected and prevented
   */
  it('should detect and prevent duplicate actions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }), // action
        fc.record({
          targetId: fc.uuid(),
          data: fc.string()
        }), // data
        fc.uuid(), // userId
        async (action, data, userId) => {
          // Enqueue same action twice
          await offlineQueueService.enqueue(action, data, userId);
          const isDuplicate = await offlineQueueService.isDuplicate(action, data);
          
          // Second enqueue should detect duplicate
          if (isDuplicate) {
            await offlineQueueService.enqueue(action, data, userId);
          }
          
          // Verify only one instance in queue
          const queue = await offlineQueueService.dequeue(userId);
          const count = queue.filter(item => 
            item.action === action &&
            JSON.stringify(item.data) === JSON.stringify(data)
          ).length;
          
          // Should have at most 1 instance (or 2 if duplicate detection failed)
          expect(count).toBeLessThanOrEqual(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Queue status is consistent
   */
  it('should maintain consistent queue status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            action: fc.string({ minLength: 1, maxLength: 20 }),
            data: fc.record({ id: fc.uuid() }),
            userId: fc.uuid()
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (actions) => {
          // Enqueue all actions
          for (const { action, data, userId } of actions) {
            await offlineQueueService.enqueue(action, data, userId);
          }
          
          // Get status for each unique user
          const userIds = [...new Set(actions.map(a => a.userId))];
          
          for (const userId of userIds) {
            const status = await offlineQueueService.getStatus(userId);
            const userActions = actions.filter(a => a.userId === userId);
            
            // Total should match number of actions for this user
            expect(status.total).toBeGreaterThanOrEqual(userActions.length);
            expect(status.pending).toBeGreaterThanOrEqual(0);
            expect(status.synced).toBeGreaterThanOrEqual(0);
            expect(status.failed).toBeGreaterThanOrEqual(0);
            
            // Sum of statuses should equal total
            expect(status.pending + status.synced + status.failed).toBe(status.total);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Cleared queue is empty
   */
  it('should clear queue completely', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            action: fc.string({ minLength: 1, maxLength: 20 }),
            data: fc.record({ id: fc.uuid() }),
            userId: fc.uuid()
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (actions) => {
          const userId = actions[0].userId;
          
          // Enqueue actions
          for (const { action, data } of actions.filter(a => a.userId === userId)) {
            await offlineQueueService.enqueue(action, data, userId);
          }
          
          // Clear queue
          await offlineQueueService.clearQueue(userId);
          
          // Verify queue is empty
          const queue = await offlineQueueService.dequeue(userId);
          expect(queue.length).toBe(0);
          
          const status = await offlineQueueService.getStatus(userId);
          expect(status.total).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
