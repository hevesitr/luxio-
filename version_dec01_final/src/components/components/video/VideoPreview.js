/**
 * VideoPreview Component
 * Preview recorded video with retake and confirm options
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Logger from '../../services/Logger';

const VideoPreview = ({ videoUri, onRetake, onConfirm }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef(null);

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
      
      // Auto-replay when video ends
      if (status.didJustFinish) {
        videoRef.current?.replayAsync();
      }
    }
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } catch (error) {
      Logger.error('Failed to toggle play/pause', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={true}
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        {/* Play/Pause overlay */}
        {!isLoading && (
          <TouchableOpacity
            style={styles.playOverlay}
            onPress={togglePlayPause}
            activeOpacity={0.9}
          >
            {!isPlaying && (
              <View style={styles.playButton}>
                <Ionicons name="play" size={48} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Text style={styles.title}>Preview Your Video</Text>
        <Text style={styles.subtitle}>
          Review your video before uploading
        </Text>

        <View style={styles.buttons}>
          {/* Retake button */}
          <TouchableOpacity
            style={[styles.button, styles.retakeButton]}
            onPress={onRetake}
          >
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>

          {/* Confirm button */}
          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={() => onConfirm(videoUri)}
          >
            <Ionicons name="checkmark" size={24} color="#fff" />
            <Text style={styles.buttonText}>Use This Video</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  retakeButton: {
    backgroundColor: '#374151',
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VideoPreview;
