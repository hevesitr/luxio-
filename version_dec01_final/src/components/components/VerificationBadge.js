import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * VerificationBadge Component
 * 
 * Displays a verification checkmark badge for verified users
 * 
 * @param {boolean} verified - Whether the user is verified
 * @param {number} size - Size of the badge (default: 20)
 * @param {string} color - Color of the checkmark (default: '#2196F3')
 * @param {object} style - Additional styles
 */
const VerificationBadge = ({ 
  verified = false, 
  size = 20, 
  color = '#2196F3',
  style 
}) => {
  if (!verified) return null;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Ionicons 
        name="checkmark-circle" 
        size={size} 
        color={color} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VerificationBadge;
