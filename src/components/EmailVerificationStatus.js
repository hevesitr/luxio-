/**
 * EmailVerificationStatus - Email verifikáció státusz megjelenítése profilban
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import EmailService from '../services/EmailService';
import Logger from '../services/Logger';

const EmailVerificationStatus = () => {
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkVerificationStatus();
  }, [user]);

  const checkVerificationStatus = async () => {
    if (!user?.id) return;

    try {
      const status = await EmailService.checkEmailVerificationStatus();
      setVerificationStatus(status);
    } catch (error) {
      Logger.error('Failed to check email verification status', error);
      setVerificationStatus({ verified: false, error: error.message });
    }
  };

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
        Logger.info('Verification email resent from profile', { userId: user.id });
      } else {
        throw new Error(result.error || 'Ismeretlen hiba');
      }
    } catch (error) {
      Logger.error('Failed to resend verification email from profile', error);
      Alert.alert(
        'Hiba',
        'Nem sikerült elküldeni a verifikációs email-t. Próbálja újra később.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!verificationStatus || verificationStatus.verified) {
    return null; // Ne jelenítsük meg, ha már verifikált vagy nincs információ
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="mail-outline" size={20} color="#FF6B6B" />
        <Text style={styles.title}>Email verifikáció</Text>
      </View>

      <Text style={styles.message}>
        Az email cím megerősítésével teljes mértékben használhatja az alkalmazás funkcióit.
      </Text>

      <TouchableOpacity
        style={[styles.resendButton, isLoading && styles.resendButtonDisabled]}
        onPress={handleResendVerification}
        disabled={isLoading}
      >
        <Text style={[styles.resendButtonText, isLoading && styles.resendButtonTextDisabled]}>
          {isLoading ? 'Küldés...' : 'Verifikációs email újraküldése'}
        </Text>
      </TouchableOpacity>

      {verificationStatus.error && (
        <Text style={styles.errorText}>
          Hiba: {verificationStatus.error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8F8',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  resendButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  resendButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  resendButtonTextDisabled: {
    color: '#999',
  },
  errorText: {
    fontSize: 12,
    color: '#FF4444',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default EmailVerificationStatus;
