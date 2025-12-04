import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

const ProfilePhotos = ({ photos, onPhotoPress, onAddPhoto, theme }) => {
  return (
    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="images" size={24} color={theme.colors.primary} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Fotóim ({photos?.length || 0}/6)
        </Text>
      </View>
      <View style={styles.photosGrid}>
        {photos?.map((photo, index) => (
          <TouchableOpacity
            key={index}
            style={styles.photoItem}
            onPress={() => onPhotoPress(photo, index)}
          >
            <Image
              source={{ uri: photo.url }}
              style={styles.photo}
              contentFit="cover"
              transition={200}
            />
            {photo.isPrivate && (
              <View style={styles.privateBadge}>
                <Ionicons name="lock-closed" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        ))}
        {(!photos || photos.length < 6) && (
          <TouchableOpacity
            style={[styles.photoItem, styles.addPhotoButton]}
            onPress={onAddPhoto}
          >
            <Ionicons name="add" size={32} color={theme.colors.primary} />
            <Text style={[styles.addPhotoText, { color: theme.colors.textSecondary }]}>
              Fotó hozzáadása
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoItem: {
    width: '31%',
    aspectRatio: 0.75,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  privateBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  addPhotoButton: {
    backgroundColor: 'rgba(255, 59, 117, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 59, 117, 0.3)',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ProfilePhotos;
