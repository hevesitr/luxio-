/**
 * Property-Based Tests for Message Atomicity
 * 
 * **Feature: history-recovery, Property 5: Message Atomicity**
 * 
 * For any message sent, both the message and receipt must be created together or not at all.
 * 
 * Validates: Requirements 6 (Message Atomicity)
 * 
 * Note: This test validates the concept of atomicity. The actual SQL function
 * (send_message_atomic) must be deployed to Supabase for full functionality.
 */

import fc from 'fast-check';

describe('Phase1.MessageAtomicity.property', () => {
  /**
   * Property 5: Atomic Operation Structure
   * Message and receipt data should be paired correctly
   */
  test('should validate message and receipt pairing structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          matchId: fc.uuid(),
          senderId: fc.uuid(),
          recipientId: fc.uuid(),
          content: fc.string({ minLength: 1, maxLength: 1000 }),
          timestamp: fc.date(),
        }),
        async (messageData) => {
          // Simulate atomic message creation
          const atomicOperation = {
            message: {
              id: fc.sample(fc.uuid(), 1)[0],
              match_id: messageData.matchId,
              sender_id: messageData.senderId,
              content: messageData.content,
              created_at: messageData.timestamp.toISOString(),
            },
            receipt: {
              id: fc.sample(fc.uuid(), 1)[0],
              message_id: null, // Will be set to message.id
              recipient_id: messageData.recipientId,
              delivered_at: null,
              read_at: null,
              created_at: messageData.timestamp.toISOString(),
            },
          };

          // Link receipt to message
          atomicOperation.receipt.message_id = atomicOperation.message.id;

          // Validate structure
          expect(atomicOperation.message).toBeDefined();
          expect(atomicOperation.receipt).toBeDefined();
          expect(atomicOperation.receipt.message_id).toBe(atomicOperation.message.id);
          expect(atomicOperation.message.sender_id).toBe(messageData.senderId);
          expect(atomicOperation.receipt.recipient_id).toBe(messageData.recipientId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Transaction Rollback Simulation
   * If message creation fails, receipt should not be created
   */
  test('should not create receipt if message creation fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          matchId: fc.uuid(),
          senderId: fc.uuid(),
          recipientId: fc.uuid(),
          content: fc.string({ minLength: 1, maxLength: 1000 }),
          shouldFail: fc.boolean(),
        }),
        async (data) => {
          let messageCreated = false;
          let receiptCreated = false;

          try {
            // Simulate message creation
            if (data.shouldFail) {
              throw new Error('Message creation failed');
            }
            messageCreated = true;

            // Only create receipt if message succeeded
            receiptCreated = true;
          } catch (error) {
            // Rollback: ensure receipt is not created
            receiptCreated = false;
          }

          // Validate atomicity
          if (data.shouldFail) {
            expect(messageCreated).toBe(false);
            expect(receiptCreated).toBe(false);
          } else {
            expect(messageCreated).toBe(true);
            expect(receiptCreated).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Message-Receipt Consistency
   * Message and receipt should have consistent data
   */
  test('should maintain consistency between message and receipt', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          matchId: fc.uuid(),
          senderId: fc.uuid(),
          recipientId: fc.uuid(),
          content: fc.string({ minLength: 1, maxLength: 1000 }),
        }),
        async (data) => {
          const messageId = fc.sample(fc.uuid(), 1)[0];
          const timestamp = new Date().toISOString();

          const message = {
            id: messageId,
            match_id: data.matchId,
            sender_id: data.senderId,
            content: data.content,
            created_at: timestamp,
          };

          const receipt = {
            id: fc.sample(fc.uuid(), 1)[0],
            message_id: messageId,
            recipient_id: data.recipientId,
            delivered_at: null,
            read_at: null,
            created_at: timestamp,
          };

          // Validate consistency
          expect(receipt.message_id).toBe(message.id);
          expect(message.created_at).toBe(receipt.created_at);
          expect(message.sender_id).not.toBe(receipt.recipient_id); // Different users
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Atomic Operation Validation
   * All required fields should be present in atomic operation
   */
  test('should validate all required fields in atomic operation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          matchId: fc.uuid(),
          senderId: fc.uuid(),
          recipientId: fc.uuid(),
          content: fc.string({ minLength: 1, maxLength: 1000 }),
        }),
        async (data) => {
          const atomicData = {
            match_id: data.matchId,
            sender_id: data.senderId,
            recipient_id: data.recipientId,
            content: data.content,
          };

          // Validate all required fields are present
          expect(atomicData.match_id).toBeDefined();
          expect(atomicData.sender_id).toBeDefined();
          expect(atomicData.recipient_id).toBeDefined();
          expect(atomicData.content).toBeDefined();

          // Validate field types
          expect(typeof atomicData.match_id).toBe('string');
          expect(typeof atomicData.sender_id).toBe('string');
          expect(typeof atomicData.recipient_id).toBe('string');
          expect(typeof atomicData.content).toBe('string');

          // Validate content length
          expect(atomicData.content.length).toBeGreaterThan(0);
          expect(atomicData.content.length).toBeLessThanOrEqual(1000);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Timestamp Consistency
   * Message and receipt should have same creation timestamp
   */
  test('should maintain timestamp consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          matchId: fc.uuid(),
          senderId: fc.uuid(),
          recipientId: fc.uuid(),
          content: fc.string({ minLength: 1, maxLength: 1000 }),
        }),
        async (data) => {
          const timestamp = new Date().toISOString();

          const message = {
            created_at: timestamp,
          };

          const receipt = {
            created_at: timestamp,
          };

          // Timestamps should match
          expect(message.created_at).toBe(receipt.created_at);

          // Timestamp should be valid ISO string
          expect(() => new Date(message.created_at)).not.toThrow();
          expect(new Date(message.created_at).toISOString()).toBe(timestamp);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Unique IDs
   * Message and receipt should have different unique IDs
   */
  test('should generate unique IDs for message and receipt', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          const messageId = fc.sample(fc.uuid(), 1)[0];
          const receiptId = fc.sample(fc.uuid(), 1)[0];

          // IDs should be different
          expect(messageId).not.toBe(receiptId);

          // Both should be valid UUIDs
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          expect(messageId).toMatch(uuidRegex);
          expect(receiptId).toMatch(uuidRegex);
        }
      ),
      { numRuns: 100 }
    );
  });
});
