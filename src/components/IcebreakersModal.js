import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const ICEBREAKERS = [
  {
    id: 1,
    question: "Mi lenne a tökéletes napod?",
    category: "Életstílus"
  },
  {
    id: 2,
    question: "Milyen könyv változtatta meg az életed?",
    category: "Kultúra"
  },
  {
    id: 3,
    question: "Mi lenne a szupererőd, ha választhatnál?",
    category: "Szórakozás"
  },
  {
    id: 4,
    question: "Hol nőttél fel és mi volt a kedvenc helyed?",
    category: "Emlékek"
  },
  {
    id: 5,
    question: "Mi lenne az álomutazásod?",
    category: "Utazás"
  },
  {
    id: 6,
    question: "Milyen zene nélkül nem tudnál élni?",
    category: "Zene"
  },
  {
    id: 7,
    question: "Mi lenne a kedvenc filmed címe és miért?",
    category: "Film"
  },
  {
    id: 8,
    question: "Mit ennél meg utoljára vacsorára?",
    category: "Étel"
  },
  {
    id: 9,
    question: "Milyen hobbid van, amit kevesen tudnak?",
    category: "Hobbi"
  },
  {
    id: 10,
    question: "Ha nyernél 1 millió forintot, mire költenéd?",
    category: "Álmok"
  },
  {
    id: 11,
    question: "Mi volt életed legviccesebb pillanata?",
    category: "Emlékek"
  },
  {
    id: 12,
    question: "Milyen sportot űznél, ha profi lennél?",
    category: "Sport"
  },
  {
    id: 13,
    question: "Mi lenne az ideális munkád?",
    category: "Karrier"
  },
  {
    id: 14,
    question: "Milyen állat lennél és miért?",
    category: "Szórakozás"
  },
  {
    id: 15,
    question: "Mi volt a legjobb ajándék, amit valaha kaptál?",
    category: "Emlékek"
  }
];

const IcebreakersModal = ({ visible, onClose, onSelectIcebreaker, targetUser }) => {
  const [selectedCategory, setSelectedCategory] = useState('Összes');

  const categories = ['Összes', ...new Set(ICEBREAKERS.map(item => item.category))];

  const filteredIcebreakers = selectedCategory === 'Összes'
    ? ICEBREAKERS
    : ICEBREAKERS.filter(item => item.category === selectedCategory);

  const handleSelect = (icebreaker) => {
    onSelectIcebreaker(icebreaker);
    onClose();
  };

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
              <Text style={styles.headerTitle}>Jégtörő kérdések</Text>
              {targetUser && (
                <Text style={styles.headerSubtitle}>
                  Küldj egy kérdést {targetUser.name}-nak!
                </Text>
              )}
            </View>
          </View>

          {/* Category Filter */}
          <View style={styles.categoryContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.categoryButtonActive
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.categoryButtonTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Icebreakers List */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {filteredIcebreakers.map((icebreaker) => (
              <TouchableOpacity
                key={icebreaker.id}
                style={styles.icebreakerItem}
                onPress={() => handleSelect(icebreaker)}
              >
                <View style={styles.icebreakerContent}>
                  <Text style={styles.icebreakerQuestion}>
                    "{icebreaker.question}"
                  </Text>
                  <View style={styles.icebreakerMeta}>
                    <Text style={styles.icebreakerCategory}>
                      {icebreaker.category}
                    </Text>
                    <Ionicons name="send" size={16} color="#00D4FF" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              💡 Tip: A jó kérdés segíthet megtörni a jeget és mélyebb beszélgetést indítani!
            </Text>
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
    maxHeight: height * 0.8,
    minHeight: height * 0.6,
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
  categoryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#00D4FF',
  },
  categoryButtonText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  icebreakerItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  icebreakerContent: {
    padding: 16,
  },
  icebreakerQuestion: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 8,
  },
  icebreakerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  icebreakerCategory: {
    color: '#00D4FF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default IcebreakersModal;
