/**
 * Onboarding Step 3: Bio & Interests
 *
 * Bio text input and interests selection
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import OnboardingValidationService from '../../services/OnboardingValidationService';
import InlineError from '../../components/InlineError';

const INTERESTS = [
  'Utazás', 'Fotózás', 'Sport', 'Zene', 'Olvasás', 'Főzés', 'Tánc', 'Festészet',
  'Futás', 'Yoga', 'Hegymászás', 'Séta', 'Kávé', 'Bor', 'Sör', 'Koncert',
  'Mozi', 'Sorozat', 'Videójáték', 'Kódolás', 'Design', 'Írás', 'Zenélés',
  'Kertészkedés', 'Állatok', 'Kutya', 'Macska', 'Túrázás', 'Tengerpart',
  'Hiking', 'Kerékpározás', 'Síelés', 'Snowboard', 'Úszás', 'Tenisz', 'Golf'
];

const OnboardingStep3 = ({ formData, onUpdateFormData, onNext, onBack }) => {
  const { theme } = useTheme();
  const [validation, setValidation] = useState(null);
  const [showInterests, setShowInterests] = useState(false);

  const bio = formData.bio || '';
  const interests = formData.interests || [];

  const handleBioChange = (text) => {
    if (text.length <= 500) {
      onUpdateFormData({ bio: text });
    }
  };

  const toggleInterest = (interest) => {
    const updatedInterests = interests.includes(interest)
      ? interests.filter(i => i !== interest)
      : [...interests, interest];

    if (updatedInterests.length <= 10) {
      onUpdateFormData({ interests: updatedInterests });
    } else {
      Alert.alert('Maximum elérve', 'Maximum 10 érdeklődési kör választható.');
    }
  };

  const handleNext = () => {
    const validationResult = OnboardingValidationService.validateBioAndInterests({
      bio,
      interests
    });
    setValidation(validationResult);

    if (validationResult.isValid) {
      onNext();
    }
  };

  const bioLength = bio.length;
  const bioProgress = Math.min((bioLength / 100) * 100, 100);

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
            Mesélj magadról
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Írj egy rövid bemutatkozást és válaszd ki az érdeklődési köreid
          </Text>
        </View>

        {/* Bio Input */}
        <View style={styles.bioSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Bemutatkozás
          </Text>

          <View style={[styles.bioContainer, { backgroundColor: theme.colors.cardBackground }]}>
            <TextInput
              style={[styles.bioInput, { color: theme.colors.text }]}
              placeholder="Írj magadról valamit... (pl. Hobbi, munka, mit keresel az alkalmazásban)"
              placeholderTextColor={theme.colors.textSecondary}
              value={bio}
              onChangeText={handleBioChange}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />

            {/* Character Counter */}
            <View style={styles.bioFooter}>
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${bioProgress}%`,
                      backgroundColor: bioLength >= 10 ? theme.colors.primary : theme.colors.warning
                    }
                  ]}
                />
              </View>
              <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
                {bioLength}/500
              </Text>
            </View>
          </View>

          {/* Bio Validation Error */}
          {validation && !validation.isValid && validation.errors.some(e => e.field === 'bio') && (
            <InlineError error={validation.errors.find(e => e.field === 'bio')?.message} />
          )}

          {/* Bio Tips */}
          <View style={[styles.tipsContainer, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
              💡 Tippek a jó bemutatkozáshoz:
            </Text>
            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
              • Legyen őszinte és pozitív
            </Text>
            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
              • Mesélj a hobbijaidról
            </Text>
            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
              • Mondd el, mit keresel az alkalmazásban
            </Text>
          </View>
        </View>

        {/* Interests Section */}
        <View style={styles.interestsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Érdeklődési körök
          </Text>

          {/* Selected Interests Preview */}
          {interests.length > 0 && (
            <View style={styles.selectedInterests}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {interests.map((interest, index) => (
                  <View
                    key={index}
                    style={[styles.selectedInterestChip, { backgroundColor: theme.colors.primary }]}
                  >
                    <Text style={[styles.selectedInterestText, { color: theme.colors.cardBackground }]}>
                      {interest}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeInterest}
                      onPress={() => toggleInterest(interest)}
                    >
                      <Ionicons name="close" size={16} color={theme.colors.cardBackground} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Add Interests Button */}
          <TouchableOpacity
            style={[styles.addInterestsButton, { borderColor: theme.colors.primary }]}
            onPress={() => setShowInterests(true)}
          >
            <Ionicons name="add" size={24} color={theme.colors.primary} />
            <Text style={[styles.addInterestsText, { color: theme.colors.primary }]}>
              Érdeklődési körök hozzáadása ({interests.length}/10)
            </Text>
          </TouchableOpacity>

          {/* Interests Validation Error */}
          {validation && !validation.isValid && validation.errors.some(e => e.field === 'interests') && (
            <InlineError error={validation.errors.find(e => e.field === 'interests')?.message} />
          )}

          {/* Interests Warnings */}
          {validation && validation.warnings && validation.warnings.length > 0 && (
            <View style={[styles.warningContainer, { backgroundColor: theme.colors.warning + '20' }]}>
              <Ionicons name="information-circle" size={20} color={theme.colors.warning} />
              <Text style={[styles.warningText, { color: theme.colors.warning }]}>
                {validation.warnings[0].message}
              </Text>
            </View>
          )}
        </View>

        {/* Interests Modal */}
        {showInterests && (
          <View style={styles.modalOverlay}>
            <View style={[styles.interestsModal, { backgroundColor: theme.colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  Válaszd ki az érdeklődési köreid
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowInterests(false)}
                >
                  <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.interestsList} showsVerticalScrollIndicator={false}>
                {INTERESTS.map((interest) => (
                  <TouchableOpacity
                    key={interest}
                    style={[
                      styles.interestItem,
                      interests.includes(interest) && { backgroundColor: theme.colors.primary + '20' }
                    ]}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Text style={[
                      styles.interestText,
                      { color: theme.colors.text },
                      interests.includes(interest) && { color: theme.colors.primary, fontWeight: '600' }
                    ]}>
                      {interest}
                    </Text>
                    {interests.includes(interest) && (
                      <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowInterests(false)}
              >
                <Text style={[styles.doneButtonText, { color: theme.colors.cardBackground }]}>
                  Kész ({interests.length}/10)
                </Text>
              </TouchableOpacity>
            </View>
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

  bioSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },

  interestsSection: {
    paddingHorizontal: 24,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },

  bioContainer: {
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
  },

  bioInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 80,
  },

  bioFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginRight: 12,
  },

  progressBar: {
    height: '100%',
    borderRadius: 2,
  },

  charCount: {
    fontSize: 14,
  },

  tipsContainer: {
    marginTop: 16,
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

  selectedInterests: {
    marginBottom: 16,
  },

  selectedInterestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },

  selectedInterestText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },

  removeInterest: {
    padding: 2,
  },

  addInterestsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 8,
  },

  addInterestsText: {
    fontSize: 16,
    fontWeight: '500',
  },

  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },

  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  interestsModal: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },

  closeButton: {
    padding: 4,
  },

  interestsList: {
    maxHeight: 300,
  },

  interestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },

  interestText: {
    fontSize: 16,
  },

  doneButton: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },

  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
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

export default OnboardingStep3;
