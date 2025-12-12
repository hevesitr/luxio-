/**
 * React Query hooks for Match operations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MatchService from '../services/MatchService';
import Logger from '../services/Logger';

// Query keys
export const MATCH_KEYS = {
  all: ['matches'],
  lists: () => [...MATCH_KEYS.all, 'list'],
  list: (userId) => [...MATCH_KEYS.lists(), userId],
  details: () => [...MATCH_KEYS.all, 'detail'],
  detail: (matchId) => [...MATCH_KEYS.details(), matchId],
  swipes: (userId) => [...MATCH_KEYS.all, 'swipes', userId],
};

/**
 * Get user's matches
 */
export const useMatches = (userId) => {
  return useQuery({
    queryKey: MATCH_KEYS.list(userId),
    queryFn: async () => {
      const result = await MatchService.getMatches(userId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

/**
 * Get swipe history
 */
export const useSwipeHistory = (userId) => {
  return useQuery({
    queryKey: MATCH_KEYS.swipes(userId),
    queryFn: async () => {
      const result = await MatchService.getSwipeHistory(userId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Swipe (like/pass) mutation
 */
export const useSwipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, targetUserId, action }) => {
      let result;
      if (action === 'like') {
        result = await MatchService.likeProfile(userId, targetUserId);
      } else {
        result = await MatchService.passProfile(userId, targetUserId);
      }
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data, { userId, targetUserId, action }) => {
      // Invalidate matches if a new match was created
      if (data.matched) {
        queryClient.invalidateQueries({ queryKey: MATCH_KEYS.list(userId) });
        Logger.success('New match created! 🎉');
      }

      // Invalidate swipe history
      queryClient.invalidateQueries({ queryKey: MATCH_KEYS.swipes(userId) });
      
      // Invalidate discovery to remove swiped profile
      queryClient.invalidateQueries({ queryKey: ['profiles', 'discovery'] });
      
      Logger.debug(`${action} action completed`, { targetUserId });
    },
    onError: (error) => {
      Logger.error('Swipe action failed', error);
    },
  });
};

/**
 * Super like mutation
 */
export const useSuperLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, targetUserId }) => {
      const result = await MatchService.superLike(userId, targetUserId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data, { userId, targetUserId }) => {
      // Invalidate matches if a new match was created
      if (data.matched) {
        queryClient.invalidateQueries({ queryKey: MATCH_KEYS.list(userId) });
        Logger.success('Super like created a match! ⭐');
      }

      // Invalidate swipe history
      queryClient.invalidateQueries({ queryKey: MATCH_KEYS.swipes(userId) });
      
      // Invalidate discovery
      queryClient.invalidateQueries({ queryKey: ['profiles', 'discovery'] });
      
      Logger.success('Super like sent! ⭐');
    },
    onError: (error) => {
      Logger.error('Super like failed', error);
    },
  });
};

/**
 * Unmatch mutation
 */
export const useUnmatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, matchId }) => {
      const result = await MatchService.unmatch(userId, matchId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data, { userId, matchId }) => {
      // Remove match from cache
      queryClient.setQueryData(MATCH_KEYS.list(userId), (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter(match => match.id !== matchId);
      });
      
      // Invalidate messages for this match
      queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
      
      Logger.success('Unmatched successfully');
    },
    onError: (error) => {
      Logger.error('Unmatch failed', error);
    },
  });
};

/**
 * Rewind last swipe mutation (Premium feature)
 */
export const useRewind = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }) => {
      const result = await MatchService.rewindLastSwipe(userId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data, { userId }) => {
      // Invalidate swipe history
      queryClient.invalidateQueries({ queryKey: MATCH_KEYS.swipes(userId) });
      
      // Invalidate discovery to show rewound profile again
      queryClient.invalidateQueries({ queryKey: ['profiles', 'discovery'] });
      
      Logger.success('Last swipe rewound! ↶');
    },
    onError: (error) => {
      Logger.error('Rewind failed', error);
    },
  });
};
