/**
 * VideoUploadSection Component
 * Section for uploading/managing profile video
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import VideoService from '../../services/VideoService';
import VideoRecorder from './VideoRecorder';
import VideoPreview from './VideoPreview';
import VideoPlayer from './VideoPlayer';
import Logger from '../../services/Logger';

const VideoUploadSection = ({ userId, onVideoUpdate }) => {
  const [video, setVideo] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Modal states
  const [showRecorder, setShowRecorder] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [recordedVideoUri, setRecordedVideoUri] = useState(null);

  useEffect(() => {
    loadUserVideo();
  }, [userId]);

  const loadUserVideo = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      
      const result = await VideoService.getUserVideo(userId);
      if (result.success && result.data) {
        setVideo(result.data);
        
        // Get video URL
        const urlResult = await VideoService.getUserVideoUrl(userId, userId);
        if (urlResult.success && urlResult.url) {
          setVideoUrl(urlResult.url);
        }
      }
    } catch (error) {
      Logger.error('Failed to load user video', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 30,
      });

      if (!result.canceled && result.assets[0]) {
        const videoUri = result.assets[0].uri;
        await uploadVideo(videoUri);
      }
    } catch (error) {
      Logger.error('Failed to pick video', error);
      Alert.alert('Error', 'Failed to select video');
    }
  };

  const handleRecordComplete = (videoUri) => {
    setRecordedVideoUri(videoUri);
    setShowRecorder(false);
    setShowPreview(true);
  };

  const handlePreviewConfirm = async (videoUri) => {
    setShowPreview(false);
    await uploadVideo(videoUri);
  };

  const handlePreviewRetake = () => {
    setShowPreview(false);
    setRecordedVideoUri(null);
    setShowRecorder(true);
  };

  const uploadVideo = async (videoUri) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate progress (actual progress tracking would require more complex implementation)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const result = await VideoService.uploadVideo(userId, videoUri);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        Alert.alert(
          'Success',
          result.message || 'Video uploaded successfully. It will be visible after moderation.'
        );
        
        // Reload video
        await loadUserVideo();
        
        if (onVideoUpdate) {
          onVideoUpdate(result.data);
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      Logger.error('Video upload failed', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload video');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteVideo = () => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete your profile video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              const result = await VideoService.deleteVideo(userId, video.id);
              
              if (result.success) {
                setVideo(null);
                setVideoUrl(null);
                Alert.alert('Success', 'Video deleted successfully');
                
                if (onVideoUpdate) {
                  onVideoUpdate(null);
                }
              }
            } catch (error) {
              Logger.error('Failed to delete video', error);
              Alert.alert('Error', 'Failed to delete video');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const showUploadOptions = () => {
    Alert.alert(
      'Add Video',
      'Choose how to add your profile video',
      [
        {
          text: 'Record Video',
          onPress: () => setShowRecorder(true),
        },
        {
          text: 'Choose from Library',
          onPress: handlePickVideo,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile Video</Text>
        {video && (
          <Text style={styles.status}>
            {video.moderation_status === 'pending' && '⏳ Pending Review'}
            {video.moderation_status === 'approved' && '✅ Approved'}
            {video.moderation_status === 'rejected' && '❌ Rejected'}
          </Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : video && videoUrl ? (
        <View style={styles.videoContainer}>
          <VideoPlayer
            videoUrl={videoUrl}
            autoplay={false}
            muted={true}
            style={styles.video}
          />
          
          <View style={styles.videoActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={showUploadOptions}
            >
              <Ionicons name="refresh" size={20} color="#007AFF" />
              <Text style={styles.actionText}>Replace</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDeleteVideo}
            >
              <Ionicons name="trash" size={20} color="#dc2626" />
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>

          {video.moderation_status === 'rejected' && video.moderation_notes && (
            <View style={styles.rejectionNote}>
              <Text style={styles.rejectionText}>
                Rejection reason: {video.moderation_notes}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadPrompt}
          onPress={showUploadOptions}
        >
          <Ionicons name="videocam" size={48} color="#007AFF" />
          <Text style={styles.uploadText}>Add Profile Video</Text>
          <Text style={styles.uploadSubtext}>
            Show your personality with a 30-second video
          </Text>
        </TouchableOpacity>
      )}

      {isUploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.uploadingText}>
            Uploading video... {uploadProgress}%
          </Text>
        </View>
      )}

      {/* Video Recorder Modal */}
      <Modal
        visible={showRecorder}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <VideoRecorder
          maxDuration={30}
          onRecordComplete={handleRecordComplete}
          onCancel={() => setShowRecorder(false)}
        />
      </Modal>

      {/* Video Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {recordedVideoUri && (
          <VideoPreview
            videoUri={recordedVideoUri}
            onRetake={handlePreviewRetake}
            onConfirm={handlePreviewConfirm}
          />
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  videoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: 300,
  },
  videoActions: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    gap: 6,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  deleteText: {
    color: '#dc2626',
  },
  rejectionNote: {
    padding: 12,
    backgroundColor: '#fee2e2',
  },
  rejectionText: {
    fontSize: 14,
    color: '#dc2626',
  },
  uploadPrompt: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  uploadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default VideoUploadSection;
