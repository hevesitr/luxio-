/**
 * NewPasswordScreen - Új jelszó beállítása képernyő (password reset után)
 * Követelmény: 5.2 Password reset flow
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../services/supabaseClient';
import PasswordService from '../services/PasswordService';
import Logger from '../services/Logger';

const NewPasswordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirm: false,
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
    isValid: false,
  });

  const [tokenValid, setTokenValid] = useState(null); // null = checking, true = valid, false = invalid

  // Token validáció useEffect-ben
  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {
    try {
      const params = route.params || {};

      if (!params.access_token || !params.refresh_token) {
        Logger.warn('No tokens provided in route params');
        setTokenValid(false);
        return;
      }

      // Token validáció Supabase-zel
      const { data, error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });

      if (error) {
        Logger.error('Token validation failed', error);
        setTokenValid(false);
        return;
      }

      Logger.info('Password reset token validated successfully');
      setTokenValid(true);

    } catch (error) {
      Logger.error('Token validation error', error);
      setTokenValid(false);
    }
  };

  // Jelszó erősség ellenőrzése
  const checkPasswordStrength = (password) => {
    const result = PasswordService.validatePassword(password);
    setPasswordStrength(result);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'password') {
      checkPasswordStrength(value);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async () => {
    // Token validáció ellenőrzés
    if (tokenValid === null) {
      Alert.alert('Hiba', 'Token ellenőrzése folyamatban...');
      return;
    }

    if (tokenValid === false) {
      Alert.alert('Hiba', 'Érvénytelen vagy lejárt token. Kérjük, kérj új jelszó visszaállítást.');
      return;
    }

    // Validáció
    if (!formData.password.trim()) {
      Alert.alert('Hiba', 'Kérjük, add meg az új jelszavad.');
      return;
    }

    if (!passwordStrength.isValid) {
      Alert.alert('Hiba', 'Az új jelszó nem elég erős. Kérjük, használj erősebb jelszót.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Hiba', 'A jelszó és a megerősítés nem egyezik meg.');
      return;
    }

    setLoading(true);
    try {
      // Jelszó frissítés Supabase-ben
      const { data, error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) {
        throw error;
      }

      Logger.success('Password updated successfully via reset', { userId: data.user?.id });

      Alert.alert(
        'Sikeres jelszóváltoztatás',
        'A jelszavad sikeresen megváltoztatva. Most bejelentkezhetsz az új jelszavaddal.',
        [
          {
            text: 'Bejelentkezés',
            onPress: () => navigation.replace('Login'),
          },
        ]
      );

    } catch (error) {
      Logger.error('Password update failed', error);

      let errorMessage = 'Hiba történt a jelszó megváltoztatása közben.';
      if (error.message?.includes('Password should be at least')) {
        errorMessage = 'A jelszónak legalább 6 karakter hosszúnak kell lennie.';
      } else if (error.message?.includes('Token has expired')) {
        errorMessage = 'A token lejárt. Kérjük, kérj új jelszó visszaállítást.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Hiba', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const { score } = passwordStrength;
    if (score < 2) return '#FF4444';
    if (score < 3) return '#FFAA00';
    if (score < 4) return '#FFFF00';
    return '#4CAF50';
  };

  const getPasswordStrengthText = () => {
    const { score } = passwordStrength;
    if (score < 2) return 'Gyenge';
    if (score < 3) return 'Közepes';
    if (score < 4) return 'Erős';
    return 'Nagyon erős';
  };

  // Token ellenőrzés képernyő
  if (tokenValid === null) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.loadingText}>Token ellenőrzése...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Érvénytelen token képernyő
  if (tokenValid === false) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
        >
          <View style={styles.errorContainer}>
            <Ionicons name="close-circle" size={80} color="#FF4444" />

            <Text style={styles.errorTitle}>Érvénytelen link</Text>

            <Text style={styles.errorMessage}>
              Ez a jelszó visszaállító link érvénytelen vagy lejárt.
              Kérjük, kérj új jelszó visszaállítást.
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => navigation.replace('PasswordResetRequest')}
            >
              <Text style={styles.retryButtonText}>Új visszaállítás kérése</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Fő képernyő
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Új jelszó beállítása</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="key" size={60} color="#FFF" />
            </View>

            <Text style={styles.title}>Új jelszó</Text>

            <Text style={styles.description}>
              Add meg az új jelszavad. A jelszónak erősnek kell lennie a biztonság érdekében.
            </Text>

            <View style={styles.formContainer}>
              {/* Új jelszó */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Új jelszó</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    placeholder="Add meg az új jelszavad"
                    secureTextEntry={!showPasswords.password}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => togglePasswordVisibility('password')}
                  >
                    <Ionicons
                      name={showPasswords.password ? 'eye-off' : 'eye'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>

                {/* Jelszó erősség indicator */}
                {formData.password.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBar}>
                      <View
                        style={[
                          styles.strengthFill,
                          {
                            width: `${(passwordStrength.score / 4) * 100}%`,
                            backgroundColor: getPasswordStrengthColor(),
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
                      {getPasswordStrengthText()}
                    </Text>
                  </View>
                )}

                {/* Jelszó követelmények */}
                {passwordStrength.feedback.length > 0 && (
                  <View style={styles.feedbackContainer}>
                    {passwordStrength.feedback.map((item, index) => (
                      <Text key={index} style={styles.feedbackText}>
                        • {item}
                      </Text>
                    ))}
                  </View>
                )}
              </View>

              {/* Jelszó megerősítés */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Jelszó megerősítése</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    placeholder="Add meg újra a jelszavad"
                    secureTextEntry={!showPasswords.confirm}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => togglePasswordVisibility('confirm')}
                  >
                    <Ionicons
                      name={showPasswords.confirm ? 'eye-off' : 'eye'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>

                {/* Egyezés ellenőrzés */}
                {formData.confirmPassword.length > 0 && (
                  <View style={styles.matchContainer}>
                    <Ionicons
                      name={formData.password === formData.confirmPassword ? 'checkmark-circle' : 'close-circle'}
                      size={16}
                      color={formData.password === formData.confirmPassword ? '#4CAF50' : '#FF4444'}
                    />
                    <Text style={[
                      styles.matchText,
                      { color: formData.password === formData.confirmPassword ? '#4CAF50' : '#FF4444' }
                    ]}>
                      {formData.password === formData.confirmPassword
                        ? 'A jelszavak egyeznek'
                        : 'A jelszavak nem egyeznek'
                      }
                    </Text>
                  </View>
                )}
              </View>

              {/* Submit gomb */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading || !passwordStrength.isValid}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#FFF" style={styles.submitIcon} />
                    <Text style={styles.submitButtonText}>Jelszó beállítása</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => navigation.replace('PasswordResetRequest')}
            >
              <Text style={styles.backLinkText}>
                Vissza a visszaállításhoz
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  iconContainer: {
    marginBottom: 24,
    opacity: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 12,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginRight: 12,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '500',
  },
  feedbackContainer: {
    marginTop: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  matchText: {
    fontSize: 14,
    marginLeft: 6,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 24,
    paddingVertical: 8,
  },
  backLinkText: {
    color: '#FFF',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  // Loading screen
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 16,
  },
  // Error screen
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    opacity: 0.9,
  },
  retryButton: {
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NewPasswordScreen;
