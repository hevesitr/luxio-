import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const ProfilePreviewCard = ({ profile, onClose, onLike, onMessage }) => {
  if (!profile) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.name} profilja</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Image */}
        <View style={styles.imageContainer}>
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.5)']}
            style={styles.imageGradient}
          >
            <Text style={styles.profileInitial}>{profile.name.charAt(0)}</Text>
          </LinearGradient>
        </View>

        {/* Profile Info */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>{profile.name}, {profile.age}</Text>
          <Text style={styles.distance}>{profile.distance.toFixed(1)} km távolságra</Text>

          <View style={styles.bioSection}>
            <Text style={styles.bioTitle}>Róla</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>

          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.interestsSection}>
              <Text style={styles.interestsTitle}>Érdeklődési körök</Text>
              <View style={styles.interestsContainer}>
                {profile.interests.map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.messageButton} onPress={onMessage}>
          <Ionicons name="chatbubble-outline" size={24} color="#00D4FF" />
          <Text style={styles.messageButtonText}>Üzenet</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.superLikeButton} onPress={() => {
          Alert.alert('Super Like', `Super like küldve ${profile.name}-nak! ✨`);
          onClose();
        }}>
          <Ionicons name="star" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.likeButton} onPress={onLike}>
          <Ionicons name="heart" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => {
            Alert.alert('Kedvencek', `${profile.name} hozzáadva a kedvencekhez! ⭐`);
            onClose();
          }}
        >
          <Ionicons name="star-outline" size={20} color="#FFD700" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 200,
    backgroundColor: '#00D4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#fff',
    fontSize: 80,
    fontWeight: '700',
  },
  infoSection: {
    padding: 20,
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  distance: {
    color: '#00D4FF',
    fontSize: 16,
    marginBottom: 20,
  },
  bioSection: {
    marginBottom: 24,
  },
  bioTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  bio: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
  },
  interestsSection: {
    marginBottom: 24,
  },
  interestsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  interestText: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#00D4FF',
  },
  messageButtonText: {
    color: '#00D4FF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  superLikeButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFD700',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  likeButton: {
    width: 56,
    height: 56,
    backgroundColor: '#FF3B75',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  favoriteButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
});

export default ProfilePreviewCard;
