import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import SupabaseMatchService from '../services/SupabaseMatchService';
import Logger from '../services/Logger';

/**
 * useDiscoveryProfiles Hook
 * 
 * Fetches and caches discovery feed profiles with React Query
 * Automatically handles caching, refetching, and error states
 * 
 * @param {string} userId - Current user ID
 * @param {Object} filters - Discovery filters
 * @returns {Object} - Query result with profiles data
 */
export const useDiscoveryProfiles = (userId, filters = {}) => {
  return useQuery({
    queryKey: queryKeys.profiles.discovery(userId, filters),
    queryFn: async () => {
      Logger.debug('Fetching discovery profiles', { userId, filters });
      
      const result = await SupabaseMatchService.getDiscoveryFeed(userId, filters);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch profiles');
      }
      
      return result.data;
    },
    enabled: !!userId, // Only run if userId exists
    staleTime: 3 * 60 * 1000, // 3 minutes (profiles change frequently)
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * useProfileDetail Hook
 * 
 * Fetches and caches a single profile's details
 * 
 * @param {string} profileId - Profile ID to fetch
 * @returns {Object} - Query result with profile data
 */
export const useProfileDetail = (profileId) => {
  return useQuery({
    queryKey: queryKeys.profiles.detail(profileId),
    queryFn: async () => {
      Logger.debug('Fetching profile detail', { profileId });
      
      const result = await SupabaseMatchService.getProfile(profileId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch profile');
      }
      
      return result.data;
    },
    enabled: !!profileId,
    staleTime: 10 * 60 * 1000, // 10 minutes (profile details don't change often)
  });
};

/**
 * useMatches Hook
 * 
 * Fetches and caches user's matches
 * 
 * @param {string} userId - Current user ID
 * @returns {Object} - Query result with matches data
 */
export const useMatches = (userId) => {
  return useQuery({
    queryKey: queryKeys.profiles.matches(userId),
    queryFn: async () => {
      Logger.debug('Fetching matches', { userId });
      
      const result = await SupabaseMatchService.getMatches(userId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch matches');
      }
      
      return result.data;
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute (matches are important, keep fresh)
    cacheTime: 5 * 60 * 1000,
  });
};

/**
 * useSaveLike Mutation
 * 
 * Mutation for saving a like/swipe
 * Invalidates discovery feed cache on success
 * 
 * @returns {Object} - Mutation object
 */
export const useSaveLike = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, profileId }) => {
      Logger.debug('Saving like', { userId, profileId });
      
      const result = await SupabaseMatchService.saveLike(userId, profileId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save like');
      }
      
      return result;
    },
    onSuccess: (data, variables) => {
      // Invalidate discovery feed to remove liked profile
      queryClient.invalidateQueries({
        queryKey: queryKeys.profiles.discovery(variables.userId),
      });
      
      // If it's a match, invalidate matches cache
      if (data.isMatch) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.profiles.matches(variables.userId),
        });
      }
      
      Logger.success('Like saved', { isMatch: data.isMatch });
    },
    onError: (error) => {
      Logger.error('Save like error', error);
    },
  });
};

/**
 * useSavePass Mutation
 * 
 * Mutation for saving a pass/dislike
 * Invalidates discovery feed cache on success
 * 
 * @returns {Object} - Mutation object
 */
export const useSavePass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, profileId }) => {
      Logger.debug('Saving pass', { userId, profileId });
      
      const result = await SupabaseMatchService.savePass(userId, profileId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save pass');
      }
      
      return result;
    },
    onSuccess: (data, variables) => {
      // Invalidate discovery feed to remove passed profile
      queryClient.invalidateQueries({
        queryKey: queryKeys.profiles.discovery(variables.userId),
      });
      
      Logger.success('Pass saved');
    },
    onError: (error) => {
      Logger.error('Save pass error', error);
    },
  });
};
