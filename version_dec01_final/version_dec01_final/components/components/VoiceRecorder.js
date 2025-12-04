import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [pulseAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    if (isRecording) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Timer
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    // In a real app, request microphone permissions here
    setIsRecording(true);
    setRecordingTime(0);
  };

  const handleStopAndSend = () => {
    if (recordingTime < 1) {
      Alert.alert('Túl rövid', 'A hangüzenetnek legalább 1 másodperc hosszúnak kell lennie!');
      return;
    }

    setIsRecording(false);
    if (onSend) {
      onSend({ duration: recordingTime });
    }
    setRecordingTime(0);
  };

  const handleCancel = () => {
    setIsRecording(false);
    setRecordingTime(0);
    if (onCancel) onCancel();
  };

  if (!isRecording) {
    return (
      <TouchableOpacity
        style={styles.micButton}
        onPress={handleStartRecording}
        onLongPress={handleStartRecording}
      >
        <Ionicons name="mic" size={24} color="#FF3B75" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.recordingContainer}>
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Ionicons name="close" size={24} color="#F44336" />
      </TouchableOpacity>

      <View style={styles.recordingInfo}>
        <Animated.View
          style={[
            styles.recordingDot,
            {
              transform: [{ scale: pulseAnimation }],
            },
          ]}
        />
        <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
        <Text style={styles.recordingText}>Felvétel...</Text>
      </View>

      <TouchableOpacity onPress={handleStopAndSend}>
        <LinearGradient
          colors={['#FF3B75', '#FF6B9D']}
          style={styles.sendButton}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 15,
    flex: 1,
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F44336',
  },
  recordingTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  recordingText: {
    fontSize: 14,
    color: '#666',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VoiceRecorder;

