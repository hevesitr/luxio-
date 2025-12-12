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
import withErrorBoundary from '../components/withErrorBoundary';

const ProfileViewsScreen = ({ navigation }) => {
  const [credits, setCredits] = useState(100);
  const [views, setViews] = useState([]);
  const [unlockedViews, setUnlockedViews] = useState(new Set());

  useEffect(() => {
    loadData();
    generateMockViews();
  }, []);

  const loadData = async () => {
    const currentCredits = await CreditsService.getCredits();
    setCredits(currentCredits);
  };

  const generateMockViews = () => {
    // Generáljunk néhány mock megtekintést
    const mockViews = profiles.slice(0, 8).map((profile, index) => ({
      id: profile.id,
      profile: profile,
      viewedAt: new Date(Date.now() - index * 3600000), // 1 óránként
      isUnlocked: false,
    }));
    setViews(mockViews);
  };

  const handleUnlockView = async (view) => {
    if (unlockedViews.has(view.id)) {
      // Már feloldva, navigálj a profilhoz
      navigation.navigate('ProfileDetail', { profile: view.profile });
      return;
    }

    if (credits < CREDIT_COSTS.seeProfileView) {
      Alert.alert(
        'Nincs elég kredit!',
        `A profil megtekintéséhez ${CREDIT_COSTS.seeProfileView} kredit szükséges.`,
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
      CREDIT_COSTS.seeProfileView,
      'Profile view unlock'
    );

    if (result.success) {
      setCredits(result.balance);
      setUnlockedViews(new Set([...unlockedViews, view.id]));
      navigation.navigate('ProfileDetail', { profile: view.profile });
    } else {
      Alert.alert('Hiba', result.message);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes} perce`;
    } else if (hours < 24) {
      return `${hours} órája`;
    } else {
      return `${days} napja`;
    }
  };

  const renderViewItem = ({ item }) => {
    const isUnlocked = unlockedViews.has(item.id);

    return (
      <TouchableOpacity
        style={styles.viewCard}
        onPress={() => handleUnlockView(item)}
      >
        <Image source={{ uri: item.profile.photo }} style={styles.viewPhoto} />
        <View style={styles.viewInfo}>
          <Text style={styles.viewName}>
            {item.profile.name}, {typeof item.profile.age === 'number' && !isNaN(item.profile.age) && item.profile.age > 0 ? item.profile.age : '?'}
          </Text>
          <Text style={styles.viewTime}>
            {formatTimeAgo(item.viewedAt)}
          </Text>
        </View>
        {!isUnlocked ? (
          <View style={styles.lockContainer}>
            <Ionicons name="lock-closed" size={20} color="#999" />
            <Text style={styles.lockText}>{CREDIT_COSTS.seeProfileView}</Text>
          </View>
        ) : (
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
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
        <Text style={styles.headerTitle}>Profil Megtekintések</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Credits')} style={styles.creditsButton}>
          <Ionicons name="diamond" size={20} color="#FF3B75" />
          <Text style={styles.creditsText}>{credits}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Ionicons name="eye" size={32} color="#FF3B75" />
        <Text style={styles.summaryTitle}>Összes megtekintés</Text>
        <Text style={styles.summaryCount}>{views.length}</Text>
        <Text style={styles.summarySubtext}>
          {unlockedViews.size} profil feloldva
        </Text>
      </View>

      <FlatList
        data={views}
        renderItem={renderViewItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="eye-off" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Még nincs megtekintés</Text>
            <Text style={styles.emptySubtext}>
              Amikor valaki megnézi a profilodat, itt jelenik meg!
            </Text>
          </View>
        }
      />

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={24} color="#2196F3" />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>Hogyan működik?</Text>
          <Text style={styles.infoText}>
            • Minden megtekintés itt jelenik meg{'\n'}
            • Kattints egy profilra a részletek megtekintéséhez{'\n'}
            • {CREDIT_COSTS.seeProfileView} kredit szükséges a feloldáshoz{'\n'}
            • Prémium tagok ingyenesen láthatják
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
  viewCard: {
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
  viewPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  viewInfo: {
    flex: 1,
  },
  viewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  viewTime: {
    fontSize: 13,
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

export default withErrorBoundary(ProfileViewsScreen, 'ProfileViewsScreen');

