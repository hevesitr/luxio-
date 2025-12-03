# Video Profile Features - Implementation Guide

## Overview

Video profile functionality has been implemented for the Dating Application. Users can now upload, record, and view short video clips on profiles.

## Features Implemented

### ✅ Core Features
- Video upload from device (max 50MB, MP4 format)
- In-app video recording (max 30 seconds)
- Automatic video compression (target 10MB, min 720p)
- Video playback with autoplay and mute/unmute
- Video moderation system
- Video reporting functionality

### 📦 Components Created

#### Services
- `src/services/VideoService.js` - Main video service with all video operations

#### Components
- `src/components/video/VideoPlayer.js` - Video playback component
- `src/components/video/VideoRecorder.js` - In-app video recording
- `src/components/video/VideoPreview.js` - Preview recorded videos
- `src/components/video/VideoUploadSection.js` - Profile video upload section
- `src/components/video/ProfileVideoCard.js` - Video display for discovery feed
- `src/components/video/VideoReportButton.js` - Report inappropriate videos

#### Screens
- `src/screens/admin/VideoModerationScreen.js` - Admin moderation interface

### 🗄️ Database Schema

Created `supabase/video-schema.sql` with:
- `videos` table with moderation support
- RLS policies for secure access
- Automatic timestamp triggers
- Cascade deletion on account removal

### 📁 Storage Setup

Created `supabase/video-storage-setup.sql` with:
- Storage policies for the `videos` bucket
- User-specific upload/read/delete permissions
- Approved video visibility for other users

## Manual Setup Required

### 1. Supabase Dashboard Setup

#### Create Videos Bucket
1. Go to Supabase Dashboard → Storage
2. Create new bucket named `videos`
3. Set bucket to **Private** (not public)
4. Click "Save"

#### Apply Storage Policies
Run the SQL from `supabase/video-storage-setup.sql` in the SQL Editor

#### Create Database Schema
Run the SQL from `supabase/video-schema.sql` in the SQL Editor

### 2. Environment Variables

Ensure these are set in your `.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

## Usage Examples

### Adding Video Upload to Profile Screen

```javascript
import { VideoUploadSection } from '../components/video';

// In your ProfileScreen component
<VideoUploadSection
  userId={profile.id}
  onVideoUpdate={(video) => {
    console.log('Video updated:', video);
  }}
/>
```

### Displaying Video in Discovery Feed

```javascript
import { ProfileVideoCard } from '../components/video';

// In your HomeScreen/DiscoveryScreen
<ProfileVideoCard
  userId={profile.id}
  currentUserId={currentUser.id}
  isActive={isCurrentCard}
  onVideoLoad={(video) => console.log('Video loaded')}
  onVideoError={(error) => console.log('Video error')}
/>
```

### Using Video Player Directly

```javascript
import { VideoPlayer } from '../components/video';

<VideoPlayer
  videoUrl={videoUrl}
  autoplay={true}
  muted={true}
  onTap={() => console.log('Video tapped')}
  onError={(error) => console.log('Error:', error)}
  style={{ width: '100%', height: 400 }}
/>
```

### Adding Video Report Button

```javascript
import { VideoReportButton } from '../components/video';

<VideoReportButton
  videoId={video.id}
  userId={currentUser.id}
  style={{ position: 'absolute', top: 10, right: 10 }}
/>
```

## Video Service API

### Upload Video
```javascript
const result = await VideoService.uploadVideo(userId, videoUri, {
  duration: 25,
  resolution: '720p'
});
```

### Get User's Video
```javascript
const result = await VideoService.getUserVideo(userId);
```

### Get Video URL
```javascript
const result = await VideoService.getVideoUrl(videoId, currentUserId);
```

### Delete Video
```javascript
const result = await VideoService.deleteVideo(userId, videoId);
```

### Compress Video
```javascript
const result = await VideoService.compressVideo(videoUri, 10);
```

### Moderation Operations
```javascript
// Get pending videos
const result = await VideoService.getPendingVideos();

