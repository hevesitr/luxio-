import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Image,
  TouchableOpacity,
  PanResponder,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;

const MatchAnimation = ({ visible, onClose, onSendMessage, profile, allMatches = [], navigation }) => {
  // console.log('MatchAnimation: Received profile:', profile?.name, profile?.id, 'visible:', visible, 'allMatches length:', allMatches?.length);
  
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnims = useRef([...Array(12)].map(() => ({
    scale: new Animated.Value(0),
    rotate: new Animated.Value(0),
    opacity: new Animated.Value(0),
    x: new Animated.Value(0),
    y: new Animated.Value(0),
  }))).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get all matches including current profile
  const matches = Array.isArray(allMatches) && allMatches.length > 0 
    ? allMatches 
    : profile 
      ? [profile] 
      : [];

  // Set current index when profile changes - MUST be before early return
  useEffect(() => {
    if (profile && Array.isArray(matches) && matches.length > 0) {
      const index = matches.findIndex(m => m && m.id === profile.id);
      if (index >= 0) {
        setCurrentMatchIndex(index);
      }
    }
  }, [profile, matches]);

  // Pan responder for swipe gestures - MUST be before early return (React Rules of Hooks)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Only start if there are multiple matches
        return matches.length > 1;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes (dx should be greater than dy)
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
      },
      onPanResponderGrant: () => {
        // Stop any ongoing animations
        slideX.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        // Constrain the movement to prevent over-swiping
        const maxMove = SCREEN_WIDTH * 0.4;
        const constrainedDx = Math.max(-maxMove, Math.min(maxMove, gestureState.dx));
        slideX.setValue(constrainedDx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        const swipeVelocity = Math.abs(vx);
        
        // Check if it's a valid swipe (either by distance or velocity)
        if (Math.abs(dx) > SWIPE_THRESHOLD || swipeVelocity > 0.3) {
          if (dx > 0 && currentMatchIndex > 0) {
            // Swipe right - previous match
            setCurrentMatchIndex(currentMatchIndex - 1);
            Animated.spring(slideX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }).start();
          } else if (dx < 0 && currentMatchIndex < matches.length - 1) {
            // Swipe left - next match
            setCurrentMatchIndex(currentMatchIndex + 1);
            Animated.spring(slideX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }).start();
          } else {
            // Not enough swipe or at boundary - snap back
            Animated.spring(slideX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }).start();
          }
        } else {
          // Not enough movement - snap back
          Animated.spring(slideX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        // Snap back if gesture is cancelled
        Animated.spring(slideX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
      sparkleAnims.forEach(anim => {
        anim.scale.setValue(0);
        anim.rotate.setValue(0);
        anim.opacity.setValue(0);
        anim.x.setValue(0);
        anim.y.setValue(0);
      });

      // Main content animation sequence
      Animated.sequence([
        // First: scale and fade in
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 15,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        // Then: slide up and rotate
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 20,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Continuous pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Sparkle animations - staggered and random
      sparkleAnims.forEach((anim, index) => {
        const delay = index * 80 + Math.random() * 200;
        const angle = (index * 360) / 12;
        const radius = 120 + Math.random() * 60;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;

        Animated.parallel([
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.spring(anim.scale, {
                toValue: 1,
                tension: 10,
                friction: 5,
                useNativeDriver: true,
              }),
              Animated.timing(anim.opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(anim.x, {
                toValue: x,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(anim.y, {
                toValue: y,
                duration: 1000,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.loop(
            Animated.timing(anim.rotate, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            })
          ),
        ]).start();
      });
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
      sparkleAnims.forEach(anim => {
        anim.scale.setValue(0);
        anim.rotate.setValue(0);
        anim.opacity.setValue(0);
        anim.x.setValue(0);
        anim.y.setValue(0);
      });
    }
  }, [visible]);

  // Early return AFTER all hooks - React rules
  if (!visible || (!profile && matches.length === 0)) {
    return null;
  }

  const currentProfile = matches[currentMatchIndex] || profile;
  if (!currentProfile || !currentProfile.id) {
    console.log('MatchAnimation: No valid currentProfile, returning null');
    return null;
  }

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <BlurView intensity={80} style={styles.blurContainer}>
        <View style={styles.container}>
          {/* Animated sparkles */}
          {sparkleAnims.map((anim, index) => {
            const sparkleRotate = anim.rotate.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.sparkle,
                  {
                    opacity: anim.opacity,
                    transform: [
                      { translateX: anim.x },
                      { translateY: anim.y },
                      { scale: anim.scale },
                      { rotate: sparkleRotate },
                    ],
                  },
                ]}
              >
                <Ionicons name="sparkles" size={20} color="#FFD700" />
              </Animated.View>
            );
          })}

          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim },
                ],
              },
            ]}
          >
            {/* Unique header with geometric shapes */}
            <View style={styles.headerContainer}>
              <View style={styles.geometricShape1} />
              <View style={styles.geometricShape2} />
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ scale: pulseAnim }, { rotate }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#FF6B9D', '#FF3B75', '#C2185B']}
                  style={styles.iconGradient}
                >
                  <Ionicons name="flash" size={40} color="#fff" />
                </LinearGradient>
              </Animated.View>
            </View>

            <Text style={styles.title}>KAPCSOLAT FELÉPÍTVE</Text>
            <Text style={styles.subtitle}>Sikeres párosítás!</Text>

            {/* Swipeable profile cards */}
            <View style={styles.swipeContainer}>
              <Animated.View
                style={[
                  styles.profileCard,
                  {
                    transform: [
                      { scale: pulseAnim },
                      { translateX: slideX },
                    ],
                  },
                ]}
                {...(matches.length > 1 ? panResponder.panHandlers : {})}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.profileImageWrapper}>
                    <Image
                      source={{ uri: currentProfile.photo }}
                      style={styles.profileImage}
                    />
                    <View style={styles.imageBorder} />
                    {currentProfile.isVerified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
                      </View>
                    )}
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{currentProfile.name}</Text>
                    <Text style={styles.profileAge}>{currentProfile.age} éves</Text>
                    {currentProfile.distance && (
                      <View style={styles.distanceContainer}>
                        <Ionicons name="location" size={14} color="#fff" />
                        <Text style={styles.distance}>{currentProfile.distance} km</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </Animated.View>
            </View>

            {/* Navigation dots */}
            {matches.length > 1 && (
              <View style={styles.dotsContainer}>
                {matches.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === currentMatchIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Navigation arrows */}
            {matches.length > 1 && (
              <View style={styles.navigationContainer}>
                <TouchableOpacity
                  style={[
                    styles.navArrow,
                    currentMatchIndex === 0 && styles.navArrowDisabled,
                  ]}
                  onPress={() => {
                    if (currentMatchIndex > 0) {
                      setCurrentMatchIndex(currentMatchIndex - 1);
                    }
                  }}
                  disabled={currentMatchIndex === 0}
                >
                  <Ionicons
                    name="chevron-back"
                    size={24}
                    color={currentMatchIndex === 0 ? 'rgba(255,255,255,0.3)' : '#fff'}
                  />
                </TouchableOpacity>
                <Text style={styles.matchCounter}>
                  {currentMatchIndex + 1} / {matches.length}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.navArrow,
                    currentMatchIndex === matches.length - 1 && styles.navArrowDisabled,
                  ]}
                  onPress={() => {
                    if (currentMatchIndex < matches.length - 1) {
                      setCurrentMatchIndex(currentMatchIndex + 1);
                    }
                  }}
                  disabled={currentMatchIndex === matches.length - 1}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={currentMatchIndex === matches.length - 1 ? 'rgba(255,255,255,0.3)' : '#fff'}
                  />
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.message}>
              <Text style={styles.messageHighlight}>Kedves {currentProfile.name}</Text> és te
              {'\n'}
              <Text style={styles.messageBold}>egymásnak tetszettek!</Text>
            </Text>

            {/* Action buttons with unique design */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  console.log('MatchAnimation: Beszélgetés indítása - currentProfile:', currentProfile?.name, currentProfile?.id);
                  if (onSendMessage && currentProfile) {
                    onSendMessage(currentProfile);
                  } else {
                    onClose();
                  }
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF3B75', '#FF6B9D', '#FF8FB3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
                  <Text style={styles.primaryButtonText}>Beszélgetés indítása</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Térkép gomb */}
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => {
                  if (navigation && currentProfile) {
                    try {
                      // Navigate to Profile tab, then to Map screen
                      // Pass returnToMatchPopup flag so the back button knows to return here
                      const rootNavigator = navigation.getParent?.() || navigation;
                      rootNavigator.navigate('Profil', {
                        screen: 'Map',
                        params: {
                          selectedProfileId: currentProfile.id,
                          selectedProfile: currentProfile,
                          returnToMatchPopup: true,
                          matchPopupParams: {
                            profile: currentProfile,
                            allMatches: matches,
                            currentMatchIndex: currentMatchIndex,
                          },
                        },
                      });
                      // Close the popup temporarily, it will reopen when returning
                      onClose();
                    } catch (error) {
                      console.error('MatchAnimation: Error navigating to Map:', error);
                      // Fallback: navigate to Profile tab first
                      try {
                        const rootNavigator = navigation.getParent?.() || navigation;
                        rootNavigator.navigate('Profil');
                        setTimeout(() => {
                          rootNavigator.navigate('Profil', {
                            screen: 'Map',
                            params: {
                              selectedProfileId: currentProfile.id,
                              selectedProfile: currentProfile,
                              returnToMatchPopup: true,
                              matchPopupParams: {
                                profile: currentProfile,
                                allMatches: matches,
                                currentMatchIndex: currentMatchIndex,
                              },
                            },
                          });
                        }, 500);
                      } catch (fallbackError) {
                        console.error('MatchAnimation: Error in fallback navigation:', fallbackError);
                      }
                    }
                  }
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4CAF50', '#66BB6A', '#81C784']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.mapButtonGradient}
                >
                  <Ionicons name="map" size={20} color="#fff" />
                  <Text style={styles.mapButtonText}>Térkép</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.secondaryButtonGradient}
                >
                  <Text style={styles.secondaryButtonText}>Folytatás</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sparkle: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  headerContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  geometricShape1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 59, 117, 0.2)',
    transform: [{ rotate: '45deg' }],
  },
  geometricShape2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 107, 157, 0.3)',
    transform: [{ rotate: '-30deg' }],
  },
  iconContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  iconGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 35,
    fontWeight: '600',
    letterSpacing: 1,
  },
  profileCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 30,
    shadowColor: '#FF3B75',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  cardGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileImageWrapper: {
    position: 'relative',
    marginRight: 20,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#fff',
  },
  imageBorder: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(255, 59, 117, 0.5)',
    top: -3,
    left: -3,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 2,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileAge: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distance: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  message: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 35,
    lineHeight: 24,
  },
  messageHighlight: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#FFD700',
  },
  messageBold: {
    fontWeight: '700',
    fontSize: 17,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF3B75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  secondaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  secondaryButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  swipeContainer: {
    width: '100%',
    marginBottom: 20,
  },
  swipeableContent: {
    width: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#fff',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  navArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowDisabled: {
    opacity: 0.3,
  },
  matchCounter: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },
  mapButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mapButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  mapButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});

export default MatchAnimation;
