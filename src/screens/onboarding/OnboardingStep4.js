/**
 * Onboarding Step 4: Preferences
 *
 * Set user preferences for matching
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import OnboardingValidationService from '../../services/OnboardingValidationService';
import InlineError from '../../components/InlineError';

const LOOKING_FOR_OPTIONS = [
  { value: 'male', label: 'Férfiakat', icon: 'man' },
  { value: 'female', label: 'Nőket', icon: 'woman' },
  { value: 'everyone', label: 'Mindenkit', icon: 'people' },
];

const OnboardingStep4 = ({ formData, onUpdateFormData, onNext, onBack }) => {
  const { theme } = useTheme();
  const [validation, setValidation] = useState(null);

  const lookingFor = formData.lookingFor || '';
  const minAge = formData.minAge || 18;
  const maxAge = formData.maxAge || 99;
  const maxDistance = formData.maxDistance || 50;

  const handleLookingForChange = (value) => {
    onUpdateFormData({ lookingFor: value });
  };

  const handleAgeRangeChange = (type, value) => {
    const numValue = parseInt(value) || 0;
    if (type === 'min') {
      onUpdateFormData({ minAge: Math.max(18, Math.min(99, numValue)) });
    } else {
      onUpdateFormData({ maxAge: Math.max(18, Math.min(99, numValue)) });
    }
  };

  const handleDistanceChange = (value) => {
    const numValue = parseInt(value) || 0;
    onUpdateFormData({ maxDistance: Math.max(1, Math.min(100, numValue)) });
  };

  const handleNext = () => {
    const validationResult = OnboardingValidationService.validatePreferences({
      lookingFor,
      minAge,
      maxAge,
      maxDistance
    });
    setValidation(validationResult);

    if (validationResult.isValid) {
      onNext();
    }
  };

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
            Kit keresel?
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Állítsd be a keresési preferenciákat a jobb match-ekért
          </Text>
        </View>

        {/* Looking For Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Keresett partner
          </Text>

          <View style={styles.optionsGrid}>
            {LOOKING_FOR_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: lookingFor === option.value
                      ? theme.colors.primary
                      : theme.colors.cardBackground,
                    borderColor: lookingFor === option.value
                      ? theme.colors.primary
                      : theme.colors.border
                  }
                ]}
                onPress={() => handleLookingForChange(option.value)}
              >
                <Ionicons
                  name={option.icon}
                  size={32}
                  color={lookingFor === option.value ? theme.colors.cardBackground : theme.colors.primary}
                />
                <Text style={[
                  styles.optionLabel,
                  {
                    color: lookingFor === option.value ? theme.colors.cardBackground : theme.colors.text
                  }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Looking For Validation Error */}
          {validation && !validation.isValid && validation.errors.some(e => e.field === 'lookingFor') && (
            <InlineError error={validation.errors.find(e => e.field === 'lookingFor')?.message} />
          )}
        </View>

        {/* Age Range Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Kor tartomány
          </Text>

          <View style={[styles.ageRangeContainer, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.ageInputGroup}>
              <Text style={[styles.ageLabel, { color: theme.colors.textSecondary }]}>Minimum</Text>
              <View style={styles.ageInputRow}>
                <TouchableOpacity
                  style={[styles.ageButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleAgeRangeChange('min', minAge - 1)}
                  disabled={minAge <= 18}
                >
                  <Ionicons name="remove" size={20} color={theme.colors.cardBackground} />
                </TouchableOpacity>

                <View style={[styles.ageValue, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.ageValueText, { color: theme.colors.text }]}>
                    {minAge}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.ageButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleAgeRangeChange('min', minAge + 1)}
                  disabled={minAge >= maxAge - 1}
                >
                  <Ionicons name="add" size={20} color={theme.colors.cardBackground} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.ageRangeSeparator}>
              <Text style={[styles.ageRangeText, { color: theme.colors.textSecondary }]}>
                és
              </Text>
            </View>

            <View style={styles.ageInputGroup}>
              <Text style={[styles.ageLabel, { color: theme.colors.textSecondary }]}>Maximum</Text>
              <View style={styles.ageInputRow}>
                <TouchableOpacity
                  style={[styles.ageButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleAgeRangeChange('max', maxAge - 1)}
                  disabled={maxAge <= minAge + 1}
                >
                  <Ionicons name="remove" size={20} color={theme.colors.cardBackground} />
                </TouchableOpacity>

                <View style={[styles.ageValue, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.ageValueText, { color: theme.colors.text }]}>
                    {maxAge}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.ageButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleAgeRangeChange('max', maxAge + 1)}
                  disabled={maxAge >= 99}
                >
                  <Ionicons name="add" size={20} color={theme.colors.cardBackground} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Age Range Validation Error */}
          {validation && !validation.isValid && validation.errors.some(e => e.field === 'ageRange') && (
            <InlineError error={validation.errors.find(e => e.field === 'ageRange')?.message} />
          )}
        </View>

        {/* Distance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Maximális távolság
          </Text>

          <View style={[styles.distanceContainer, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.distanceSlider}>
              <View style={styles.distanceTrack}>
                <View
                  style={[
                    styles.distanceProgress,
                    {
                      width: `${(maxDistance / 100) * 100}%`,
                      backgroundColor: theme.colors.primary
                    }
                  ]}
                />
              </View>

              {/* Slider markers */}
              {[10, 25, 50, 75, 100].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.sliderMarker,
                    { left: `${(value / 100) * 100}%` },
                    maxDistance >= value && { backgroundColor: theme.colors.primary }
                  ]}
                  onPress={() => handleDistanceChange(value)}
                />
              ))}
            </View>

            <View style={styles.distanceValue}>
              <Text style={[styles.distanceText, { color: theme.colors.text }]}>
                {maxDistance} km
              </Text>
            </View>

            <View style={styles.distanceLabels}>
              <Text style={[styles.distanceLabel, { color: theme.colors.textSecondary }]}>10km</Text>
              <Text style={[styles.distanceLabel, { color: theme.colors.textSecondary }]}>100km</Text>
            </View>
          </View>

          {/* Distance Validation Error */}
          {validation && !validation.isValid && validation.errors.some(e => e.field === 'maxDistance') && (
            <InlineError error={validation.errors.find(e => e.field === 'maxDistance')?.message} />
          )}
        </View>

        {/* Tips */}
        <View style={[styles.tipsContainer, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
            💡 Tippek a jó beállításokhoz:
          </Text>
          <Text style={[styles.tipsText, { color: theme.colors.textSecondary }]}>
            • A szélesebb kor tartomány több match lehetőséget ad
          </Text>
          <Text style={[styles.tipsText, { color: theme.colors.textSecondary }]}>
            • A nagyobb távolság több embert jelent, de ritkább találkozást
          </Text>
          <Text style={[styles.tipsText, { color: theme.colors.textSecondary }]}>
            • Ezeket a beállításokat később bármikor módosíthatod
          </Text>
        </View>
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

  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },

  optionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },

  optionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },

  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },

  ageRangeContainer: {
    padding: 20,
    borderRadius: 12,
  },

  ageInputGroup: {
    alignItems: 'center',
  },

  ageLabel: {
    fontSize: 14,
    marginBottom: 12,
  },

  ageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  ageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ageValue: {
    width: 60,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ageValueText: {
    fontSize: 18,
    fontWeight: '600',
  },

  ageRangeSeparator: {
    alignItems: 'center',
    marginVertical: 20,
  },

  ageRangeText: {
    fontSize: 16,
    fontWeight: '500',
  },

  distanceContainer: {
    padding: 20,
    borderRadius: 12,
  },

  distanceSlider: {
    position: 'relative',
    marginBottom: 20,
  },

  distanceTrack: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
  },

  distanceProgress: {
    height: '100%',
    borderRadius: 3,
  },

  sliderMarker: {
    position: 'absolute',
    top: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    transform: [{ translateX: -8 }],
  },

  distanceValue: {
    alignItems: 'center',
    marginBottom: 12,
  },

  distanceText: {
    fontSize: 24,
    fontWeight: '700',
  },

  distanceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  distanceLabel: {
    fontSize: 14,
  },

  tipsContainer: {
    margin: 24,
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

export default OnboardingStep4;
