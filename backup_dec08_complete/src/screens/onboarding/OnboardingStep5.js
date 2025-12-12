/**
 * Onboarding Step 5: Review & Complete
 *
 * Review all entered information and complete onboarding
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import ProfileService from '../../services/ProfileService';
import OnboardingValidationService from '../../services/OnboardingValidationService';
import ErrorMessageService from '../../services/ErrorMessageService';
import InlineError from '../../components/InlineError';
import ErrorDisplay from '../../components/ErrorDisplay';

const OnboardingStep5 = ({ formData, onUpdateFormData, onComplete, onBack }) => {
  const { theme } = useTheme();
  const { user, completeOnboarding } = useAuth();
  const [validation, setValidation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Final validation
      const validationResult = OnboardingValidationService.validateCompleteOnboarding(formData);
      setValidation(validationResult);

      if (!validationResult.isValid) {
        setError(ErrorMessageService.getOnboardingErrorMessage(validationResult.errors));
        return;
      }

      // Save profile data
      await ProfileService.updateProfile(user.id, {
        name: formData.name,
        birthday: formData.birthday,
        gender: formData.gender,
        bio: formData.bio,
        interests: formData.interests,
        photos: formData.photos.map(photo => ({ uri: photo.uri, isPrimary: photo.id === formData.photos[0]?.id })),
      });

      // Save preferences
      await ProfileService.updatePreferences(user.id, {
        looking_for: formData.lookingFor,
        min_age: formData.minAge,
        max_age: formData.maxAge,
        max_distance: formData.maxDistance,
      });

      // Mark onboarding as complete
      await completeOnboarding();

      // Show success message
      Alert.alert(
        'Üdvözöljük!',
        'A profilod sikeresen beállítva. Kezdd el felfedezni az új partnereket!',
        [
          { text: 'Rendben', onPress: onComplete }
        ]
      );

    } catch (error) {
      console.error('Onboarding completion error:', error);
      const userFriendlyError = ErrorMessageService.createUserFriendlyError(error);
      setError(userFriendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const birth = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const completionPercentage = validation?.completionPercentage || 0;

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
            Majdnem kész!
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Ellenőrizd az adataidat és kezdd el használni az alkalmazást
          </Text>
        </View>

        {/* Completion Progress */}
        <View style={styles.completionContainer}>
          <View style={styles.completionHeader}>
            <Text style={[styles.completionTitle, { color: theme.colors.text }]}>
              Profil teljesség
            </Text>
            <Text style={[styles.completionPercentage, { color: theme.colors.primary }]}>
              {completionPercentage}%
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
        </View>

        {/* Profile Preview */}
        <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Profil előnézet
          </Text>

          <View style={styles.profilePreview}>
            {/* Photos */}
            <View style={styles.photosPreview}>
              {formData.photos && formData.photos.length > 0 && (
                <Image
                  source={{ uri: formData.photos[0].uri }}
                  style={styles.mainPhoto}
                />
              )}
              {formData.photos && formData.photos.length > 1 && (
                <View style={styles.secondaryPhotos}>
                  {formData.photos.slice(1, 4).map((photo, index) => (
                    <Image
                      key={index}
                      source={{ uri: photo.uri }}
                      style={styles.secondaryPhoto}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.colors.text }]}>
                {formData.name || 'Név'}
              </Text>
              <Text style={[styles.profileAge, { color: theme.colors.textSecondary }]}>
                {calculateAge(formData.birthday) || 'Életkor'}
              </Text>
              {formData.bio && (
                <Text style={[styles.profileBio, { color: theme.colors.textSecondary }]}>
                  {formData.bio.length > 100 ? formData.bio.substring(0, 100) + '...' : formData.bio}
                </Text>
              )}
              {formData.interests && formData.interests.length > 0 && (
                <View style={styles.interestsPreview}>
                  {formData.interests.slice(0, 3).map((interest, index) => (
                    <View key={index} style={[styles.interestChip, { backgroundColor: theme.colors.primary + '20' }]}>
                      <Text style={[styles.interestText, { color: theme.colors.primary }]}>
                        {interest}
                      </Text>
                    </View>
                  ))}
                  {formData.interests.length > 3 && (
                    <Text style={[styles.moreInterests, { color: theme.colors.textSecondary }]}>
                      +{formData.interests.length - 3} egyéb
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Preferences Summary */}
        <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Keresési beállítások
          </Text>

          <View style={styles.preferencesList}>
            <View style={styles.preferenceItem}>
              <Ionicons name="heart" size={20} color={theme.colors.primary} />
              <Text style={[styles.preferenceText, { color: theme.colors.text }]}>
                Keresem: {formData.lookingFor === 'male' ? 'Férfiakat' :
                          formData.lookingFor === 'female' ? 'Nőket' : 'Mindenkit'}
              </Text>
            </View>

            <View style={styles.preferenceItem}>
              <Ionicons name="calendar" size={20} color={theme.colors.primary} />
              <Text style={[styles.preferenceText, { color: theme.colors.text }]}>
                Kor: {formData.minAge}-{formData.maxAge} év
              </Text>
            </View>

            <View style={styles.preferenceItem}>
              <Ionicons name="location" size={20} color={theme.colors.primary} />
              <Text style={[styles.preferenceText, { color: theme.colors.text }]}>
                Távolság: max {formData.maxDistance} km
              </Text>
            </View>
          </View>
        </View>

        {/* Validation Errors */}
        {validation && !validation.isValid && (
          <View style={styles.errorsContainer}>
            {validation.errors.map((error, index) => (
              <InlineError key={index} error={error.message} />
            ))}
          </View>
        )}

        {/* Warnings */}
        {validation && validation.warnings && validation.warnings.length > 0 && (
          <View style={[styles.warningContainer, { backgroundColor: theme.colors.warning + '20' }]}>
            <Ionicons name="information-circle" size={20} color={theme.colors.warning} />
            <Text style={[styles.warningText, { color: theme.colors.warning }]}>
              {validation.warnings[0].message}
            </Text>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <ErrorDisplay
            error={error}
            onRetry={handleComplete}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Tips */}
        <View style={[styles.tipsContainer, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
            💡 Utolsó tippek:
          </Text>
          <Text style={[styles.tipsText, { color: theme.colors.textSecondary }]}>
            • A profilképeid bármikor módosíthatók
          </Text>
          <Text style={[styles.tipsText, { color: theme.colors.textSecondary }]}>
            • A keresési beállításokat később is változtathatod
          </Text>
          <Text style={[styles.tipsText, { color: theme.colors.textSecondary }]}>
            • Minél részletesebb a profilod, annál több match-eredményed lesz
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomContainer, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={isLoading}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.textSecondary} />
          <Text style={[styles.backButtonText, { color: theme.colors.textSecondary }]}>
            Vissza
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.completeButton,
            {
              backgroundColor: isLoading ? theme.colors.border : theme.colors.primary
            }
          ]}
          onPress={handleComplete}
          disabled={isLoading}
        >
          {isLoading ? (
            <Text style={[styles.completeButtonText, { color: theme.colors.textSecondary }]}>
              Mentés...
            </Text>
          ) : (
            <>
              <Text style={[styles.completeButtonText, { color: theme.colors.cardBackground }]}>
                Kezdjük!
              </Text>
              <Ionicons
                name="checkmark"
                size={20}
                color={theme.colors.cardBackground}
              />
            </>
          )}
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

  completionContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },

  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  completionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  completionPercentage: {
    fontSize: 18,
    fontWeight: '700',
  },

  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  section: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },

  profilePreview: {
    flexDirection: 'row',
    gap: 16,
  },

  photosPreview: {
    flexDirection: 'row',
    gap: 8,
  },

  mainPhoto: {
    width: 80,
    height: 100,
    borderRadius: 8,
  },

  secondaryPhotos: {
    gap: 4,
  },

  secondaryPhoto: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },

  profileAge: {
    fontSize: 16,
    marginBottom: 8,
  },

  profileBio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },

  interestsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  interestChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  interestText: {
    fontSize: 12,
    fontWeight: '500',
  },

  moreInterests: {
    fontSize: 12,
    fontStyle: 'italic',
  },

  preferencesList: {
    gap: 12,
  },

  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  preferenceText: {
    fontSize: 16,
    flex: 1,
  },

  errorsContainer: {
    marginHorizontal: 16,
    gap: 8,
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

  tipsText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
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

  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    gap: 8,
  },

  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingStep5;
