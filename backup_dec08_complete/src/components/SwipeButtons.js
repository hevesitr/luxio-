import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

/**
 * SwipeButtons - Swipe akció gombok
 * 
 * @param {Function} onUndo - Visszavonás callback
 * @param {Function} onDislike - Dislike callback
 * @param {Function} onSuperLike - Super Like callback
 * @param {Function} onLike - Like callback
 * @param {Function} onBoost - Boost callback
 * @param {boolean} canUndo - Van-e visszavonható akció
 * @param {boolean} disabled - Gombok letiltva
 * @param {boolean} visible - Gombok láthatósága
 */
const SwipeButtons = ({
  onUndo,
  onDislike,
  onSuperLike,
  onLike,
  onBoost,
  canUndo = false,
  disabled = false,
  visible = true,
}) => {
  if (!visible) return null;

  const handlePress = async (callback, hapticStyle) => {
    if (disabled) return;
    
    try {
      await Haptics.impactAsync(hapticStyle);
    } catch (error) {
      console.log('Haptics error:', error);
    }
    
    if (callback) callback();
  };

  return (
    <View style={styles.container}>
      {/* Undo Button */}
      <TouchableOpacity
        style={[styles.button, styles.smallButton, !canUndo && styles.buttonDisabled]}
        onPress={() => handlePress(onUndo, Haptics.ImpactFeedbackStyle.Light)}
        disabled={!canUndo || disabled}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="arrow-undo" 
          size={24} 
          color={canUndo ? '#FFC107' : '#999'} 
        />
      </TouchableOpacity>

      {/* Dislike Button */}
      <TouchableOpacity
        style={[styles.button, styles.largeButton, disabled && styles.buttonDisabled]}
        onPress={() => handlePress(onDislike, Haptics.ImpactFeedbackStyle.Medium)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, styles.dislikeContainer]}>
          <Ionicons name="close" size={32} color="#F44336" />
        </View>
      </TouchableOpacity>

      {/* Super Like Button */}
      <TouchableOpacity
        style={[styles.button, styles.mediumButton, disabled && styles.buttonDisabled]}
        onPress={() => handlePress(onSuperLike, Haptics.ImpactFeedbackStyle.Heavy)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#4f9df7', '#5fd4ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          <Ionicons name="star" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Like Button */}
      <TouchableOpacity
        style={[styles.button, styles.largeButton, disabled && styles.buttonDisabled]}
        onPress={() => handlePress(onLike, Haptics.ImpactFeedbackStyle.Heavy)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, styles.likeContainer]}>
          <Ionicons name="heart" size={32} color="#4CAF50" />
        </View>
      </TouchableOpacity>

      {/* Boost Button */}
      <TouchableOpacity
        style={[styles.button, styles.smallButton, disabled && styles.buttonDisabled]}
        onPress={() => handlePress(onBoost, Haptics.ImpactFeedbackStyle.Light)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons name="flash" size={24} color="#9C27B0" />
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
    paddingHorizontal: 10,
    gap: 15,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  smallButton: {
    width: 50,
    height: 50,
  },
  mediumButton: {
    width: 60,
    height: 60,
  },
  largeButton: {
    width: 70,
    height: 70,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  likeContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  dislikeContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
});

export default SwipeButtons;
