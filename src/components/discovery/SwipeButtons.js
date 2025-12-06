/**
 * Swipe Buttons Component
 * Action buttons for swiping on profiles
 */
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SwipeButtons = ({ onPass, onLike, onSuperLike, onRewind, disabled = false, canRewind = false }) => {
  return (
    <View style={styles.container}>
      {/* Rewind Button (Premium) */}
      <TouchableOpacity
        style={[styles.button, styles.buttonSmall, (disabled || !canRewind) && styles.buttonDisabled]}
        disabled={disabled || !canRewind}
        onPress={onRewind}
      >
        <Ionicons name="arrow-undo" size={24} color={canRewind ? "#FFC107" : "#999"} />
      </TouchableOpacity>
      
      {/* Pass Button */}
      <TouchableOpacity
        style={[styles.button, styles.buttonLarge, disabled && styles.buttonDisabled]}
        onPress={onPass}
        disabled={disabled}
      >
        <Ionicons name="close" size={32} color="#FF3B30" />
      </TouchableOpacity>
      
      {/* Super Like Button */}
      <TouchableOpacity
        style={[styles.button, styles.buttonMedium, disabled && styles.buttonDisabled]}
        onPress={onSuperLike}
        disabled={disabled}
      >
        <Ionicons name="star" size={28} color="#007AFF" />
      </TouchableOpacity>
      
      {/* Like Button */}
      <TouchableOpacity
        style={[styles.button, styles.buttonLarge, disabled && styles.buttonDisabled]}
        onPress={onLike}
        disabled={disabled}
      >
        <Ionicons name="heart" size={32} color="#34C759" />
      </TouchableOpacity>
      
      {/* Boost Button (Premium) */}
      <TouchableOpacity
        style={[styles.button, styles.buttonSmall, disabled && styles.buttonDisabled]}
        disabled={disabled}
      >
        <Ionicons name="flash" size={24} color="#AF52DE" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 16,
  },
  button: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  buttonMedium: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  buttonLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default SwipeButtons;
