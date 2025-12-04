import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ProfileService from '../services/ProfileService';
import Logger from '../services/Logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * OnboardingScreen
 * 
 * Multi-step onboarding flow for new users
 * Steps:
 * 1. Basic Info (name, birthday, gender)
 * 2. Photos (upload profile photos)
 * 3. Bio & Interests
 * 4. Preferences (looking for, distance, age range)
 * 5. Location Permission
 */
const OnboardingScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef(null);

  // Form data
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
    lookingFor: [],
    ageMin: 18,
    ageMax: 99,
    maxDistance: 50,
    
    // Step 5: Location
    locationEnabled: false,
  });

  const [errors, setErrors] = useState({});

  const styles = createStyles(theme);

  const steps = [
    {
      title: 'Alapadatok',
      subtitle: 'Kezdjük az alapokkal',
      component: BasicInfoStep,
    },
    {
      title: 'Fotók',
      subtitle: 'Adj hozzá legalább 2 fotót',
      component: PhotosStep,
    },
    {
      title: 'Bemutatkozás',
      subtitle: 'Mesélj magadról',
      component: BioStep,
    },
    {
      title: 'Preferenciák',
      subtitle: 'Kit keresel?',
      component: PreferencesStep,
    },
    {
      title: 'Helyszín',
      subtitle: 'Találj embereket a közeledben',
      component: LocationStep,
    },
  ];

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const validateStep = () => {
    const newErrors = {};

    switch (currentStep) {
      case 0: // Basic Info
        if (!formData.name || formData.name.trim().length < 2) {
          newErrors.name = 'A név legalább 2 karakter legyen';
        }
        if (!formData.birthday) {
          newErrors.birthday = 'Add meg a születési dátumod';
        } else {
          const age = calculateAge(formData.birthday);
          if (age < 18) {
            newErrors.birthday = 'Legalább 18 évesnek kell lenned';
          }
          if (age > 100) {
            newErrors.birthday = 'Érvénytelen születési dátum';
          }
        }
        if (!formData.gender) {
          newErrors.gender = 'Válaszd ki a nemed';
        }
        break;

      case 1: // Photos
        if (formData.photos.length < 2) {
          newErrors.photos = 'Legalább 2 fotó szükséges';
        }
        break;

      case 2: // Bio
        if (!formData.bio || formData.bio.trim().length < 20) {
          newErrors.bio = 'A bemutatkozás legalább 20 karakter legyen';
        }
        if (formData.interests.length < 3) {
          newErrors.interests = 'Válassz legalább 3 érdeklődési kört';
        }
        break;

      case 3: // Preferences
        if (formData.lookingFor.length === 0) {
          newErrors.lookingFor = 'Válaszd ki, kit keresel';
        }
        if (formData.ageMin >= formData.ageMax) {
          newErrors.ageRange = 'Érvénytelen kor tartomány';
        }
        break;

      case 4: // Location
        // Optional, no validation needed
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    } else {
      // Last step - save profile
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);

      // Save profile data
      const result = await ProfileService.updateProfile(user.id, {
        name: formData.name,
        birthday: formData.birthday,
        gender: formData.gender,
        bio: formData.bio,
        interests: formData.interests,
        looking_for: formData.lookingFor,
        age_min: formData.ageMin,
        age_max: formData.ageMax,
        max_distance: formData.maxDistance,
        onboarding_completed: true,
      });

      if (result.success) {
        Logger.success('Onboarding completed');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Navigate to main app
        navigation.replace('Main');
      } else {
        throw new Error(result.error || 'Failed to save profile');
      }
    } catch (error) {
      Logger.error('Onboarding error', error);
      Alert.alert('Hiba', 'Nem sikerült menteni a profilt. Próbáld újra!');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear error for this field
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.headerText}>
          <Text style={styles.stepCounter}>
            {currentStep + 1} / {steps.length}
          </Text>
          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* Step Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <StepComponent
          formData={formData}
          updateFormData={updateFormData}
          errors={errors}
          theme={theme}
        />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? 'Befejezés' : 'Tovább'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Helper function
