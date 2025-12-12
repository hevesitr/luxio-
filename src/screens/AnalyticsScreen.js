import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AnalyticsService from '../services/AnalyticsService';
import { useTheme } from '../context/ThemeContext';

const AnalyticsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  
  // Fallback theme protection
  const safeTheme = theme || {
    colors: {
      background: '#0a0a0a',
      surface: '#1a1a1a',
      text: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      primary: '#FF3B75',
      border: 'rgba(255, 255, 255, 0.1)',
    }
  };
  
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // Inicializáljuk a statisztikákat, ha hiányoznak mezők
    const initializedStats = await AnalyticsService.initializeStats();
    const calculatedMetrics = AnalyticsService.calculateMetrics(initializedStats);
    const generatedInsights = AnalyticsService.getInsights(initializedStats, calculatedMetrics);
    
    setStats(initializedStats);
    setMetrics(calculatedMetrics);
    setInsights(generatedInsights);
  };

  const handleReset = () => {
    Alert.alert(
      'Statisztikák törlése',
      'Biztosan törölni szeretnéd az összes statisztikát?',
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Törlés',
          style: 'destructive',
          onPress: async () => {
            await AnalyticsService.resetStats();
            loadStats();
            Alert.alert('✅ Törölve', 'Statisztikák sikeresen törölve!');
          },
        },
      ]
    );
  };

  const styles = createStyles(safeTheme);

  if (!stats || !metrics) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.text }}>Betöltés...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statisztikák</Text>
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <Ionicons name="refresh" size={24} color="#FF3B75" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Főbb statisztikák */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Összesítés</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FF3B75', '#FF6B9D']}
                style={styles.statGradient}
              >
                <Ionicons name="flame" size={32} color="#fff" />
                <Text style={styles.statValue}>{stats.totalSwipes}</Text>
                <Text style={styles.statLabel}>Összes Swipe</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['#4CAF50', '#8BC34A']}
                style={styles.statGradient}
              >
                <Ionicons name="heart" size={32} color={theme.colors.text} />
                <Text style={styles.statValue}>{stats.matches}</Text>
                <Text style={styles.statLabel}>Match</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['#2196F3', '#64B5F6']}
                style={styles.statGradient}
              >
                <Ionicons name="chatbubble" size={32} color={theme.colors.text} />
                <Text style={styles.statValue}>{stats.messagesSent}</Text>
                <Text style={styles.statLabel}>Üzenet</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FFC107', '#FFD54F']}
                style={styles.statGradient}
              >
                <Ionicons name="star" size={32} color={theme.colors.text} />
                <Text style={styles.statValue}>{stats.superLikes}</Text>
                <Text style={styles.statLabel}>Super Like</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Részletes metrikák */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Részletes Adatok</Text>
          
          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="thumbs-up" size={20} color="#4CAF50" />
              <Text style={styles.metricLabel}>Jobbra swipe arány</Text>
            </View>
            <Text style={styles.metricValue}>{metrics.rightSwipeRate}%</Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="heart-circle" size={20} color="#FF3B75" />
              <Text style={styles.metricLabel}>Match arány</Text>
            </View>
            <Text style={styles.metricValue}>{metrics.matchRate}%</Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="chatbox" size={20} color="#2196F3" />
              <Text style={styles.metricLabel}>Átlag üzenet / match</Text>
            </View>
            <Text style={styles.metricValue}>{metrics.avgMessagesPerMatch}</Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="filter" size={20} color="#9C27B0" />
              <Text style={styles.metricLabel}>Szelektivitás</Text>
            </View>
            <Text style={styles.metricValue}>{metrics.selectivityScore}%</Text>
          </View>
        </View>

        {/* Insights */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights</Text>
            {insights.map((insight, index) => (
              <View key={index} style={styles.insightCard}>
                <Text style={styles.insightIcon}>{insight.icon}</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDescription}>{insight.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Swipe breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Swipe Eloszlás</Text>
          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownValue}>{stats.rightSwipes}</Text>
              <View style={[styles.breakdownBar, { flex: stats.rightSwipes, backgroundColor: '#4CAF50' }]} />
              <Text style={styles.breakdownLabel}>❤️ Like</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownValue}>{stats.leftSwipes}</Text>
              <View style={[styles.breakdownBar, { flex: stats.leftSwipes, backgroundColor: '#F44336' }]} />
              <Text style={styles.breakdownLabel}>❌ Pass</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownValue}>{stats.superLikes}</Text>
              <View style={[styles.breakdownBar, { flex: Math.max(stats.superLikes, 1), backgroundColor: '#2196F3' }]} />
              <Text style={styles.breakdownLabel}>⭐ Super</Text>
            </View>
          </View>
        </View>

        {/* Részletes metrikák bővítés */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Részletes Metrikák</Text>
          
          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="eye" size={20} color="#9C27B0" />
              <Text style={styles.metricLabel}>Profil megtekintések</Text>
            </View>
            <Text style={styles.metricValue}>{stats.profileViews || 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="heart" size={20} color="#E91E63" />
              <Text style={styles.metricLabel}>Kapott like-ok</Text>
            </View>
            <Text style={styles.metricValue}>{stats.likesReceived || 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="chatbubbles" size={20} color="#00BCD4" />
              <Text style={styles.metricLabel}>Aktív beszélgetések</Text>
            </View>
            <Text style={styles.metricValue}>{stats.activeConversations || 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="time" size={20} color="#FF9800" />
              <Text style={styles.metricLabel}>Átlagos válaszidő</Text>
            </View>
            <Text style={styles.metricValue}>{stats.avgResponseTime || 'N/A'}</Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="trending-up" size={20} color="#4CAF50" />
              <Text style={styles.metricLabel}>Match növekedés (7 nap)</Text>
            </View>
            <Text style={styles.metricValue}>
              {stats.matchGrowth7d > 0 ? '+' : ''}{stats.matchGrowth7d || 0}%
            </Text>
          </View>
        </View>

        {/* Időbeli aktivitás */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aktivitás (7 nap)</Text>
          
          <View style={styles.activityContainer}>
            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
              const dayStats = stats.dailyActivity?.[day] || { swipes: 0, matches: 0 };
              const maxSwipes = Math.max(...(stats.dailyActivity?.map(d => d.swipes) || [1]), 1);
              const height = (dayStats.swipes / maxSwipes) * 100;
              
              return (
                <View key={day} style={styles.activityDay}>
                  <View style={styles.activityBarContainer}>
                    <View 
                      style={[
                        styles.activityBar, 
                        { height: `${Math.max(height, 10)}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.activityDayLabel}>
                    {['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'][day]}
                  </Text>
                  <Text style={styles.activityValue}>{dayStats.swipes}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Üzenet típusok */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Üzenet Típusok</Text>
          
          <View style={styles.messageTypeRow}>
            <View style={styles.messageTypeItem}>
              <Ionicons name="chatbubble" size={24} color="#2196F3" />
              <Text style={styles.messageTypeValue}>{stats.textMessages || 0}</Text>
              <Text style={styles.messageTypeLabel}>Szöveg</Text>
            </View>
            <View style={styles.messageTypeItem}>
              <Ionicons name="mic" size={24} color="#FF3B75" />
              <Text style={styles.messageTypeValue}>{stats.voiceMessages || 0}</Text>
              <Text style={styles.messageTypeLabel}>Hang</Text>
            </View>
            <View style={styles.messageTypeItem}>
              <Ionicons name="videocam" size={24} color="#9C27B0" />
              <Text style={styles.messageTypeValue}>{stats.videoMessages || 0}</Text>
              <Text style={styles.messageTypeLabel}>Videó</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Utolsó frissítés: {new Date(stats.lastReset).toLocaleDateString('hu-HU')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 50,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  resetButton: {
    padding: 5,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginTop: 12,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 15,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  statGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 5,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricLabel: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 15,
    marginBottom: 10,
    gap: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  insightIcon: {
    fontSize: 32,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  breakdownContainer: {
    gap: 15,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    width: 40,
  },
  breakdownBar: {
    height: 20,
    borderRadius: 10,
    minWidth: 20,
  },
  breakdownLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  activityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    marginTop: 10,
  },
  activityDay: {
    alignItems: 'center',
    flex: 1,
  },
  activityBarContainer: {
    width: 30,
    height: 100,
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  activityBar: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    minHeight: 10,
  },
  activityDayLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  activityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  messageTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  messageTypeItem: {
    alignItems: 'center',
    gap: 8,
  },
  messageTypeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  messageTypeLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

export default AnalyticsScreen;