// Approve video
const result = await VideoService.approveVideo(videoId);

// Reject video
const result = await VideoService.rejectVideo(videoId, reason);

// Report video
const result = await VideoService.reportVideo(videoId, reporterId, reason);
```

## Video Constraints

- **Format**: MP4 only
- **Max Upload Size**: 50MB
- **Max Compressed Size**: 10MB
- **Max Duration**: 30 seconds
- **Min Resolution**: 720p
- **Moderation**: Required before display

## Moderation Workflow

1. User uploads/records video
2. Video is saved with status `pending`
3. Video is NOT visible to other users
4. Admin reviews video in VideoModerationScreen
5. Admin approves or rejects with reason
6. If approved, video becomes visible
7. If rejected, user is notified with reason

## Testing Checklist

### Manual Testing Required

- [ ] Upload video from device
- [ ] Record video in-app
- [ ] Test 30-second auto-stop
- [ ] Test video compression
- [ ] Test video playback
- [ ] Test autoplay on mute
- [ ] Test tap to unmute
- [ ] Test video deletion
- [ ] Test video replacement
- [ ] Test moderation approval
- [ ] Test moderation rejection
- [ ] Test video reporting
- [ ] Test on iOS device
- [ ] Test on Android device

### Known Limitations

1. **FFmpeg Deprecated**: The `ffmpeg-kit-react-native` package is deprecated. Consider migrating to a maintained alternative in the future.

2. **Video Metadata**: Duration and resolution detection is simplified. For production, consider using FFmpeg for accurate metadata extraction.

3. **Progress Tracking**: Upload progress is simulated. For real progress tracking, implement chunked uploads with progress callbacks.

4. **Physical Device Required**: Camera recording requires testing on physical devices, not simulators.

## Troubleshooting

### Video Upload Fails
- Check Supabase storage bucket exists and is named `videos`
- Verify storage policies are applied
- Check file size is under 50MB
- Ensure video format is MP4

### Video Not Visible
- Check moderation status (must be `approved`)
- Verify RLS policies are correctly set
- Check signed URL generation

### Compression Fails
- Ensure FFmpeg is properly installed
- Check video format is supported
- Verify sufficient device storage

### Camera Permission Denied
- Check app permissions in device settings
- Ensure permission requests are properly handled
- Test on physical device (not simulator)

## Next Steps

1. **Test on Physical Devices**: Camera functionality requires physical iOS/Android devices
2. **Apply Database Schema**: Run `video-schema.sql` in Supabase
3. **Create Storage Bucket**: Set up `videos` bucket in Supabase Dashboard
4. **Apply Storage Policies**: Run `video-storage-setup.sql` in Supabase
5. **Integrate Components**: Add VideoUploadSection to ProfileScreen
6. **Add to Discovery**: Integrate ProfileVideoCard in HomeScreen
7. **Set Up Admin Access**: Add VideoModerationScreen to admin navigation

## Dependencies Installed

```json
{
  "expo-camera": "~17.0.9",
  "expo-av": "~16.0.7",
  "ffmpeg-kit-react-native": "^6.0.2"
}
```

## Files Created

### Services
- `src/services/VideoService.js`

### Components
- `src/components/video/VideoPlayer.js`
- `src/components/video/VideoRecorder.js`
- `src/components/video/VideoPreview.js`
- `src/components/video/VideoUploadSection.js`
- `src/components/video/ProfileVideoCard.js`
- `src/components/video/VideoReportButton.js`
- `src/components/video/index.js`

### Screens
- `src/screens/admin/VideoModerationScreen.js`

### Database
- `supabase/video-schema.sql`
- `supabase/video-storage-setup.sql`

### Documentation
- `VIDEO_FEATURES_GUIDE.md` (this file)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the Supabase logs for errors
3. Check device permissions for camera/microphone
4. Verify all SQL scripts have been run

---

**Status**: ✅ Implementation Complete
**Last Updated**: December 3, 2025
