import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const VoiceMessage = ({ duration = 30, isOwn = false, onPlay }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isPlaying) {
      // Animate waves
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Simulate playback
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      waveAnimation.setValue(0);
    }
  }, [isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (onPlay) onPlay();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = currentTime / duration;

  return (
    <View style={[styles.container, isOwn && styles.ownContainer]}>
      <TouchableOpacity 
        style={[styles.playButton, isOwn && styles.ownPlayButton]} 
        onPress={handlePlayPause}
      >
        <Ionicons 
          name={isPlaying ? 'pause' : 'play'} 
          size={20} 
          color={isOwn ? '#fff' : '#FF3B75'} 
        />
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        {/* Waveform bars */}
        <View style={styles.waveform}>
          {[...Array(20)].map((_, index) => {
            const height = Math.random() * 20 + 10;
            const isActive = progress > index / 20;
            
            return (
              <Animated.View
                key={index}
                style={[
                  styles.waveBar,
                  {
                    height,
                    backgroundColor: isActive 
                      ? (isOwn ? '#fff' : '#FF3B75')
                      : (isOwn ? 'rgba(255,255,255,0.3)' : '#e0e0e0'),
                    transform: isPlaying && isActive ? [
                      {
                        scaleY: waveAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.3],
                        }),
                      },
                    ] : [],
                  },
                ]}
              />
            );
          })}
        </View>
        
        <Text style={[styles.time, isOwn && styles.ownTime]}>
          {formatTime(isPlaying ? currentTime : duration)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 12,
    minWidth: 220,
    gap: 10,
  },
  ownContainer: {
    backgroundColor: '#FF3B75',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownPlayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  waveformContainer: {
    flex: 1,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 30,
  },
  waveBar: {
    flex: 1,
    borderRadius: 2,
  },
  time: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  ownTime: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

export default VoiceMessage;

