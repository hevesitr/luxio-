# React Query Integration Guide

## Overview

React Query (@tanstack/react-query) has been integrated into the dating app to provide:
- **Intelligent caching** - Reduce unnecessary API calls
- **Optimistic updates** - Instant UI feedback
- **Background refetching** - Keep data fresh automatically
- **Infinite scroll** - Efficient pagination for messages
- **Request deduplication** - Prevent duplicate API calls
- **Error handling** - Automatic retry logic

## Installation

```bash
npm install @tanstack/react-query --legacy-peer-deps
```

## Architecture

### 1. Query Provider Setup

**File**: `src/context/QueryProvider.js`

The QueryProvider wraps the entire app and provides React Query functionality:

```javascript
import QueryProvider from './src/context/QueryProvider';

<QueryProvider>
  <AuthProvider>
    {/* Rest of app */}
  </AuthProvider>
</QueryProvider>
```

**Configuration**:
- Cache time: 10 minutes
- Stale time: 5 minutes
- Retry: 2 attempts with exponential backoff
- Auto refetch on reconnect

### 2. Custom Hooks

All React Query hooks are organized by feature:

#### Profile Hooks (`src/hooks/useProfiles.js`)

```javascript
import { useProfile, useDiscoveryProfiles, useUpdateProfile } from '../hooks';

// Get user profile
const { data: profile, isLoading } = useProfile(userId);

// Get discovery profiles
const { data: profiles } = useDiscoveryProfiles(userId, filters);

// Update profile
const updateMutation = useUpdateProfile();
updateMutation.mutate({ userId, updates });
```

**Available hooks**:
- `useProfile(userId)` - Get user's profile
- `useDiscoveryProfiles(userId, filters)` - Get discovery feed
- `useUpdateProfile()` - Update profile mutation
- `useUploadPhoto()` - Upload photo mutation
- `useDeletePhoto()` - Delete photo mutation
- `usePrefetchDiscovery()` - Prefetch next batch

#### Match Hooks (`src/hooks/useMatches.js`)

```javascript
import { useMatches, useSwipe, useSuperLike } from '../hooks';

// Get matches
const { data: matches } = useMatches(userId);

// Swipe action
const swipeMutation = useSwipe();
swipeMutation.mutate({ userId, targetUserId, action: 'like' });

// Super like
const superLikeMutation = useSuperLike();
superLikeMutation.mutate({ userId, targetUserId });
```

**Available hooks**:
- `useMatches(userId)` - Get user's matches
- `useSwipeHistory(userId)` - Get swipe history
- `useSwipe()` - Like/pass mutation
- `useSuperLike()` - Super like mutation
- `useUnmatch()` - Unmatch mutation
- `useRewind()` - Rewind last swipe (Premium)

#### Message Hooks (`src/hooks/useMessages.js`)

```javascript
import { useMessages, useSendMessage, useConversations } from '../hooks';

// Get messages with infinite scroll
const {
  data: messagesData,
  fetchNextPage,
  hasNextPage,
} = useMessages(matchId);

// Send message
const sendMutation = useSendMessage();
sendMutation.mutate({ matchId, senderId, content });

// Get conversations
const { data: conversations } = useConversations(userId);
```

**Available hooks**:
- `useMessages(matchId)` - Get messages with infinite scroll
- `useConversations(userId)` - Get conversation list
- `useSendMessage()` - Send message mutation
- `useMarkAsRead()` - Mark message as read
- `useDeleteMessage()` - Delete message mutation
- `useTypingIndicator()` - Update typing status
- `usePrefetchMessages()` - Prefetch messages

#### Video Hooks (`src/hooks/useVideo.js`)

```javascript
import { useUserVideo, useUploadVideo, useVideoUrl } from '../hooks';

// Get user's video
const { data: video } = useUserVideo(userId);

// Upload video
const uploadMutation = useUploadVideo();
uploadMutation.mutate({ userId, videoUri, metadata });

// Get video URL
const { data: videoUrl } = useVideoUrl(videoId, currentUserId);
```

**Available hooks**:
- `useUserVideo(userId)` - Get user's video
- `useVideoUrl(videoId, currentUserId)` - Get signed video URL
- `useUserVideoUrl(userId, currentUserId)` - Get user's video URL
- `usePendingVideos()` - Get pending videos (admin)
- `useUploadVideo()` - Upload video mutation
- `useRecordVideo()` - Record video mutation
- `useDeleteVideo()` - Delete video mutation
- `useCompressVideo()` - Compress video mutation
- `useApproveVideo()` - Approve video (admin)
- `useRejectVideo()` - Reject video (admin)
- `useReportVideo()` - Report video mutation

## Optimized Screens

### HomeScreen.OPTIMIZED.js

**Features**:
- Cached discovery profiles
- Optimistic swipe animations
- Automatic prefetching of next batch
- Match modal with instant feedback
- Gesture-based swiping with Reanimated

**Usage**:
```javascript
import HomeScreen from './src/screens/HomeScreen.OPTIMIZED';
```

### ChatScreen.OPTIMIZED.js

**Features**:
- Infinite scroll for message history
- Optimistic message sending
- Real-time typing indicators
- Auto-mark messages as read
- Keyboard-aware layout

