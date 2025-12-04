/**
 * Tests for Message Generators
 * 
 * These tests verify that the generators produce valid message data
 */

import fc from 'fast-check';
import {
  messageGenerator,
  messageContentGenerator,
  conversationGenerator,
  orderedMessagesGenerator,
  constrainedMessageGenerator,
} from './messageGenerators';

describe('Message Generators', () => {
  describe('messageContentGenerator', () => {
    it('should generate content with 1-500 characters', () => {
      fc.assert(
        fc.property(messageContentGenerator, (content) => {
          expect(content.trim().length).toBeGreaterThanOrEqual(1);
          expect(content.length).toBeLessThanOrEqual(500);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('messageGenerator', () => {
    it('should generate valid message objects', () => {
      fc.assert(
        fc.property(messageGenerator, (message) => {
          // Check required fields exist
          expect(message).toHaveProperty('id');
          expect(message).toHaveProperty('senderId');
          expect(message).toHaveProperty('receiverId');
          expect(message).toHaveProperty('content');
          expect(message).toHaveProperty('timestamp');
          expect(message).toHaveProperty('read');

          // Check content constraints
          expect(message.content.trim().length).toBeGreaterThanOrEqual(1);
          expect(message.content.length).toBeLessThanOrEqual(500);

          // Check timestamp is a date
          expect(message.timestamp).toBeInstanceOf(Date);

          // Check read is boolean
          expect(typeof message.read).toBe('boolean');

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('conversationGenerator', () => {
    it('should generate valid conversations', () => {
      fc.assert(
        fc.property(conversationGenerator(), (conversation) => {
          // Check structure
          expect(conversation).toHaveProperty('user1Id');
          expect(conversation).toHaveProperty('user2Id');
          expect(conversation).toHaveProperty('messages');

          // Check users are different
          expect(conversation.user1Id).not.toBe(conversation.user2Id);

          // Check messages array
          expect(Array.isArray(conversation.messages)).toBe(true);
          expect(conversation.messages.length).toBeGreaterThanOrEqual(1);

          // Check messages are between the two users
          conversation.messages.forEach(msg => {
            const validSender = [conversation.user1Id, conversation.user2Id].includes(msg.senderId);
            const validReceiver = [conversation.user1Id, conversation.user2Id].includes(msg.receiverId);
            expect(validSender).toBe(true);
            expect(validReceiver).toBe(true);
            expect(msg.senderId).not.toBe(msg.receiverId);
          });

          // Check chronological order
          for (let i = 1; i < conversation.messages.length; i++) {
            expect(conversation.messages[i].timestamp.getTime())
              .toBeGreaterThanOrEqual(conversation.messages[i - 1].timestamp.getTime());
          }

          return true;
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('orderedMessagesGenerator', () => {
    it('should generate chronologically ordered messages', () => {
      fc.assert(
        fc.property(orderedMessagesGenerator(10), (messages) => {
          expect(messages.length).toBe(10);

          // Check chronological order
          for (let i = 1; i < messages.length; i++) {
            expect(messages[i].timestamp.getTime())
              .toBeGreaterThanOrEqual(messages[i - 1].timestamp.getTime());
          }

          return true;
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('constrainedMessageGenerator', () => {
    it('should respect content length constraints', () => {
      const generator = constrainedMessageGenerator({ minLength: 10, maxLength: 50 });
      
      fc.assert(
        fc.property(generator, (message) => {
          expect(message.content.trim().length).toBeGreaterThanOrEqual(10);
          expect(message.content.length).toBeLessThanOrEqual(50);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should respect read status constraint', () => {
      const generator = constrainedMessageGenerator({ read: true });
      
      fc.assert(
        fc.property(generator, (message) => {
          expect(message.read).toBe(true);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
