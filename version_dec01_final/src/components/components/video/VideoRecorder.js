/**
 * VideoRecorder Component
 * In-app video recording with camera
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Logger from '../../services/Logger';

const VideoRecorder = ({ maxDuration = 30, onRecordComplete, onCancel }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [facing, setFacing] = useState('front');
  
  const cameraRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    requestPermissions();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const { status: audioStatus } = await Camera.requestMicrophonePermissionsAsync();
      
      setHasPermission(status === 'granted' && audioStatus === 'granted');
      
      if (status !== 'granted' || audioStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera and microphone permissions are required to record videos.',
          [{ text: 'OK', onPress: onCancel }]
        );
      }
    } catch (error) {
      Logger.error('Failed to request permissions', error);
      setHasPermission(false);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          
          // Auto-stop at max duration
          if (newTime >= maxDuration) {
            stopRecording();
          }
          
          return newTime;
        });
      }, 1000);

      // Start recording
      const video = await cameraRef.current.recordAsync({
        maxDuration: maxDuration,
        quality: Camera.Constants.VideoQuality['720p'],
      });

      Logger.debug('Recording completed', { uri: video.uri });
      
      if (onRecordComplete) {
        onRecordComplete(video.uri);
      }
    } catch (error) {
      Logger.error('Recording failed', error);
      Alert.alert('Error', 'Recording failed. Please try again.');
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;

    try {
      await cameraRef.current.stopRecording();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (error) {
      Logger.error('Failed to stop recording', error);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={onCancel}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="video"
      >
        {/* Timer */}
        <View style={styles.timerContainer}>
          <View style={[styles.timerBadge, isRecording && styles.recording]}>
            {isRecording && <View style={styles.recordingDot} />}
            <Text style={styles.timerText}>
              {formatTime(recordingTime)} / {formatTime(maxDuration)}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Cancel button */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onCancel}
            disabled={isRecording}
          >
            <Ionicons 
              name="close" 
              size={32} 
              color={isRecording ? '#666' : '#fff'} 
            />
          </TouchableOpacity>

          {/* Record button */}
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <View style={[styles.recordButtonInner, isRecording && styles.recordButtonInnerActive]} />
          </TouchableOpacity>

          {/* Flip camera button */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleCameraFacing}
            disabled={isRecording}
          >
            <Ionicons 
              name="camera-reverse" 
              size={32} 
              color={isRecording ? '#666' : '#fff'} 
            />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  message: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#fff',
    fontSize: 16,
  },
  timerContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recording: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  timerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  recordButtonActive: {
    borderColor: '#dc2626',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dc2626',
  },
  recordButtonInnerActive: {
    borderRadius: 8,
    width: 30,
    height: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VideoRecorder;
