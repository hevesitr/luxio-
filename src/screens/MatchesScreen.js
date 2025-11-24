import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedAvatar from '../components/AnimatedAvatar';
import ChatScreen from './ChatScreen';
import { currentUser } from '../data/userProfile';
import MatchService from '../services/MatchService';

const SETTINGS_KEY = '@user_settings';

const MatchesScreen = ({ matches, navigation, removeMatch }) => {
  const { theme } = useTheme();
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showOnMap, setShowOnMap] = useState(true);
  const [lastMessages, setLastMessages] = useState({});

  useEffect(() => {
    loadShowOnMapSetting();
    loadLastMessages();
  }, []);

  const loadLastMessages = async () => {
    try {
      const stored = await MatchService.loadLastMessages();
      setLastMessages(stored || {});
    } catch (error) {
      console.error('MatchesScreen: Error loading last messages:', error);
    }
  };

  const handleLastMessageUpdate = async (matchId, message) => {
    try {
      const updated = await MatchService.updateLastMessage(matchId, message);
      setLastMessages(updated);
    } catch (error) {
      console.error('MatchesScreen: Error updating last message:', error);
    }
  };

  const loadShowOnMapSetting = async () => {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        const settings = JSON.parse(data);
        setShowOnMap(settings.showOnMap !== undefined ? settings.showOnMap : true);
      } else {
        // Ha nincs beállítás, használjuk a currentUser értékét
        setShowOnMap(currentUser.showOnMap !== false);
      }
    } catch (error) {
      console.error('Error loading showOnMap setting:', error);
      setShowOnMap(currentUser.showOnMap !== false);
    }
  };

  const handleShowOnMap = (match) => {
    if (!showOnMap) {
      Alert.alert(
        '⚠️ Térkép láthatóság',
        'A térképen való megjelenítés nincs engedélyezve. Engedélyezd a beállításokban a "Megjelenés a térképen" opciót, hogy láthasd a matcheket a térképen.',
        [
          { text: 'Mégse', style: 'cancel' },
          {
            text: 'Beállítások',
            onPress: () => {
              if (navigation) {
                // Navigáljunk a Profil fülre, majd a Beállításokra
                const parent = navigation.getParent();
                if (parent) {
                  parent.navigate('Profil');
                  setTimeout(() => {
                    navigation.navigate('Settings');
                  }, 300);
                }
              }
            },
          },
        ]
      );
      return;
    }

    // Navigáljunk a térképre - a Map screen a ProfileStack-ben van
    // Átadjuk a match profil ID-ját, hogy közvetlenül azt mutassa
    if (navigation) {
      try {
        // Get the root navigator (TabNavigator)
        const rootNavigator = navigation.getParent() || navigation;
        
        // Navigate to Profile tab, then to Map screen in ProfileStack
        // Pass the match profile ID as parameter
        rootNavigator.navigate('Profil', {
          screen: 'Map',
          params: {
            selectedProfileId: match?.id,
            selectedProfile: match,
            showOnlySelectedProfile: true,
          },
        });
      } catch (error) {
        console.error('MatchesScreen: Error navigating to Map:', error);
        // Fallback: navigate to Profile tab first, then Map
        try {
          const rootNavigator = navigation.getParent() || navigation;
          rootNavigator.navigate('Profil');
          // Wait a bit for the ProfileStack to be ready
          setTimeout(() => {
            try {
              rootNavigator.navigate('Profil', {
                screen: 'Map',
                params: {
                  selectedProfileId: match?.id,
                  selectedProfile: match,
                  showOnlySelectedProfile: true,
                },
              });
            } catch (err) {
              console.error('MatchesScreen: Error in fallback navigation:', err);
              Alert.alert('Hiba', 'Nem sikerült megnyitni a térképet. Kérlek próbáld újra.');
            }
          }, 500);
        } catch (fallbackError) {
          console.error('MatchesScreen: Fallback navigation error:', fallbackError);
          Alert.alert('Hiba', 'Nem sikerült megnyitni a térképet.');
        }
      }
    } else {
      console.error('MatchesScreen: No navigation available');
      Alert.alert('Hiba', 'Navigációs hiba történt.');
    }
  };

  const openChat = (match) => {
    setSelectedMatch(match);
    setChatVisible(true);
  };

  const closeChat = () => {
    setChatVisible(false);
    setSelectedMatch(null);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const sortedMatches = useMemo(() => {
    if (!Array.isArray(matches)) return [];
    return [...matches].sort((a, b) => {
      const timeA = lastMessages[a.id]?.timestamp || a.matchedAt || 0;
      const timeB = lastMessages[b.id]?.timestamp || b.matchedAt || 0;
      return new Date(timeB) - new Date(timeA);
    });
  }, [matches, lastMessages]);

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffMinutes < 1) return 'Az imént';
    if (diffMinutes < 60) return `${diffMinutes} p`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} ó`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} nap`;
  };

  const handleDeleteMatch = (match) => {
    Alert.alert(
      'Match törlése',
      `Biztosan törölni szeretnéd a match-et ${match.name}-val?`,
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Törlés',
          style: 'destructive',
          onPress: () => {
            if (removeMatch) {
              removeMatch(match.id);
              Alert.alert('✅ Sikeres', 'A match törölve lett.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllMatches = () => {
    if (matches.length === 0) {
      Alert.alert('ℹ️', 'Nincs törölhető match.');
      return;
    }

    Alert.alert(
      'Összes match törlése',
      `Biztosan törölni szeretnéd az összes (${matches.length}) match-et? Ez a művelet nem vonható vissza!`,
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Törlés',
          style: 'destructive',
          onPress: () => {
            if (removeMatch) {
              // Töröljük az összes match-et egyenként
              // A removeMatch aszinkron, de a state update miatt mindegyik lefut
              const matchIds = matches.map(match => match.id);
              matchIds.forEach(matchId => {
                removeMatch(matchId);
              });
              // Kis késleltetés után mutassuk a sikeres üzenetet
              setTimeout(() => {
                Alert.alert('✅ Sikeres', `Az összes match (${matches.length}) törölve lett.`);
              }, 100);
            }
          },
        },
      ]
    );
  };

  const renderMatch = ({ item }) => {
    const lastMessage = lastMessages[item.id];
    const previewText = lastMessage?.text || 'Kezdj el beszélgetni...';
    const previewTime = formatLastMessageTime(lastMessage?.timestamp || item.matchedAt);

    return (
      <View style={styles.matchCard}>
        <TouchableOpacity
          style={styles.matchCardContent}
          onPress={() => openChat(item)}
          activeOpacity={0.7}
        >
          <AnimatedAvatar
            source={{ uri: item.photo }}
            size={70}
            online={Math.random() > 0.5}
          />
          <View style={styles.matchInfo}>
            <View style={styles.matchHeaderRow}>
              <Text style={styles.matchName}>{item.name}</Text>
              {previewTime ? <Text style={styles.previewTime}>{previewTime}</Text> : null}
            </View>
            <Text style={styles.matchAge}>{item.age} éves</Text>
            <View style={styles.messagePreview}>
              <Ionicons name="chatbubble-outline" size={14} color={theme.colors.textTertiary} />
              <Text style={styles.lastMessage} numberOfLines={1}>
                {previewText}
              </Text>
            </View>
          </View>
          <View style={styles.matchBadge}>
            <Ionicons name="heart" size={18} color="#4CAF50" />
          </View>
        </TouchableOpacity>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => handleShowOnMap(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="map" size={20} color={showOnMap ? "#4CAF50" : theme.colors.textSecondary} />
            <Text style={[styles.mapButtonText, !showOnMap && styles.mapButtonTextDisabled]}>
              Térkép
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteMatch(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.error || "#FF3B30"} />
            <Text style={styles.deleteButtonText}>Törlés</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {matches.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={80} color={theme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>Még nincs matched</Text>
          <Text style={styles.emptyText}>
            Kezdj el swipe-olni és találd meg a tökéletes párt!
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>
                  {matches.length} Match
                </Text>
                <Text style={styles.headerSubtitle}>
                  Gratulálunk! Kezdj el beszélgetni velük!
                </Text>
              </View>
              {matches.length > 0 && (
                <TouchableOpacity
                  style={styles.deleteAllButton}
                  onPress={handleDeleteAllMatches}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.colors.error || "#FF3B30"} />
                  <Text style={styles.deleteAllButtonText}>Összes törlése</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <FlatList
            data={sortedMatches}
            renderItem={renderMatch}
            keyExtractor={(item, index) => `match-${item.id}-${item.matchedAt || index}`}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          />
        </>
      )}

      <Modal
        visible={chatVisible}
        animationType="slide"
        onRequestClose={closeChat}
      >
        {selectedMatch && (
          <ChatScreen
            match={selectedMatch}
            onClose={closeChat}
            onUpdateLastMessage={(message) => handleLastMessageUpdate(selectedMatch?.id, message)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.error + '15' || 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: theme.colors.error || '#FF3B30',
  },
  deleteAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.error || '#FF3B30',
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  listContainer: {
    padding: 12,
  },
  matchCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  matchCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  matchInfo: {
    flex: 1,
    marginLeft: 16,
  },
  matchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  matchName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  matchAge: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.textTertiary,
  },
  matchBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(76, 175, 80, 0.4)',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  mapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    gap: 6,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  mapButtonTextDisabled: {
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.error || '#FF3B30',
  },
});

export default MatchesScreen;

