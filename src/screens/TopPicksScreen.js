import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TopPicksService from '../services/TopPicksService';
import PremiumService from '../services/PremiumService';
import { profiles } from '../data/profiles';
import { currentUser } from '../data/userProfile';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

const TopPicksScreen = ({ navigation }) => {
  const [topPicks, setTopPicks] = useState([]);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(0);
  const [extraPicks, setExtraPicks] = useState(0);

  useEffect(() => {
    loadTopPicks();
    const interval = setInterval(updateRefreshTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const loadTopPicks = async () => {
    // Check premium status for extra picks
    const features = await PremiumService.getFeatures();
    setExtraPicks(features.topPicksExtra);

    // Get or generate top picks
    let picks = await TopPicksService.getTodaysTopPicks();
    
    if (!picks) {
      picks = await TopPicksService.generateTopPicks(
        profiles,
        currentUser,
        features.topPicksExtra
      );
    }

    setTopPicks(picks);
    updateRefreshTime();
  };

  const updateRefreshTime = async () => {
    const time = await TopPicksService.getTimeUntilRefresh();
    setTimeUntilRefresh(time);
  };

  const handleProfilePress = (profile) => {
    // Navigate to profile detail or swipe view
    navigation.navigate('Felfedezés', { initialProfile: profile });
  };

  const renderPickCard = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleProfilePress(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.photo }} style={styles.cardImage} />
      
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
        style={styles.cardGradient}
      >
        <View style={styles.compatibilityBadge}>
          <Text style={styles.compatibilityScore}>
            {item.compatibility.score}%
          </Text>
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardAge}>{item.age}</Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={18} color="#2196F3" />
            )}
          </View>
          <Text style={styles.pickReason}>
            {TopPicksService.getPickReason(item.compatibility)}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.topPickBadge}>
        <Ionicons name="star" size={16} color="#fff" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Picks</Text>
        <TouchableOpacity onPress={loadTopPicks}>
          <Ionicons name="refresh" size={24} color="#FF3B75" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <Ionicons name="diamond" size={20} color="#FF3B75" />
          <Text style={styles.infoText}>
            {topPicks.length} választék
          </Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.infoItem}>
          <Ionicons name="time" size={20} color="#FF3B75" />
          <Text style={styles.infoText}>
            Frissül {TopPicksService.formatTimeUntilRefresh(timeUntilRefresh)} múlva
          </Text>
        </View>
      </View>

      {extraPicks > 0 && (
        <View style={styles.premiumBanner}>
          <Ionicons name="star" size={20} color="#FFD700" />
          <Text style={styles.premiumText}>
            +{extraPicks} prémium ajánlás a csomagodban
          </Text>
        </View>
      )}

      <View style={styles.descriptionContainer}>
        <Text style={styles.description}>
          Az AI által kiválasztott legjobb profilok számodra, kompatibilitás alapján
        </Text>
      </View>

      <FlatList
        data={topPicks}
        renderItem={renderPickCard}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="diamond-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>
              Nincsenek mai Top Picks-ek
            </Text>
            <Text style={styles.emptySubtext}>
              Frissíts hogy új ajánlásokat kapj!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: '#f8f8f8',
    gap: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#FFF9E6',
    gap: 8,
  },
  premiumText: {
    fontSize: 14,
    color: '#B8860B',
    fontWeight: '600',
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 12,
  },
  compatibilityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  compatibilityScore: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardInfo: {
    gap: 5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardAge: {
    fontSize: 14,
    color: '#fff',
  },
  pickReason: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  topPickBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF3B75',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 10,
  },
});

export default TopPicksScreen;

