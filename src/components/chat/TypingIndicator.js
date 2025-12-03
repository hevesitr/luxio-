/**
 * Typing Indicator Component
 * Shows when other user is typing
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';

const TypingIndicator = ({ profile }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animate = (dot, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };
    
    const animations = Animated.parallel([
      animate(dot1, 0),
      animate(dot2, 200),
      animate(dot3, 400),
    ]);
    
    animations.start();
    
    return () => animations.stop();
  }, []);
  
  return (
    <View style={styles.container}>
      {profile && (
        <Image
          source={{ uri: profile.photo_url }}
          style={styles.avatar}
        />
      )}
      
      <View style={styles.bubble}>
        <Animated.View
          style={[
            styles.dot,
            {
              opacity: dot1,
              transform: [{
                translateY: dot1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -4],
                }),
              }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              opacity: dot2,
              transform: [{
                translateY: dot2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -4],
                }),
              }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              opacity: dot3,
              transform: [{
                translateY: dot3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -4],
                }),
              }],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
  },
});

export default TypingIndicator;
