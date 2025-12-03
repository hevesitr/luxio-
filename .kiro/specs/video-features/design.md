# Design Document: Video Profile Features

## Overview

This design implements video profile functionality for the Dating Application, allowing users to upload, record, and view short video clips on profiles. The implementation uses React Native's camera APIs, FFmpeg for compression, and Supabase Storage for video hosting.

## Architecture

### Component Stack
- **UI Layer**: React Native Video, Expo Camera
- **Compression**: FFmpeg (react-native-ffmpeg)
- **Storage**: Supabase Storage (videos bucket)
- **Playback**: React Native Video with autoplay
- **Moderation**: Manual review queue (admin dashboard)

### Video Pipeline
```
User Action → Upload/Record → Validation → Compression → Storage → Moderation → Display
```

## Components and Interfaces

### VideoService

```javascript
class VideoService {
  // Upload video from device
  async uploadVideo(userId, videoUri)
  
  // Record video in-app
  async recordVideo(userId, duration)
  
  // Compress video to target size
  async compressVideo(videoUri, targetSizeMB)
  
  // Delete video
  async deleteVideo(userId, videoId)
  
  // Get video URL
  async getVideoUrl(videoId)
  
  // Submit for moderation
  async submitForModeration(videoId)
}
```

### VideoPlayer Component

```javascript
<VideoPlayer
  videoUrl={profile.videoUrl}
  autoplay={true}
  muted={true}
  onTap={() => toggleMute()}
  onError={(error) => handleError(error)}
/>
```

### VideoRecorder Component

```javascript
<VideoRecorder
  maxDuration={30}
  onRecordComplete={(videoUri) => handleRecording(videoUri)}
  onCancel={() => closeRecorder()}
/>
```

## Data Models

### Video Schema (Supabase)

```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  file_size_mb DECIMAL NOT NULL,
  resolution TEXT NOT NULL,
  moderation_status TEXT DEFAULT 'pending',
  moderation_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  CONSTRAINT valid_duration CHECK (duration_seconds <= 30),
  CONSTRAINT valid_size CHECK (file_size_mb <= 10)
);
```

### Video Constraints
- Format: MP4 (H.264 codec)
- Max Duration: 30 seconds
- Max Upload Size: 50MB
- Max Compressed Size: 10MB
- Min Resolution: 720p
- Moderation: Required before display

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Video Upload Properties

**Property 1: Format validation**
*For any* uploaded file, if the format is not MP4, the upload should be rejected.
**Validates: Requirements 1.1**

**Property 2: Duration validation**
*For any* uploaded video, if the duration exceeds 30 seconds, the upload should be rejected.
**Validates: Requirements 1.2**

**Property 3: Size validation**
*For any* uploaded video, if the file size exceeds 50MB, the upload should be rejected.
**Validates: Requirements 1.3**

### Video Recording Properties

**Property 4: Recording time limit**
*For any* recording session, the recording should automatically stop at exactly 30 seconds.
**Validates: Requirements 2.3**

**Property 5: Permission requirement**
*For any* recording attempt without camera permission, the recording should fail with a permission error.
**Validates: Requirements 2.1**

### Video Compression Properties

**Property 6: Compression size limit**
*For any* video, after compression, the file size should be under 10MB.
**Validates: Requirements 3.1, 3.4**

**Property 7: Resolution preservation**
*For any* compressed video, the resolution should be at least 720p.
**Validates: Requirements 3.2**

### Video Playback Properties

**Property 8: Autoplay on mute**
*For any* profile with video, the video should autoplay when the profile is viewed, starting muted.
**Validates: Requirements 4.1**

**Property 9: Tap to unmute**
*For any* playing video, tapping should toggle the mute state.
**Validates: Requirements 4.2**

**Property 10: Video stop on swipe**
*For any* playing video, swiping to the next profile should stop the current video.
**Validates: Requirements 4.4**

### Video Moderation Properties

**Property 11: Moderation queue**
*For any* uploaded video, it should be added to the moderation queue with status 'pending'.
**Validates: Requirements 5.1**

**Property 12: Pending video invisibility**
*For any* video with status 'pending', it should not be visible to other users.
**Validates: Requirements 5.2**

**Property 13: Approved video visibility**
*For any* video with status 'approved', it should be visible on the user's profile.
**Validates: Requirements 5.3**

### Video Management Properties

**Property 14: Video deletion**
*For any* user's video, deleting it should remove it from storage and the profile immediately.
**Validates: Requirements 6.2**

**Property 15: Video replacement**
*For any* user uploading a new video, the old video should be replaced and deleted from storage.
**Validates: Requirements 6.3**

**Property 16: Account deletion cascade**
*For any* deleted user account, all associated videos should be permanently deleted from storage.
**Validates: Requirements 6.5**

## Error Handling

### Upload Errors
- Invalid format → "Please upload an MP4 video"
- Duration too long → "Video must be 30 seconds or less"
- File too large → "Video must be under 50MB"
- Network error → "Upload failed. Please try again"

### Recording Errors
- Permission denied → "Camera permission required"
- Recording failed → "Recording failed. Please try again"
- Storage full → "Not enough storage space"

### Compression Errors
- Compression failed → "Video processing failed"
- Output too large → "Video could not be compressed sufficiently"

### Playback Errors
- Video not found → Display placeholder image
- Network error → "Video unavailable. Check connection"
- Unsupported format → "Video format not supported"

## Testing Strategy

### Unit Tests
- Video validation (format, duration, size)
- Compression logic
- Storage operations (upload, delete)
- Moderation status transitions

### Integration Tests
- End-to-end upload flow
- Recording and compression pipeline
- Playback with autoplay/mute
- Moderation workflow

### Property-Based Tests
- All 16 correctness properties
- 100 iterations per property
- Random video metadata generation
- Edge case coverage (0s, 30s, 50MB, etc.)

## Performance Considerations

### Compression
- Use hardware acceleration when available
- Show progress indicator for long compressions
- Compress in background thread
- Target bitrate: 2 Mbps for 720p

### Playback
- Preload next video in discovery feed
- Cache recently viewed videos
- Use adaptive bitrate streaming
- Lazy load videos outside viewport

### Storage
- Use CDN for video delivery
- Implement video thumbnail generation
- Set appropriate cache headers
- Clean up orphaned videos periodically

## Implementation Plan

See `tasks.md` for detailed implementation tasks.

