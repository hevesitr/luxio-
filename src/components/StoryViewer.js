import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const StoryViewer = ({ visible, stories, initialIndex = 0, onClose, onUserPress }) => {
  const [currentUserIndex, setCurrentUserIndex] = useState(initialIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const progressRef = useRef(null);

  const currentUser = stories[currentUserIndex];
  const currentStory = currentUser?.stories[currentStoryIndex];

  // Reset when initialIndex changes (new user selected)
  useEffect(() => {
    if (visible) {
      setCurrentUserIndex(initialIndex);
      setCurrentStoryIndex(0);
    }
  }, [initialIndex, visible]);

  useEffect(() => {
    if (!visible || isPaused) return;

    // Reset progress
    progress.setValue(0);

    // Animate progress bar
    progressRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: 5000, // 5 seconds per story
      useNativeDriver: false,
    });

    progressRef.current.start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });

    return () => {
      if (progressRef.current) {
        progressRef.current.stop();
      }
    };
  }, [visible, currentUserIndex, currentStoryIndex, isPaused]);

  const handleNext = () => {
    if (currentStoryIndex < currentUser.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else if (currentUserIndex < stories.length - 1) {
      setCurrentUserIndex(currentUserIndex + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(currentUserIndex - 1);
      const prevUser = stories[currentUserIndex - 1];
      setCurrentStoryIndex(prevUser.stories.length - 1);
    }
  };

  const handleTap = (x) => {
    const tapX = x;
    if (tapX < SCREEN_WIDTH / 2) {
      handlePrevious();
    } else {
      handleNext();
    }
  };

  if (!visible || !currentUser || !currentStory) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Image source={{ uri: currentStory.image }} style={styles.storyImage} />
        
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.3)']}
          style={styles.gradient}
        />

        {/* Progress bars */}
        <View style={styles.progressContainer}>
          {currentUser.stories.map((_, index) => (
            <View key={index} style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  index < currentStoryIndex && styles.progressBarComplete,
                ]}
              >
                {index === currentStoryIndex && (
                  <Animated.View
                    style={[
                      styles.progressBarActive,
                      {
                        width: progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => {
              onClose();
              if (onUserPress) onUserPress(currentUser);
            }}
          >
            <Image source={{ uri: currentUser.photo }} style={styles.avatar} />
            <View>
              <Text style={styles.userName}>{currentUser.name}</Text>
              <Text style={styles.timeAgo}>{currentStory.timeAgo}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Story content */}
        {currentStory.text && (
          <View style={styles.textContainer}>
            <Text style={styles.storyText}>{currentStory.text}</Text>
          </View>
        )}

        {/* Tap areas */}
        <TouchableOpacity
          style={styles.tapLeft}
          activeOpacity={1}
          onPress={() => handleTap(SCREEN_WIDTH * 0.25)}
        />
        <TouchableOpacity
          style={styles.tapRight}
          activeOpacity={1}
          onPress={() => handleTap(SCREEN_WIDTH * 0.75)}
        />

        {/* Reaction buttons */}
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.reactionButton}
            onPress={() => Alert.alert('❤️', 'Liked!')}
          >
            <Ionicons name="heart-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.reactionButton}
            onPress={() => Alert.alert('💬', 'Reply')}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.reactionButton}
            onPress={() => Alert.alert('📤', 'Share')}
          >
            <Ionicons name="paper-plane-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  progressContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 10,
    gap: 4,
    zIndex: 10,
  },
  progressBarContainer: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'transparent',
  },
  progressBarComplete: {
    backgroundColor: '#fff',
  },
  progressBarActive: {
    height: '100%',
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    zIndex: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  timeAgo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    padding: 5,
  },
  textContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  storyText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tapLeft: {
    position: 'absolute',
    top: 120,
    left: 0,
    width: SCREEN_WIDTH / 2,
    height: SCREEN_HEIGHT - 250,
  },
  tapRight: {
    position: 'absolute',
    top: 120,
    right: 0,
    width: SCREEN_WIDTH / 2,
    height: SCREEN_HEIGHT - 250,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    zIndex: 10,
  },
  reactionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StoryViewer;
