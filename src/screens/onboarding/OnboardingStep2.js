/**
 * Onboarding Step 2: Photo Upload
 *
 * Photo upload step with validation and tips
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import OnboardingValidationService from '../../services/OnboardingValidationService';
import InlineError from '../../components/InlineError';

const MAX_PHOTOS = 9;
const MIN_PHOTOS = 2;

const OnboardingStep2 = ({ formData, onUpdateFormData, onNext, onBack }) => {
  const { theme } = useTheme();
  const [validation, setValidation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const photos = formData.photos || [];

  const handlePhotoPick = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Maximum elérve', `Maximum ${MAX_PHOTOS} kép tölthető fel.`);
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          'Engedély szükséges',
          'A fénykép könyvtár eléréséhez engedély szükséges.',
          [
            { text: 'Mégse', style: 'cancel' },
            { text: 'Beállítások', onPress: () => {
              // This would open app settings
              Alert.alert('Info', 'Kérjük, engedélyezd a fénykép könyvtár hozzáférést a telefon beállításaiban.');
            }}
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const newPhoto = {
          uri: result.assets[0].uri,
          id: Date.now().toString(),
          isFromLibrary: true,
        };

        const updatedPhotos = [...photos, newPhoto];
        onUpdateFormData({ photos: updatedPhotos });

        // Validate after adding photo
        const validationResult = OnboardingValidationService.validatePhotos(updatedPhotos);
        setValidation(validationResult);
      }
    } catch (error) {
      console.error('Photo pick error:', error);
      Alert.alert('Hiba', 'A kép kiválasztása sikertelen volt. Kérjük, próbáld újra.');
    }
  };

  const handleTakePhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Maximum elérve', `Maximum ${MAX_PHOTOS} kép tölthető fel.`);
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          'Kamera engedély szükséges',
          'A fényképezéshez kamera engedély szükséges.',
          [
            { text: 'Mégse', style: 'cancel' },
            { text: 'Beállítások', onPress: () => {
              Alert.alert('Info', 'Kérjük, engedélyezd a kamera hozzáférést a telefon beállításaiban.');
            }}
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const newPhoto = {
          uri: result.assets[0].uri,
          id: Date.now().toString(),
          isFromCamera: true,
        };

        const updatedPhotos = [...photos, newPhoto];
        onUpdateFormData({ photos: updatedPhotos });

        // Validate after adding photo
        const validationResult = OnboardingValidationService.validatePhotos(updatedPhotos);
        setValidation(validationResult);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Hiba', 'A fényképezés sikertelen volt. Kérjük, próbáld újra.');
    }
  };

  const removePhoto = (photoId) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    onUpdateFormData({ photos: updatedPhotos });

    // Validate after removing photo
    const validationResult = OnboardingValidationService.validatePhotos(updatedPhotos);
    setValidation(validationResult);
  };

  const handleNext = () => {
    const validationResult = OnboardingValidationService.validatePhotos(photos);
    setValidation(validationResult);

    if (validationResult.isValid) {
      onNext();
    }
  };

  const photoTips = [
    'Használj természetes fényt',
    'Mosolyogj és nézz a kamerába',
    'Mutasd meg a személyiséged',
    'Felső test kép a legjobb',
    'Kerüld a szűrőket és sapkát'
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Add profilképeket
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Legalább 2 kép szükséges, de minél több, annál jobb!
          </Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {Array.from({ length: MAX_PHOTOS }, (_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index < photos.length
                    ? theme.colors.primary
                    : theme.colors.border
                }
              ]}
            />
          ))}
          <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
            {photos.length}/{MAX_PHOTOS}
          </Text>
        </View>

        {/* Photo Grid */}
        <View style={styles.photoGrid}>
          {/* Add Photo Buttons */}
          {photos.length < MAX_PHOTOS && (
            <>
              <TouchableOpacity
                style={[styles.photoSlot, styles.addPhotoSlot, { borderColor: theme.colors.primary }]}
                onPress={handlePhotoPick}
              >
                <Ionicons name="images" size={32} color={theme.colors.primary} />
                <Text style={[styles.addPhotoText, { color: theme.colors.primary }]}>
                  Galériából
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.photoSlot, styles.addPhotoSlot, { borderColor: theme.colors.primary }]}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera" size={32} color={theme.colors.primary} />
                <Text style={[styles.addPhotoText, { color: theme.colors.primary }]}>
                  Fényképezés
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Uploaded Photos */}
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.photoContainer}>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
                onPress={() => removePhoto(photo.id)}
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
              {index === 0 && (
                <View style={[styles.mainPhotoBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[styles.mainPhotoText, { color: theme.colors.cardBackground }]}>
                    Fő kép
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Validation Error */}
        {validation && !validation.isValid && (
          <InlineError error={validation.errors[0]?.message} />
        )}

        {/* Tips */}
        <View style={[styles.tipsContainer, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
            💡 Tippek a jó profilképekhez:
          </Text>
          {photoTips.map((tip, index) => (
            <Text key={index} style={[styles.tipText, { color: theme.colors.textSecondary }]}>
              • {tip}
            </Text>
          ))}
        </View>

        {/* Warnings */}
        {validation && validation.warnings && validation.warnings.length > 0 && (
          <View style={[styles.warningContainer, { backgroundColor: theme.colors.warning + '20' }]}>
            <Ionicons name="information-circle" size={20} color={theme.colors.warning} />
            <Text style={[styles.warningText, { color: theme.colors.warning }]}>
              {validation.warnings[0].message}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomContainer, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.textSecondary} />
          <Text style={[styles.backButtonText, { color: theme.colors.textSecondary }]}>
            Vissza
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: validation?.isValid ? theme.colors.primary : theme.colors.border
            }
          ]}
          onPress={handleNext}
          disabled={!validation?.isValid}
        >
          <Text style={[
            styles.nextButtonText,
            {
              color: validation?.isValid ? theme.colors.cardBackground : theme.colors.textSecondary
            }
          ]}>
            Tovább
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={validation?.isValid ? theme.colors.cardBackground : theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContainer: {
    flex: 1,
  },

  contentContainer: {
    paddingBottom: 120,
  },

  header: {
    padding: 24,
    alignItems: 'center',
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 8,
  },

  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  progressText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },

  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },

  photoSlot: {
    width: 100,
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addPhotoSlot: {
    borderWidth: 2,
    borderStyle: 'dashed',
  },

  addPhotoText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },

  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    position: 'relative',
  },

  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },

  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mainPhotoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  mainPhotoText: {
    fontSize: 10,
    fontWeight: '600',
  },

  tipsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },

  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },

  tipText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },

  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },

  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 34,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },

  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },

  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    gap: 8,
  },

  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingStep2;
