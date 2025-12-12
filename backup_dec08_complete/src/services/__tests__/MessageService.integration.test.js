/**
 * MessageService Integration Tests
 * Implements Task 4.4 - Integration tests
 */

import MessageService from '../MessageService';
import { supabase } from '../supabaseClient';

// Mock Supabase for testing
jest.mock('../supabaseClient');

// Mock Logger to avoid console output during tests
jest.mock('../Logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  success: jest.fn(),
}));

describe('MessageService Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage - Message Persistence and Delivery Receipts', () => {
    it('should send a message and generate delivery receipt', async () => {
      // Mock active match
      supabase.from.mockImplementation((table) => {
        if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'match-123', status: 'active', user_id: 'user1', matched_user_id: 'user2' },
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
                  data: { id: 'msg-123', content: 'Hello', type: 'text' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'message_receipts') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'receipt-123', status: 'delivered' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await MessageService.sendMessage('match-123', 'user1', 'Hello');

      expect(result.success).toBe(true);
      expect(result.data.content).toBe('Hello');
      expect(result.data.delivery_receipt).toBeDefined();
    });

    it('should reject message to inactive match', async () => {
      supabase.from.mockImplementation((table) => {
        if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'match-123', status: 'inactive' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await MessageService.sendMessage('match-123', 'user1', 'Hello');

      expect(result.success).toBe(false);
      expect(result.code).toBe('BUS_5003');
    });
  });

  describe('getMessages - Pagination', () => {
    it('should load most recent 50 messages with pagination support', async () => {
      const mockMessages = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        created_at: new Date(Date.now() - i * 1000).toISOString(),
      }));

      supabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: mockMessages,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await MessageService.getMessages('match-123', 50);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(50);
    });

    it('should support basic pagination', async () => {
      const mockMessages = Array.from({ length: 25 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        created_at: new Date(Date.now() - i * 1000).toISOString(),
      }));

      supabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: mockMessages,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await MessageService.getMessagesPaginated('match-123', 50, null);

      expect(result.success).toBe(true);
      expect(result.data.messages).toHaveLength(25);
      expect(result.data.hasMore).toBe(false); // 25 < 50 limit
      expect(result.data.nextCursor).toBeDefined();
    });
  });

  describe('getConversation - Load Recent Messages', () => {
    it('should load most recent 50 messages for a conversation', async () => {
      const mockMessages = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        sender: { full_name: `User ${i % 2}` },
      }));

      supabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: mockMessages,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await MessageService.getMessages('match-123', 50);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(50);
      expect(result.data[0].sender).toBeDefined();
    });
  });

  describe('Real-time Subscriptions', () => {
    it('should subscribe to messages with real-time notifications', async () => {
      const mockCallback = jest.fn();

      supabase.channel.mockReturnValue({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnValue('subscription'),
      });

      const subscription = MessageService.subscribeToMessages('match-123', mockCallback);

      expect(subscription).toBe('subscription');
      expect(supabase.channel).toHaveBeenCalledWith('messages:match-123');
    });

    it('should handle typing indicators in real-time', async () => {
      supabase.channel.mockReturnValue({
        track: jest.fn().mockResolvedValue(true),
      });

      const result = await MessageService.sendTypingIndicator('match-123', 'user1');

      expect(result.success).toBe(true);
      expect(supabase.channel).toHaveBeenCalledWith('match:match-123');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      supabase.from.mockImplementation((table) => {
        if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Match not found' },
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await MessageService.sendMessage('invalid-match', 'user1', 'Hello');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      supabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Database connection failed' },
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await MessageService.getMessages('match-123', 50);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
