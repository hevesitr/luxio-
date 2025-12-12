/**
 * PauseAccountScreen - Fiók szüneteltetése és újraaktiválása
 * Követelmény: 7.5 Implement account pause functionality
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AccountService from '../services/AccountService';
import Logger from '../services/Logger';

const PauseAccountScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [isPaused, setIsPaused] = useState(false);
  const [pauseStatus, setPauseStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    messages: 0,
    matches: 0,
    swipes: 0,
    blocks: 0
  });

  // Load current pause status and stats on mount
  useEffect(() => {
    loadPauseStatus();
    loadAccountStats();
  }, []);

  const loadPauseStatus = async () => {
    if (!user?.id) return;

    try {
      const status = await AccountService.getAccountStatus(user.id);
      setIsPaused(status.isPaused);
      setPauseStatus(status.pauseStatus);
    } catch (error) {
      Logger.error('Failed to load pause status', error);
    }
  };

  const loadAccountStats = async () => {
    if (!user?.id) return;

    try {
      const accountStats = await AccountService.getAccountStatistics(user.id);
      setStats(accountStats);
    } catch (error) {
      Logger.error('Failed to load account stats', error);
    }
  };

  const handlePauseToggle = async (value) => {
    if (!user?.id) return;

    if (value) {
      // Pause account
      showPauseConfirmation();
    } else {
      // Resume account
      await handleResumeAccount();
    }
  };

  const showPauseConfirmation = () => {
    Alert.alert(
      'Fiók szüneteltetése',
      'Biztosan szüneteltetni szeretnéd a fiókodat?\n\n' +
      'Szüneteltetés közben:\n' +
      '• Nem jelensz meg a felfedezésben\n' +
      '• Nem kapsz új értesítéseket\n' +
      '• Megtartod az összes meglévő adatot\n' +
      '• Bármikor újraaktiválhatod a fiókot\n\n' +
      'Meddig szeretnéd szüneteltetni?',
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: '30 nap',
          onPress: () => handlePauseAccount(30, 'Felhasználói kérés'),
        },
        {
          text: '60 nap',
          onPress: () => handlePauseAccount(60, 'Felhasználói kérés'),
        },
        {
          text: '90 nap',
          onPress: () => handlePauseAccount(90, 'Felhasználói kérés'),
        },
      ]
    );
  };

  const handlePauseAccount = async (durationDays, reason) => {
    setLoading(true);
    try {
      const result = await AccountService.pauseAccount(user.id, reason, durationDays);

      if (result.success) {
        setIsPaused(true);
        setPauseStatus(result.pauseStatus);

        Alert.alert(
          'Fiók szüneteltetve',
          `A fiókod ${durationDays} napig szüneteltetve lesz. ` +
          `Újraaktiválás: ${result.resumeDate}`,
          [{ text: 'Rendben' }]
        );

        Logger.info('Account paused from UI', {
          userId: user.id,
          durationDays,
          resumeDate: result.resumeDate
        });
      } else {
        throw new Error(result.error || 'Ismeretlen hiba');
      }
    } catch (error) {
      Logger.error('Account pause failed', error);
      Alert.alert('Hiba', 'Nem sikerült szüneteltetni a fiókot. Próbáld újra.');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeAccount = async () => {
    setLoading(true);
    try {
      const result = await AccountService.resumeAccount(user.id);

      if (result.success) {
        setIsPaused(false);
        setPauseStatus(null);

        Alert.alert(
          'Fiók újraaktiválva',
          'A fiókod sikeresen újraaktiválva. Üdvözlünk vissza!',
          [{ text: 'Rendben' }]
        );

        Logger.info('Account resumed from UI', { userId: user.id });
      } else {
        throw new Error(result.error || 'Ismeretlen hiba');
      }
    } catch (error) {
      Logger.error('Account resume failed', error);
      Alert.alert('Hiba', 'Nem sikerült újraaktiválni a fiókot. Próbáld újra.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('hu-HU');
  };

  const getPauseStatusText = () => {
    if (!isPaused) return 'Aktív';

    if (pauseStatus?.resume_date) {
      const resumeDate = new Date(pauseStatus.resume_date);
      const now = new Date();

      if (resumeDate > now) {
        const daysLeft = Math.ceil((resumeDate - now) / (1000 * 60 * 60 * 24));
        return `${daysLeft} nap van hátra`;
      } else {
        return 'Lejárt - újra kell aktiválni';
      }
    }

    return 'Szüneteltetve';
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fiók szüneteltetése</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons
                name={isPaused ? "pause-circle" : "play-circle"}
                size={24}
                color={isPaused ? "#FF9800" : "#4CAF50"}
              />
              <Text style={styles.statusTitle}>Fiók státusz</Text>
            </View>

            <Text style={[
              styles.statusValue,
              { color: isPaused ? "#FF9800" : "#4CAF50" }
            ]}>
              {getPauseStatusText()}
            </Text>

            {pauseStatus && (
              <View style={styles.pauseDetails}>
                <Text style={styles.pauseDetailText}>
                  Szüneteltetve: {formatDate(pauseStatus.paused_at)}
                </Text>
                <Text style={styles.pauseDetailText}>
                  Újraaktiválás: {formatDate(pauseStatus.resume_date)}
                </Text>
                {pauseStatus.pause_reason && (
                  <Text style={styles.pauseDetailText}>
                    Ok: {pauseStatus.pause_reason}
                  </Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.controlCard}>
            <View style={styles.controlHeader}>
              <Text style={styles.controlTitle}>Szüneteltetés be/ki</Text>
              {loading && <ActivityIndicator size="small" color="#FFF" />}
            </View>

            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>
                {isPaused ? 'Fiók szüneteltetve' : 'Fiók aktív'}
              </Text>
              <Switch
                value={isPaused}
                onValueChange={handlePauseToggle}
                disabled={loading}
                trackColor={{ false: '#ccc', true: '#FF9800' }}
                thumbColor="#FFF"
              />
            </View>

            <Text style={styles.controlDescription}>
              {isPaused
                ? 'Kapcsold ki a szüneteltetést az azonnali újraaktiváláshoz.'
                : 'Kapcsold be a szüneteltetést, hogy ideiglenesen eltűnj a felfedezésből.'
              }
            </Text>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Fiók statisztikák</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="chatbubbles" size={20} color="#FF6B6B" />
                <Text style={styles.statValue}>{stats.messages}</Text>
                <Text style={styles.statLabel}>Üzenetek</Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="heart" size={20} color="#FF6B6B" />
                <Text style={styles.statValue}>{stats.matches}</Text>
                <Text style={styles.statLabel}>Matchek</Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="hand-left" size={20} color="#FF6B6B" />
                <Text style={styles.statValue}>{stats.swipes}</Text>
                <Text style={styles.statLabel}>Swipe-ok</Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="shield" size={20} color="#FF6B6B" />
                <Text style={styles.statValue}>{stats.blocks}</Text>
                <Text style={styles.statLabel}>Blokkok</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Szüneteltetésről</Text>
              <Text style={styles.infoText}>
                A szüneteltetés ideiglenes megoldás, ha pihenni szeretnél az app-tól.
                Az összes adatot megőrizzük, és bármikor folytathatod ahol abbahagytad.
              </Text>
            </View>
          </View>
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#FFF',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  pauseDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  pauseDetailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  controlCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  controlTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 16,
    color: '#333',
  },
  controlDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#F0F8FF',
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default PauseAccountScreen;
