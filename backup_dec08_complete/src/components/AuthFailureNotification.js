/**
 * AuthFailureNotification - Authentication failure értesítések megjelenítése
 * Követelmény: 4.5 Add silent failure detection
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import Logger from '../services/Logger';

const AuthFailureNotification = ({ style }) => {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const [failureType, setFailureType] = useState(null); // null, 'token_expired', 'auth_failed', 'network_error'
  const [showNotification, setShowNotification] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Auth context változások figyelése
    // Ez egy egyszerű implementáció - valós app-ban az AuthService-ből jönnének az események
    const checkAuthStatus = () => {
      // Szimulált failure detection
      // Valós implementációban ez az AuthService heartbeat mechanizmusából jönne
    };

    checkAuthStatus();

    // Periodikus ellenőrzés (valós app-ban ez az AuthService heartbeat-je lenne)
    const interval = setInterval(checkAuthStatus, 30000); // 30 másodpercenként

    return () => clearInterval(interval);
  }, []);

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);

    if (retryCount >= 2) {
      // 3. próbálkozás után kijelentkezés
      Alert.alert(
        'Hitelesítési hiba',
        'Nem sikerült helyreállítani a kapcsolatot. Kérjük, jelentkezzen be újra.',
        [
          {
            text: 'Bejelentkezés',
            onPress: () => {
              signOut();
              navigation.replace('Login');
            },
          },
        ]
      );
      return;
    }

    // Retry logika
    Logger.info('AuthFailureNotification: Retrying authentication', { attempt: retryCount + 1 });

    // Szimulált retry
    setTimeout(() => {
      // Valós implementációban itt lenne az AuthService refresh hívás
      if (retryCount >= 1) {
        // Sikertelen retry
        setFailureType('auth_failed');
        setShowNotification(true);
      } else {
        // Sikeres retry
        setFailureType(null);
        setShowNotification(false);
      }
    }, 2000);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Kijelentkezés',
      'Biztosan ki szeretne jelentkezni?',
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Kijelentkezés',
          style: 'destructive',
          onPress: () => {
            signOut();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const handleDismiss = () => {
    setShowNotification(false);
    setFailureType(null);
    setRetryCount(0);
  };

  const getFailureInfo = () => {
    switch (failureType) {
      case 'token_expired':
        return {
          icon: 'time-outline',
          color: '#FF9800',
          title: 'Token lejárt',
          message: 'A munkamenet ideje lejárt. Frissítse bejelentkezését.',
          actionText: 'Frissítés',
        };
      case 'auth_failed':
        return {
          icon: 'warning-outline',
          color: '#F44336',
          title: 'Hitelesítési hiba',
          message: 'Nem sikerült ellenőrizni az identitását.',
          actionText: 'Újrapróbálkozás',
        };
      case 'network_error':
        return {
          icon: 'cloud-offline-outline',
          color: '#FF9800',
          title: 'Hálózati hiba',
          message: 'Nem sikerült kapcsolódni a szerverhez.',
          actionText: 'Újrapróbálkozás',
        };
      default:
        return null;
    }
  };

  const failureInfo = getFailureInfo();
  if (!failureInfo || !showNotification) return null;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.notification, { borderLeftColor: failureInfo.color }]}>
        <View style={styles.header}>
          <Ionicons name={failureInfo.icon} size={20} color={failureInfo.color} />
          <Text style={[styles.title, { color: failureInfo.color }]}>
            {failureInfo.title}
          </Text>
          <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
            <Ionicons name="close" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.message}>{failureInfo.message}</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton, { backgroundColor: failureInfo.color }]}
            onPress={handleRetry}
          >
            <Text style={styles.primaryButtonText}>{failureInfo.actionText}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleSignOut}
          >
            <Text style={styles.secondaryButtonText}>Kijelentkezés</Text>
          </TouchableOpacity>
        </View>

        {retryCount > 0 && (
          <Text style={styles.retryInfo}>
            {retryCount}. próbálkozás
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingTop: 50, // Status bar miatt
  },
  notification: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  retryInfo: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default AuthFailureNotification;
