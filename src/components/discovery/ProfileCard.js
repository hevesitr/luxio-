/**
 * Profile Card Component
 * Displays user profile in discovery feed
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  PanResponder,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ProfileCard = ({ profile, isActive, onSwipeLeft, onSwipeRight }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false
      }),
      onPanResponderRelease: (e, gesture) => {
        const { dx, dy, vx, vy } = gesture;

        // Horizontal swipe threshold
        const horizontalThreshold = SCREEN_WIDTH * 0.3;

        if (Math.abs(dx) > horizontalThreshold) {
          if (dx > 0) {
            // Swipe right - Like
            Animated.spring(pan, {
              toValue: { x: SCREEN_WIDTH, y: dy },
              useNativeDriver: false,
            }).start(() => {
              onSwipeRight && onSwipeRight();
              pan.setValue({ x: 0, y: 0 });
            });
          } else {
            // Swipe left - Pass
            Animated.spring(pan, {
              toValue: { x: -SCREEN_WIDTH, y: dy },
              useNativeDriver: false,
            }).start(() => {
              onSwipeLeft && onSwipeLeft();
              pan.setValue({ x: 0, y: 0 });
            });
          }
        } else {
          // Reset position if not swiped far enough
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  if (!profile) return null;

  // Kezeljük a különböző adatstruktúrákat (Supabase vs Mock)
  const photos = profile.photos || [];
  const currentPhoto = photos[currentPhotoIndex] ||
                      profile.photo_url ||
                      profile.avatar_url ||
                      profile.profile_picture ||
                      'https://via.placeholder.com/400x500?text=No+Image';

  // Név kezelése különböző mezőkből
  const displayName = profile.name || profile.full_name || 'Ismeretlen';

  // Kor kezelése
  const age = (() => {
    // Először próbáljuk a profile.age mezőt
    if (typeof profile.age === 'number' && !isNaN(profile.age) && profile.age > 0) {
      return profile.age;
    }

    // Ha nincs age mező vagy érvénytelen, próbáljuk a date_of_birth-ot
    if (profile.date_of_birth) {
      try {
        const birthYear = new Date(profile.date_of_birth).getFullYear();
        const currentYear = new Date().getFullYear();
        const calculatedAge = currentYear - birthYear;

        // Ellenőrizzük, hogy ésszerű kor-e (18-100 év)
        if (calculatedAge >= 18 && calculatedAge <= 100) {
          return calculatedAge;
        }
      } catch (error) {
        // Hibás dátum formátum esetén folytatjuk
      }
    }

    // Ha semmi sem működik, null-t adunk vissza
    return null;
  })();

  // Város/helyszín kezelése
  const city = profile.city || 'Budapest'; // Default Budapest

  // Bio kezelése
  const bio = profile.bio || 'Nincs bemutatkozás.';

  // Ellenőrzött státusz kezelése
  const isVerified = profile.is_verified || profile.isVerified || false;
  
  const handlePhotoPress = (side) => {
    if (side === 'left' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
    } else if (side === 'right' && currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1);
    }
  };
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
          ]
        }
      ]}
      {...panResponder.panHandlers}
    >
      {/* Photo */}
      <Image
        source={{ uri: currentPhoto }}
        style={styles.photo}
        resizeMode="cover"
      />
      
      {/* Photo indicators */}
      {photos.length > 1 && (
        <View style={styles.indicators}>
          {photos.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentPhotoIndex && styles.indicatorActive
              ]}
            />
          ))}
        </View>
      )}
      
      {/* Photo navigation */}
      {photos.length > 1 && (
        <View style={styles.photoNavigation}>
          <TouchableOpacity
            style={styles.photoNavButton}
            onPress={() => handlePhotoPress('left')}
            disabled={currentPhotoIndex === 0}
          />
          <TouchableOpacity
            style={styles.photoNavButton}
            onPress={() => handlePhotoPress('right')}
            disabled={currentPhotoIndex === photos.length - 1}
          />
        </View>
      )}
      
      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      />
      
      {/* Profile info */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {displayName}
            {age && <Text style={styles.age}>, {age}</Text>}
          </Text>

          {isVerified && (
            <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
          )}
        </View>

        {bio && (
          <Text style={styles.bio} numberOfLines={3}>
            {bio}
          </Text>
        )}

        {/* Tags */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagsContainer}
        >
          {city && (
            <View style={styles.tag}>
              <Ionicons name="location" size={14} color="#fff" />
              <Text style={styles.tagText}>{city}</Text>
            </View>
          )}
          
          {profile.occupation && (
            <View style={styles.tag}>
              <Ionicons name="briefcase" size={14} color="#fff" />
              <Text style={styles.tagText}>{profile.occupation}</Text>
            </View>
          )}
          
          {profile.education && (
            <View style={styles.tag}>
              <Ionicons name="school" size={14} color="#fff" />
              <Text style={styles.tagText}>{profile.education}</Text>
            </View>
          )}
          
          {profile.distance && (
            <View style={styles.tag}>
              <Ionicons name="navigate" size={14} color="#fff" />
              <Text style={styles.tagText}>{profile.distance} km away</Text>
            </View>
          )}
        </ScrollView>
        
        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.interestsContainer}
          >
            {profile.interests.slice(0, 5).map((interest, index) => (
              <View key={index} style={styles.interest}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(245,245,245,0.01)', // KRITIKUS: Android PanResponder fix
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  indicators: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 4,
  },
  indicator: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
  },
  indicatorActive: {
    backgroundColor: '#fff',
  },
  photoNavigation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  photoNavButton: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  infoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  age: {
    fontSize: 28,
    fontWeight: '400',
    color: '#fff',
  },
  bio: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
    lineHeight: 22,
  },
  tagsContainer: {
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
  },
  interestsContainer: {
    marginTop: 8,
  },
  interest: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  interestText: {
    color: '#fff',
    fontSize: 13,
  },
});

export default ProfileCard;
