/**
 * Error Modal Component
 *
 * Modal wrapper for displaying error messages
 */
import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ErrorDisplay from './ErrorDisplay';
import { useTheme } from '../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ErrorModal = ({
  visible,
  error,
  onRetry,
  onDismiss,
  showRecoverySteps = true
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.colors.background }]}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onDismiss}
          >
            <Ionicons
              name="close"
              size={24}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Error Display */}
          <ErrorDisplay
            error={error}
            onRetry={onRetry}
            onDismiss={onDismiss}
            showRecoverySteps={showRecoverySteps}
          />
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
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },

  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});

export default ErrorModal;
