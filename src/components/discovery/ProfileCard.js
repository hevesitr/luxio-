/**
 * Profile Card Component
 * Displays user profile in discovery feed
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ProfileCard = ({ profile, isActive }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  if (!profile) return null;
  
  const photos = profile.photos || [];
  const currentPhoto = photos[currentPhotoIndex] || profile.photo_url;
  
  const age = profile.age || profile.date_of_birth 
    ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()
    : null;
  
  const handlePhotoPress = (side) => {
    if (side === 'left' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
    } else if (side === 'right' && currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1);
    }
  };
  
  return (
    <View style={styles.container}>
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
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      />
      
      {/* Profile info */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {profile.name || profile.full_name}
            {age && <Text style={styles.age}>, {age}</Text>}
          </Text>
          
          {profile.is_verified && (
            <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
          )}
        </View>
        
        {profile.bio && (
          <Text style={styles.bio} numberOfLines={3}>
            {profile.bio}
          </Text>
        )}
        
        {/* Tags */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagsContainer}
        >
          {profile.city && (
            <View style={styles.tag}>
              <Ionicons name="location" size={14} color="#fff" />
              <Text style={styles.tagText}>{profile.city}</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
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
