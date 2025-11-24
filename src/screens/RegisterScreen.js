import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import ConsentScreen from './ConsentScreen';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api/v1'
  : 'https://api.datingapp.com/api/v1';

const RegisterScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Regisztráció, 2: Consent

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState([]);
  const [birthDate, setBirthDate] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Consent states
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    marketing: false,
    analytics: false,
  });

  const calculateAge = (date) => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age;
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const age = calculateAge(selectedDate);
      if (age < 18) {
        Alert.alert(
          'Életkor korlátozás',
          'Sajnáljuk, az alkalmazás használatához legalább 18 évesnek kell lenned.',
          [{ text: 'Rendben' }]
        );
        return;
      }
      setBirthDate(selectedDate);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Hiba', 'Kérjük, add meg a nevedet.');
      return false;
    }

    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Hiba', 'Kérjük, add meg egy érvényes email címet.');
      return false;
    }

    if (!password || password.length < 8) {
      Alert.alert('Hiba', 'A jelszónak legalább 8 karakter hosszúnak kell lennie.');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hiba', 'A jelszavak nem egyeznek.');
      return false;
    }

    if (!gender) {
      Alert.alert('Hiba', 'Kérjük, válassz nemet.');
      return false;
    }

    if (lookingFor.length === 0) {
      Alert.alert('Hiba', 'Kérjük, válassz, kit keresel.');
      return false;
    }

    const age = calculateAge(birthDate);
    if (age < 18) {
      Alert.alert('Hiba', 'Az alkalmazás használatához legalább 18 évesnek kell lenned.');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    // Consent ellenőrzés
    if (!consents.terms || !consents.privacy) {
      Alert.alert(
        'Kötelező mezők',
        'A Felhasználási Feltételek és az Adatvédelmi Szabályzat elfogadása kötelező.'
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          password,
          gender,
          lookingFor,
          birthDate: birthDate.toISOString().split('T')[0],
          consents: {
            terms: consents.terms,
            privacy: consents.privacy,
            marketing: consents.marketing,
            analytics: consents.analytics,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Token mentése
        const StorageService = require('../services/StorageService').default;
        await StorageService.setToken(result.data.token);
        await StorageService.setRefreshToken(result.data.refreshToken);
        await StorageService.setUserId(result.data.user.id);

        Alert.alert(
          '✅ Sikeres regisztráció',
          'Fiókod létrehozva! Most már bejelentkezhetsz.',
          [
            {
              text: 'Rendben',
              onPress: () => {
                // Navigate to home or email verification
                if (result.data.user.emailVerified) {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                  });
                } else {
                  // Navigate to OTP verification
                  navigation.navigate('OTPVerification', {
                    email: email.trim().toLowerCase(),
                    userId: result.data.user.id,
                  });
                }
              },
            },
          ]
        );
      } else {
        throw new Error(result.error?.message || 'Regisztráció sikertelen');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Hiba történt a regisztráció során.';
      if (error.message.includes('email')) {
        errorMessage = 'Ez az email cím már regisztrálva van.';
      } else if (error.message.includes('phone')) {
        errorMessage = 'Ez a telefonszám már regisztrálva van.';
      }

      Alert.alert('Hiba', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleLookingFor = (option) => {
    setLookingFor(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  const styles = createStyles(theme);

  if (step === 2) {
    return (
      <ConsentScreen
        navigation={navigation}
        route={{ params: { isRegistration: true } }}
        onConsentChange={(newConsents) => {
          setConsents(newConsents);
          setStep(1);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Regisztráció</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.introText}>
          Hozd létre a fiókodat, hogy elkezdhesd az ismerkedést!
        </Text>

        {/* Név */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Név *</Text>
          <TextInput
            style={styles.input}
            placeholder="Add meg a nevedet"
            placeholderTextColor={theme.colors.textSecondary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* Email */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email cím *</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor={theme.colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Telefon (opcionális) */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Telefonszám (opcionális)</Text>
          <TextInput
            style={styles.input}
            placeholder="+36 20 123 4567"
            placeholderTextColor={theme.colors.textSecondary}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Jelszó */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Jelszó *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Minimum 8 karakter"
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Jelszó megerősítés */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Jelszó megerősítése *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Add meg újra a jelszót"
              placeholderTextColor={theme.colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Születési dátum */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Születési dátum *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.dateText}>
              {birthDate.toLocaleDateString('hu-HU')} ({calculateAge(birthDate)} év)
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={birthDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date(2006, 0, 1)} // 18 év minimum
              minimumDate={new Date(1950, 0, 1)}
            />
          )}
        </View>

        {/* Nem */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nem *</Text>
          <View style={styles.optionsRow}>
            {['male', 'female', 'other'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  gender === option && styles.optionButtonActive,
                ]}
                onPress={() => setGender(option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    gender === option && styles.optionTextActive,
                  ]}
                >
                  {option === 'male' ? 'Férfi' : option === 'female' ? 'Nő' : 'Egyéb'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Kit keres */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Kit keresel? *</Text>
          <View style={styles.optionsRow}>
            {['male', 'female', 'other'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  lookingFor.includes(option) && styles.optionButtonActive,
                ]}
                onPress={() => toggleLookingFor(option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    lookingFor.includes(option) && styles.optionTextActive,
                  ]}
                >
                  {option === 'male' ? 'Férfi' : option === 'female' ? 'Nő' : 'Egyéb'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Consent checkbox */}
        <View style={styles.consentBox}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setConsents(prev => ({ ...prev, terms: !prev.terms }))}
          >
            <Ionicons
              name={consents.terms ? 'checkbox' : 'checkbox-outline'}
              size={24}
              color={consents.terms ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={styles.checkboxText}>
              Elfogadom a{' '}
              <Text
                style={styles.linkText}
                onPress={() => navigation.navigate('WebView', { url: 'https://hevesitr.github.io/luxio-/web/terms-of-service.html' })}
              >
                Felhasználási Feltételeket
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setConsents(prev => ({ ...prev, privacy: !prev.privacy }))}
          >
            <Ionicons
              name={consents.privacy ? 'checkbox' : 'checkbox-outline'}
              size={24}
              color={consents.privacy ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={styles.checkboxText}>
              Elfogadom az{' '}
              <Text
                style={styles.linkText}
                onPress={() => navigation.navigate('WebView', { url: 'https://hevesitr.github.io/luxio-/web/privacy-policy.html' })}
              >
                Adatvédelmi Szabályzatot
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.consentButton}
          onPress={() => setStep(2)}
        >
          <Text style={styles.consentButtonText}>
            Részletes Adatkezelési Beállítások
          </Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.registerButton, loading && styles.registerButtonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.registerButtonGradient}
            >
              <Text style={styles.registerButtonText}>Regisztráció</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginLinkText}>
            Már van fiókod? <Text style={styles.loginLinkBold}>Bejelentkezés</Text>
          </Text>
        </TouchableOpacity>
      </View>
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  introText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 14,
  },
  eyeButton: {
    padding: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateText: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  optionButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#fff',
  },
  consentBox: {
    marginTop: 8,
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  consentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  consentButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginRight: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  registerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  loginLinkBold: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;

