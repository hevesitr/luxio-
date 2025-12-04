import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GamificationService from '../services/GamificationService';
import { useTheme } from '../context/ThemeContext';

const GamificationScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [streak, setStreak] = useState({ days: 0, lastDate: null });
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState({
    totalMatches: 0,
    totalMessages: 0,
    totalLikes: 0,
    profileViews: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentStreak = await GamificationService.getCurrentStreak();
    const userBadges = await GamificationService.getBadges();
    const userStats = await GamificationService.getStats();
    
    setStreak(currentStreak);
    setBadges(userBadges);
    setStats(userStats);
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gamifikáció</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Streak Section */}
        <View style={styles.section}>
          <View style={styles.streakCard}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryLight]}
              style={styles.streakGradient}
            >
              <Ionicons name="flame" size={60} color={theme.colors.text} />
              <Text style={styles.streakNumber}>{streak.days}</Text>
              <Text style={styles.streakLabel}>Napos Streak</Text>
              <Text style={styles.streakSubtext}>
                {streak.days > 0 
                  ? `Folytasd a sorozatot! 🔥` 
                  : `Kezdj el aktív lenni!`}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.streakInfo}>
            <View style={styles.streakInfoItem}>
              <Ionicons name="trophy" size={24} color={theme.colors.warning} />
              <Text style={styles.streakInfoText}>
                {streak.days >= 7 ? '✅' : '⏳'} 7 nap = Badge
              </Text>
            </View>
            <View style={styles.streakInfoItem}>
              <Ionicons name="trophy" size={24} color={theme.colors.warning} />
              <Text style={styles.streakInfoText}>
                {streak.days >= 30 ? '✅' : '⏳'} 30 nap = Badge
              </Text>
            </View>
            <View style={styles.streakInfoItem}>
              <Ionicons name="trophy" size={24} color={theme.colors.warning} />
              <Text style={styles.streakInfoText}>
                {streak.days >= 100 ? '✅' : '⏳'} 100 nap = Badge
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statisztikák</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="heart" size={32} color={theme.colors.primary} />
              <Text style={styles.statNumber}>{stats.totalMatches}</Text>
              <Text style={styles.statLabel}>Match</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="chatbubble" size={32} color={theme.colors.info} />
              <Text style={styles.statNumber}>{stats.totalMessages}</Text>
              <Text style={styles.statLabel}>Üzenet</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="thumbs-up" size={32} color={theme.colors.success} />
              <Text style={styles.statNumber}>{stats.totalLikes}</Text>
              <Text style={styles.statLabel}>Like</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="eye" size={32} color={theme.colors.purple} />
              <Text style={styles.statNumber}>{stats.profileViews}</Text>
              <Text style={styles.statLabel}>Nézet</Text>
            </View>
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kitűzők</Text>
            <Text style={styles.badgeCount}>{badges.length} / 12</Text>
          </View>

          {badges.length === 0 ? (
            <View style={styles.emptyBadges}>
              <Ionicons name="trophy-outline" size={60} color={theme.colors.textTertiary} />
              <Text style={styles.emptyText}>Még nincs kitűződ</Text>
              <Text style={styles.emptySubtext}>
                Használd az alkalmazást aktívan, hogy kitűzőket szerezz!
              </Text>
            </View>
          ) : (
            <View style={styles.badgesGrid}>
              {badges.map((badge) => (
                <View key={badge.id} style={styles.badgeCard}>
                  <View style={styles.badgeIconContainer}>
                    <Ionicons name={badge.icon} size={40} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  <Text style={styles.badgeDescription}>{badge.description}</Text>
                  <Text style={styles.badgeDate}>
                    {new Date(badge.earnedAt).toLocaleDateString('hu-HU')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Available Badges Preview */}
          <View style={styles.availableBadges}>
            <Text style={styles.availableTitle}>Elérhető kitűzők</Text>
            <View style={styles.availableList}>
              <View style={styles.availableItem}>
                <Ionicons name="flame-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.availableText}>7 napos streak</Text>
              </View>
              <View style={styles.availableItem}>
                <Ionicons name="heart-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.availableText}>10 match</Text>
              </View>
              <View style={styles.availableItem}>
                <Ionicons name="chatbubble-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.availableText}>100 üzenet</Text>
              </View>
              <View style={styles.availableItem}>
                <Ionicons name="thumbs-up-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.availableText}>50 like</Text>
              </View>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  streakCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  streakGradient: {
    padding: 30,
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 10,
  },
  streakLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 5,
  },
  streakSubtext: {
    fontSize: 14,
    color: theme.colors.text,
    opacity: 0.9,
    marginTop: 10,
  },
  streakInfo: {
    gap: 12,
  },
  streakInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  streakInfoText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 15,
    letterSpacing: -0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  badgeCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  emptyBadges: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  badgeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  badgeDate: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    marginTop: 8,
  },
  availableBadges: {
    marginTop: 20,
    padding: 15,
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  availableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  availableList: {
    gap: 8,
  },
  availableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  availableText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});

export default GamificationScreen;

