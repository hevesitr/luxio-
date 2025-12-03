import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import MediaUploadService from '../services/MediaUploadService';
import { supabase } from '../services/supabaseClient';
import { useTheme } from '../context/ThemeContext';

const PhotoUploadScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { userId } = route.params || {};
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const MAX_PHOTOS = 6;

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('photos')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data && data.photos) {
        setPhotos(data.photos);
      }
    } catch (error) {
      console.error('Load photos error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPhoto = () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Maximum elérve', `Maximum ${MAX_PHOTOS} képet tölthetsz fel.`);
      return;
    }

    Alert.alert(
      'Kép hozzáadása',
      'Válassz egy lehetőséget',
      [
        {
          text: 'Kamera',
          onPress: handleCamera,
        },
        {
          text: 'Galéria',
          onPress: handleGallery,
        },
        {
          text: 'Mégse',
          style: 'cancel',
        },
      ]
    );
  };

  const handleCamera = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await MediaUploadService.pickImageFromCamera();
      if (result) {
        await uploadPhoto(result.uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Hiba', 'Kép készítése sikertelen.');
    }
  };

  const handleGallery = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await MediaUploadService.pickImageFromGallery();
      if (result) {
        await uploadPhoto(result.uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Hiba', 'Kép választása sikertelen.');
    }
  };

  const uploadPhoto = async (uri) => {
    try {
      setIsUploading(true);
      const fileName = `photo_${Date.now()}.jpg`;
      const upload = await MediaUploadService.uploadImage(uri, userId, fileName);

      const newPhotos = [...photos, upload.url];
      setPhotos(newPhotos);

      const { error } = await supabase
        .from('profiles')
        .update({ photos: newPhotos })
        .eq('id', userId);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Siker', 'Kép feltöltve!');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Hiba', 'Kép feltöltése sikertelen.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = (index) => {
    Alert.alert(
      'Kép törlése',
      'Biztosan törölni szeretnéd ezt a képet?',
      [
        {
          text: 'Mégse',
          style: 'cancel',
        },
        {
          text: 'Törlés',
          style: 'destructive',
          onPress: async () => {
            try {
              const newPhotos = photos.filter((_, i) => i !== index);
              setPhotos(newPhotos);

              const { error } = await supabase
                .from('profiles')
                .update({ photos: newPhotos })
                .eq('id', userId);

              if (error) throw error;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Hiba', 'Kép törlése sikertelen.');
            }
          },
        },
      ]
    );
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Képek kezelése</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Képek betöltése...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            {photos.length}/{MAX_PHOTOS} kép feltöltve
          </Text>

          <View style={styles.grid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePhoto(index)}
                >
                  <Ionicons name="close-circle" size={28} color="#FF3B75" />
                </TouchableOpacity>
              </View>
            ))}

            {photos.length < MAX_PHOTOS && (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={handleAddPhoto}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <>
                    <Ionicons name="add" size={40} color={theme.colors.textSecondary} />
                    <Text style={styles.addPhotoText}>Kép hozzáadása</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.infoText}>
              Tölts fel legalább 2 képet a profilodhoz. A képek segítenek másoknak megismerni téged!
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    width: '48%',
    aspectRatio: 4 / 5,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 14,
  },
  addPhotoButton: {
    width: '48%',
    aspectRatio: 4 / 5,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addPhotoText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 24,
    padding: 16,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});

export default PhotoUploadScreen;
