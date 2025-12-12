/**
 * Session Timeout Warning Component
 * 
 * Property: Property 12 - Session Timeout Warning
 * Validates: Requirements 13 (Session Timeout Handling)
 */

import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SessionTimeoutWarning = ({ 
  visible, 
  onExtend, 
  onLogout, 
  timeRemaining = 300 // 5 minutes in seconds
}) => {
  const [countdown, setCountdown] = useState(timeRemaining);

  useEffect(() => {
    if (!visible) {
      setCountdown(timeRemaining);
      return;
    }

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, timeRemaining, onLogout]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onLogout}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={48} color="#FF6B6B" />
          </View>

          <Text style={styles.title}>Session Expiring Soon</Text>
          
          <Text style={styles.message}>
            Your session will expire in
          </Text>

          <Text style={styles.countdown}>{formatTime(countdown)}</Text>

          <Text style={styles.description}>
            Would you like to extend your session?
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.extendButton]}
              onPress={onExtend}
            >
              <Ionicons name="refresh" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Extend Session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={onLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#666" />
              <Text style={[styles.buttonText, styles.logoutButtonText]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  countdown: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginVertical: 16,
  },
  description: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  extendButton: {
    backgroundColor: '#FF6B6B',
  },
  logoutButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  logoutButtonText: {
    color: '#666',
  },
});

export default SessionTimeoutWarning;
