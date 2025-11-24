import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api/v1'
  : 'https://api.datingapp.com/api/v1';

const PasswordResetScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState(route?.params?.email || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendResetCode = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Hiba', 'Kérjük, add meg egy érvényes email címet.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          '✅ Kód elküldve',
          'Jelszó visszaállítási kódot küldtünk az email címedre.'
        );
        setStep(2);
        setResendCooldown(60);
      } else {
        throw new Error(result.error?.message || 'Kód küldése sikertelen');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Hiba', 'Hiba történt a kód küldése során.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Hiba', 'Kérjük, add meg a teljes 6 számjegyű kódot.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: otpString,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStep(3);
      } else {
        throw new Error(result.error?.message || 'Kód verifikáció sikertelen');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Hiba', 'Érvénytelen vagy lejárt kód. Kérj új kódot.');
      setOtp(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      Alert.alert('Hiba', 'A jelszónak legalább 8 karakter hosszúnak kell lennie.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Hiba', 'A jelszavak nem egyeznek.');
      return;
    }

    setLoading(true);
    try {
      const otpString = otp.join('');
      
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: otpString,
          newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          '✅ Sikeres',
          'Jelszavad sikeresen megváltoztatva. Most már bejelentkezhetsz az új jelszavaddal.',
          [
            {
              text: 'Rendben',
              onPress: () => {
                navigation.navigate('Login', { email: email.trim().toLowerCase() });
              },
            },
          ]
        );
      } else {
        throw new Error(result.error?.message || 'Jelszó visszaállítás sikertelen');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Hiba', 'Hiba történt a jelszó visszaállítása során.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index, value) => {
    if (value.length > 1 || (value && !/^\d$/.test(value))) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      // Auto-focus next (would need refs, simplified here)
    }

    if (index === 5 && value && newOtp.every(digit => digit !== '')) {
      handleVerifyOTP();
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) {
      return;
    }

    await handleSendResetCode();
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Jelszó Visszaállítás</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {step === 1 && (
          <>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={64} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Elfelejtetted a jelszavadat?</Text>
            <Text style={styles.description}>
              Add meg az email címedet, és küldünk neked egy jelszó visszaállítási kódot.
            </Text>

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
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendResetCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryDark]}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Kód Küldése</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <View style={styles.iconContainer}>
              <Ionicons name="mail" size={64} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Kód Megadása</Text>
            <Text style={styles.description}>
              Küldtünk egy 6 számjegyű kódot az email címedre: {email}
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  style={[styles.otpInput, digit && styles.otpInputFilled]}
                  value={digit}
                  onChangeText={(value) => handleOTPChange(index, value)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading || otp.some(digit => !digit)}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryDark]}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Megerősítés</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResendCode}
              disabled={resendCooldown > 0 || loading}
              style={styles.resendButton}
            >
              <Text style={[styles.resendText, (resendCooldown > 0 || loading) && styles.resendTextDisabled]}>
                {resendCooldown > 0 ? `Újraküldés (${resendCooldown}s)` : 'Újraküldés'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {step === 3 && (
          <>
            <View style={styles.iconContainer}>
              <Ionicons name="key" size={64} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Új Jelszó</Text>
            <Text style={styles.description}>
              Add meg az új jelszavadat. Legalább 8 karakter hosszúnak kell lennie.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Új jelszó</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 8 karakter"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
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
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Jelszó megerősítése</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
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
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryDark]}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Jelszó Visszaállítása</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </>
        )}
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
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  formGroup: {
    width: '100%',
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  otpInputFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: theme.colors.textSecondary,
  },
});

export default PasswordResetScreen;

