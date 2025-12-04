import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CreditsService, { CREDIT_COSTS } from '../services/CreditsService';
import { profiles } from '../data/profiles';

const GiftsScreen = ({ navigation, route }) => {
  const { profile } = route.params || {};
  const [credits, setCredits] = useState(100);
  const [selectedGift, setSelectedGift] = useState(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [sentGifts, setSentGifts] = useState([]);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    const currentCredits = await CreditsService.getCredits();
    setCredits(currentCredits);
  };

  const gifts = [
    { id: 1, name: 'Rózsa', emoji: '🌹', price: 10, color: '#FF3B75' },
    { id: 2, name: 'Csokoládé', emoji: '🍫', price: 10, color: '#8B4513' },
    { id: 3, name: 'Kávé', emoji: '☕', price: 10, color: '#6F4E37' },
    { id: 4, name: 'Sör', emoji: '🍺', price: 10, color: '#FFD700' },
    { id: 5, name: 'Szívecske', emoji: '💝', price: 15, color: '#FF69B4' },
    { id: 6, name: 'Csillag', emoji: '⭐', price: 15, color: '#FFD700' },
    { id: 7, name: 'Doboz', emoji: '🎁', price: 20, color: '#FF6B6B' },
    { id: 8, name: 'Gyémánt', emoji: '💎', price: 30, color: '#00CED1' },
    { id: 9, name: 'Király', emoji: '👑', price: 50, color: '#FFD700' },
    { id: 10, name: 'Rakéta', emoji: '🚀', price: 50, color: '#4169E1' },
  ];

  const handleSendGift = async (gift) => {
    if (!profile) {
      Alert.alert(
        'Profil szükséges',
        'Kérlek válassz egy profilt az ajándék küldéséhez!',
        [{ text: 'OK' }]
      );
      return;
    }

    if (credits < gift.price) {
      Alert.alert(
        'Nincs elég kredit!',
        `Ehhez a ajándékhoz ${gift.price} kredit szükséges. Jelenleg ${credits} kreditjeid vannak.`,
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

    const result = await CreditsService.deductCredits(gift.price, `Gift: ${gift.name}`);
    
    if (result.success) {
      setCredits(result.balance);
      setSelectedGift(gift);
      setShowGiftModal(true);
      setSentGifts([...sentGifts, { ...gift, profileId: profile?.id, timestamp: new Date() }]);
      
      setTimeout(() => {
        setShowGiftModal(false);
        if (profile) {
          Alert.alert(
            '✅ Ajándék elküldve!',
            `${gift.emoji} ${gift.name} ajándékot küldtél ${profile.name}nak!`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            '✅ Ajándék elküldve!',
            `${gift.emoji} ${gift.name} ajándékot küldtél!`,
            [{ text: 'OK' }]
          );
        }
      }, 2000);
    } else {
      Alert.alert('Hiba', result.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajándékok</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Credits')} style={styles.creditsButton}>
          <Ionicons name="diamond" size={20} color="#FF3B75" />
          <Text style={styles.creditsText}>{credits}</Text>
        </TouchableOpacity>
      </View>

      {profile ? (
        <View style={styles.profileCard}>
          <Image source={{ uri: profile.photo }} style={styles.profilePhoto} />
          <Text style={styles.profileName}>{profile.name}, {profile.age}</Text>
          <Text style={styles.profileSubtext}>Küldj neki egy ajándékot! 💝</Text>
        </View>
      ) : (
        <View style={styles.profileCard}>
          <Ionicons name="gift" size={48} color="#FF3B75" />
          <Text style={styles.profileName}>Ajándékok</Text>
          <Text style={styles.profileSubtext}>
            Válassz egy profilt, hogy ajándékot küldhess neki!
          </Text>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Válassz ajándékot</Text>
          <Text style={styles.sectionSubtitle}>
            Ajándékokkal kifejezheted érdeklődésedet és növelheted az esélyeidet!
          </Text>
        </View>

        <View style={styles.giftsGrid}>
          {gifts.map((gift) => (
            <TouchableOpacity
              key={gift.id}
              style={[
                styles.giftCard,
                credits < gift.price && styles.giftCardDisabled,
              ]}
              onPress={() => handleSendGift(gift)}
              disabled={credits < gift.price}
            >
              <View style={[styles.giftEmojiContainer, { backgroundColor: gift.color + '20' }]}>
                <Text style={styles.giftEmoji}>{gift.emoji}</Text>
              </View>
              <Text style={styles.giftName}>{gift.name}</Text>
              <View style={styles.giftPriceContainer}>
                <Ionicons name="diamond" size={14} color="#FF3B75" />
                <Text style={styles.giftPrice}>{gift.price}</Text>
              </View>
              {credits < gift.price && (
                <View style={styles.lockedOverlay}>
                  <Ionicons name="lock-closed" size={16} color="#999" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Miért érdemes ajándékot küldeni?</Text>
            <Text style={styles.infoText}>
              • Növeli az esélyeidet a match-re{'\n'}
              • Kiemelkedik a profilod{'\n'}
              • Mutatja, hogy komolyan gondolod{'\n'}
              • Megnyitja a beszélgetést
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showGiftModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGiftModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>{selectedGift?.emoji}</Text>
            <Text style={styles.modalTitle}>Ajándék elküldve!</Text>
            <Text style={styles.modalSubtitle}>
              {selectedGift?.name} ajándékot küldtél {profile?.name || 'felhasználónak'}!
            </Text>
            <View style={styles.modalAnimation}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
  profileCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileSubtext: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 15,
    paddingTop: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  giftsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    gap: 12,
    marginBottom: 20,
  },
  giftCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  giftCardDisabled: {
    opacity: 0.5,
  },
  giftEmojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  giftEmoji: {
    fontSize: 32,
  },
  giftName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  giftPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  giftPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF3B75',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    marginHorizontal: 15,
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '80%',
  },
  modalEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalAnimation: {
    marginTop: 10,
  },
});

export default GiftsScreen;

