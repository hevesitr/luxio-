/**
 * BlockedUsersScreen - Blokkolt felhasználók listája és kezelése
 * Követelmény: 8.3 Update UI for blocking features
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import BlockingService from '../services/BlockingService';
import Logger from '../services/Logger';

const BlockedUsersScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    blockedCount: 0,
    blockedByCount: 0,
  });

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const [blocked, statsData] = await Promise.all([
        BlockingService.getBlockedUsers(user.id),
        BlockingService.getBlockingStats(user.id),
      ]);

      setBlockedUsers(blocked);
      setStats(statsData);

      Logger.info('Blocked users loaded', {
        count: blocked.length,
        userId: user.id
      });

    } catch (error) {
      Logger.error('Failed to load blocked users', error);
      Alert.alert('Hiba', 'Nem sikerült betölteni a blokkolt felhasználókat.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBlockedUsers();
    setRefreshing(false);
  }, [loadBlockedUsers]);

  const handleUnblockUser = useCallback(async (blockedUser) => {
    Alert.alert(
      'Blokkolás feloldása',
      `Biztosan feloldod ${blockedUser.blocked_user?.first_name || 'ezt a felhasználót'} blokkolását?`,
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Feloldás',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await BlockingService.unblockUser(
                user.id,
                blockedUser.blocked_id
              );

              if (result.success) {
                // Frissítjük a listát
                await loadBlockedUsers();

                Alert.alert(
                  'Sikeres',
                  'A blokkolás fel lett oldva.'
                );

                Logger.info('User unblocked', {
                  blockerId: user.id,
                  blockedId: blockedUser.blocked_id
                });
              } else {
                throw new Error(result.error || 'Ismeretlen hiba');
              }
            } catch (error) {
              Logger.error('Failed to unblock user', error);
              Alert.alert('Hiba', 'Nem sikerült feloldani a blokkolást.');
            }
          },
        },
      ]
    );
  }, [user?.id, loadBlockedUsers]);

  const renderBlockedUser = ({ item }) => {
    const blockedUser = item.blocked_user;
    const blockedAt = new Date(item.created_at);
    const timeAgo = getTimeAgo(blockedAt);

    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          {/* Profil kép placeholder */}
          <View style={styles.avatar}>
            {blockedUser?.photos?.[0] ? (
              <Text style={styles.avatarText}>
                {blockedUser.first_name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            ) : (
              <Ionicons name="person" size={24} color="#999" />
            )}
          </View>

          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {blockedUser?.first_name || 'Ismeretlen felhasználó'}
            </Text>
            <Text style={styles.blockReason}>
              Oka: {getBlockReasonText(item.reason)}
            </Text>
            <Text style={styles.blockTime}>
              {timeAgo} blokkolva
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.unblockButton}
          onPress={() => handleUnblockUser(item)}
        >
          <Text style={styles.unblockButtonText}>Feloldás</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getBlockReasonText = (reason) => {
    const reasons = {
      harassment: 'Zaklatás',
      inappropriate_content: 'Nem megfelelő tartalom',
      spam: 'Spam',
      fake_profile: 'Hamis profil',
      other: 'Egyéb',
    };
    return reasons[reason] || 'Ismeretlen';
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} napja`;
    } else if (diffInHours > 0) {
      return `${diffInHours} órája`;
    } else {
      return 'nemrég';
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="shield-checkmark" size={64} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>Nincs blokkolt felhasználó</Text>
      <Text style={styles.emptyText}>
        Még nem blokkoltál senkit. Ha valaki zaklat vagy spam-et küld,
        használd a blokkolás funkciót a biztonságod érdekében.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Blokkolt felhasználók</Text>
      <Text style={styles.headerSubtitle}>
        {stats.blockedCount} felhasználó blokkolva • {stats.blockedByCount} felhasználó blokkolt téged
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.loadingText}>Blokkolt felhasználók betöltése...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerBarTitle}>Blokkolt felhasználók</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <FlatList
            data={blockedUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderBlockedUser}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#FFF"
                titleColor="#FFF"
                title="Frissítés..."
              />
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerBarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 16,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  blockReason: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  blockTime: {
    fontSize: 12,
    color: '#999',
  },
  unblockButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  unblockButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default BlockedUsersScreen;
