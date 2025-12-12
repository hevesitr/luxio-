/**
 * Location Permission Modal
 * Helymeghatározás engedélyezési dialógus
 * December 2, 2025 verzió szerint
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const LocationPermissionModal = ({ visible, onClose, onPermissionGranted }) => {
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        onPermissionGranted(location);
        onClose();
      } else {
        alert('Helymeghatározás engedély megtagadva');
        onClose();
      }
    } catch (error) {
      console.error('Location permission error:', error);
      alert('Hiba történt a helymeghatározás során');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Pin ikon */}
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={48} color="#FF4458" />
          </View>

          {/* Cím */}
          <Text style={styles.title}>
            📍 Helymeghatározás engedélyezése
          </Text>

          {/* Leírás */}
          <Text style={styles.description}>
            Szeretnéd megosztani a hozzávetőleges pozíciódat (1 km sugarú körben)?
          </Text>

          {/* Adatvédelmi megjegyzés */}
          <Text style={styles.privacyNote}>
            A pontos koordinátáid soha nem lesznek elérhetőek, csak egy 1 km-es kör jelenik meg a térképen adatvédelmi okokból.
          </Text>

          {/* Gombok */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>MÉGSE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.allowButton]}
              onPress={requestLocationPermission}
            >
              <Text style={styles.allowButtonText}>ENGEDÉLYEZEM</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  privacyNote: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  allowButton: {
    backgroundColor: '#FF4458',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  allowButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LocationPermissionModal;
