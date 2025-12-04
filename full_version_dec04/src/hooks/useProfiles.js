import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProfileService from '../services/ProfileService';
import SupabaseStorageService from '../services/SupabaseStorageService';

// Query keys
export const PROFILE_QUERY_KEYS = {
  profile: (userId) => ['profile', userId],
  discoveryProfiles: (userId, filters) => ['discoveryProfiles', userId, filters],
  all: () => ['profiles'],
};

// Custom hooks for profile management

export const useProfile = (userId) => {
  return useQuery({
    queryKey: PROFILE_QUERY_KEYS.profile(userId),
    queryFn: () => ProfileService.getProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDiscoveryProfiles = (userId, filters = {}) => {
  return useQuery({
    queryKey: PROFILE_QUERY_KEYS.discoveryProfiles(userId, filters),
    queryFn: () => ProfileService.getDiscoveryProfiles(userId, filters),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes for discovery
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, profileData }) => ProfileService.updateProfile(userId, profileData),
    onSuccess: (data, { userId }) => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.profile(userId) });
      // Also invalidate discovery profiles as the user's profile changed
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.all() });
    },
  });
};

export const useUploadPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uri, userId, index }) => SupabaseStorageService.uploadPhoto(uri, userId, index),
    onSuccess: (data, { userId }) => {
      // Invalidate profile data to refetch with new photo
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.profile(userId) });
    },
  });
};

export const useDeletePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bucket, path }) => SupabaseStorageService.deleteFile(bucket, path),
    onSuccess: (data, { userId }) => {
      // Invalidate profile data to refetch without deleted photo
      if (userId) {
        queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.profile(userId) });
      }
    },
  });
};

export const usePrefetchDiscovery = (userId, filters = {}) => {
  const queryClient = useQueryClient();

  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey: PROFILE_QUERY_KEYS.discoveryProfiles(userId, filters),
      queryFn: () => ProfileService.getDiscoveryProfiles(userId, filters),
      staleTime: 2 * 60 * 1000,
    });
  };

  return { prefetch };
};
