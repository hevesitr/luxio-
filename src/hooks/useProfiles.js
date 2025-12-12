/**
 * React Query hooks for Profile operations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProfileService from '../services/ProfileService';
import BlockingService from '../services/BlockingService';
import Logger from '../services/Logger';
import { queryKeys } from '../config/queryClient';

// Query keys for profiles
export const PROFILE_KEYS = {
  all: ['profiles'],
  discovery: (userId, filters) => [...PROFILE_KEYS.all, 'discovery', userId, filters],
  detail: (userId) => [...PROFILE_KEYS.all, 'detail', userId],
};

/**
 * Get user's own profile
 */
export const useProfile = (userId) => {
  return useQuery({
    queryKey: queryKeys.user.profile(userId),
    queryFn: async () => {
      const result = await ProfileService.getProfile(userId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes for user profile (less frequently changing)
  });
};

/**
 * Get discovery profiles
 */
export const useDiscoveryProfiles = (userId, filters = {}) => {
  return useQuery({
    queryKey: queryKeys.profiles.discovery(userId, filters),
    queryFn: async () => {
      const result = await ProfileService.searchProfiles(filters);
      if (!result.success) throw new Error(result.error);

      // Blokkolás alapján szűrjük a profilokat - Implements 8.4: Implement profile visibility control
      const filteredProfiles = await ProfileService.filterVisibleProfiles(userId, result.data);

      Logger.debug('Discovery profiles filtered for blocking', {
        userId,
        originalCount: result.data.length,
        filteredCount: filteredProfiles.length
      });

      return filteredProfiles;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds for discovery (real-time data)
    refetchOnMount: true,
    retry: (failureCount, error) => {
      // Don't retry on auth errors or rate limiting
      if (error?.message?.includes('unauthorized') || error?.message?.includes('rate_limit')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Update profile mutation
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }) => {
      const result = await ProfileService.updateProfile(userId, updates);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data, { userId }) => {
      // Invalidate and refetch profile
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile(userId) });

      // Update cache optimistically
      queryClient.setQueryData(queryKeys.user.profile(userId), data);

      Logger.success('Profile updated successfully');
    },
    onError: (error) => {
      Logger.error('Failed to update profile', error);
    },
  });
};

/**
 * Upload profile photo mutation
 */
export const useUploadPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, photoUri }) => {
      const result = await ProfileService.uploadProfilePhoto(userId, photoUri);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data, { userId }) => {
      // Invalidate profile to refetch with new photo
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.detail(userId) });
      
      Logger.success('Photo uploaded successfully');
    },
    onError: (error) => {
      Logger.error('Failed to upload photo', error);
    },
  });
};

/**
 * Delete profile photo mutation
 */
export const useDeletePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, photoUrl }) => {
      const result = await ProfileService.deleteProfilePhoto(userId, photoUrl);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data, { userId }) => {
      // Invalidate profile to refetch without deleted photo
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.detail(userId) });
      
      Logger.success('Photo deleted successfully');
    },
    onError: (error) => {
      Logger.error('Failed to delete photo', error);
    },
  });
};

/**
 * Prefetch discovery profiles
 */
export const usePrefetchDiscovery = () => {
  const queryClient = useQueryClient();

  return (userId, filters = {}) => {
    queryClient.prefetchQuery({
      queryKey: PROFILE_KEYS.discovery(userId, filters),
      queryFn: async () => {
        const result = await ProfileService.searchProfiles(filters);
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      staleTime: 30 * 1000,
    });
  };
};
