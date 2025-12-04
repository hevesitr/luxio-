import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const IncomingCallScreen = ({ route, navigation }) => {
  const { caller, callType = 'voice' } = route.params || {};
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Ring animation
    Animated.loop(
      Animated.timing(ringAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Haptic feedback every 2 seconds
    const hapticInterval = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 2000);

    return () => {
      clearInterval(hapticInterval);
    };
  }, []);

  const handleAccept = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Navigate to appropriate call screen
    if (callType === 'video') {
      navigation.replace('VideoChat', { caller });
    } else {
      navigation.replace('VoiceCall', { caller });
    }
  };

  const handleDecline = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    navigation.goBack();
  };

  const ringScale = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const ringOpacity = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <View style={styles.container}>
      <BlurView intensity={80} style={styles.blurContainer}>
        {/* Caller Info */}
        <View style={styles.callerContainer}>
          {/* Ring Animation */}
          <Animated.View
            style={[
              styles.ringOuter,
              {
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />
          
          {/* Avatar with Pulse */}
          <Animated.View
            style={[
              styles.avatarContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {caller?.photo ? (
              <Image source={{ uri: caller.photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={80} color="#fff" />
              </View>
            )}
          </Animated.View>

          {/* Caller Name */}
          <Text style={styles.callerName}>{caller?.name || 'Unknown'}</Text>
          
          {/* Call Type */}
          <View style={styles.callTypeContainer}>
            <Ionicons 
              name={callType === 'video' ? 'videocam' : 'call'} 
              size={20} 
              color="#fff" 
            />
            <Text style={styles.callTypeText}>
              {callType === 'video' ? 'Videóhívás' : 'Hanghívás'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Decline Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDecline}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#FF3B75', '#FF1744']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionButtonText}>Elutasít</Text>
          </TouchableOpacity>

          {/* Accept Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAccept}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#4CAF50', '#66BB6A']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="call" size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionButtonText}>Fogad</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  callerContainer: {
    alignItems: 'center',
    gap: 20,
  },
  ringOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#fff',
    top: 0,
  },
  avatarContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.PRIMARY_PINK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callerName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  callTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  callTypeText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  actionButton: {
    alignItems: 'center',
    gap: 12,
  },
  actionButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default IncomingCallScreen;
