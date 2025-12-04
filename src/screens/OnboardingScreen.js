/**
 * OnboardingScreen - Main Container
 *
 * Orchestrates the 5-step onboarding flow with progress tracking
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import OnboardingStep1 from './onboarding/OnboardingStep1';
import OnboardingStep2 from './onboarding/OnboardingStep2';
import OnboardingStep3 from './onboarding/OnboardingStep3';
import OnboardingStep4 from './onboarding/OnboardingStep4';
import OnboardingStep5 from './onboarding/OnboardingStep5';

const STEPS = [
  { key: 'welcome', title: 'Üdvözöllek', component: OnboardingStep1 },
  { key: 'photos', title: 'Fotók', component: OnboardingStep2 },
  { key: 'bio', title: 'Bemutatkozás', component: OnboardingStep3 },
  { key: 'preferences', title: 'Preferenciák', component: OnboardingStep4 },
  { key: 'review', title: 'Befejezés', component: OnboardingStep5 },
];

const OnboardingScreen = ({ navigation, onComplete }) => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    birthday: '',
    gender: '',

    // Step 2: Photos
    photos: [],

    // Step 3: Bio & Interests
    bio: '',
    interests: [],

    // Step 4: Preferences
    lookingFor: '',
    minAge: 18,
    maxAge: 99,
    maxDistance: 50,

    // Step 5: Location (optional)
    locationEnabled: false,
  });

  const handleUpdateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // Skip to the end and complete
    handleComplete();
  };

  const handleComplete = () => {
    // Navigate to main app
    if (onComplete) {
      onComplete();
    } else {
      navigation.replace('MainTabs');
    }
  };

  const CurrentStepComponent = STEPS[currentStep].component;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Progress Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: theme.colors.primary
                }
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
            {currentStep + 1} / {STEPS.length}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
            Kihagyás
          </Text>
        </TouchableOpacity>
      </View>

      {/* Step Content */}
      <View style={styles.content}>
        <CurrentStepComponent
          formData={formData}
          onUpdateFormData={handleUpdateFormData}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
          onComplete={handleComplete}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  progressContainer: {
    flex: 1,
    marginRight: 16,
  },

  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
  },

  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },

  skipButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  skipText: {
    fontSize: 14,
    fontWeight: '500',
  },

  content: {
    flex: 1,
  },
});

export default OnboardingScreen;