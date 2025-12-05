/**
 * EmailVerificationBanner - Email verifikáció emlékeztető banner
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import EmailService from '../services/EmailService';
import Logger from '../services/Logger';

const EmailVerificationBanner = ({ onDismiss }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleResendVerification = async () => {
    if (!user?.email) {
      Alert.alert('Hiba', 'Nincs elérhető email cím.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await EmailService.resendVerificationEmail(user.email);

      if (result.success) {
        Alert.alert(
          'Email elküldve',
          'Új verifikációs email elküldve a postaládájába.'
        );
        Logger.info('Verification email resent', { userId: user.id });
      } else {
        throw new Error(result.error || 'Ismeretlen hiba');
      }
    } catch (error) {
      Logger.error('Failed to resend verification email', error);
      Alert.alert(
        'Hiba',
        'Nem sikerült elküldeni a verifikációs email-t. Próbálja újra később.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="mail-outline" size={24} color="#FF6B6B" style={styles.icon} />

        <View style={styles.textContainer}>
          <Text style={styles.title}>Email verifikáció szükséges</Text>
          <Text style={styles.message}>
            Kérjük, erősítse meg email címét a teljes funkcionalitás eléréséhez.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.resendButton]}
            onPress={handleResendVerification}
            disabled={isLoading}
          >
            <Text style={styles.resendButtonText}>
              {isLoading ? 'Küldés...' : 'Újraküldés'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dismissButton]}
            onPress={handleDismiss}
          >
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendButton: {
    backgroundColor: '#FF6B6B',
  },
  resendButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  dismissButton: {
    backgroundColor: '#F5F5F5',
    width: 36,
    height: 36,
  },
});

export default EmailVerificationBanner;
