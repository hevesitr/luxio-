import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import CreditsService, { CREDIT_COSTS } from '../services/CreditsService';

const VideoChatScreen = ({ navigation, route }) => {
  const { profile } = route.params || {};
  const [credits, setCredits] = useState(100);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const callTimerRef = useRef(null);

  useEffect(() => {
    loadCredits();
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, []);

  const loadCredits = async () => {
    const currentCredits = await CreditsService.getCredits();
    setCredits(currentCredits);
  };

  const startCall = async () => {
    if (credits < CREDIT_COSTS.videoCall) {
      Alert.alert(
        'Nincs elég kredit!',
        `Videó híváshoz ${CREDIT_COSTS.videoCall} kredit szükséges.`,
        [
          { text: 'Mégse', style: 'cancel' },
          {
            text: 'Kreditek vásárlása',
            onPress: () => navigation.navigate('Credits'),
          },
        ]
      );
      return;
    }

    const result = await CreditsService.deductCredits(
      CREDIT_COSTS.videoCall,
      'Video call'
    );

    if (result.success) {
      setCredits(result.balance);
      setIsCallActive(true);
      startCallTimer();
    } else {
      Alert.alert('Hiba', result.message);
    }
  };

  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const endCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    setIsCallActive(false);
    setCallDuration(0);
    Alert.alert('Hívás befejezve', `Hívás időtartama: ${formatDuration(callDuration)}`);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Videó Hívás</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-off" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nincs kiválasztott profil</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Videó Hívás</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Credits')} style={styles.creditsButton}>
          <Ionicons name="diamond" size={20} color="#FF3B75" />
          <Text style={styles.creditsText}>{credits}</Text>
        </TouchableOpacity>
      </View>

      {!isCallActive ? (
        <View style={styles.preCallContainer}>
          <View style={styles.profileCard}>
            <Image source={{ uri: profile.photo }} style={styles.profilePhoto} />
            <Text style={styles.profileName}>{profile.name}, {profile.age}</Text>
            <Text style={styles.profileSubtext}>
              Készülj fel a videó híváshoz!
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color="#2196F3" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Videó hívás információ</Text>
              <Text style={styles.infoText}>
                • {CREDIT_COSTS.videoCall} kredit szükséges{'\n'}
                • Korlátlan időtartam{'\n'}
                • Hang és videó egyaránt{'\n'}
                • Bármikor megszakítható
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.callButton} onPress={startCall}>
            <Ionicons name="videocam" size={32} color="#fff" />
            <Text style={styles.callButtonText}>Hívás indítása</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.callContainer}>
          {/* Másik fél videó */}
          <View style={styles.remoteVideo}>
            {isVideoOff ? (
              <View style={styles.videoPlaceholder}>
                <Image source={{ uri: profile.photo }} style={styles.placeholderImage} />
                <Text style={styles.placeholderText}>{profile.name}</Text>
              </View>
            ) : (
              <View style={styles.videoPlaceholder}>
                <Image source={{ uri: profile.photo }} style={styles.videoImage} />
              </View>
            )}
          </View>

          {/* Saját videó (kis ablak) */}
          <View style={styles.localVideo}>
            {isVideoOff ? (
              <View style={styles.localVideoPlaceholder}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
            ) : (
              <View style={styles.localVideoContent}>
                <Text style={styles.localVideoText}>Te</Text>
              </View>
            )}
          </View>

          {/* Hívás időtartama */}
          <View style={styles.callDurationContainer}>
            <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
          </View>

          {/* Kontroll gombok */}
          <View style={styles.callControls}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={() => setIsMuted(!isMuted)}
            >
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.endCallButton]}
              onPress={endCall}
            >
              <Ionicons name="call" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
              onPress={() => setIsVideoOff(!isVideoOff)}
            >
              <Ionicons
                name={isVideoOff ? 'videocam-off' : 'videocam'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  creditsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B7520',
    borderRadius: 20,
  },
  creditsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B75',
  },
  placeholder: {
    width: 34,
  },
  preCallContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileSubtext: {
    fontSize: 14,
    color: '#666',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
  },
  callButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 18,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  callButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  callContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.5,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  localVideo: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  localVideoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoContent: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  callDurationContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  callDuration: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  callControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#F44336',
  },
  endCallButton: {
    backgroundColor: '#F44336',
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
  },
});

export default VideoChatScreen;

