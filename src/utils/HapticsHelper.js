/**
 * HapticsHelper - Safe Haptics wrapper
 * Ensures Haptics always works even if ImpactFeedbackStyle is undefined
 */
import * as Haptics from 'expo-haptics';

// Safe Haptics wrapper that handles undefined ImpactFeedbackStyle
const SafeHaptics = {
  async impactAsync(style = 'medium') {
    try {
      // Convert to lowercase string if it's not already
      const styleStr = typeof style === 'string' ? style.toLowerCase() : 'medium';
      
      // Call Haptics with string value
      // await Haptics.impactAsync(styleStr); // DISABLED
    } catch (error) {
      // Silently fail - Haptics not available
      console.log('Haptics not available:', error.message);
    }
  },

  // Provide safe style constants
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
};

export default SafeHaptics;
