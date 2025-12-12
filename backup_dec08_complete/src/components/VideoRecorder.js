import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { Camera } from 'expo-camera'; // Demo mode - no camera needed
import { LinearGradient } from 'expo-linear-gradient';

const VideoRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef = useRef(null);
  const recordingRef = useRef(null);
  const timerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    requestCameraPermission();
    
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
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

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    // Demo mode - simulate permission granted
    // In real app: const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(true);
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

      // Start recording (mock - in real app would use Camera.recordAsync)
      // For demo, we'll simulate it
      recordingRef.current = {
        uri: 'mock-video-uri',
        duration: 0,
      };
    } catch (error) {
      Alert.alert('Hiba', 'Nem sikerült elindítani a felvételt.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    // Update recording duration
    if (recordingRef.current) {
      recordingRef.current.duration = recordingTime;
    }
  };

  const handleSend = () => {
    if (recordingTime < 1) {
      Alert.alert('Túl rövid', 'A videó minimum 1 másodperc kell legyen!');
      return;
    }

    const videoData = {
      uri: recordingRef.current?.uri || 'mock-video-uri',
      duration: recordingTime,
      thumbnailUri: null, // In real app, generate thumbnail
    };

    onSend(videoData);
    stopRecording();
  };

  const handleCancel = () => {
    stopRecording();
    onCancel();
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Kamera engedély kérése...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Kamera engedély szükséges!</Text>
        <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Engedélyezés</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isRecording ? (
        <View style={styles.recordingContainer}>
          <View style={styles.timerContainer}>
            <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.timerText}>{recordingTime}s</Text>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
              <View style={styles.stopButtonInner}>
                <Ionicons name="stop" size={24} color="#fff" />
              </View>
              <Text style={styles.stopText}>Leállítás</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Ionicons name="close-circle" size={32} color="#F44336" />
              <Text style={styles.cancelText}>Mégse</Text>
            </TouchableOpacity>
            {recordingTime > 0 && (
              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <LinearGradient
                  colors={['#FF3B75', '#FF6B9D']}
                  style={styles.sendGradient}
                >
                  <Ionicons name="send" size={24} color="#fff" />
                  <Text style={styles.sendText}>Küldés</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
          <LinearGradient
            colors={['#FF3B75', '#FF6B9D']}
            style={styles.recordGradient}
          >
            <Ionicons name="videocam" size={32} color="#fff" />
            <Text style={styles.recordText}>Videó felvétele</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#FF3B75',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  recordingContainer: {
    alignItems: 'center',
    gap: 15,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F44336',
  },
  timerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
  },
  cancelButton: {
    alignItems: 'center',
    gap: 4,
  },
  stopButton: {
    alignItems: 'center',
    gap: 4,
  },
  stopButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: '600',
  },
  sendButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  sendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  sendText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  recordGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  recordText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VideoRecorder;

