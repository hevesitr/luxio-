# React Query Quick Start Guide

## 🚀 Gyors Használat

### 1. Profil Lekérése
```javascript
import { useProfile } from '../hooks';

function ProfileScreen() {
  const { data: profile, isLoading, isError } = useProfile(userId);
  
  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage />;
  
  return <ProfileView profile={profile} />;
}
```

### 2. Discovery Profiles
```javascript
import { useDiscoveryProfiles } from '../hooks';

function HomeScreen() {
  const { data: profiles, isLoading } = useDiscoveryProfiles(userId, {
    minAge: 18,
    maxAge: 35,
    gender: 'female',
  });
  
  return <SwipeCards profiles={profiles} />;
}
```

### 3. Swipe Művelet
```javascript
import { useSwipe } from '../hooks';

function SwipeButton() {
  const swipeMutation = useSwipe();
  
  const handleLike = async () => {
    const result = await swipeMutation.mutateAsync({
      userId: currentUserId,
      targetUserId: profileId,
      action: 'like',
    });
    
    if (result.matched) {
      showMatchModal();
    }
  };
  
  return <Button onPress={handleLike} loading={swipeMutation.isLoading} />;
}
```

### 4. Üzenetek (Infinite Scroll)
```javascript
import { useMessages, useSendMessage } from '../hooks';

function ChatScreen({ matchId }) {
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
  } = useMessages(matchId);
  
  const sendMutation = useSendMessage();
  
  const messages = messagesData?.pages?.flat() || [];
  
  const handleSend = async (text) => {
    await sendMutation.mutateAsync({
      matchId,
      senderId: userId,
      content: text,
    });
  };
  
  return (
    <FlatList
      data={messages}
      onEndReached={() => hasNextPage && fetchNextPage()}
      renderItem={({ item }) => <MessageBubble message={item} />}
    />
  );
}
```

### 5. Matches Lista
```javascript
import { useMatches } from '../hooks';

function MatchesScreen() {
  const { data: matches, isLoading, refetch } = useMatches(userId);
  
  return (
    <FlatList
      data={matches}
      refreshing={isLoading}
      onRefresh={refetch}
      renderItem={({ item }) => <MatchCard match={item} />}
    />
  );
}
```

### 6. Profil Frissítés
```javascript
import { useUpdateProfile } from '../hooks';

function EditProfileScreen() {
  const updateMutation = useUpdateProfile();
  
  const handleSave = async (updates) => {
    await updateMutation.mutateAsync({
      userId,
      updates: {
        bio: 'New bio',
        interests: ['music', 'travel'],
      },
    });
  };
  
  return <EditForm onSave={handleSave} loading={updateMutation.isLoading} />;
}
```

### 7. Videó Feltöltés
```javascript
import { useUploadVideo } from '../hooks';

function VideoUploadScreen() {
  const uploadMutation = useUploadVideo();
  
  const handleUpload = async (videoUri) => {
    await uploadMutation.mutateAsync({
      userId,
      videoUri,
      metadata: { duration: 30 },
    });
  };
  
  return <VideoUploader onUpload={handleUpload} />;
}
```

## 📊 Query States

### Loading State
```javascript
const { data, isLoading, isFetching } = useProfile(userId);

if (isLoading) return <LoadingSpinner />; // Initial load
if (isFetching) return <RefreshIndicator />; // Background refetch
```

### Error State
```javascript
const { data, isError, error } = useProfile(userId);

if (isError) {
  return <ErrorMessage message={error.message} />;
}
```

### Success State
```javascript
const { data, isSuccess } = useProfile(userId);

if (isSuccess) {
  return <ProfileView profile={data} />;
}
```

## 🔄 Mutation States

### Loading
```javascript
const mutation = useUpdateProfile();

<Button 
  onPress={handleUpdate}
  loading={mutation.isLoading}
  disabled={mutation.isLoading}
/>
```

### Success
```javascript
const mutation = useUpdateProfile();

useEffect(() => {
  if (mutation.isSuccess) {
    Alert.alert('Success', 'Profile updated!');
  }
}, [mutation.isSuccess]);
```

### Error
```javascript
const mutation = useUpdateProfile();

useEffect(() => {
  if (mutation.isError) {
    Alert.alert('Error', mutation.error.message);
  }
}, [mutation.isError]);
```

## 🎯 Best Practices

### 1. Enabled Option
```javascript
// Only fetch when userId is available
const { data } = useProfile(userId, {
  enabled: !!userId,
});
```

### 2. Stale Time
```javascript
// Cache for 5 minutes
const { data } = useProfile(userId, {
  staleTime: 5 * 60 * 1000,
});
```

### 3. Refetch Interval
```javascript
// Auto-refetch every 30 seconds
const { data } = useMatches(userId, {
  refetchInterval: 30 * 1000,
});
```

### 4. Optimistic Updates
```javascript
const mutation = useSendMessage();

// Message appears instantly, rolls back on error
await mutation.mutateAsync({
  matchId,
  senderId: userId,
  content: text,
});
```

### 5. Prefetching
```javascript
const prefetch = usePrefetchDiscovery();

// Prefetch next batch
useEffect(() => {
  if (currentIndex >= profiles.length - 3) {
    prefetch(userId, filters);
  }
}, [currentIndex]);
```

## 🔧 Debugging

### Check Cache
```javascript
import { queryClient } from '../context/QueryProvider';

// Get cached data
const cachedProfile = queryClient.getQueryData(['profiles', 'detail', userId]);

// Invalidate cache
queryClient.invalidateQueries({ queryKey: ['profiles'] });

// Clear cache
queryClient.clear();
```

### Logging
```javascript
// All hooks automatically log errors
// Check console for React Query logs
```

## 📚 Összes Hook

### Profile Hooks
- `useProfile(userId)`
- `useDiscoveryProfiles(userId, filters)`
- `useUpdateProfile()`
- `useUploadPhoto()`
- `useDeletePhoto()`
- `usePrefetchDiscovery()`

### Match Hooks
- `useMatches(userId)`
- `useSwipeHistory(userId)`
- `useSwipe()`
- `useSuperLike()`
- `useUnmatch()`
- `useRewind()`

### Message Hooks
- `useMessages(matchId)`
- `useConversations(userId)`
- `useSendMessage()`
- `useMarkAsRead()`
- `useDeleteMessage()`
- `useTypingIndicator()`
- `usePrefetchMessages()`

### Video Hooks
- `useUserVideo(userId)`
- `useVideoUrl(videoId)`
- `useUserVideoUrl(userId)`
- `usePendingVideos()`
- `useUploadVideo()`
- `useRecordVideo()`
- `useDeleteVideo()`
- `useCompressVideo()`
- `useApproveVideo()`
- `useRejectVideo()`
- `useReportVideo()`
- `useSubmitForModeration()`

## 🎉 Kész!

Most már használhatod a React Query hooks-okat az egész appban!

Részletes dokumentáció: `REACT_QUERY_INTEGRATION.md`