**Usage**:
```javascript
import ChatScreen from './src/screens/ChatScreen.OPTIMIZED';
```

### MatchesScreen.OPTIMIZED.js

**Features**:
- Tabbed interface (Matches / Messages)
- Real-time unread count badges
- Pull-to-refresh
- Optimized list rendering
- Empty states

**Usage**:
```javascript
import MatchesScreen from './src/screens/MatchesScreen.OPTIMIZED';
```

## Query Keys

Query keys are organized hierarchically for easy invalidation:

```javascript
// Profile keys
['profiles']
['profiles', 'list']
['profiles', 'list', { filters }]
['profiles', 'detail', userId]
['profiles', 'discovery', userId, filters]

// Match keys
['matches']
['matches', 'list', userId]
['matches', 'swipes', userId]

// Message keys
['messages']
['messages', 'list', matchId]
['messages', 'conversations', userId]

// Video keys
['videos']
['videos', 'user', userId]
['videos', 'url', videoId]
['videos', 'pending']
```

## Cache Invalidation

React Query automatically invalidates and refetches data when mutations succeed:

```javascript
// After sending a message
queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
queryClient.invalidateQueries({ queryKey: ['messages', 'conversations', userId] });

// After swiping
queryClient.invalidateQueries({ queryKey: ['profiles', 'discovery'] });
queryClient.invalidateQueries({ queryKey: ['matches', 'list', userId] });

// After updating profile
queryClient.invalidateQueries({ queryKey: ['profiles', 'detail', userId] });
```

## Optimistic Updates

Messages use optimistic updates for instant feedback:

```javascript
const sendMutation = useSendMessage();

// Optimistic update
onMutate: async ({ matchId, content }) => {
  // Cancel outgoing refetches
  await queryClient.cancelQueries({ queryKey: ['messages', matchId] });
  
  // Snapshot previous value
  const previousMessages = queryClient.getQueryData(['messages', matchId]);
  
  // Optimistically update
  queryClient.setQueryData(['messages', matchId], (old) => {
    return [optimisticMessage, ...old];
  });
  
  return { previousMessages };
},

// Rollback on error
onError: (error, variables, context) => {
  queryClient.setQueryData(['messages', matchId], context.previousMessages);
}
```

## Performance Optimizations

### 1. Prefetching

Prefetch data before it's needed:

```javascript
const prefetchDiscovery = usePrefetchDiscovery();

// Prefetch when getting close to end
useEffect(() => {
  if (currentIndex >= profiles.length - 3) {
    prefetchDiscovery(userId, filters);
  }
}, [currentIndex, profiles]);
```

### 2. Stale Time

Configure how long data is considered fresh:

```javascript
// Profile data - 2 minutes
useProfile(userId, {
  staleTime: 2 * 60 * 1000,
});

// Discovery profiles - 30 seconds
useDiscoveryProfiles(userId, filters, {
  staleTime: 30 * 1000,
});
```

### 3. Background Refetching

Automatically refetch data at intervals:

```javascript
// Matches - refetch every 30 seconds
useMatches(userId, {
  refetchInterval: 30 * 1000,
});

// Messages - refetch every 5 seconds
useMessages(matchId, {
  refetchInterval: 5 * 1000,
});
```

### 4. Infinite Scroll

Efficient pagination for large lists:

```javascript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useMessages(matchId);

// Flatten pages
const messages = data?.pages?.flat() || [];

// Load more
<FlatList
  data={messages}
  onEndReached={() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }}
/>
```

## Error Handling

React Query provides built-in error handling:

```javascript
const { data, isError, error } = useProfile(userId);

if (isError) {
  return <ErrorMessage error={error} />;
}
```

**Automatic retry**:
- Queries retry 2 times with exponential backoff
- Mutations retry once
- Failed requests are logged automatically

## Migration Guide

### Before (Direct Service Calls)

```javascript
const [profiles, setProfiles] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await ProfileService.getDiscoveryProfiles(userId);
      setProfiles(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  loadProfiles();
}, [userId]);
```

### After (React Query)

```javascript
const { data: profiles, isLoading } = useDiscoveryProfiles(userId);
```

**Benefits**:
- ✅ Automatic caching
- ✅ Background refetching
- ✅ Error handling
- ✅ Loading states
- ✅ Request deduplication
- ✅ 90% less code

## Best Practices

1. **Use query keys consistently** - Follow the hierarchical structure
2. **Invalidate related queries** - When data changes, invalidate dependent queries
3. **Prefetch predictable data** - Improve perceived performance
4. **Configure stale time appropriately** - Balance freshness vs. performance
5. **Use optimistic updates for mutations** - Provide instant feedback
6. **Handle loading and error states** - Provide good UX
7. **Leverage background refetching** - Keep data fresh automatically
8. **Use infinite queries for lists** - Efficient pagination

## Debugging

Enable React Query DevTools (development only):

```javascript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

## Next Steps

1. ✅ React Query installed and configured
2. ✅ Custom hooks created for all services
3. ✅ Optimized screens implemented
4. ⏳ Replace old screens with optimized versions
5. ⏳ Test all functionality
6. ⏳ Monitor performance improvements
7. ⏳ Add React Query DevTools for debugging

## Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Optimistic Updates Guide](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
