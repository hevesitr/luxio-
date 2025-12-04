/**
 * Error Display Component
 *
 * Displays user-friendly error messages with recovery steps
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const ErrorDisplay = ({
  error,
  onRetry,
  onDismiss,
  showRecoverySteps = true,
  compact = false
}) => {
  const { theme } = useTheme();

  if (!error) return null;

  const handleAction = () => {
    if (error.action === 'Újrapróbálkozás' && onRetry) {
      onRetry();
    } else if (error.action === 'Engedély megadása') {
      Alert.alert(
        'Engedély szükséges',
        'Az alkalmazásnak szüksége van erre az engedélyre a megfelelő működéshez. Kérjük, add meg az engedélyt a telefon beállításaiban.',
        [
          { text: 'Mégse', style: 'cancel' },
          { text: 'Beállítások megnyitása', onPress: () => {
            // Open device settings - this would need react-native-permissions or similar
            Alert.alert('Információ', 'Kérjük, nyisd meg a telefon beállításaiban a LoveX alkalmazást és engedélyezd a szükséges jogosultságokat.');
          }}
        ]
      );
    } else {
      onDismiss && onDismiss();
    }
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: theme.colors.errorBackground }]}>
        <Ionicons name="warning" size={16} color={theme.colors.error} />
        <Text style={[styles.compactText, { color: theme.colors.error }]}>
          {error.message}
        </Text>
        <TouchableOpacity onPress={handleAction}>
          <Text style={[styles.compactAction, { color: theme.colors.primary }]}>
            {error.action}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.cardBackground }]}>
      {/* Error Header */}
      <View style={styles.header}>
        <Ionicons name="warning" size={24} color={theme.colors.error} />
        <Text style={[styles.title, { color: theme.colors.error }]}>
          {error.title}
        </Text>
      </View>

      {/* Error Message */}
      <Text style={[styles.message, { color: theme.colors.text }]}>
        {error.message}
      </Text>

      {/* Recovery Steps */}
      {showRecoverySteps && error.recoverySteps && error.recoverySteps.length > 0 && (
        <View style={styles.recoveryContainer}>
          <Text style={[styles.recoveryTitle, { color: theme.colors.text }]}>
            Hogyan oldhatod meg:
          </Text>
          <ScrollView style={styles.recoveryScroll} showsVerticalScrollIndicator={false}>
            {error.recoverySteps.map((step, index) => (
              <View key={index} style={styles.recoveryStep}>
                <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[styles.stepNumberText, { color: theme.colors.cardBackground }]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[styles.stepText, { color: theme.colors.text }]}>
                  {step}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {onDismiss && (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
            onPress={onDismiss}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
              Később
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAction}
        >
          <Text style={[styles.primaryButtonText, { color: theme.colors.cardBackground }]}>
            {error.action}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
  },

  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },

  recoveryContainer: {
    marginBottom: 24,
  },

  recoveryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },

  recoveryScroll: {
    maxHeight: 200,
  },

  recoveryStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },

  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
  },

  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },

  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    gap: 8,
  },

  compactText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  compactAction: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ErrorDisplay;
