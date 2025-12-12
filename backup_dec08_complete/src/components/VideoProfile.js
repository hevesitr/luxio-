import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;
const EXIT_SWIPE_THRESHOLD = 120;
const DEMO_ARROW_SIZE = 30;
const DEMO_ARROW_LINE_WIDTH = 3;
const DEMO_ARROW_LINE_HEIGHT = Math.min(200, SCREEN_HEIGHT * 0.28);
const ARROW_BOUNCE_DISTANCE = 18;
const ARROW_VERTICAL_OFFSET = SCREEN_HEIGHT * 0.32 - DEMO_ARROW_LINE_HEIGHT / 2;

const DOUBLE_TAP_DELAY = 260;

const VideoProfile = ({ visible, profile, allProfiles = [], onClose, onLike, onSkip, onQuickLike }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDemoArrow, setShowDemoArrow] = useState(true);
  const [showHeart, setShowHeart] = useState(false);
  const videoRefs = useRef({});
  const translateY = useRef(new Animated.Value(0)).current;
  const arrowOpacity = useRef(new Animated.Value(1)).current;
  const arrowBounce = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const arrowLoopRef = useRef(null);
  const lastTapRef = useRef(null);
  const singleTapTimeout = useRef(null);
  useEffect(() => {
    return () => {
      if (singleTapTimeout.current) {
        clearTimeout(singleTapTimeout.current);
      }
    };
  }, []);

  // Szűrjük ki azokat a profilokat, akiknek van videoProfile mezője
  const fallbackVideos = useMemo(
    () => [
      {
        id: 'demo-1',
        name: 'Demo Anna',
        age: 25,
        distance: 3,
        relationshipGoal: 'serious',
        bio: 'Demo videó – modern városi élet.',
        interests: ['Utazás', 'Zene', 'Kávé'],
        videoProfile: 'https://videos.pexels.com/video-files/3044154/3044154-hd_1920_1080_30fps.mp4',
      },
      {
        id: 'demo-2',
        name: 'Demo Luca',
        age: 27,
        distance: 5,
        relationshipGoal: 'casual',
        bio: 'Demo videó – szabadtéri pillanatok.',
        interests: ['Természet', 'Sport', 'Kaland'],
        videoProfile: 'https://videos.pexels.com/video-files/2110305/2110305-uhd_3840_2160_25fps.mp4',
      },
      {
        id: 'demo-3',
        name: 'Demo Nóri',
        age: 26,
        distance: 2,
        relationshipGoal: 'friends',
        bio: 'Demo videó – kávé a belvárosban.',
        interests: ['Kávézók', 'Divat', 'Fotózás'],
        videoProfile: 'https://videos.pexels.com/video-files/3798/3798-hd_1920_1080_25fps.mp4',
      },
      {
        id: 'demo-4',
        name: 'Demo Kata',
        age: 24,
        distance: 4,
        relationshipGoal: 'serious',
        bio: 'Demo videó – edzés és aktív élet.',
        interests: ['Fitness', 'Egészség', 'Zene'],
        videoProfile: 'https://videos.pexels.com/video-files/4328979/4328979-hd_1920_1080_25fps.mp4',
      },
      {
        id: 'demo-5',
        name: 'Demo Eszti',
        age: 28,
        distance: 7,
        relationshipGoal: 'casual',
        bio: 'Demo videó – esti városi fények.',
        interests: ['Nightlife', 'Tánc', 'Utazás'],
        videoProfile: 'https://videos.pexels.com/video-files/9946031/9946031-sd_960_540_25fps.mp4',
      },
    ],
    []
  );

  const videoProfiles = useMemo(() => {
    const filtered = allProfiles.filter((p) => !!p.videoProfile);
    const combined = [...fallbackVideos, ...filtered];
    const seen = new Set();
    return combined.filter((item) => {
      const key = item.videoProfile;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allProfiles, fallbackVideos]);

  const currentProfile = videoProfiles[currentIndex] || null;

  const heart1X = useRef(new Animated.Value(-60)).current;
  const heart2X = useRef(new Animated.Value(60)).current;
  const heart1Scale = useRef(new Animated.Value(0)).current;
  const heart2Scale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  const triggerHeart = useCallback(() => {
    // Set visible immediately
    setShowHeart(true);
    heartOpacity.setValue(1);
    
    // Reset positions - start from sides, move to center (but not too close)
    heart1X.setValue(-70);
    heart2X.setValue(70);
    heart1Scale.setValue(0.7);
    heart2Scale.setValue(0.7);
    
    // Immediate fast animation: hearts come together
    Animated.parallel([
      // Heart 1 - from left to center
      Animated.parallel([
        Animated.spring(heart1Scale, {
          toValue: 1.1,
          friction: 2,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(heart1X, {
          toValue: -30,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      // Heart 2 - from right to center
      Animated.parallel([
        Animated.spring(heart2Scale, {
          toValue: 1.1,
          friction: 2,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(heart2X, {
          toValue: 30,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Pulse effect when they meet (smaller scale)
      Animated.parallel([
        Animated.spring(heart1Scale, {
          toValue: 1.3,
          friction: 1.5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(heart2Scale, {
          toValue: 1.3,
          friction: 1.5,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Keep visible for shorter time (0.35 seconds total)
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(heartOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(heart1Scale, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(heart2Scale, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowHeart(false);
        });
      }, 200); // 200ms animation + 200ms = 0.4 seconds total
    });
  }, [heart1X, heart2X, heart1Scale, heart2Scale, heartOpacity]);

  const handleQuickLike = useCallback(() => {
    if (currentProfile) {
      // Immediately handle match (before animation)
      onQuickLike?.(currentProfile);
      // Then show animation
      triggerHeart();
    }
  }, [currentProfile, onQuickLike, triggerHeart]);

  useEffect(() => {
    if (!visible) {
      setShowDemoArrow(false);
      setIsPlaying(true);
      arrowLoopRef.current?.stop();
      arrowBounce.setValue(0);
      return;
    }

    if (videoProfiles.length > 0) {
      // Keressük meg az aktuális profil indexét a videóprofilok között
      const initialIndex = profile?.videoProfile 
        ? videoProfiles.findIndex(p => p.id === profile.id)
        : 0;
      const startIndex = initialIndex >= 0 ? initialIndex : 0;
      setCurrentIndex(startIndex);
      setShowDemoArrow(true);
      
      // Demó nyíl animáció (közel 6 másodpercig)
      arrowOpacity.setValue(1);
      arrowBounce.setValue(0);
      arrowLoopRef.current?.stop();
      arrowLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(arrowBounce, {
            toValue: -ARROW_BOUNCE_DISTANCE,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(arrowBounce, {
            toValue: ARROW_BOUNCE_DISTANCE,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      arrowLoopRef.current.start();
      Animated.sequence([
        Animated.timing(arrowOpacity, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(arrowOpacity, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(arrowOpacity, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        arrowLoopRef.current?.stop();
        arrowBounce.setValue(0);
        setShowDemoArrow(false);
      });
    }
  }, [visible]);

  useEffect(() => {
    if (visible && videoProfiles.length > 0) {
      const currentVideoRef = videoRefs.current[currentIndex];
      if (currentVideoRef) {
        currentVideoRef.playAsync();
        setIsPlaying(true);
      }
    }
    return () => {
      // Pause all videos when closing
      Object.values(videoRefs.current).forEach(ref => {
        if (ref) ref.pauseAsync();
      });
    };
  }, [visible, currentIndex, videoProfiles.length]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gesture) => {
        if (Math.abs(gesture.dx) > Math.abs(gesture.dy)) {
          return;
        }
        // Limit the movement to prevent over-scrolling
        const maxMove = SCREEN_HEIGHT * 0.3;
        const clampedDy = Math.max(-maxMove, Math.min(maxMove, gesture.dy));
        translateY.setValue(clampedDy);
      },
      onPanResponderRelease: (e, gesture) => {
        if (Math.abs(gesture.dx) > EXIT_SWIPE_THRESHOLD && Math.abs(gesture.dx) > Math.abs(gesture.dy)) {
          onClose?.();
          return;
        }
        if (Math.abs(gesture.dy) > SWIPE_THRESHOLD) {
          if (gesture.dy < 0 && currentIndex > 0) {
            // Swipe up - previous video
            goToVideo(currentIndex - 1);
          } else if (gesture.dy > 0 && currentIndex < videoProfiles.length - 1) {
            // Swipe down - next video
            goToVideo(currentIndex + 1);
          } else {
            // Reset position
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }).start();
          }
        } else {
          const now = Date.now();
          if (lastTapRef.current && now - lastTapRef.current < DOUBLE_TAP_DELAY) {
            clearTimeout(singleTapTimeout.current);
            lastTapRef.current = null;
            handleQuickLike();
          } else {
            lastTapRef.current = now;
            singleTapTimeout.current = setTimeout(() => {
              setIsPlaying((prev) => !prev);
              lastTapRef.current = null;
            }, DOUBLE_TAP_DELAY);
          }
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        }
      },
    })
  ).current;

  const goToVideo = (newIndex) => {
    if (newIndex < 0 || newIndex >= videoProfiles.length) {
      // Reset position if can't go further
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
      return;
    }
    
    // Pause current video
    const currentRef = videoRefs.current[currentIndex];
    if (currentRef) currentRef.pauseAsync();
    
    // Reset translateY and change index
    translateY.setValue(0);
    setCurrentIndex(newIndex);
    
    // Play new video
    setTimeout(() => {
      const newRef = videoRefs.current[newIndex];
      if (newRef) {
        newRef.playAsync();
        setIsPlaying(true);
      }
    }, 100);
  };

  if (!visible || videoProfiles.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container} {...panResponder.panHandlers}>
        <View style={styles.videoContainer}>
          {videoProfiles.map((videoProfile, index) => {
            const offset = (index - currentIndex) * SCREEN_HEIGHT;
            const isCurrent = index === currentIndex;
            
            return (
              <Animated.View
                key={videoProfile.id}
                style={[
                  styles.videoWrapper,
                  { 
                    top: isCurrent ? 0 : offset,
                    transform: isCurrent ? [{ translateY }] : [],
                    zIndex: videoProfiles.length - Math.abs(index - currentIndex),
                  },
                ]}
              >
              <Video
                ref={(ref) => {
                  videoRefs.current[index] = ref;
                }}
                source={{ uri: videoProfile.videoProfile }}
                style={styles.video}
                resizeMode="cover"
                isLooping
                isMuted={isMuted}
                shouldPlay={index === currentIndex && isPlaying}
                useNativeControls={false}
              />
              
              {index === currentIndex && !isPlaying && (
                <View style={styles.playIconContainer}>
                  <Ionicons name="play-circle" size={80} color="rgba(255,255,255,0.9)" />
                </View>
              )}

              {/* Video watermark */}
              <View style={styles.videoTag}>
                <Ionicons name="videocam" size={16} color="#fff" />
                <Text style={styles.videoTagText}>VIDEO PROFIL</Text>
              </View>

              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
              />

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{videoProfile.name}, {videoProfile.age}</Text>
                  {videoProfile.isVerified && (
                    <Ionicons name="checkmark-circle" size={20} color="#2196F3" />
                  )}
                </View>
                <View style={styles.headerButtons}>
                  <TouchableOpacity 
                    onPress={() => setIsMuted(!isMuted)} 
                    style={styles.headerButton}
                  >
                    <Ionicons 
                      name={isMuted ? 'volume-mute' : 'volume-high'} 
                      size={24} 
                      color="#fff" 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Profile info sidebar */}
              <View style={styles.sidebar}>
                <View style={styles.infoItem}>
                  <Ionicons name="location" size={18} color="#fff" />
                  <Text style={styles.infoText}>{videoProfile.distance} km</Text>
                </View>
                
                {videoProfile.relationshipGoal && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoText}>
                      {videoProfile.relationshipGoal === 'serious' ? '💍 Komoly' : 
                       videoProfile.relationshipGoal === 'casual' ? '😊 Laza' : 
                       '👥 Barátság'}
                    </Text>
                  </View>
                )}

                {videoProfile.bio && (
                  <View style={styles.bioContainer}>
                    <Text style={styles.bioText} numberOfLines={3}>
                      {videoProfile.bio}
                    </Text>
                  </View>
                )}

                {videoProfile.interests && (
                  <View style={styles.interestsContainer}>
                    {videoProfile.interests.slice(0, 3).map((interest, idx) => (
                      <View key={idx} style={styles.interestTag}>
                        <Text style={styles.interestText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              </Animated.View>
            );
          })}
        </View>

        {/* Action buttons - only for current video */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.skipButton]}
            onPress={() => {
              onSkip(currentProfile);
              onClose();
            }}
          >
            <LinearGradient
              colors={['rgba(244, 67, 54, 0.3)', 'rgba(244, 67, 54, 0.2)']}
              style={styles.buttonGradient}
            >
              <Ionicons name="close" size={26} color="#F44336" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => {
              onLike(currentProfile);
              onClose();
            }}
          >
            <LinearGradient
              colors={['rgba(76, 175, 80, 0.3)', 'rgba(76, 175, 80, 0.2)']}
              style={styles.buttonGradient}
            >
              <Ionicons name="heart" size={26} color="#4CAF50" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Demo arrow - swipe indicator */}
        {showDemoArrow && (
          <Animated.View
            style={[
              styles.demoArrowContainer,
              { opacity: arrowOpacity, transform: [{ translateY: arrowBounce }] },
            ]}
          >
            <Ionicons name="chevron-up" size={DEMO_ARROW_SIZE} color="#fff" />
            <View style={styles.demoArrowBody}>
              <View style={styles.demoArrowLine} />
            </View>
            <Ionicons name="chevron-down" size={DEMO_ARROW_SIZE} color="#fff" />
            <Text style={styles.demoArrowText}>Mozgasd fel-le</Text>
            <Text style={styles.demoArrowText}>Duplán kopp a like-hoz</Text>
          </Animated.View>
        )}

        {showHeart && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.heartOverlay,
              {
                opacity: heartOpacity,
              },
            ]}
          >
            {/* Heart 1 - coming from left */}
            <Animated.View
              style={[
                styles.heartContainer,
                {
                  transform: [
                    { translateX: heart1X },
                    { scale: heart1Scale },
                  ],
                },
              ]}
            >
              <View style={styles.heartGlow} />
              <Ionicons name="heart" size={70} color="#FF3B75" />
            </Animated.View>
            
            {/* Heart 2 - coming from right */}
            <Animated.View
              style={[
                styles.heartContainer,
                {
                  transform: [
                    { translateX: heart2X },
                    { scale: heart2Scale },
                  ],
                },
              ]}
            >
              <View style={styles.heartGlow} />
              <Ionicons name="heart" size={70} color="#FF3B75" />
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  videoWrapper: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    left: 0,
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  videoTag: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 59, 117, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 59, 117, 0.5)',
  },
  videoTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  header: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  sidebar: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bioContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  bioText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  interestTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  interestText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  actionButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1.5,
  },
  skipButton: {
    borderColor: 'rgba(244, 67, 54, 0.4)',
  },
  likeButton: {
    borderColor: 'rgba(76, 175, 80, 0.4)',
  },
  buttonGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  heartContainer: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -35,
    marginTop: -35,
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
  },
  heartGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 59, 117, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 59, 117, 0.6)',
    shadowColor: '#FF3B75',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 20,
  },
  playIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  demoArrowContainer: {
    position: 'absolute',
    top: ARROW_VERTICAL_OFFSET,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 100,
  },
  demoArrowBody: {
    width: DEMO_ARROW_LINE_WIDTH * 4,
    height: DEMO_ARROW_LINE_HEIGHT,
    marginVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  demoArrowLine: {
    width: DEMO_ARROW_LINE_WIDTH,
    height: '100%',
    borderRadius: DEMO_ARROW_LINE_WIDTH / 2,
    backgroundColor: '#fff',
  },
  demoArrowText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default VideoProfile;

