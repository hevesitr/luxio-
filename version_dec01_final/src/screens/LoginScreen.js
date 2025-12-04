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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import StorageService from '../services/StorageService';
import { SupabaseAuthService } from '../services/SupabaseAuthService';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const validateForm = () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Hiba', 'Kérjük, add meg egy érvényes email címet.');
      return false;
    }

    if (!password || password.length < 8) {
      Alert.alert('Hiba', 'Kérjük, add meg a jelszavadat.');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { user } = await SupabaseAuthService.signInUser({
        email: normalizedEmail,
        password,
      });

      if (rememberMe) {
        await StorageService.setItem('remember_me', true);
        await StorageService.setItem('saved_email', normalizedEmail);
      } else {
        await StorageService.removeItem('remember_me');
        await StorageService.removeItem('saved_email');
      }

      await refreshProfile();

      if (user?.email && !user.email_confirmed_at) {
        Alert.alert(
          'Email megerősítés szükséges',
          'Kérjük, erősítsd meg az email címedet a postaládádba érkezett linken keresztül.'
        );
      } else {
        Alert.alert('✅ Sikeres bejelentkezés', 'Üdv újra a Luxio-ban!');
      }
    } catch (error) {
      console.error('Login error:', error);
      const message =
        error.message?.includes('Invalid login credentials')
          ? 'Hibás email cím vagy jelszó.'
          : error.message || 'Hiba történt a bejelentkezés során.';
      Alert.alert('Hiba', message);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const BiometricService = require('../services/BiometricService').default;
      const isEnabled = await BiometricService.isEnabled();
      
      if (!isEnabled) {
        Alert.alert(
          'Biometrikus hitelesítés',
          'A biometrikus hitelesítés nincs engedélyezve. Engedélyezd a Beállításokban.',
          [{ text: 'Rendben' }]
        );
        return;
      }

      const result = await BiometricService.authenticate('Bejelentkezés biometrikus hitelesítéssel');
      
      if (result.success) {
        // Load saved credentials
        const savedEmail = await StorageService.getItem('saved_email');
        if (savedEmail) {
          setEmail(savedEmail);
          // Auto-login with saved credentials
          // Note: In production, you'd need to store encrypted password or use token
          Alert.alert('Info', 'Biometrikus hitelesítés sikeres. Add meg a jelszavadat.');
        }
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      Alert.alert('Hiba', 'Biometrikus hitelesítés sikertelen.');
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Üdvözöljük!</Text>
            <Text style={styles.subtitle}>
              Jelentkezz be a fiókodba, hogy folytathasd az ismerkedést
            </Text>
          </View>

          <View style={styles.form}>
            {/* Email */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email cím</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Jelszó</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Add meg a jelszavadat"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <Ionicons
                  name={rememberMe ? 'checkbox' : 'checkbox-outline'}
                  size={20}
                  color={rememberMe ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text style={styles.checkboxText}>Emlékezz rám</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('PasswordReset')}
                style={styles.forgotPasswordButton}
              >
                <Text style={styles.forgotPasswordText}>Elfelejtetted?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryDark]}
                  style={styles.loginButtonGradient}
                >
                  <Text style={styles.loginButtonText}>Bejelentkezés</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>

            {/* Biometric Login */}
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
            >
              <Ionicons name="finger-print" size={24} color={theme.colors.primary} />
              <Text style={styles.biometricButtonText}>Biometrikus bejelentkezés</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>vagy</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Még nincs fiókod? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Regisztráció</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 14,
  },
  eyeButton: {
    padding: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 8,
  },
  forgotPasswordButton: {
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 24,
  },
  biometricButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginHorizontal: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;