const calculateAge = (birthday) => {
  const today = new Date();
  const birthDate = new Date(birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Step 1: Basic Info
const BasicInfoStep = ({ formData, updateFormData, errors, theme }) => {
  const styles = createStyles(theme);

  return (
    <View style={styles.stepContainer}>
      {/* Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Név *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder="Add meg a neved"
          placeholderTextColor={theme.colors.textTertiary}
          value={formData.name}
          onChangeText={(text) => updateFormData('name', text)}
          maxLength={50}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Birthday */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Születési dátum *</Text>
        <TextInput
          style={[styles.input, errors.birthday && styles.inputError]}
          placeholder="ÉÉÉÉ-HH-NN"
          placeholderTextColor={theme.colors.textTertiary}
          value={formData.birthday}
          onChangeText={(text) => updateFormData('birthday', text)}
          keyboardType="numeric"
        />
        {errors.birthday && <Text style={styles.errorText}>{errors.birthday}</Text>}
        <Text style={styles.helperText}>Legalább 18 évesnek kell lenned</Text>
      </View>

      {/* Gender */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nem *</Text>
        <View style={styles.optionsRow}>
          {['Férfi', 'Nő', 'Egyéb'].map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.optionButton,
                formData.gender === gender && styles.optionButtonActive,
              ]}
              onPress={() => updateFormData('gender', gender)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  formData.gender === gender && styles.optionButtonTextActive,
                ]}
              >
                {gender}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
      </View>
    </View>
  );
};

// Step 2: Photos
const PhotosStep = ({ formData, updateFormData, errors, theme }) => {
  const styles = createStyles(theme);

  const handleAddPhoto = () => {
    Alert.alert('Fotó hozzáadása', 'Fotó feltöltés funkció hamarosan elérhető');
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.description}>
        Adj hozzá legalább 2 fotót magadról. A profilok fotókkal 10x több match-et kapnak!
      </Text>

      <View style={styles.photosGrid}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <TouchableOpacity
            key={index}
            style={styles.photoSlot}
            onPress={handleAddPhoto}
          >
            {formData.photos[index] ? (
              <View style={styles.photoPreview}>
                {/* Photo preview would go here */}
                <Ionicons name="image" size={40} color={theme.colors.primary} />
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="add" size={32} color={theme.colors.textTertiary} />
                <Text style={styles.photoPlaceholderText}>
                  {index === 0 ? 'Főkép' : `Fotó ${index + 1}`}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {errors.photos && <Text style={styles.errorText}>{errors.photos}</Text>}
    </View>
  );
};

// Step 3: Bio & Interests
const BioStep = ({ formData, updateFormData, errors, theme }) => {
  const styles = createStyles(theme);

  const availableInterests = [
    '🎵 Zene',
    '🎬 Film',
    '📚 Olvasás',
    '🏃 Sport',
    '✈️ Utazás',
    '🍳 Főzés',
    '🎨 Művészet',
    '🎮 Gaming',
    '📸 Fotózás',
    '🐕 Állatok',
    '🌱 Természet',
    '💃 Tánc',
  ];

  const toggleInterest = (interest) => {
    const current = formData.interests || [];
    if (current.includes(interest)) {
      updateFormData('interests', current.filter((i) => i !== interest));
    } else {
      updateFormData('interests', [...current, interest]);
    }
  };

  return (
    <View style={styles.stepContainer}>
      {/* Bio */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Bemutatkozás *</Text>
        <TextInput
          style={[styles.textArea, errors.bio && styles.inputError]}
          placeholder="Mesélj magadról... Mit szeretsz csinálni? Mik a hobbijaid?"
          placeholderTextColor={theme.colors.textTertiary}
          value={formData.bio}
          onChangeText={(text) => updateFormData('bio', text)}
          multiline
          numberOfLines={6}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>
          {formData.bio.length} / 500
        </Text>
        {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
      </View>

      {/* Interests */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Érdeklődési körök * (min. 3)</Text>
        <View style={styles.interestsGrid}>
          {availableInterests.map((interest) => (
            <TouchableOpacity
              key={interest}
              style={[
                styles.interestChip,
                formData.interests?.includes(interest) && styles.interestChipActive,
              ]}
              onPress={() => toggleInterest(interest)}
            >
              <Text
                style={[
                  styles.interestChipText,
                  formData.interests?.includes(interest) && styles.interestChipTextActive,
                ]}
              >
                {interest}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.interests && <Text style={styles.errorText}>{errors.interests}</Text>}
      </View>
    </View>
  );
};

// Step 4: Preferences
const PreferencesStep = ({ formData, updateFormData, errors, theme }) => {
  const styles = createStyles(theme);

  const toggleLookingFor = (gender) => {
    const current = formData.lookingFor || [];
    if (current.includes(gender)) {
      updateFormData('lookingFor', current.filter((g) => g !== gender));
    } else {
      updateFormData('lookingFor', [...current, gender]);
    }
  };

  return (
    <View style={styles.stepContainer}>
      {/* Looking For */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Kit keresel? *</Text>
        <View style={styles.optionsRow}>
          {['Férfi', 'Nő', 'Mindenki'].map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.optionButton,
                formData.lookingFor?.includes(gender) && styles.optionButtonActive,
              ]}
              onPress={() => toggleLookingFor(gender)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  formData.lookingFor?.includes(gender) && styles.optionButtonTextActive,
                ]}
              >
                {gender}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.lookingFor && <Text style={styles.errorText}>{errors.lookingFor}</Text>}
      </View>

      {/* Age Range */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Kor tartomány: {formData.ageMin} - {formData.ageMax} év
        </Text>
        <View style={styles.rangeInputs}>
          <TextInput
            style={styles.rangeInput}
            value={String(formData.ageMin)}
            onChangeText={(text) => updateFormData('ageMin', parseInt(text) || 18)}
            keyboardType="numeric"
            maxLength={2}
          />
          <Text style={styles.rangeSeparator}>-</Text>
          <TextInput
            style={styles.rangeInput}
            value={String(formData.ageMax)}
            onChangeText={(text) => updateFormData('ageMax', parseInt(text) || 99)}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
        {errors.ageRange && <Text style={styles.errorText}>{errors.ageRange}</Text>}
      </View>

      {/* Distance */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Maximális távolság: {formData.maxDistance} km
        </Text>
        <TextInput
          style={styles.input}
          value={String(formData.maxDistance)}
          onChangeText={(text) => updateFormData('maxDistance', parseInt(text) || 50)}
          keyboardType="numeric"
          maxLength={3}
        />
      </View>
    </View>
  );
};

// Step 5: Location
const LocationStep = ({ formData, updateFormData, errors, theme }) => {
  const styles = createStyles(theme);

  const handleEnableLocation = () => {
    Alert.alert(
      'Helyszín engedély',
      'Engedélyezd a helyszín hozzáférést, hogy találj embereket a közeledben.',
      [
        { text: 'Később', style: 'cancel' },
        {
          text: 'Engedélyezés',
          onPress: () => {
            updateFormData('locationEnabled', true);
            // Request location permission
          },
        },
      ]
    );
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.locationCard}>
        <Ionicons name="location" size={64} color={theme.colors.primary} />
        <Text style={styles.locationTitle}>Találj embereket a közeledben</Text>
        <Text style={styles.locationDescription}>
          Engedélyezd a helyszín hozzáférést, hogy lásd, kik vannak a közeledben.
          A pontos helyszíned sosem lesz látható másoknak.
        </Text>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleEnableLocation}
        >
          <Text style={styles.locationButtonText}>
            {formData.locationEnabled ? '✓ Engedélyezve' : 'Helyszín engedélyezése'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Kihagyom most</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 20,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      marginBottom: 10,
    },
    headerText: {
      gap: 4,
    },
    stepCounter: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    progressBarContainer: {
      height: 4,
      backgroundColor: theme.colors.border,
      marginHorizontal: 20,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
    },
    stepContainer: {
      gap: 24,
    },
    description: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      lineHeight: 24,
    },
    inputGroup: {
      gap: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    input: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    inputError: {
      borderColor: '#F44336',
    },
    textArea: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 120,
      textAlignVertical: 'top',
    },
    errorText: {
      fontSize: 14,
      color: '#F44336',
    },
    helperText: {
      fontSize: 14,
      color: theme.colors.textTertiary,
    },
    charCount: {
      fontSize: 12,
      color: theme.colors.textTertiary,
      textAlign: 'right',
    },
    optionsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    optionButton: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: theme.colors.cardBackground,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    optionButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '20',
    },
    optionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    optionButtonTextActive: {
      color: theme.colors.primary,
    },
    photosGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    photoSlot: {
      width: (SCREEN_WIDTH - 64) / 3,
      height: (SCREEN_WIDTH - 64) / 3,
      borderRadius: 12,
      overflow: 'hidden',
    },
    photoPlaceholder: {
      flex: 1,
      backgroundColor: theme.colors.cardBackground,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
    },
    photoPlaceholderText: {
      fontSize: 12,
      color: theme.colors.textTertiary,
    },
    photoPreview: {
      flex: 1,
      backgroundColor: theme.colors.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    interestsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    interestChip: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: theme.colors.cardBackground,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    interestChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '20',
    },
    interestChipText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    interestChipTextActive: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    rangeInputs: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    rangeInput: {
      flex: 1,
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      textAlign: 'center',
    },
    rangeSeparator: {
      fontSize: 20,
      color: theme.colors.text,
      fontWeight: '600',
    },
    locationCard: {
      alignItems: 'center',
      padding: 32,
      gap: 16,
    },
    locationTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: 'center',
    },
    locationDescription: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    locationButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 25,
      marginTop: 16,
    },
    locationButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    skipButton: {
      paddingVertical: 12,
    },
    skipButtonText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    footer: {
      padding: 20,
      paddingBottom: 10,
    },
    nextButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 25,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    nextButtonDisabled: {
      opacity: 0.5,
    },
    nextButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#fff',
    },
  });

export default OnboardingScreen;
