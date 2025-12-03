# Implementation Plan - Video Profile Features

## Overview

This plan implements video profile functionality including upload, recording, compression, playback, and moderation.

---

## TASKS

- [ ] 1. Setup and Dependencies
- [x] 1.1 Install video dependencies


  - Install expo-camera: `expo install expo-camera`
  - Install expo-av: `expo install expo-av`
  - Install react-native-ffmpeg: `npm install react-native-ffmpeg`
  - _Requirements: 1.1, 2.1, 3.1_



- [ ] 1.2 Configure Supabase storage for videos
  - Create 'videos' bucket in Supabase Dashboard
  - Set bucket to private access


  - Configure storage policies for video access
  - _Requirements: 6.4_

- [ ] 1.3 Update database schema
  - Create videos table with moderation fields
  - Add foreign key to profiles table


  - Add indexes for user_id and moderation_status
  - _Requirements: 5.1, 6.1_
  - **File:** `supabase/video-schema.sql`

- [x] 2. Video Service Implementation


- [ ] 2.1 Create VideoService base structure
  - Implement VideoService class
  - Add error handling with ErrorHandler
  - Add logging with Logger
  - _Requirements: All_


  - **File:** `src/services/VideoService.js`

- [ ] 2.2 Implement video validation
  - Validate MP4 format
  - Validate duration (max 30s)


  - Validate file size (max 50MB)
  - Return specific error messages
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2.3 Implement video upload


  - Upload video to Supabase storage
  - Generate unique storage path
  - Save video metadata to database
  - Set moderation status to 'pending'


  - _Requirements: 1.5, 5.1_

- [ ] 2.4 Implement video compression
  - Use FFmpeg for compression
  - Target 10MB max size


  - Maintain 720p resolution
  - Show progress indicator
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 2.5 Implement video deletion
  - Delete from Supabase storage

  - Delete metadata from database
  - Handle cascade deletion on account delete
  - _Requirements: 6.2, 6.5_

- [x] 2.6 Implement video URL retrieval


  - Get signed URL from Supabase
  - Check moderation status
  - Return null for pending videos
  - _Requirements: 5.2, 5.3_



- [ ] 3. Video Recording Component
- [ ] 3.1 Create VideoRecorder component
  - Implement camera interface
  - Add recording controls (start/stop)
  - Display timer (0-30s)
  - Auto-stop at 30 seconds

  - _Requirements: 2.1, 2.2, 2.3_
  - **File:** `src/components/video/VideoRecorder.js`

- [ ] 3.2 Implement permission handling
  - Request camera permission

  - Request microphone permission
  - Display permission denied message
  - _Requirements: 2.1_

- [ ] 3.3 Implement preview and retake
  - Show video preview after recording


  - Add retake button
  - Add confirm button
  - _Requirements: 2.4, 2.5_

- [ ] 4. Video Player Component
- [x] 4.1 Create VideoPlayer component

  - Implement video playback with expo-av
  - Add autoplay on mute
  - Add tap to unmute
  - Add playback controls
  - _Requirements: 4.1, 4.2, 4.3_


  - **File:** `src/components/video/VideoPlayer.js`

- [ ] 4.2 Implement video lifecycle
  - Stop video on component unmount
  - Stop video on swipe to next profile
  - Preload next video


  - _Requirements: 4.4_

- [ ] 4.3 Implement error handling
  - Display placeholder on load error
  - Show error message
  - Add retry button

  - _Requirements: 4.5_

- [ ] 5. Profile Integration
- [ ] 5.1 Add video upload to ProfileScreen
  - Add "Add Video" button


  - Open video picker or recorder
  - Show upload progress
  - Display success/error messages
  - _Requirements: 1.1, 1.4, 1.5_
  - **File:** `src/screens/ProfileScreen.js`

- [ ] 5.2 Add video display to ProfileScreen
  - Show VideoPlayer if video exists
  - Show "Add Video" prompt if no video
  - Add delete video button
  - _Requirements: 6.1, 6.2_

- [ ] 5.3 Add video to discovery feed
  - Display VideoPlayer in profile cards
  - Implement autoplay on view
  - Stop video on swipe
  - _Requirements: 4.1, 4.4_
  - **File:** `src/screens/HomeScreen.js`

- [ ] 6. Video Moderation
- [ ] 6.1 Create moderation queue view
  - List pending videos
  - Show video preview
  - Add approve/reject buttons
  - Add rejection reason input


  - _Requirements: 5.1, 5.4_
  - **File:** `src/screens/admin/VideoModerationScreen.js`

- [ ] 6.2 Implement moderation actions
  - Approve video (set status to 'approved')
  - Reject video (set status to 'rejected', add notes)
  - Send notification to user
  - _Requirements: 5.3, 5.4_

- [ ] 6.3 Implement video reporting
  - Add report button on videos
  - Flag video for immediate review
  - Add to priority moderation queue
  - _Requirements: 5.5_

- [ ] 7. Testing
- [ ]* 7.1 Write unit tests for VideoService
  - Test validation logic
  - Test upload/delete operations
  - Test compression
  - _Requirements: 1.1, 1.2, 1.3, 3.1_

- [ ]* 7.2 Write property tests for video features
  - **Property 1: Format validation**
  - **Property 2: Duration validation**
  - **Property 3: Size validation**
  - **Property 6: Compression size limit**
  - **Property 7: Resolution preservation**
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2_

- [ ]* 7.3 Write integration tests
  - Test end-to-end upload flow
  - Test recording and compression
  - Test playback with autoplay
  - _Requirements: All_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Run all video feature tests
  - Test on iOS and Android
  - Verify compression quality
  - Test moderation workflow
  - Ask user if questions arise

---

## 📊 IMPLEMENTATION STATISTICS

**Total Tasks:** 28
- Setup: 3 tasks
- Video Service: 6 tasks
- Video Recording: 3 tasks
- Video Player: 3 tasks
- Profile Integration: 3 tasks
- Moderation: 3 tasks
- Testing: 3 tasks (optional)
- Checkpoint: 1 task

**Estimated Time:** 12-16 hours

**Dependencies:**
- expo-camera
- expo-av
- react-native-ffmpeg
- Supabase storage bucket

---

## 📋 MANUAL STEPS REQUIRED

1. **Supabase Dashboard:**
   - Create 'videos' bucket
   - Set bucket to private
   - Apply storage policies

2. **Database:**
   - Run video-schema.sql
   - Verify tables created

3. **Testing:**
   - Test on physical devices (camera required)
   - Test video compression quality
   - Verify moderation workflow

---

**Status:** Ready to implement
**Next:** Install dependencies and begin implementation

