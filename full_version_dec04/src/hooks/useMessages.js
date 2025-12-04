import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import MessageService from '../services/MessageService';

// Query keys
export const MESSAGE_QUERY_KEYS = {
  messages: (matchId) => ['messages', matchId],
  conversations: (userId) => ['conversations', userId],
  typing: (matchId, userId) => ['typing', matchId, userId],
  all: () => ['messages'],
};

// Custom hooks for message management

export const useMessages = (matchId) => {
  return useInfiniteQuery({
    queryKey: MESSAGE_QUERY_KEYS.messages(matchId),
    queryFn: ({ pageParam = 0 }) => MessageService.getMessages(matchId, pageParam, 20),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === 20 ? pages.length * 20 : undefined;
    },
    enabled: !!matchId,
    staleTime: 30 * 1000, // 30 seconds for messages
  });
};

export const useConversations = (userId) => {
  return useQuery({
    queryKey: MESSAGE_QUERY_KEYS.conversations(userId),
    queryFn: () => MessageService.getConversations(userId),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, message, senderId }) =>
      MessageService.sendMessage(matchId, message, senderId),
    onMutate: async ({ matchId, message, senderId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: MESSAGE_QUERY_KEYS.messages(matchId) });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(MESSAGE_QUERY_KEYS.messages(matchId));

      // Optimistically add the message
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content: message,
        senderId,
        timestamp: new Date().toISOString(),
        status: 'sending',
      };

      queryClient.setQueryData(MESSAGE_QUERY_KEYS.messages(matchId), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page, index) =>
            index === 0 ? [optimisticMessage, ...page] : page
          ),
        };
      });

      return { previousMessages, optimisticMessage };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousMessages) {
        queryClient.setQueryData(MESSAGE_QUERY_KEYS.messages(variables.matchId), context.previousMessages);
      }
    },
    onSuccess: (data, variables) => {
      // Update the optimistic message with real data
      queryClient.setQueryData(MESSAGE_QUERY_KEYS.messages(variables.matchId), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.map((msg) =>
              msg.id.startsWith('temp-') && msg.content === variables.message
                ? { ...msg, ...data, status: 'sent' }
                : msg
            )
          ),
        };
      });

      // Invalidate conversations to update last message
      queryClient.invalidateQueries({ queryKey: MESSAGE_QUERY_KEYS.conversations(variables.senderId) });
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, userId }) => MessageService.markAsRead(matchId, userId),
    onSuccess: (data, { matchId, userId }) => {
      // Update conversations to mark as read
      queryClient.invalidateQueries({ queryKey: MESSAGE_QUERY_KEYS.conversations(userId) });
      // Also invalidate messages if needed
      queryClient.invalidateQueries({ queryKey: MESSAGE_QUERY_KEYS.messages(matchId) });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, matchId }) => MessageService.deleteMessage(messageId),
    onMutate: async ({ messageId, matchId }) => {
      await queryClient.cancelQueries({ queryKey: MESSAGE_QUERY_KEYS.messages(matchId) });
      const previousMessages = queryClient.getQueryData(MESSAGE_QUERY_KEYS.messages(matchId));

      // Optimistically remove message
      queryClient.setQueryData(MESSAGE_QUERY_KEYS.messages(matchId), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.filter((msg) => msg.id !== messageId)
          ),
        };
      });

      return { previousMessages };
    },
    onError: (err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(MESSAGE_QUERY_KEYS.messages(variables.matchId), context.previousMessages);
      }
    },
    onSuccess: (data, { matchId, userId }) => {
      // Invalidate conversations to update last message
      if (userId) {
        queryClient.invalidateQueries({ queryKey: MESSAGE_QUERY_KEYS.conversations(userId) });
      }
    },
  });
};

export const useTypingIndicator = (matchId, userId) => {
  return useQuery({
    queryKey: MESSAGE_QUERY_KEYS.typing(matchId, userId),
    queryFn: () => MessageService.getTypingStatus(matchId, userId),
    enabled: !!matchId && !!userId,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 5000, // Poll every 5 seconds
  });
};

export const usePrefetchMessages = (matchId) => {
  const queryClient = useQueryClient();

  const prefetch = () => {
    queryClient.prefetchInfiniteQuery({
      queryKey: MESSAGE_QUERY_KEYS.messages(matchId),
      queryFn: ({ pageParam = 0 }) => MessageService.getMessages(matchId, pageParam, 20),
      staleTime: 30 * 1000,
    });
  };

  return { prefetch };
};
