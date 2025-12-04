/**
 * VideoModerationScreen
 * Admin screen for moderating pending videos
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import VideoPlayer from '../../components/video/VideoPlayer';
import VideoService from '../../services/VideoService';
import Logger from '../../services/Logger';

const VideoModerationScreen = ({ navigation }) => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPendingVideos();
  }, []);

  const loadPendingVideos = async () => {
    try {
      setIsLoading(true);
      
      const result = await VideoService.getPendingVideos();
      
      if (result.success) {
        setVideos(result.data || []);
      }
    } catch (error) {
      Logger.error('Failed to load pending videos', error);
      Alert.alert('Error', 'Failed to load pending videos');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPendingVideos();
  };

  const handleApprove = async (video) => {
    Alert.alert(
      'Approve Video',
      `Approve video from ${video.profiles?.name || 'Unknown'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const result = await VideoService.approveVideo(video.id);
              
              if (result.success) {
                Alert.alert('Success', 'Video approved');
                loadPendingVideos();
              }
            } catch (error) {
              Logger.error('Failed to approve video', error);
              Alert.alert('Error', 'Failed to approve video');
            }
          },
        },
      ]
    );
  };

  const handleReject = (video) => {
    setSelectedVideo(video);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    try {
      const result = await VideoService.rejectVideo(
        selectedVideo.id,
        rejectionReason
      );
      
      if (result.success) {
        Alert.alert('Success', 'Video rejected');
        setShowRejectModal(false);
        setSelectedVideo(null);
        setRejectionReason('');
        loadPendingVideos();
      }
    } catch (error) {
      Logger.error('Failed to reject video', error);
      Alert.alert('Error', 'Failed to reject video');
    }
  };

  const renderVideoItem = ({ item }) => {
    const profile = item.profiles || {};
    
    return (
      <View style={styles.videoItem}>
        {/* User Info */}
        <View style={styles.userInfo}>
          <Image
            source={{ uri: profile.avatar_url }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {profile.name || 'Unknown'}, {profile.age || '?'}
            </Text>
            <Text style={styles.uploadDate}>
              Uploaded: {new Date(item.created_at).toLocaleDateString()}
            </Text>
            <Text style={styles.videoInfo}>
              Duration: {item.duration_seconds}s | Size: {item.file_size_mb}MB
            </Text>
          </View>
        </View>

        {/* Video Preview */}
        <View style={styles.videoPreview}>
          <VideoPlayer
            videoUrl={`${process.env.SUPABASE_URL}/storage/v1/object/sign/videos/${item.storage_path}`}
            autoplay={false}
            muted={true}
            style={styles.video}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item)}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item)}
          >
            <Ionicons name="close-circle" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading pending videos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Moderation</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{videos.length}</Text>
        </View>
      </View>

      {/* Video List */}
      {videos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-done-circle" size={64} color="#10b981" />
          <Text style={styles.emptyText}>No pending videos</Text>
          <Text style={styles.emptySubtext}>
            All videos have been reviewed
          </Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        />
      )}

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Video</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for rejection
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="Rejection reason..."
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmReject}
              >
                <Text style={styles.confirmButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  badge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  videoItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  userInfo: {
    flexDirection: 'row',
    padding: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  uploadDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  videoInfo: {
    fontSize: 12,
    color: '#999',
  },
  videoPreview: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#dc2626',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#dc2626',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default VideoModerationScreen;
