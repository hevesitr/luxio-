import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import VideoService from '../services/VideoService';
import SupabaseStorageService from '../services/SupabaseStorageService';

// Query keys
export const VIDEO_QUERY_KEYS = {
  userVideo: (userId) => ['userVideo', userId],
  videoUrl: (videoId) => ['videoUrl', videoId],
  userVideoUrl: (userId) => ['userVideoUrl', userId],
  all: () => ['videos'],
};

// Custom hooks for video management

export const useUserVideo = (userId) => {
  return useQuery({
    queryKey: VIDEO_QUERY_KEYS.userVideo(userId),
    queryFn: () => VideoService.getUserVideo(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useVideoUrl = (videoId) => {
  return useQuery({
    queryKey: VIDEO_QUERY_KEYS.videoUrl(videoId),
    queryFn: () => VideoService.getVideoUrl(videoId),
    enabled: !!videoId,
    staleTime: 30 * 60 * 1000, // 30 minutes for URLs
  });
};

export const useUserVideoUrl = (userId) => {
  return useQuery({
    queryKey: VIDEO_QUERY_KEYS.userVideoUrl(userId),
    queryFn: () => VideoService.getUserVideoUrl(userId),
    enabled: !!userId,
    staleTime: 30 * 60 * 1000, // 30 minutes for URLs
  });
};

export const useUploadVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uri, userId, metadata = {} }) =>
      VideoService.uploadVideo(uri, userId, metadata),
    onSuccess: (data, { userId }) => {
      // Invalidate user video data
      queryClient.invalidateQueries({ queryKey: VIDEO_QUERY_KEYS.userVideo(userId) });
      queryClient.invalidateQueries({ queryKey: VIDEO_QUERY_KEYS.userVideoUrl(userId) });
    },
  });
};

export const useDeleteVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ videoId, userId }) => VideoService.deleteVideo(videoId),
    onSuccess: (data, { userId }) => {
      // Invalidate user video data
      queryClient.invalidateQueries({ queryKey: VIDEO_QUERY_KEYS.userVideo(userId) });
      queryClient.invalidateQueries({ queryKey: VIDEO_QUERY_KEYS.userVideoUrl(userId) });
    },
  });
};

export const useUpdateVideoMetadata = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ videoId, metadata }) => VideoService.updateVideoMetadata(videoId, metadata),
    onSuccess: (data, { userId }) => {
      // Invalidate user video data
      if (userId) {
        queryClient.invalidateQueries({ queryKey: VIDEO_QUERY_KEYS.userVideo(userId) });
      }
    },
  });
};

export const useCompressVideo = () => {
  return useMutation({
    mutationFn: ({ uri, options = {} }) => VideoService.compressVideo(uri, options),
  });
};

export const useExtractThumbnail = () => {
  return useMutation({
    mutationFn: ({ videoUri, timestamp = 0 }) => VideoService.extractThumbnail(videoUri, timestamp),
  });
};

export const useGetVideoDuration = () => {
  return useMutation({
    mutationFn: ({ uri }) => VideoService.getVideoDuration(uri),
  });
};

export const useValidateVideo = () => {
  return useMutation({
    mutationFn: ({ uri }) => VideoService.validateVideo(uri),
  });
};

export const usePrefetchVideo = (videoId) => {
  const queryClient = useQueryClient();

  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey: VIDEO_QUERY_KEYS.videoUrl(videoId),
      queryFn: () => VideoService.getVideoUrl(videoId),
      staleTime: 30 * 60 * 1000,
    });
  };

  return { prefetch };
};

export const usePrefetchUserVideo = (userId) => {
  const queryClient = useQueryClient();

  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey: VIDEO_QUERY_KEYS.userVideo(userId),
      queryFn: () => VideoService.getUserVideo(userId),
      staleTime: 10 * 60 * 1000,
    });

    queryClient.prefetchQuery({
      queryKey: VIDEO_QUERY_KEYS.userVideoUrl(userId),
      queryFn: () => VideoService.getUserVideoUrl(userId),
      staleTime: 30 * 60 * 1000,
    });
  };

  return { prefetch };
};
