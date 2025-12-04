/**
 * React Query hooks for Profile operations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProfileService from '../services/ProfileService';
import Logger from '../services/Logger';

// Query keys
export const PROFILE_KEYS = {
  all: ['profiles'],
  lists: () => [...PROFILE_KEYS.all, 'list'],
  list: (filters) => [...PROFILE_KEYS.lists(), { filters }],
  details: () => [...PROFILE_KEYS.all, 'detail'],
  detail: (id) => [...PROFILE_KEYS.details(), id],
  discovery: (userId, filters) => [...PROFILE_KEYS.all, 'discovery', userId, filters],
};

/**
 * Get user's own profile
 */
export const useProfile = (userId) => {
  return useQuery({
    queryKey: PROFILE_KEYS.detail(userId),
    queryFn: async () => {
      const result = await ProfileService.getProfile(userId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Get discovery profiles
 */
export const useDiscoveryProfiles = (userId, filters = {}) => {
  return useQuery({
    queryKey: PROFILE_KEYS.discovery(userId, filters),
    queryFn: async () => {
      const result = await ProfileService.searchProfiles(filters);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true,
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
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.detail(userId) });
      
      // Update cache optimistically
      queryClient.setQueryData(PROFILE_KEYS.detail(userId), data);
      
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
