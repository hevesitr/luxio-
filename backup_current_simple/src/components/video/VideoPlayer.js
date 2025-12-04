/**
 * VideoPlayer Component
 * Playback video with autoplay, mute/unmute, and controls
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Logger from '../../services/Logger';

const VideoPlayer = ({
  videoUrl,
  autoplay = true,
  muted = true,
  onTap,
  onError,
  style,
  placeholderImage,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup: stop video when component unmounts
      if (videoRef.current) {
        videoRef.current.stopAsync();
      }
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Stop video when videoUrl changes
    if (videoRef.current) {
      videoRef.current.stopAsync();
      setIsPlaying(false);
    }
  }, [videoUrl]);

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
      
      // Auto-replay when video ends
      if (status.didJustFinish) {
        videoRef.current?.replayAsync();
      }
    } else if (status.error) {
      Logger.error('Video playback error', status.error);
      setHasError(true);
      setIsLoading(false);
      
      if (onError) {
        onError(status.error);
      }
    }
  };

  const handleTap = async () => {
    if (onTap) {
      onTap();
    }

    // Toggle mute
    await toggleMute();
    
    // Show controls temporarily
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const toggleMute = async () => {
    if (!videoRef.current) return;

    try {
      const newMutedState = !isMuted;
      await videoRef.current.setIsMutedAsync(newMutedState);
      setIsMuted(newMutedState);
    } catch (error) {
      Logger.error('Failed to toggle mute', error);
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

  // Stop video (called from parent)
  const stop = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.stopAsync();
        setIsPlaying(false);
      } catch (error) {
        Logger.error('Failed to stop video', error);
      }
    }
  };

  // Expose stop method to parent
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.stop = stop;
    }
  }, []);

  if (!videoUrl) {
    return (
      <View style={[styles.container, style]}>
        {placeholderImage ? (
          <Image source={placeholderImage} style={styles.placeholder} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="videocam-off" size={48} color="#666" />
          </View>
        )}
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Ionicons name="alert-circle" size={48} color="#dc2626" />
        {placeholderImage && (
          <Image source={placeholderImage} style={styles.errorPlaceholder} />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={autoplay}
        isLooping={true}
        isMuted={isMuted}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* Tap overlay */}
      <TouchableOpacity
        style={styles.tapOverlay}
        onPress={handleTap}
        activeOpacity={1}
      />

      {/* Controls */}
      {showControls && (
        <View style={styles.controls}>
          {/* Play/Pause button */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={togglePlayPause}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={32}
              color="#fff"
            />
          </TouchableOpacity>

          {/* Mute/Unmute button */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleMute}
          >
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={32}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Mute indicator (always visible when muted) */}
      {isMuted && !showControls && (
        <View style={styles.muteIndicator}>
          <Ionicons name="volume-mute" size={20} color="#fff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  tapOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VideoPlayer;
