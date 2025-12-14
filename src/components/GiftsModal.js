import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const GIFTS = [
  {
    id: 1,
    name: 'Rózsa',
    emoji: '🌹',
    price: 50,
    color: '#FF69B4',
    description: 'Klasszikus választás'
  },
  {
    id: 2,
    name: 'Szív',
    emoji: '💖',
    price: 75,
    color: '#FF1493',
    description: 'Szeretet kifejezése'
  },
  {
    id: 3,
    name: 'Csokoládé',
    emoji: '🍫',
    price: 100,
    color: '#8B4513',
    description: 'Édes meglepetés'
  },
  {
    id: 4,
    name: 'Kávé',
    emoji: '☕',
    price: 120,
    color: '#8B4513',
    description: 'Reggeli energia'
  },
  {
    id: 5,
    name: 'Bor',
    emoji: '🍷',
    price: 150,
    color: '#8B0000',
    description: 'Romantikus este'
  },
  {
    id: 6,
    name: 'Pizza',
    emoji: '🍕',
    price: 200,
    color: '#FF4500',
    description: 'Közös étkezés'
  },
  {
    id: 7,
    name: 'Jegesmedve',
    emoji: '🐻‍❄️',
    price: 250,
    color: '#87CEEB',
    description: 'Aranyos meglepetés'
  },
  {
    id: 8,
    name: 'Unicorn',
    emoji: '🦄',
    price: 300,
    color: '#FF69B4',
    description: 'Varázslatos ajándék'
  },
  {
    id: 9,
    name: 'Luxus autó',
    emoji: '🚗',
    price: 500,
    color: '#FFD700',
    description: 'Prémium ajándék'
  },
  {
    id: 10,
    name: 'Repülő',
    emoji: '✈️',
    price: 750,
    color: '#4169E1',
    description: 'Utazási álom'
  },
  {
    id: 11,
    name: 'Villa',
    emoji: '🏰',
    price: 1000,
    color: '#DAA520',
    description: 'Királyi ajándék'
  },
  {
    id: 12,
    name: 'Luxus Yacht',
    emoji: '🛥️',
    price: 1500,
    color: '#000080',
    description: 'Legfelső osztály'
  }
];

const GiftsModal = ({ visible, onClose, onSendGift, targetUser, userCoins = 500 }) => {
  const [selectedGift, setSelectedGift] = useState(null);

  const handleSendGift = () => {
    if (selectedGift && userCoins >= selectedGift.price) {
      onSendGift(selectedGift);
      setSelectedGift(null);
      onClose();
    }
  };

  const canAfford = (gift) => userCoins >= gift.price;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Ajándék küldése</Text>
              {targetUser && (
                <Text style={styles.headerSubtitle}>
                  Küldj egy ajándékot {targetUser.name}-nak!
                </Text>
              )}
            </View>
            <View style={styles.coinsContainer}>
              <Ionicons name="diamond" size={16} color="#FFD700" />
              <Text style={styles.coinsText}>{userCoins}</Text>
            </View>
          </View>

          {/* Gifts Grid */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.giftsGrid}>
              {GIFTS.map((gift) => (
                <TouchableOpacity
                  key={gift.id}
                  style={[
                    styles.giftItem,
                    selectedGift?.id === gift.id && styles.giftItemSelected,
                    !canAfford(gift) && styles.giftItemDisabled
                  ]}
                  onPress={() => canAfford(gift) && setSelectedGift(gift)}
                  disabled={!canAfford(gift)}
                >
                  <View style={[styles.giftEmojiContainer, { backgroundColor: gift.color + '20' }]}>
                    <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                  </View>
                  <Text style={styles.giftName}>{gift.name}</Text>
                  <View style={styles.giftPriceContainer}>
                    <Ionicons name="diamond" size={12} color="#FFD700" />
                    <Text style={[styles.giftPrice, !canAfford(gift) && styles.giftPriceDisabled]}>
                      {gift.price}
                    </Text>
                  </View>
                  <Text style={styles.giftDescription}>{gift.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Selected Gift Preview */}
          {selectedGift && (
            <View style={styles.selectedGiftPreview}>
              <View style={styles.previewContent}>
                <Text style={styles.previewEmoji}>{selectedGift.emoji}</Text>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewName}>{selectedGift.name}</Text>
                  <Text style={styles.previewDescription}>{selectedGift.description}</Text>
                  <View style={styles.previewPrice}>
                    <Ionicons name="diamond" size= {14} color="#FFD700" />
                    <Text style={styles.previewPriceText}>{selectedGift.price} coin</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            {selectedGift ? (
              <TouchableOpacity
                style={[styles.sendButton, !canAfford(selectedGift) && styles.sendButtonDisabled]}
                onPress={handleSendGift}
                disabled={!canAfford(selectedGift)}
              >
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.sendButtonText}>
                  Küldés ({selectedGift.price} coin)
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.selectGiftText}>
                Válassz ki egy ajándékot!
              </Text>
            )}
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
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
    minHeight: height * 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#00D4FF',
    fontSize: 14,
    marginTop: 4,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  coinsText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  giftsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  giftItem: {
    width: (width - 60) / 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  giftItemSelected: {
    borderColor: '#00D4FF',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
  },
  giftItemDisabled: {
    opacity: 0.5,
  },
  giftEmojiContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  giftEmoji: {
    fontSize: 24,
  },
  giftName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  giftPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  giftPrice: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 2,
  },
  giftPriceDisabled: {
    color: '#666',
  },
  giftDescription: {
    color: '#ccc',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
  },
  selectedGiftPreview: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    borderWidth: 1,
    borderColor: '#00D4FF',
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  previewPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewPriceText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D4FF',
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
  sendButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  selectGiftText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default GiftsModal;
