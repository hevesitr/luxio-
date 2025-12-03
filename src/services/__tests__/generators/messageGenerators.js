/**
 * Message Generators for Property-Based Testing
 * 
 * These generators create random message data for property tests.
 * All generators use fast-check to produce valid test data within constraints.
 */

import fc from 'fast-check';
import { userIdGenerator } from './userGenerators';

/**
 * Generate a valid message ID (UUID format)
 */
export const messageIdGenerator = fc.uuid();

/**
 * Generate a valid message content (1-500 characters)
 */
export const messageContentGenerator = fc.string({ 
  minLength: 1, 
  maxLength: 500 
}).filter(content => content.trim().length >= 1);

/**
 * Generate a valid timestamp
 */
export const timestampGenerator = fc.date({ 
  min: new Date('2020-01-01'), 
  max: new Date() 
}).filter(date => !isNaN(date.getTime()));

/**
 * Generate a complete message object
 */
export const messageGenerator = fc.record({
  id: messageIdGenerator,
  senderId: userIdGenerator,
  receiverId: userIdGenerator,
  content: messageContentGenerator,
  timestamp: timestampGenerator,
  read: fc.boolean()
});

/**
 * Generate a message between two specific users
 */
export const messageBetweenUsersGenerator = (senderId, receiverId) => {
  return fc.record({
    id: messageIdGenerator,
    senderId: fc.constant(senderId),
    receiverId: fc.constant(receiverId),
    content: messageContentGenerator,
    timestamp: timestampGenerator,
    read: fc.boolean()
  });
};

/**
 * Generate a conversation (array of messages between two users)
 */
export const conversationGenerator = (minMessages = 1, maxMessages = 50) => {
  return fc.tuple(userIdGenerator, userIdGenerator)
    .chain(([user1Id, user2Id]) => {
      if (user1Id === user2Id) {
        // Ensure different users
        return fc.tuple(
          fc.constant(user1Id),
          fc.uuid().filter(id => id !== user1Id)
        );
      }
      return fc.constant([user1Id, user2Id]);
    })
    .chain(([user1Id, user2Id]) => {
      return fc.array(
        fc.record({
          id: messageIdGenerator,
          senderId: fc.constantFrom(user1Id, user2Id),
          receiverId: fc.constantFrom(user1Id, user2Id),
          content: messageContentGenerator,
          timestamp: timestampGenerator,
          read: fc.boolean()
        }).filter(msg => msg.senderId !== msg.receiverId),
        { minLength: minMessages, maxLength: maxMessages }
      ).map(messages => ({
        user1Id,
        user2Id,
        messages: messages.sort((a, b) => a.timestamp - b.timestamp)
      }));
    });
};

/**
 * Generate a chronologically ordered sequence of messages
 */
export const orderedMessagesGenerator = (count = 10) => {
  return fc.array(messageGenerator, { minLength: count, maxLength: count })
    .map(messages => messages.sort((a, b) => a.timestamp - b.timestamp));
};

/**
 * Generate messages with specific timestamp range
 */
export const messagesInTimeRangeGenerator = (startDate, endDate, count = 10) => {
  return fc.array(
    fc.record({
      id: messageIdGenerator,
      senderId: userIdGenerator,
      receiverId: userIdGenerator,
      content: messageContentGenerator,
      timestamp: fc.date({ min: startDate, max: endDate }),
      read: fc.boolean()
    }),
    { minLength: count, maxLength: count }
  );
};

/**
 * Generate a message with read status
 */
export const readMessageGenerator = fc.record({
  id: messageIdGenerator,
  senderId: userIdGenerator,
  receiverId: userIdGenerator,
  content: messageContentGenerator,
  timestamp: timestampGenerator,
  read: fc.constant(true)
});

/**
 * Generate an unread message
 */
export const unreadMessageGenerator = fc.record({
  id: messageIdGenerator,
  senderId: userIdGenerator,
  receiverId: userIdGenerator,
  content: messageContentGenerator,
  timestamp: timestampGenerator,
  read: fc.constant(false)
});

/**
 * Generate paginated messages
 */
export const paginatedMessagesGenerator = (totalMessages = 100, pageSize = 20) => {
  return fc.array(messageGenerator, { 
    minLength: totalMessages, 
    maxLength: totalMessages 
  }).map(messages => {
    const sorted = messages.sort((a, b) => a.timestamp - b.timestamp);
    const pages = [];
    for (let i = 0; i < sorted.length; i += pageSize) {
      pages.push(sorted.slice(i, i + pageSize));
    }
    return { messages: sorted, pages, pageSize };
  });
};

/**
 * Generate a message with constraints
 */
export const constrainedMessageGenerator = (constraints = {}) => {
  const contentGen = constraints.minLength || constraints.maxLength
    ? fc.string({ 
        minLength: constraints.minLength || 1, 
        maxLength: constraints.maxLength || 500 
      }).filter(content => content.trim().length >= (constraints.minLength || 1))
    : messageContentGenerator;
  
  const timestampGen = constraints.startDate || constraints.endDate
    ? fc.date({ 
        min: constraints.startDate || new Date('2020-01-01'), 
        max: constraints.endDate || new Date() 
      })
    : timestampGenerator;
  
  return fc.record({
    id: messageIdGenerator,
    senderId: constraints.senderId || userIdGenerator,
    receiverId: constraints.receiverId || userIdGenerator,
    content: contentGen,
    timestamp: timestampGen,
    read: constraints.read !== undefined ? fc.constant(constraints.read) : fc.boolean()
  });
};
