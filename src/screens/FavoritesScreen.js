import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CreditsService, { CREDIT_COSTS } from '../services/CreditsService';
import { profiles } from '../data/profiles';

const FavoritesScreen = ({ navigation }) => {
  const [credits, setCredits] = useState(100);
  const [favorites, setFavorites] = useState([]);
  const [unlockedFavorites, setUnlockedFavorites] = useState(new Set());

  useEffect(() => {
    loadData();
    generateMockFavorites();
  }, []);

  const loadData = async () => {
    const currentCredits = await CreditsService.getCredits();
    setCredits(currentCredits);
  };

  const generateMockFavorites = () => {
    // Generáljunk néhány mock kedvencet
    const mockFavorites = profiles.slice(0, 6).map((profile) => ({
      id: profile.id,
      profile: profile,
      addedAt: new Date(Date.now() - Math.random() * 7 * 24 * 3600000),
      isUnlocked: Math.random() > 0.5, // Néhány feloldva
    }));
    setFavorites(mockFavorites);
    // Kezdeti feloldott kedvencek
    const initialUnlocked = mockFavorites
      .filter(f => f.isUnlocked)
      .map(f => f.id);
    setUnlockedFavorites(new Set(initialUnlocked));
  };

  const handleUnlockFavorite = async (favorite) => {
    if (unlockedFavorites.has(favorite.id)) {
      navigation.navigate('ProfileDetail', { profile: favorite.profile });
      return;
    }

    if (credits < CREDIT_COSTS.unlockFavorite) {
      Alert.alert(
        'Nincs elég kredit!',
        `A kedvenc feloldásához ${CREDIT_COSTS.unlockFavorite} kredit szükséges.`,
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
      CREDIT_COSTS.unlockFavorite,
      'Favorite unlock'
    );

    if (result.success) {
      setCredits(result.balance);
      setUnlockedFavorites(new Set([...unlockedFavorites, favorite.id]));
      navigation.navigate('ProfileDetail', { profile: favorite.profile });
    } else {
      Alert.alert('Hiba', result.message);
    }
  };

  const handleRemoveFavorite = (favoriteId) => {
    Alert.alert(
      'Kedvenc eltávolítása',
      'Biztosan eltávolítod ezt a kedvencet?',
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Eltávolítás',
          style: 'destructive',
          onPress: () => {
            setFavorites(favorites.filter(f => f.id !== favoriteId));
            setUnlockedFavorites(prev => {
              const newSet = new Set(prev);
              newSet.delete(favoriteId);
              return newSet;
            });
          },
        },
      ]
    );
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderFavoriteItem = ({ item }) => {
    const isUnlocked = unlockedFavorites.has(item.id);

    return (
      <TouchableOpacity
        style={styles.favoriteCard}
        onPress={() => handleUnlockFavorite(item)}
      >
        <Image source={{ uri: item.profile.photo }} style={styles.favoritePhoto} />
        <View style={styles.favoriteInfo}>
          <View style={styles.favoriteHeader}>
            <Text style={styles.favoriteName}>
              {item.profile.name}, {item.profile.age}
            </Text>
            {item.profile.isVerified && (
              <Ionicons name="checkmark-circle" size={18} color="#2196F3" />
            )}
          </View>
          <Text style={styles.favoriteDistance}>
            {item.profile.distance} km távolságra
          </Text>
          <Text style={styles.favoriteDate}>
            Hozzáadva: {formatDate(item.addedAt)}
          </Text>
        </View>
        {!isUnlocked ? (
          <View style={styles.lockContainer}>
            <Ionicons name="lock-closed" size={20} color="#999" />
            <Text style={styles.lockText}>{CREDIT_COSTS.unlockFavorite}</Text>
          </View>
        ) : (
          <View style={styles.unlockedActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ProfileDetail', { profile: item.profile })}
              style={styles.actionButton}
            >
              <Ionicons name="eye" size={20} color="#2196F3" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleRemoveFavorite(item.id)}
              style={styles.actionButton}
            >
              <Ionicons name="heart-dislike" size={20} color="#F44336" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kedvencek</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Credits')} style={styles.creditsButton}>
          <Ionicons name="diamond" size={20} color="#FF3B75" />
          <Text style={styles.creditsText}>{credits}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Ionicons name="heart" size={32} color="#FF3B75" />
        <Text style={styles.summaryTitle}>Kedvencek</Text>
        <Text style={styles.summaryCount}>{favorites.length}</Text>
        <Text style={styles.summarySubtext}>
          {unlockedFavorites.size} feloldva
        </Text>
      </View>

      <FlatList
        data={favorites}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Még nincs kedvenc</Text>
            <Text style={styles.emptySubtext}>
              Amikor valakit kedvencnek jelölsz, itt jelenik meg!
            </Text>
          </View>
        }
      />

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={24} color="#2196F3" />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>Hogyan működik?</Text>
          <Text style={styles.infoText}>
            • Jelöld kedvencnek azokat, akik érdekelnek{'\n'}
            • {CREDIT_COSTS.unlockFavorite} kredit szükséges a feloldáshoz{'\n'}
            • Prémium tagok ingyenesen láthatják{'\n'}
            • Bármikor eltávolíthatod
          </Text>
        </View>
      </View>
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
  summaryCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  summaryCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF3B75',
    marginTop: 5,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  favoriteCard: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  favoritePhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  favoriteDistance: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  favoriteDate: {
    fontSize: 12,
    color: '#999',
  },
  lockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
  },
  lockText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF3B75',
  },
  unlockedActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 40,
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
});

export default FavoritesScreen;

