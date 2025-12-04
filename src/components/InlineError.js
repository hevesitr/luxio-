/**
 * Inline Error Component
 *
 * Displays error messages inline with form fields
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const InlineError = ({
  error,
  visible = true,
  style,
  iconSize = 16,
  animationDuration = 300
}) => {
  const { theme } = useTheme();
  const [opacity] = React.useState(new Animated.Value(visible ? 1 : 0));

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible && error ? 1 : 0,
      duration: animationDuration,
      useNativeDriver: true,
    }).start();
  }, [visible, error, opacity, animationDuration]);

  if (!error) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{
            translateY: opacity.interpolate({
              inputRange: [0, 1],
              outputRange: [-10, 0],
            }),
          }],
        },
        style
      ]}
    >
      <Ionicons
        name="warning"
        size={iconSize}
        color={theme.colors.error}
      />
      <Text style={[styles.text, { color: theme.colors.error }]}>
        {error}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },

  text: {
    fontSize: 14,
    lineHeight: 18,
    flex: 1,
  },
});

export default InlineError;
