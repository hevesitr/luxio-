import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const StoryCircle = ({ user, onPress, isViewed = false, isOwnStory = false }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.avatarContainer, !isViewed && styles.avatarGlow]}>
        {!isViewed ? (
          <LinearGradient
            colors={['#FF3B75', '#FFC107', '#2196F3']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.avatarInner}>
              <Image source={{ uri: user.photo }} style={styles.avatar} />
              <View style={styles.shine} />
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.viewedBorder}>
            <Image source={{ uri: user.photo }} style={styles.avatar} />
          </View>
        )}
        {isOwnStory && (
          <View style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 16,
    width: 68,
  },
  avatarContainer: {
    width: 68,
    height: 68,
    marginBottom: 0,
  },
  avatarGlow: {
    shadowColor: '#FF3B75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  gradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2.5,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 32,
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    padding: 3,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
  },
  viewedBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  addButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B75',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: -2,
  },
  shine: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ rotate: '35deg' }],
    pointerEvents: 'none',
  },
});

export default StoryCircle;

