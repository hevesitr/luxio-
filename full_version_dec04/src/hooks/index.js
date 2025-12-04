// Export all React Query hooks
export * from './useProfiles';
export * from './useMatches';
export * from './useMessages';
export * from './useVideo';

// Re-export individual hooks for convenience
export { useProfile, useDiscoveryProfiles, useUpdateProfile, useUploadPhoto, useDeletePhoto, usePrefetchDiscovery } from './useProfiles';
export { useMatches, useSwipeHistory, useSwipe, useSuperLike, useUnmatch, useRewind } from './useMatches';
export { useMessages, useConversations, useSendMessage, useMarkAsRead, useDeleteMessage, useTypingIndicator, usePrefetchMessages } from './useMessages';
export { useUserVideo, useVideoUrl, useUserVideoUrl, useUploadVideo, useDeleteVideo, useUpdateVideoMetadata, useCompressVideo, useExtractThumbnail, useGetVideoDuration, useValidateVideo, usePrefetchVideo, usePrefetchUserVideo } from './useVideo';
