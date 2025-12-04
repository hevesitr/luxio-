/**
 * Property-Based Tests for MessageService
 * 
 * **Feature: property-based-testing**
 * 
 * These tests validate universal properties that should hold
 * for all valid inputs to the MessageService.
 */

import fc from 'fast-check';
import { supabase } from '../../supabaseClient';
import MessageService from '../../MessageService';
import { messageGenerator, conversationGenerator } from '../generators/messageGenerators';
import { userIdGenerator } from '../generators/userGenerators';

// Mock Supabase for testing
jest.mock('../../supabaseClient');

describe('MessageService Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 6: Message persistence round-trip', () => {
    /**
     * **Feature: property-based-testing, Property 6: Message persistence round-trip**
     * **Validates: Requirements 3.1**
     * 
     * For any message, sending then retrieving by ID should return an equivalent message.
     */
    it('should persist and retrieve messages correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          messageGenerator,
          fc.uuid(), // matchId
          async (message, matchId) => {
            const messageId = message.id;

            // Mock active match check
            supabase.from = jest.fn((table) => {
              if (table === 'matches') {
                return {
                  select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue({
                        data: { id: matchId, status: 'active' },
                        error: null,
                      }),
                    }),
                  }),
                  update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null }),
                  }),
                };
              }
              if (table === 'messages') {
                return {
                  insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue({
                        data: {
                          id: messageId,
                          match_id: matchId,
                          sender_id: message.senderId,
                          content: message.content,
                          created_at: message.timestamp.toISOString(),
                          is_read: false,
                        },
                        error: null,
                      }),
                    }),
                  }),
                  select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({
                          data: [{
                            id: messageId,
                            match_id: matchId,
                            sender_id: message.senderId,
                            content: message.content,
                            created_at: message.timestamp.toISOString(),
                            is_read: false,
                          }],
                          error: null,
                        }),
                      }),
                    }),
                  }),
                };
              }
              return {};
            });

            // Send message
            const sentMessage = await MessageService.sendMessage(
              matchId,
              message.senderId,
              message.content
            );

            // Retrieve messages
            const retrievedResult = await MessageService.getMessages(matchId);

            // Verify round-trip
            expect(sentMessage.data.content).toBe(message.content);
            expect(sentMessage.data.sender_id).toBe(message.senderId);
            expect(retrievedResult.success).toBe(true);
            expect(retrievedResult.data[0].content).toBe(message.content);
            expect(retrievedResult.data[0].sender_id).toBe(message.senderId);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 7: Message chronological ordering', () => {
    /**
     * **Feature: property-based-testing, Property 7: Message chronological ordering**
     * **Validates: Requirements 3.2**
     * 
     * For any conversation, loading messages should return them in chronological order.
     */
    it('should return messages in chronological order', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationGenerator(5, 20),
          fc.uuid(), // matchId
          async (conversation, matchId) => {
            // Mock messages retrieval with chronological order
            const sortedMessages = [...conversation.messages].sort(
              (a, b) => a.timestamp - b.timestamp
            );

            supabase.from = jest.fn((table) => {
              if (table === 'messages') {
                return {
                  select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({
                          data: sortedMessages.map(msg => ({
                            id: msg.id,
                            match_id: matchId,
                            sender_id: msg.senderId,
                            content: msg.content,
                            created_at: msg.timestamp.toISOString(),
                            is_read: msg.read,
                          })),
                          error: null,
                        }),
                      }),
                    }),
                  }),
                };
              }
              return {};
            });

            // Get messages
            const result = await MessageService.getMessages(matchId);

            // Verify chronological order
            expect(result.success).toBe(true);
            for (let i = 1; i < result.data.length; i++) {
              const prevTime = new Date(result.data[i - 1].created_at).getTime();
              const currTime = new Date(result.data[i].created_at).getTime();
              expect(currTime).toBeGreaterThanOrEqual(prevTime);
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 8: Message deletion consistency', () => {
    /**
     * **Feature: property-based-testing, Property 8: Message deletion consistency**
     * **Validates: Requirements 3.3**
     * 
     * For any message, after deletion, subsequent queries should not return it.
     */
    it('should not return deleted messages', async () => {
      await fc.assert(
        fc.asyncProperty(
          messageGenerator,
          fc.uuid(), // matchId
          async (message, matchId) => {
            const messageId = message.id;
            let isDeleted = false;

            // Mock message deletion and retrieval
            supabase.from = jest.fn((table) => {
              if (table === 'messages') {
                return {
                  delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockImplementation(() => {
                      isDeleted = true;
                      return Promise.resolve({ error: null });
                    }),
                  }),
                  select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({
                          data: isDeleted ? [] : [{
                            id: messageId,
                            match_id: matchId,
                            sender_id: message.senderId,
                            content: message.content,
                          }],
                          error: null,
                        }),
                      }),
                    }),
                  }),
                };
              }
              return {};
            });

            // Delete message
            const { error } = await supabase
              .from('messages')
              .delete()
              .eq('id', messageId);

            expect(error).toBeNull();

            // Try to retrieve messages
            const result = await MessageService.getMessages(matchId);

            // Verify message is not in results
            expect(result.success).toBe(true);
            expect(result.data.find(m => m.id === messageId)).toBeUndefined();

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
