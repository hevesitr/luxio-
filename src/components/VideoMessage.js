import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_WIDTH = SCREEN_WIDTH * 0.6;

const VideoMessage = ({ videoUri, thumbnailUri, duration, isOwn = false, onPlay }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
      if (onPlay) onPlay();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, isOwn && styles.ownContainer]}>
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={handlePlayPause}
        activeOpacity={0.9}
      >
        {thumbnailUri ? (
          <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="videocam" size={40} color="rgba(255, 255, 255, 0.5)" />
          </View>
        )}
        
        {/* Video player overlay */}
        {videoUri && videoUri !== 'mock-video-uri' && (
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.video}
            useNativeControls={false}
            resizeMode="cover"
            isLooping={false}
            isMuted={false}
            shouldPlay={isPlaying}
          />
        )}

        {/* Play/Pause overlay */}
        {!isPlaying && (
          <View style={styles.overlay}>
            <View style={styles.playButton}>
              <Ionicons
                name="play"
                size={32}
                color="#fff"
              />
            </View>
          </View>
        )}

        {/* Duration badge */}
        <View style={styles.durationBadge}>
          <Ionicons name="videocam" size={12} color="#fff" />
          <Text style={styles.durationText}>{formatTime(duration)}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: VIDEO_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ownContainer: {
    backgroundColor: 'rgba(255, 59, 117, 0.2)',
    borderColor: 'rgba(255, 59, 117, 0.4)',
  },
  videoContainer: {
    width: VIDEO_WIDTH,
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default VideoMessage;

