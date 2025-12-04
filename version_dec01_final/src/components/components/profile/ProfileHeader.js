import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ProfileHeader = ({ 
  userProfile, 
  completionPercentage, 
  completionMessage,
  onEditPress,
  onPhotoPress,
  theme 
}) => {
  return (
    <View style={styles.header}>
      <LinearGradient
        colors={['rgba(255, 59, 117, 0.8)', 'rgba(255, 107, 157, 0.6)']}
        style={styles.headerGradient}
      >
        <TouchableOpacity 
          style={styles.photoContainer}
          onPress={onPhotoPress}
        >
          <Image
            source={{ uri: userProfile.photo }}
            style={styles.profilePhoto}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.photoOverlay}>
            <Ionicons name="camera" size={32} color="#fff" />
            <Text style={styles.photoOverlayText}>Fotó módosítása</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.name}>
            {userProfile.name}, {userProfile.age}
          </Text>
          {userProfile.work && (
            <View style={styles.infoRow}>
              <Ionicons name="briefcase" size={16} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.infoText}>{userProfile.work}</Text>
            </View>
          )}
          {userProfile.education && (
            <View style={styles.infoRow}>
              <Ionicons name="school" size={16} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.infoText}>{userProfile.education}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.editButton}
          onPress={onEditPress}
        >
          <Ionicons name="create-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Profile Completion */}
      {completionPercentage < 100 && (
        <View style={[styles.completionCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.completionHeader}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            <Text style={[styles.completionTitle, { color: theme.colors.text }]}>
              Profil kitöltöttség: {completionPercentage}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${completionPercentage}%`,
                  backgroundColor: theme.colors.primary 
                }
              ]} 
            />
          </View>
          {completionMessage && (
            <Text style={[styles.completionMessage, { color: theme.colors.textSecondary }]}>
              {completionMessage}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  headerGradient: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  photoOverlayText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '600',
  },
  headerInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  editButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 10,
  },
  completionCard: {
    margin: 20,
    marginTop: -10,
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  completionMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ProfileHeader;
