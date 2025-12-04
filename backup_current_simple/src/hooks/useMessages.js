import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import MessageService from '../services/MessageService';
import Logger from '../services/Logger';

/**
 * useMessages Hook
 * 
 * Fetches and caches messages for a conversation
 * Automatically handles real-time updates via subscriptions
 * 
 * @param {string} matchId - Match/conversation ID
 * @param {Object} options - Query options
 * @returns {Object} - Query result with messages data
 */
export const useMessages = (matchId, options = {}) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: queryKeys.messages.conversation(matchId),
    queryFn: async () => {
      Logger.debug('Fetching messages', { matchId });
      
      const result = await MessageService.getMessages(matchId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch messages');
      }
      
      // Subscribe to real-time updates
      MessageService.subscribeToMessages(matchId, (newMessage) => {
        queryClient.setQueryData(
          queryKeys.messages.conversation(matchId),
          (oldData) => {
            if (!oldData) return [newMessage];
            
            // Check if message already exists (avoid duplicates)
            const exists = oldData.some((msg) => msg.id === newMessage.id);
            if (exists) return oldData;
            
            return [...oldData, newMessage];
          }
        );
      });
      
      return result.data;
    },
    enabled: !!matchId,
    staleTime: 30 * 1000, // 30 seconds (messages are real-time)
    cacheTime: 5 * 60 * 1000,
    ...options,
  });
};

/**
 * useSendMessage Mutation
 * 
 * Mutation for sending a message
 * Optimistically updates cache before server response
 * 
 * @returns {Object} - Mutation object
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ matchId, senderId, receiverId, content, type = 'text' }) => {
      Logger.debug('Sending message', { matchId, type });
      
      const result = await MessageService.sendMessage(
        matchId,
        senderId,
        receiverId,
        content,
        type
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }
      
      return result.data;
    },
    // Optimistic update
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.messages.conversation(variables.matchId),
      });
      
      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(
        queryKeys.messages.conversation(variables.matchId)
      );
      
      // Optimistically update cache
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        match_id: variables.matchId,
        sender_id: variables.senderId,
        receiver_id: variables.receiverId,
        content: variables.content,
        type: variables.type || 'text',
        created_at: new Date().toISOString(),
        read: false,
        _optimistic: true,
      };
      
      queryClient.setQueryData(
        queryKeys.messages.conversation(variables.matchId),
        (old) => (old ? [...old, optimisticMessage] : [optimisticMessage])
      );
      
      return { previousMessages, optimisticMessage };
    },
    // On error, rollback
    onError: (err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.conversation(variables.matchId),
          context.previousMessages
        );
      }
      Logger.error('Send message error', err);
    },
    // On success, replace optimistic message with real one
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(
        queryKeys.messages.conversation(variables.matchId),
        (old) => {
          if (!old) return [data];
          
          // Replace optimistic message with real one
          return old.map((msg) =>
            msg.id === context.optimisticMessage.id ? data : msg
          );
        }
      );
      
      Logger.success('Message sent');
    },
  });
};

/**
 * useUnreadCount Hook
 * 
 * Fetches and caches unread message count
 * 
 * @param {string} userId - Current user ID
 * @returns {Object} - Query result with unread count
 */
export const useUnreadCount = (userId) => {
  return useQuery({
    queryKey: queryKeys.messages.unread(userId),
    queryFn: async () => {
      Logger.debug('Fetching unread count', { userId });
      
      const result = await MessageService.getUnreadCount(userId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch unread count');
      }
      
      return result.data;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};
