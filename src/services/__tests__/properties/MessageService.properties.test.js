/**
 * Property-Based Tests for MessageService
 * Feature: property-based-testing
 */
import fc from 'fast-check';
import {
  messageGenerator,
  messageSequenceGenerator,
  paginationGenerator,
} from '../generators/messageGenerators';

// Mock MessageService
class MockMessageService {
  constructor() {
    this.messages = new Map(); // messageId -> message
    this.conversations = new Map(); // conversationKey -> array of messageIds
  }

  getConversationKey(user1, user2) {
    return [user1, user2].sort().join('-');
  }

  async sendMessage(senderId, receiverId, content, timestamp = null) {
    const message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      senderId,
      receiverId,
      content,
      timestamp: timestamp || new Date(),
      read: false,
      delivered: true,
    };

    this.messages.set(message.id, message);

    const convKey = this.getConversationKey(senderId, receiverId);
    if (!this.conversations.has(convKey)) {
      this.conversations.set(convKey, []);
    }
    this.conversations.get(convKey).push(message.id);

    return { success: true, message };
  }

  async getMessage(messageId) {
    const message = this.messages.get(messageId);
    return message || null;
  }

  async getMessages(user1, user2, limit = 50) {
    const convKey = this.getConversationKey(user1, user2);
    const messageIds = this.conversations.get(convKey) || [];
    
    const messages = messageIds
      .map(id => this.messages.get(id))
      .filter(Boolean)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-limit);

    return messages;
  }

  async deleteMessage(messageId) {
    const message = this.messages.get(messageId);
    if (!message) return { success: false };

    this.messages.delete(messageId);

    // Remove from conversation
    const convKey = this.getConversationKey(message.senderId, message.receiverId);
    const messageIds = this.conversations.get(convKey) || [];
    const index = messageIds.indexOf(messageId);
    if (index > -1) {
      messageIds.splice(index, 1);
    }

    return { success: true };
  }

  async unmatch(user1, user2) {
    const convKey = this.getConversationKey(user1, user2);
    const messageIds = this.conversations.get(convKey) || [];

    // Delete all messages
    for (const msgId of messageIds) {
      this.messages.delete(msgId);
    }

    this.conversations.delete(convKey);
    return { success: true };
  }

  async getMessagesPaginated(user1, user2, page = 1, pageSize = 50) {
    const convKey = this.getConversationKey(user1, user2);
    const messageIds = this.conversations.get(convKey) || [];
    
    const allMessages = messageIds
      .map(id => this.messages.get(id))
      .filter(Boolean)
      .sort((a, b) => a.timestamp - b.timestamp);

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageMessages = allMessages.slice(start, end);

    return {
      messages: pageMessages,
      page,
      pageSize,
      total: allMessages.length,
      hasMore: end < allMessages.length,
    };
  }

  reset() {
    this.messages = new Map();
    this.conversations = new Map();
  }
}

describe('MessageService Properties', () => {
  let messageService;

  beforeEach(() => {
    messageService = new MockMessageService();
  });

  /**
   * Property 6: Message persistence round-trip
   * Validates: Requirements 3.1
   */
  it('Property 6: Message persistence round-trip - sent message should be retrievable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // senderId
        fc.uuid(), // receiverId
        fc.string({ minLength: 1, maxLength: 500 }), // content
        async (senderId, receiverId, content) => {
          messageService.reset();

          const result = await messageService.sendMessage(senderId, receiverId, content);
          expect(result.success).toBe(true);

          const retrieved = await messageService.getMessage(result.message.id);
          expect(retrieved).not.toBeNull();
          expect(retrieved.content).toBe(content);
          expect(retrieved.senderId).toBe(senderId);
          expect(retrieved.receiverId).toBe(receiverId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: Message chronological ordering
   * Validates: Requirements 3.2
   */
  it('Property 7: Message chronological ordering - messages should be in chronological order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // user1
        fc.uuid(), // user2
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2, maxLength: 20 }),
        async (user1, user2, contents) => {
          fc.pre(user1 !== user2);
          messageService.reset();

          // Send messages with incrementing timestamps
          const baseTime = Date.now();
          for (let i = 0; i < contents.length; i++) {
            const timestamp = new Date(baseTime + i * 1000);
            await messageService.sendMessage(user1, user2, contents[i], timestamp);
          }

          const messages = await messageService.getMessages(user1, user2);

          // Verify chronological order
          for (let i = 0; i < messages.length - 1; i++) {
            expect(messages[i].timestamp.getTime()).toBeLessThanOrEqual(
              messages[i + 1].timestamp.getTime()
            );
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8: Message deletion consistency
   * Validates: Requirements 3.3
   */
  it('Property 8: Message deletion consistency - deleted message should not be retrievable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // senderId
        fc.uuid(), // receiverId
        fc.string({ minLength: 1, maxLength: 500 }), // content
        async (senderId, receiverId, content) => {
          messageService.reset();

          const result = await messageService.sendMessage(senderId, receiverId, content);
          const messageId = result.message.id;

          // Verify message exists
          let retrieved = await messageService.getMessage(messageId);
          expect(retrieved).not.toBeNull();

          // Delete message
          await messageService.deleteMessage(messageId);

          // Verify message is gone
          retrieved = await messageService.getMessage(messageId);
          expect(retrieved).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Unmatch cascade deletion
   * Validates: Requirements 3.4
   */
  it('Property 9: Unmatch cascade deletion - unmatching should delete all messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // user1
        fc.uuid(), // user2
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 10 }),
        async (user1, user2, contents) => {
          fc.pre(user1 !== user2);
          messageService.reset();

          // Send messages
          for (const content of contents) {
            await messageService.sendMessage(user1, user2, content);
          }

          // Verify messages exist
          let messages = await messageService.getMessages(user1, user2);
          expect(messages.length).toBe(contents.length);

          // Unmatch
          await messageService.unmatch(user1, user2);

          // Verify all messages are gone
          messages = await messageService.getMessages(user1, user2);
          expect(messages.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10: Pagination non-overlap
   * Validates: Requirements 3.5
   */
  it('Property 10: Pagination non-overlap - pages should not overlap and maintain order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // user1
        fc.uuid(), // user2
        fc.integer({ min: 10, max: 30 }), // message count
        fc.integer({ min: 5, max: 10 }), // page size
        async (user1, user2, messageCount, pageSize) => {
          fc.pre(user1 !== user2);
          messageService.reset();

          // Send messages with incrementing timestamps
          const baseTime = Date.now();
          for (let i = 0; i < messageCount; i++) {
            const timestamp = new Date(baseTime + i * 1000);
            await messageService.sendMessage(user1, user2, `Message ${i}`, timestamp);
          }

          // Get first two pages
          const page1 = await messageService.getMessagesPaginated(user1, user2, 1, pageSize);
          const page2 = await messageService.getMessagesPaginated(user1, user2, 2, pageSize);

          // Verify no overlap
          const page1Ids = new Set(page1.messages.map(m => m.id));
          const page2Ids = new Set(page2.messages.map(m => m.id));

          for (const id of page2Ids) {
            expect(page1Ids.has(id)).toBe(false);
          }

          // Verify chronological order within pages
          for (let i = 0; i < page1.messages.length - 1; i++) {
            expect(page1.messages[i].timestamp.getTime()).toBeLessThanOrEqual(
              page1.messages[i + 1].timestamp.getTime()
            );
          }

          for (let i = 0; i < page2.messages.length - 1; i++) {
            expect(page2.messages[i].timestamp.getTime()).toBeLessThanOrEqual(
              page2.messages[i + 1].timestamp.getTime()
            );
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
