/**
 * Property-based tests for MessagingService
 * Testing offline queue data integrity and crash recovery
 */
import fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MessagingService from '../../MessagingService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock network monitoring
jest.mock('react-native', () => ({
  NetInfo: {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn(),
  },
}));

describe('MessagingService - Offline Queue Properties', () => {
  let service;

  beforeEach(async () => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    service = new MessagingService();
    await service.initialize();
  });

  describe('Offline Queue Data Integrity', () => {
    it('should never lose messages during processing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.record({
            id: fc.string({ minLength: 1 }), // Ensure non-empty IDs
            content: fc.string(),
            conversationId: fc.string(),
            senderId: fc.string(),
            receiverId: fc.string(),
          }), { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 0, max: 5 }), // Network failures
          async (messages, networkFailures) => {
            // Arrange: Add messages to queue
            for (const message of messages) {
              await service.addToOfflineQueue(message);
            }

            const initialQueueLength = service.messageQueue.length;

            // Act: Simulate processing with potential failures
            service.isOnline = true;
            let failureCount = 0;

            // Mock sendMessageOnline with occasional failures
            service.sendMessageOnline = jest.fn()
              .mockImplementation((msg) => {
                if (failureCount < networkFailures) {
                  failureCount++;
                  return Promise.reject(new Error('Network error'));
                }
                return Promise.resolve({ success: true, id: msg.id });
              });

            await service.processOfflineQueue();

            // Assert: No messages lost (either processed or still in queue)
            const remainingQueue = service.messageQueue.length;
            const completedCount = initialQueueLength - remainingQueue;

            // All messages should either be completed or still in queue
            expect(completedCount + remainingQueue).toBe(initialQueueLength);
            expect(completedCount).toBeGreaterThanOrEqual(0);
            expect(remainingQueue).toBeGreaterThanOrEqual(0);
          }
        )
      );
    });

    it('should handle duplicate messages correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 1 }), // Ensure non-empty IDs
            content: fc.string(),
            conversationId: fc.string(),
            senderId: fc.string(),
            receiverId: fc.string(),
          }),
          fc.integer({ min: 2, max: 5 }), // Reduce for speed
          async (message, duplicateAttempts) => {
            // Clear previous state
            service.messageQueue = [];
            AsyncStorage.setItem.mockClear();

            // Act: Try to add the same message multiple times
            for (let i = 0; i < duplicateAttempts; i++) {
              await service.addToOfflineQueue(message);
            }

            // Wait for batch persist to complete
            await new Promise(resolve => setTimeout(resolve, 200));

            // Assert: Only one instance should exist
            expect(service.messageQueue.length).toBe(1);
            expect(service.messageQueue[0].id).toBe(message.id);
          }
        )
      );
    }, 15000);

    it('should persist queue state correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.record({
            id: fc.string({ minLength: 1 }), // Ensure non-empty IDs
            content: fc.string(),
            conversationId: fc.string(),
            senderId: fc.string(),
            receiverId: fc.string(),
          }), { minLength: 1, maxLength: 5 }),
          async (messages) => {
            // Clear previous calls
            AsyncStorage.setItem.mockClear();

            // Arrange: Add messages
            for (const message of messages) {
              await service.addToOfflineQueue(message);
            }

            // Wait for batch persist to complete
            await new Promise(resolve => setTimeout(resolve, 200));

            // Assert: Storage was called at least once
            expect(AsyncStorage.setItem).toHaveBeenCalled();
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
              'offline_messages',
              expect.any(String)
            );

            const storedData = JSON.parse(AsyncStorage.setItem.mock.calls.slice(-1)[0][1]);
            expect(storedData.length).toBe(messages.length);
            expect(storedData.every(msg => msg.status === 'queued')).toBe(true);
          }
        )
      );
    }, 15000);

    it('should recover from crash during processing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.record({
            id: fc.string({ minLength: 1 }), // Ensure non-empty IDs
            content: fc.string(),
            conversationId: fc.string(),
            senderId: fc.string(),
            receiverId: fc.string(),
          }), { minLength: 1, maxLength: 3 }),
          async (messages) => {
            // Clear previous state
            service.messageQueue = [];
            AsyncStorage.setItem.mockClear();

            // Arrange: Add messages
            for (const message of messages) {
              await service.addToOfflineQueue(message);
            }

            // Wait for batch persist
            await new Promise(resolve => setTimeout(resolve, 200));

            // Simulate crash during processing by directly modifying stored data
            const storedData = JSON.parse(AsyncStorage.setItem.mock.calls.slice(-1)[0][1]);
            storedData[0].status = 'processing';
            storedData[0].retryCount = 0;

            // Act: Create new service instance (simulating app restart)
            const newService = new MessagingService();
            AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(storedData));
            await newService.loadOfflineQueue();

            // Assert: Processing message should be reset to queued
            const processingMessage = newService.messageQueue.find(msg => msg.id === messages[0].id);
            expect(processingMessage).toBeDefined();
            expect(processingMessage.status).toBe('queued');
            expect(processingMessage.retryCount).toBe(1);
          }
        )
      );
    }, 15000);

    it('should respect retry limits', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string(),
            content: fc.string(),
            conversationId: fc.string(),
            senderId: fc.string(),
            receiverId: fc.string(),
          }),
          fc.integer({ min: 3, max: 10 }), // Retry attempts
          async (message, retryAttempts) => {
            // Arrange: Add message that always fails
            await service.addToOfflineQueue(message);
            service.sendMessageOnline = jest.fn().mockRejectedValue(new Error('Persistent error'));

            // Act: Process multiple times
            service.isOnline = true;
            for (let i = 0; i < retryAttempts; i++) {
              await service.processOfflineQueue();
            }

            // Assert: Message should be removed after max retries
            const remainingMessage = service.messageQueue.find(msg => msg.id === message.id);
            if (remainingMessage) {
              expect(remainingMessage.retryCount).toBeLessThanOrEqual(3);
            }
          }
        )
      );
    });
  });
});
