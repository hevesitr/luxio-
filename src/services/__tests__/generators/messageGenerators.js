/**
 * Message Generators for Property-Based Testing
 */
import fc from 'fast-check';
import { userIdGenerator } from './userGenerators';

/**
 * Generate a valid message ID (UUID format)
 */
export const messageIdGenerator = fc.uuid();

/**
 * Generate valid message content (1-500 characters)
 */
export const messageContentGenerator = fc.string({ minLength: 1, maxLength: 500 });

/**
 * Generate a timestamp
 */
export const timestampGenerator = fc.date({
  min: new Date('2020-01-01'),
  max: new Date('2030-12-31'),
});

/**
 * Generate a complete message object
 */
export const messageGenerator = fc.record({
  id: messageIdGenerator,
  senderId: userIdGenerator,
  receiverId: userIdGenerator,
  content: messageContentGenerator,
  timestamp: timestampGenerator,
  read: fc.boolean(),
  delivered: fc.boolean(),
});

/**
 * Generate a sequence of messages (for ordering tests)
 */
export const messageSequenceGenerator = fc.array(messageGenerator, {
  minLength: 1,
  maxLength: 50,
});

/**
 * Generate a conversation (messages between two users)
 */
export const conversationGenerator = fc.tuple(
  userIdGenerator, // user1
  userIdGenerator, // user2
  fc.array(messageGenerator, { minLength: 1, maxLength: 100 })
).map(([user1, user2, messages]) => ({
  user1,
  user2,
  messages: messages.map(msg => ({
    ...msg,
    senderId: fc.sample(fc.constantFrom(user1, user2), 1)[0],
    receiverId: fc.sample(fc.constantFrom(user1, user2), 1)[0],
  })),
}));

/**
 * Generate pagination parameters
 */
export const paginationGenerator = fc.record({
  page: fc.integer({ min: 1, max: 10 }),
  pageSize: fc.integer({ min: 10, max: 100 }),
});

/**
 * Generate an invalid message (for validation testing)
 */
export const invalidMessageGenerator = fc.oneof(
  // Empty content
  fc.record({
    id: messageIdGenerator,
    senderId: userIdGenerator,
    receiverId: userIdGenerator,
    content: fc.constant(''),
    timestamp: timestampGenerator,
  }),
  // Content too long
  fc.record({
    id: messageIdGenerator,
    senderId: userIdGenerator,
    receiverId: userIdGenerator,
    content: fc.string({ minLength: 501, maxLength: 1000 }),
    timestamp: timestampGenerator,
  }),
  // Same sender and receiver
  fc.tuple(userIdGenerator).chain(([userId]) =>
    fc.record({
      id: messageIdGenerator,
      senderId: fc.constant(userId),
      receiverId: fc.constant(userId),
      content: messageContentGenerator,
      timestamp: timestampGenerator,
    })
  )
);

export default {
  messageIdGenerator,
  messageContentGenerator,
  timestampGenerator,
  messageGenerator,
  messageSequenceGenerator,
  conversationGenerator,
  paginationGenerator,
  invalidMessageGenerator,
};
