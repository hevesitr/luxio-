import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api/v1'
  : 'https://api.datingapp.com/api/v1';

const OTPVerificationScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { email, phone, userId, type = 'email' } = route.params || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Auto-focus first input
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Resend cooldown timer
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOTPChange = (index, value) => {
    // Only allow single digit
    if (value.length > 1) {
      return;
    }

    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all fields filled
    if (index === 5 && value && newOtp.every(digit => digit !== '')) {
      handleVerify();
    }
  };

  const handleKeyPress = (index, key) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Hiba', 'Kérjük, add meg a teljes 6 számjegyű kódot.');
      return;
    }

    setLoading(true);
    try {
      const StorageService = require('../services/StorageService').default;
      const token = await StorageService.getToken();

      const endpoint = type === 'email' 
        ? '/auth/verify-email'
        : '/auth/verify-phone';

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          otp: otpString,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          '✅ Sikeres verifikáció',
          type === 'email' 
            ? 'Email címed sikeresen megerősítve!'
            : 'Telefonszámod sikeresen megerősítve!',
          [
            {
              text: 'Rendben',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
                });
              },
            },
          ]
        );
      } else {
        throw new Error(result.error?.message || 'Verifikáció sikertelen');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      
      let errorMessage = 'Hiba történt a verifikáció során.';
      if (error.message.includes('invalid') || error.message.includes('expired')) {
        errorMessage = 'Érvénytelen vagy lejárt kód. Kérjük, kérj új kódot.';
        // Clear OTP
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }

      Alert.alert('Hiba', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) {
      return;
    }

    setLoading(true);
    try {
      const StorageService = require('../services/StorageService').default;
      const token = await StorageService.getToken();

      const endpoint = type === 'email'
        ? '/auth/resend-email-verification'
        : '/auth/resend-phone-verification';

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          '✅ Kód elküldve',
          type === 'email'
            ? 'Új verifikációs kódot küldtünk az email címedre.'
            : 'Új verifikációs kódot küldtünk a telefonszámodra.'
        );
        setResendCooldown(60); // 60 másodperc cooldown
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        throw new Error(result.error?.message || 'Kód küldése sikertelen');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Hiba', 'Hiba történt a kód újraküldése során.');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verifikáció</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={type === 'email' ? 'mail' : 'call'}
            size={64}
            color={theme.colors.primary}
          />
        </View>

        <Text style={styles.title}>
          {type === 'email' ? 'Email Verifikáció' : 'Telefon Verifikáció'}
        </Text>

        <Text style={styles.description}>
          {type === 'email'
            ? `Küldtünk egy 6 számjegyű kódot az email címedre:\n${email}`
            : `Küldtünk egy 6 számjegyű kódot a telefonszámodra:\n${phone}`}
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
              ]}
              value={digit}
              onChangeText={(value) => handleOTPChange(index, value)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={loading || otp.some(digit => !digit)}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.verifyButtonGradient}
            >
              <Text style={styles.verifyButtonText}>Megerősítés</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Nem kaptad meg a kódot?</Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resendCooldown > 0 || loading}
            style={styles.resendButton}
          >
            <Text
              style={[
                styles.resendButtonText,
                (resendCooldown > 0 || loading) && styles.resendButtonTextDisabled,
              ]}
            >
              {resendCooldown > 0 ? `Újraküldés (${resendCooldown}s)` : 'Újraküldés'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.changeContactButton}
          onPress={() => {
            Alert.alert(
              'Kapcsolat módosítása',
              'Ha nem kaptad meg a kódot, ellenőrizd a megadott email címet vagy telefonszámot.',
              [{ text: 'Rendben' }]
            );
          }}
        >
          <Text style={styles.changeContactText}>
            Nem kaptad meg? Kapcsolat módosítása
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
  verifyButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: theme.colors.textSecondary,
  },
  changeContactButton: {
    paddingVertical: 12,
  },
  changeContactText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
  },
});

export default OTPVerificationScreen;

