import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MatchService from '../services/MatchService';
import SupabaseMatchService from '../services/SupabaseMatchService';

// Query keys
export const MATCH_QUERY_KEYS = {
  matches: (userId) => ['matches', userId],
  swipeHistory: (userId) => ['swipeHistory', userId],
  all: () => ['matches'],
};

// Custom hooks for match management

export const useMatches = (userId) => {
  return useQuery({
    queryKey: MATCH_QUERY_KEYS.matches(userId),
    queryFn: () => MatchService.getMatches(userId),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useSwipeHistory = (userId) => {
  return useQuery({
    queryKey: MATCH_QUERY_KEYS.swipeHistory(userId),
    queryFn: () => MatchService.getSwipeHistory(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSwipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, targetUserId, action, targetProfile }) =>
      SupabaseMatchService.saveSwipe(userId, targetUserId, action, targetProfile),
    onMutate: async ({ userId, targetUserId, action }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: MATCH_QUERY_KEYS.matches(userId) });

      // Snapshot the previous value
      const previousMatches = queryClient.getQueryData(MATCH_QUERY_KEYS.matches(userId));

      // Optimistically update
      if (action === 'like') {
        queryClient.setQueryData(MATCH_QUERY_KEYS.matches(userId), (old) => {
          if (!old) return old;
          // Add optimistic match if it's a mutual like
          return [...old, { id: targetUserId, matchedAt: new Date().toISOString() }];
        });
      }

      return { previousMatches };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMatches) {
        queryClient.setQueryData(MATCH_QUERY_KEYS.matches(variables.userId), context.previousMatches);
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: MATCH_QUERY_KEYS.matches(variables.userId) });
      queryClient.invalidateQueries({ queryKey: MATCH_QUERY_KEYS.swipeHistory(variables.userId) });
    },
  });
};

export const useSuperLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, targetUserId, targetProfile }) =>
      SupabaseMatchService.saveSuperLike(userId, targetUserId, targetProfile),
    onMutate: async ({ userId, targetUserId }) => {
      await queryClient.cancelQueries({ queryKey: MATCH_QUERY_KEYS.matches(userId) });
      const previousMatches = queryClient.getQueryData(MATCH_QUERY_KEYS.matches(userId));

      // Optimistically add super like match
      queryClient.setQueryData(MATCH_QUERY_KEYS.matches(userId), (old) => {
        if (!old) return old;
        return [...old, {
          id: targetUserId,
          matchedAt: new Date().toISOString(),
          superLike: true
        }];
      });

      return { previousMatches };
    },
    onError: (err, variables, context) => {
      if (context?.previousMatches) {
        queryClient.setQueryData(MATCH_QUERY_KEYS.matches(variables.userId), context.previousMatches);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: MATCH_QUERY_KEYS.matches(variables.userId) });
      queryClient.invalidateQueries({ queryKey: MATCH_QUERY_KEYS.swipeHistory(variables.userId) });
    },
  });
};

export const useUnmatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, matchId }) => SupabaseMatchService.unmatch(userId, matchId),
    onMutate: async ({ userId, matchId }) => {
      await queryClient.cancelQueries({ queryKey: MATCH_QUERY_KEYS.matches(userId) });
      const previousMatches = queryClient.getQueryData(MATCH_QUERY_KEYS.matches(userId));

      // Optimistically remove match
      queryClient.setQueryData(MATCH_QUERY_KEYS.matches(userId), (old) => {
        if (!old) return old;
        return old.filter(match => match.id !== matchId);
      });

      return { previousMatches };
    },
    onError: (err, variables, context) => {
      if (context?.previousMatches) {
        queryClient.setQueryData(MATCH_QUERY_KEYS.matches(variables.userId), context.previousMatches);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: MATCH_QUERY_KEYS.matches(variables.userId) });
    },
  });
};

export const useRewind = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, swipeId }) => SupabaseMatchService.rewindSwipe(userId, swipeId),
    onSuccess: (data, { userId }) => {
      // Invalidate both matches and swipe history
      queryClient.invalidateQueries({ queryKey: MATCH_QUERY_KEYS.matches(userId) });
      queryClient.invalidateQueries({ queryKey: MATCH_QUERY_KEYS.swipeHistory(userId) });
    },
  });
};
