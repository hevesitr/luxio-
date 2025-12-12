/**
 * React Query Hooks Index
 * Central export for all custom hooks
 */

// Profile hooks
export {
  useProfile,
  useDiscoveryProfiles,
  useUpdateProfile,
  useUploadPhoto,
  useDeletePhoto,
  usePrefetchDiscovery,
  PROFILE_KEYS,
} from './useProfiles';

// Match hooks
export {
  useMatches,
  useSwipeHistory,
  useSwipe,
  useSuperLike,
  useUnmatch,
  useRewind,
  MATCH_KEYS,
} from './useMatches';

// Message hooks
export {
  useMessages,
  useConversations,
  useSendMessage,
  useMarkAsRead,
  useDeleteMessage,
  useTypingIndicator,
  usePrefetchMessages,
  MESSAGE_KEYS,
} from './useMessages';

// Video hooks
export {
  useUserVideo,
  useVideoUrl,
  useUserVideoUrl,
  usePendingVideos,
  useUploadVideo,
  useRecordVideo,
  useDeleteVideo,
  useCompressVideo,
  useApproveVideo,
  useRejectVideo,
  useReportVideo,
  useSubmitForModeration,
  VIDEO_KEYS,
} from './useVideo';

// Network hooks
export { default as useNetwork } from './useNetwork';