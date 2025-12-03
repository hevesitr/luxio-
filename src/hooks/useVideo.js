/**
 * React Query hooks for Video operations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import VideoService from '../services/VideoService';
import Logger from '../services/Logger';

// Query keys
export const VIDEO_KEYS = {
  all: ['videos'],
  user: (userId) => [...VIDEO_KEYS.all, 'user', userId],
  url: (videoId) => [...VIDEO_KEYS.all, 'url', videoId],
  pending: () => [...VIDEO_KEYS.all, 'pending'],
};

/**
 * Get user's video
 */
export const useUserVideo = (userId) => {
  return useQuery({
    queryKey: VIDEO_KEYS.user(userId),
    queryFn: async () => {
      const result = await VideoService.getUserVideo(userId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Get video URL
 */
export const useVideoUrl = (videoId, currentUserId) => {
  return useQuery({
    queryKey: VIDEO_KEYS.url(videoId),
    queryFn: async () => {
      const result = await VideoService.getVideoUrl(videoId, currentUserId);
      if (!result.success) throw new Error(result.error);
      return result.url;
    },
    enabled: !!videoId,
    staleTime: 30 * 60 * 1000, // 30 minutes (signed URLs are valid for 1 hour)
    retry: 1, // Don't retry too much for URLs
  });
};

/**
 * Get user's video URL
 */
export const useUserVideoUrl = (userId, currentUserId) => {
  return useQuery({
    queryKey: [...VIDEO_KEYS.user(userId), 'url'],
    queryFn: async () => {
      const result = await VideoService.getUserVideoUrl(userId, currentUserId);
      if (!result.success) throw new Error(result.error);
      return result.url;
    },
    enabled: !!userId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Get pending videos for moderation (admin only)
 */
export const usePendingVideos = () => {
  return useQuery({
    queryKey: VIDEO_KEYS.pending(),
    queryFn: async () => {
      const result = await VideoService.getPendingVideos();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

/**
 * Upload video mutation
 */
export const useUploadVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, videoUri, metadata }) => {
      const result = await VideoService.uploadVideo(userId, videoUri, metadata);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data, { userId }) => {
      // Invalidate user's video to show new upload
      queryClient.invalidateQueries({ queryKey: VIDEO_KEYS.user(userId) });
      
      // Invalidate pending videos for admin
      queryClient.invalidateQueries({ queryKey: VIDEO_KEYS.pending() });
      
      Logger.success('Video uploaded successfully');
    },
    onError: (error) => {
      Logger.error('Video upload failed', error);
    },
  });
};

/**
 * Record video mutation
 */
export const useRecordVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, duration }) => {
      const result = await VideoService.recordVideo(userId, duration);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data, { userId }) => {
      // Invalidate user's video
      queryClient.invalidateQueries({ queryKey: VIDEO_KEYS.user(userId) });
      
      Logger.success('Video recorded successfully');
    },
    onError: (error) => {
      Logger.error('Video recording failed', error);
    },
  });
};

/**
 * Delete video mutation
 */
export const useDeleteVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, videoId }) => {
      const result = await VideoService.deleteVideo(userId, videoId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data, { userId, videoId }) => {
      // Remove from user's video cache
      queryClient.setQueryData(VIDEO_KEYS.user(userId), null);
      
      // Invalidate video URL cache
      queryClient.invalidateQueries({ queryKey: VIDEO_KEYS.url(videoId) });
      
      Logger.success('Video deleted successfully');
    },
    onError: (error) => {
      Logger.error('Video deletion failed', error);
    },
  });
};

/**
 * Compress video mutation
 */
export const useCompressVideo = () => {
  return useMutation({
    mutationFn: async ({ videoUri, targetSizeMB, onProgress }) => {
      const result = await VideoService.compressVideo(videoUri, targetSizeMB, onProgress);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onError: (error) => {
      Logger.error('Video compression failed', error);
    },
  });
};

/**
 * Approve video mutation (admin only)
 */
export const useApproveVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }) => {
      const result = await VideoService.approveVideo(videoId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data, { videoId }) => {
      // Remove from pending videos
      queryClient.setQueryData(VIDEO_KEYS.pending(), (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter(video => video.id !== videoId);
      });
      
      // Invalidate video URL to refresh with approved status
      queryClient.invalidateQueries({ queryKey: VIDEO_KEYS.url(videoId) });
      
      Logger.success('Video approved');
    },
    onError: (error) => {
      Logger.error('Video approval failed', error);
    },
  });
};

/**
 * Reject video mutation (admin only)
 */
export const useRejectVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, reason }) => {
      const result = await VideoService.rejectVideo(videoId, reason);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data, { videoId }) => {
      // Remove from pending videos
      queryClient.setQueryData(VIDEO_KEYS.pending(), (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter(video => video.id !== videoId);
      });
      
      // Invalidate video URL
      queryClient.invalidateQueries({ queryKey: VIDEO_KEYS.url(videoId) });
      
      Logger.success('Video rejected');
    },
    onError: (error) => {
      Logger.error('Video rejection failed', error);
    },
  });
};

/**
 * Report video mutation
 */
export const useReportVideo = () => {
  return useMutation({
    mutationFn: async ({ videoId, reporterId, reason }) => {
      const result = await VideoService.reportVideo(videoId, reporterId, reason);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      Logger.success('Video reported successfully');
    },
    onError: (error) => {
      Logger.error('Video report failed', error);
    },
  });
};

/**
 * Submit video for moderation mutation
 */
export const useSubmitForModeration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }) => {
      const result = await VideoService.submitForModeration(videoId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data, { videoId }) => {
      // Invalidate pending videos to show resubmitted video
      queryClient.invalidateQueries({ queryKey: VIDEO_KEYS.pending() });
      
      // Invalidate video URL
      queryClient.invalidateQueries({ queryKey: VIDEO_KEYS.url(videoId) });
      
      Logger.success('Video resubmitted for moderation');
    },
    onError: (error) => {
      Logger.error('Video resubmission failed', error);
    },
  });
};
