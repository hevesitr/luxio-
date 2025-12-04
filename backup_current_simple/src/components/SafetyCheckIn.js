import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SafetyCheckIn = ({ visible, onClose, match }) => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  const [checkInEnabled, setCheckInEnabled] = useState(false);

  const emergencyContacts = [
    { id: 1, name: 'Anya', phone: '+36 20 123 4567', icon: '👩' },
    { id: 2, name: 'Legjobb barát', phone: '+36 30 987 6543', icon: '👤' },
    { id: 3, name: 'Testvér', phone: '+36 70 555 1234', icon: '👨' },
  ];

  const handleActivateCheckIn = () => {
    if (!selectedContact || !location || !time) {
      Alert.alert('Hiányos adatok', 'Kérlek töltsd ki az összes mezőt!');
      return;
    }

    setCheckInEnabled(true);
    Alert.alert(
      '✅ Check-in aktiválva',
      `${selectedContact.name} értesítve lesz, ha nem jelentkezel be ${time}-ig.\n\nHely: ${location}\n\nBiztonságos randizást! 💚`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Itt valódi appban SMS vagy push értesítés menne
            onClose();
          },
        },
      ]
    );
  };

  const handleCheckInNow = () => {
    Alert.alert(
      '✅ Biztonságban vagy!',
      'Értesítettük a kapcsolattartódat, hogy minden rendben!\n\nA check-in deaktiválva.',
      [{ text: 'OK', onPress: () => onClose() }]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>🛡️ Safety Check-in</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Találkozó során maradj biztonságban! Jelezz egy barátnak vagy családtagnak, hogy hol vagy és mikor kellene jelentkezned.
          </Text>

          {match && (
            <View style={styles.matchInfo}>
              <Text style={styles.matchText}>
                Találkozó: <Text style={styles.matchName}>{match.name}</Text>
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Ki kapjon értesítést?</Text>
          <View style={styles.contactsList}>
            {emergencyContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={[
                  styles.contactCard,
                  selectedContact?.id === contact.id && styles.contactCardActive,
                ]}
                onPress={() => setSelectedContact(contact)}
              >
                <Text style={styles.contactIcon}>{contact.icon}</Text>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>
                {selectedContact?.id === contact.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Hol találkoztok?</Text>
          <TextInput
            style={styles.input}
            placeholder="pl. Starbucks, Váci utca 12."
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.sectionTitle}>Mikor kell jelentkezned?</Text>
          <TextInput
            style={styles.input}
            placeholder="pl. 20:00"
            value={time}
            onChangeText={setTime}
          />

          <TouchableOpacity
            style={styles.activateButton}
            onPress={checkInEnabled ? handleCheckInNow : handleActivateCheckIn}
          >
            <LinearGradient
              colors={checkInEnabled ? ['#4CAF50', '#66BB6A'] : ['#FF3B75', '#FF6B9D']}
              style={styles.buttonGradient}
            >
              <Ionicons
                name={checkInEnabled ? 'shield-checkmark' : 'shield'}
                size={24}
                color="#fff"
              />
              <Text style={styles.buttonText}>
                {checkInEnabled ? 'Biztonságban vagyok!' : 'Check-in aktiválása'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {checkInEnabled && (
            <View style={styles.activeIndicator}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.activeText}>
                Check-in aktív • {selectedContact?.name} értesítve lesz
              </Text>
            </View>
          )}

          <Text style={styles.footer}>
            Ha nem jelentkezel be időben, automatikusan értesítjük a kiválasztott kapcsolatot.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  matchInfo: {
    backgroundColor: '#FFF0F5',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  matchText: {
    fontSize: 14,
    color: '#666',
  },
  matchName: {
    fontWeight: 'bold',
    color: '#FF3B75',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  contactsList: {
    gap: 10,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  contactCardActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  contactIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactPhone: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activateButton: {
    marginTop: 25,
    borderRadius: 15,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 15,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
  },
  activeText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  footer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 18,
  },
});

export default SafetyCheckIn;

