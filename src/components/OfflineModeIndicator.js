/**
 * Offline Mode Indicator Component
 * 
 * Property: Property 11 - Offline Mode Indication
 * Validates: Requirements 12 (Offline Mode Indicator)
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../context/NetworkContext';

const OfflineModeIndicator = () => {
  const { isOnline, isReconnecting, reconnectionAttempts } = useNetwork();
  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (!isOnline || isReconnecting) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, isReconnecting, fadeAnim]);

  // Don't render if online and not reconnecting
  if (isOnline && !isReconnecting) {
    return null;
  }

  const getIndicatorConfig = () => {
    if (isReconnecting) {
      return {
        icon: 'sync',
        text: `Syncing... (attempt ${reconnectionAttempts + 1})`,
        backgroundColor: '#FFA500',
        iconColor: '#FFF',
      };
    }

    if (!isOnline) {
      return {
        icon: 'cloud-offline',
        text: 'Offline Mode',
        backgroundColor: '#FF6B6B',
        iconColor: '#FFF',
      };
    }

    return {
      icon: 'checkmark-circle',
      text: 'Synced',
      backgroundColor: '#4CAF50',
      iconColor: '#FFF',
    };
  };

  const config = getIndicatorConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: config.backgroundColor, opacity: fadeAnim },
      ]}
    >
      <Ionicons name={config.icon} size={16} color={config.iconColor} />
      <Text style={styles.text}>{config.text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 10,
  },
  text: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default OfflineModeIndicator;
