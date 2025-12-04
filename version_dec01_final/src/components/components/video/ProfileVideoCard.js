/**
 * ProfileVideoCard Component
 * Video display for profile cards in discovery feed
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import VideoPlayer from './VideoPlayer';
import VideoService from '../../services/VideoService';
import Logger from '../../services/Logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProfileVideoCard = ({ 
  userId, 
  currentUserId,
  isActive = false, // Whether this card is currently visible
  onVideoLoad,
  onVideoError,
}) => {
  const [videoUrl, setVideoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoPlayerRef = useRef(null);

  useEffect(() => {
    loadVideo();
  }, [userId]);

  useEffect(() => {
    // Stop video when card becomes inactive
    if (!isActive && videoPlayerRef.current) {
      videoPlayerRef.current.stop?.();
    }
  }, [isActive]);

  const loadVideo = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      
      const result = await VideoService.getUserVideoUrl(userId, currentUserId);
      
      if (result.success && result.url) {
        setVideoUrl(result.url);
        
        if (onVideoLoad) {
          onVideoLoad(result.video);
        }
      } else {
        setVideoUrl(null);
      }
    } catch (error) {
      Logger.error('Failed to load profile video', error);
      
      if (onVideoError) {
        onVideoError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!videoUrl) {
    return null;
  }

  return (
    <View style={styles.container}>
      <VideoPlayer
        ref={videoPlayerRef}
        videoUrl={videoUrl}
        autoplay={isActive}
        muted={true}
        style={styles.video}
        onError={onVideoError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH - 40,
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginVertical: 12,
  },
  video: {
    width: '100%',
    height: '100%',
  },
});

export default ProfileVideoCard;
