/**
 * PasswordChangeScreen - Jelszó megváltoztatása képernyő
 * Követelmény: 5.1 Password change functionality
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import PasswordService from '../services/PasswordService';
import Logger from '../services/Logger';

const PasswordChangeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Jelszó erősség állapot
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
    isValid: false,
  });

  // Jelszó erősség ellenőrzése
  const checkPasswordStrength = (password) => {
    const result = PasswordService.validatePassword(password);
    setPasswordStrength(result);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'newPassword') {
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
    // Validáció
    if (!formData.currentPassword.trim()) {
      Alert.alert('Hiba', 'Kérjük, add meg a jelenlegi jelszavad.');
      return;
    }

    if (!formData.newPassword.trim()) {
      Alert.alert('Hiba', 'Kérjük, add meg az új jelszavad.');
      return;
    }

    if (!passwordStrength.isValid) {
      Alert.alert('Hiba', 'Az új jelszó nem elég erős. Kérjük, használj erősebb jelszót.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Hiba', 'Az új jelszó és a megerősítés nem egyezik meg.');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      Alert.alert('Hiba', 'Az új jelszó nem lehet ugyanaz, mint a jelenlegi.');
      return;
    }

    setLoading(true);
    try {
      // Jelszó megváltoztatása
      const result = await PasswordService.changePassword(
        formData.currentPassword,
        formData.newPassword
      );

      if (result.success) {
        Logger.info('Password changed successfully', { userId: user?.id });

        Alert.alert(
          'Sikeres jelszóváltoztatás',
          'A jelszavadat sikeresen megváltoztattad. Minden más eszközön ki leszel léptetve a biztonság érdekében.',
          [
            {
              text: 'Rendben',
              onPress: () => navigation.goBack(),
            },
          ]
        );

        // Form reset
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setPasswordStrength({ score: 0, feedback: [], isValid: false });

      } else {
        throw new Error(result.error || 'Ismeretlen hiba történt');
      }

    } catch (error) {
      Logger.error('Password change failed', error);

      let errorMessage = 'Hiba történt a jelszó megváltoztatása közben.';
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'A jelenlegi jelszó helytelen.';
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

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Jelszó megváltoztatása</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            {/* Jelenlegi jelszó */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Jelenlegi jelszó</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.currentPassword}
                  onChangeText={(value) => handleInputChange('currentPassword', value)}
                  placeholder="Add meg a jelenlegi jelszavad"
                  secureTextEntry={!showPasswords.current}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => togglePasswordVisibility('current')}
                >
                  <Ionicons
                    name={showPasswords.current ? 'eye-off' : 'eye'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Új jelszó */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Új jelszó</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.newPassword}
                  onChangeText={(value) => handleInputChange('newPassword', value)}
                  placeholder="Add meg az új jelszavad"
                  secureTextEntry={!showPasswords.new}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => togglePasswordVisibility('new')}
                >
                  <Ionicons
                    name={showPasswords.new ? 'eye-off' : 'eye'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              {/* Jelszó erősség indicator */}
              {formData.newPassword.length > 0 && (
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
              <Text style={styles.label}>Új jelszó megerősítése</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  placeholder="Add meg újra az új jelszavad"
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
                    name={formData.newPassword === formData.confirmPassword ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={formData.newPassword === formData.confirmPassword ? '#4CAF50' : '#FF4444'}
                  />
                  <Text style={[
                    styles.matchText,
                    { color: formData.newPassword === formData.confirmPassword ? '#4CAF50' : '#FF4444' }
                  ]}>
                    {formData.newPassword === formData.confirmPassword
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
                  <Ionicons name="lock-closed" size={20} color="#FFF" style={styles.submitIcon} />
                  <Text style={styles.submitButtonText}>Jelszó megváltoztatása</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Biztonsági információ */}
            <View style={styles.securityInfo}>
              <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
              <Text style={styles.securityText}>
                A jelszó megváltoztatása után minden más eszközön ki leszel léptetve a fiókodból.
              </Text>
            </View>
          </View>
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: '#FFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
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
    backgroundColor: '#FF6B6B',
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
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F8F0',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  securityText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    lineHeight: 20,
    flex: 1,
  },
});

export default PasswordChangeScreen;
