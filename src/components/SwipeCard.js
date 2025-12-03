import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, PanResponder, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CompatibilityService from '../services/CompatibilityService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

const getActivityText = (lastActive) => {
  if (!lastActive) return 'Offline';
  const now = new Date();
  const diff = now - new Date(lastActive);
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 15) return 'Online most';
  if (hours < 1) return `${minutes} perce aktív`;
  if (hours < 24) return `${hours} órája aktív`;
  if (days < 7) return `${days} napja aktív`;
  return 'Régen aktív';
};

const getActivityStyle = (lastActive) => {
  if (!lastActive) return { backgroundColor: '#999' };
  const now = new Date();
  const diff = now - new Date(lastActive);
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (minutes < 15) return { backgroundColor: '#4CAF50' };
  if (hours < 1) return { backgroundColor: '#FFC107' };
  return { backgroundColor: '#999' };
};

const SwipeCard = forwardRef(({ profile, onSwipeLeft, onSwipeRight, isFirst, userProfile, onDoubleTap, onProfilePress, fullScreen = false }, ref) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showLike, setShowLike] = useState(false);
  const [showNope, setShowNope] = useState(false);
  const [swipeStrength, setSwipeStrength] = useState(0);
  const [showSuperLike, setShowSuperLike] = useState(false);
  const lastTap = useRef(null);
  const superLikeTimeoutRef = useRef(null);

  const compatibility = userProfile 
    ? CompatibilityService.calculateCompatibility(userProfile, profile)
    : null;


  useEffect(() => {
    return () => {
      if (superLikeTimeoutRef.current) {
        clearTimeout(superLikeTimeoutRef.current);
      }
    };
  }, []);

  const triggerSuperLikeBadge = () => {
    setShowSuperLike(true);
    if (superLikeTimeoutRef.current) {
      clearTimeout(superLikeTimeoutRef.current);
    }
    superLikeTimeoutRef.current = setTimeout(() => {
      setShowSuperLike(false);
    }, 700);
  };

  useImperativeHandle(ref, () => ({
    swipeLeft: () => {
      setPosition({ x: -SCREEN_WIDTH - 100, y: 0 });
      setTimeout(() => {
        onSwipeLeft(profile);
        setPosition({ x: 0, y: 0 });
      }, 250);
    },
    swipeRight: () => {
      setPosition({ x: SCREEN_WIDTH + 100, y: 0 });
      setTimeout(() => {
        onSwipeRight(profile);
        setPosition({ x: 0, y: 0 });
      }, 250);
    },
    superLike: () => {
      triggerSuperLikeBadge();
      setPosition({ x: 0, y: -SCREEN_HEIGHT });
      setTimeout(() => {
        onSwipeRight(profile);
        setPosition({ x: 0, y: 0 });
        setShowLike(false);
      }, 280);
    },
  }));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (e, gesture) => {
        setPosition({ x: gesture.dx, y: gesture.dy });
        const strength = Math.min(1, Math.abs(gesture.dx) / (SWIPE_THRESHOLD * 0.9));
        
        if (gesture.dx > 50) {
          setShowLike(true);
          setShowNope(false);
          setSwipeStrength(strength);
        } else if (gesture.dx < -50) {
          setShowNope(true);
          setShowLike(false);
          setSwipeStrength(strength);
        } else {
          setShowLike(false);
          setShowNope(false);
          setSwipeStrength(0);
        }
      },
      onPanResponderRelease: (e, gesture) => {
        setIsDragging(false);
        setSwipeStrength(0);
        
        // Ha volt jelentős mozgás, akkor swipe
        const hasSignificantMovement = Math.abs(gesture.dx) > 10 || Math.abs(gesture.dy) > 10;
        
        if (hasSignificantMovement) {
          // Swipe logika
          if (gesture.dx > SWIPE_THRESHOLD) {
            setPosition({ x: SCREEN_WIDTH + 100, y: gesture.dy });
            setTimeout(() => {
              onSwipeRight(profile);
              setPosition({ x: 0, y: 0 });
              setShowLike(false);
            }, 250);
          } else if (gesture.dx < -SWIPE_THRESHOLD) {
            setPosition({ x: -SCREEN_WIDTH - 100, y: gesture.dy });
            setTimeout(() => {
              onSwipeLeft(profile);
              setPosition({ x: 0, y: 0 });
              setShowNope(false);
            }, 250);
          } else if (gesture.dy < -120 && Math.abs(gesture.dx) < 80) {
            triggerSuperLikeBadge();
            setPosition({ x: 0, y: -SCREEN_HEIGHT });
            setTimeout(() => {
              onSwipeRight(profile);
              setPosition({ x: 0, y: 0 });
              setShowLike(false);
            }, 280);
          } else {
            setPosition({ x: 0, y: 0 });
            setShowLike(false);
            setShowNope(false);
          }
        } else {
          // Nincs mozgás, csak tap - dupla tap detektálás
          const now = Date.now();
          const DOUBLE_TAP_DELAY = 300;
          
          if (lastTap.current && (now - lastTap.current) < DOUBLE_TAP_DELAY) {
            // Double tap detected!
            lastTap.current = null;
            if (onDoubleTap) {
              console.log('SwipeCard: Double tap detected, calling onDoubleTap');
              onDoubleTap(profile);
            }
          } else {
            lastTap.current = now;
          }
          
          // Reset pozíció
          setPosition({ x: 0, y: 0 });
          setShowLike(false);
          setShowNope(false);
        }
      },
    })
  ).current;

  const rotation = (position.x / SCREEN_WIDTH) * 10;
  const cardWidth = fullScreen ? SCREEN_WIDTH : SCREEN_WIDTH * 0.94;
  const cardHeight = fullScreen ? SCREEN_HEIGHT : SCREEN_HEIGHT * 0.72;
  const cardBorderRadius = fullScreen ? 0 : 20;

  return (
    <View
      style={[
        styles.card,
        !isFirst && styles.nextCard,
        { 
          width: cardWidth,
          height: cardHeight,
          borderRadius: cardBorderRadius,
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate: `${rotation}deg` }
          ]
        }
      ]}
      {...panResponder.panHandlers}
    >
      <Image source={{ uri: profile.photo }} style={styles.image} />
      
      {compatibility && !fullScreen && (
        <View
          style={[
            styles.compatibilityBadge,
            { borderColor: `${compatibility.level.color}55` },
          ]}
        >
          <Text style={styles.compatibilityScore}>{compatibility.score}%</Text>
          <Text style={styles.compatibilityText}>Match</Text>
        </View>
      )}
      
      {showLike && (
        <View style={[styles.stamp, styles.likeStamp, { opacity: swipeStrength }]}>
          <Text style={[styles.stampText, { color: '#4CAF50' }]}>LIKE</Text>
        </View>
      )}

      {showNope && (
        <View style={[styles.stamp, styles.nopeStamp, { opacity: swipeStrength }]}>
          <Text style={[styles.stampText, { color: '#F44336' }]}>NOPE</Text>
        </View>
      )}

      {showSuperLike && (
        <View style={styles.superLikeBadge}>
          <LinearGradient
            colors={['#4f9df7', '#5fd4ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.superLikeGradient}
          >
            <Ionicons name="star" size={26} color="#fff" />
            <Text style={styles.superLikeText}>SUPER LIKE</Text>
          </LinearGradient>
        </View>
      )}

      {!fullScreen && (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        >
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.age}>{profile.age != null && !isNaN(profile.age) ? profile.age : 25}</Text>
              {profile.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
                </View>
              )}
            </View>
            <View style={styles.detailsRow}>
              <Ionicons name="location-outline" size={16} color="#fff" />
              <Text style={styles.location}>{profile.distance} km</Text>
              {profile.relationshipGoal && (
                <>
                  <Text style={styles.detailsSeparator}>•</Text>
                  <Text style={styles.relationshipGoal}>
                    {profile.relationshipGoal === 'serious' ? '💍 Komoly' : 
                     profile.relationshipGoal === 'casual' ? '😊 Laza' : 
                     '👥 Barátság'}
                  </Text>
                </>
              )}
            </View>
            <View style={styles.activityRow}>
              <View style={[styles.activityDot, getActivityStyle(profile.lastActive)]} />
              <Text style={styles.activityText}>{getActivityText(profile.lastActive)}</Text>
            </View>
            {profile.bio && (
              <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
            )}
            
            {compatibility && compatibility.commonInterests.length > 0 && (
              <View style={styles.commonInterestsContainer}>
                <Ionicons name="heart" size={12} color="#FF3B75" />
                <Text style={styles.commonInterestsText}>
                  {compatibility.commonInterests.join(', ')}
                </Text>
              </View>
            )}
            
            {/* Profil megnyitás gomb */}
            {onProfilePress && (
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => {
                  console.log('SwipeCard: Profile button pressed');
                  if (onProfilePress) {
                    onProfilePress(profile);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="information-circle" size={20} color="#fff" />
                <Text style={styles.profileButtonText}>Részletek</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.92,
    height: SCREEN_HEIGHT * 0.75,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  nextCard: {
    transform: [{ scale: 0.94 }],
    opacity: 0.6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 28,
  },
  info: {
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  age: {
    fontSize: 30,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '400',
    marginLeft: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  location: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  bio: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 8,
    lineHeight: 20,
    fontWeight: '400',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  interestText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  stamp: {
    position: 'absolute',
    top: 60,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 5,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  likeStamp: {
    right: 30,
    borderColor: '#4CAF50',
    transform: [{ rotate: '20deg' }],
  },
  nopeStamp: {
    left: 30,
    borderColor: '#F44336',
    transform: [{ rotate: '-20deg' }],
  },
  stampText: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 3,
  },
  superLikeBadge: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    zIndex: 12,
  },
  superLikeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 26,
    shadowColor: '#4f9df7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  superLikeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  compatibilityBadge: {
    position: 'absolute',
    top: 26,
    right: 24,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: 'rgba(10, 10, 10, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  compatibilityScore: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  compatibilityText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  commonInterestsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    marginBottom: 10,
    marginTop: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  commonInterestsText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  commonInterestTag: {
    backgroundColor: '#FF3B75',
    borderColor: '#FF3B75',
  },
  commonInterestText: {
    color: '#fff',
  },
  verifiedBadge: {
    marginLeft: 5,
  },
  relationshipGoal: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  detailsSeparator: {
    fontSize: 14,
    color: '#fff',
    marginHorizontal: 5,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SwipeCard;
