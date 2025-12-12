import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import SwipeCard from '../components/SwipeCard';
import MatchAnimation from '../components/MatchAnimation';
import { profiles as initialProfiles } from '../data/profiles';
import { currentUser } from '../data/userProfile';
import MatchService from '../services/MatchService';
import DiscoveryService from '../services/DiscoveryService';
import CompatibilityService from '../services/CompatibilityService';
import Logger from '../services/Logger';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * HomeScreen - Teljes eredeti layout a screenshot alapján
 * 
 * Felső ikonsor (7 ikon):
 * 1. Passport - Helyszín váltás
 * 2. Verified - Hitelesített profilok
 * 3. Sparkles - Boost/Kiemelés
 * 4. Chart - Top Picks
 * 5. Search - Keresés
 * 6. Diamond - Premium
 * 7. Lightning - Boost
 * 
 * Jobb oldal:
 * - Match % - Kompatibilitás
 * - Refresh - Profil frissítés
 * - 3 pont - További opciók
 * 
 * Alsó navigáció (5 menü):
 * 1. Felfedezés (piros)
 * 2. Események
 * 3. Matchek
 * 4. Videók
 * 5. Profil
 * 
 * Alsó akció gombok (3 gomb):
 * - Bal nyíl - Pass
 * - Kör - Superlike
 * - Jobb nyíl - Like
 */

const HomeScreen = ({ navigation, onMatch }) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchAnimVisible, setMatchAnimVisible] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [compatibility, setCompatibility] = useState(null);

  const currentProfile = useMemo(() => 
    profiles[currentIndex],
    [profiles, currentIndex]
  );

  // Load profiles
  useEffect(() => {
    loadProfiles();
  }, []);

  // Calculate compatibility for current profile
  useEffect(() => {
    if (currentProfile && user) {
      const comp = CompatibilityService.calculateCompatibility(user, currentProfile);
      setCompatibility(comp);
    }
  }, [currentProfile, user]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const userId = user?.id || currentUser.id;
      const history = await MatchService.loadHistory().catch(() => []);
      const excludeIds = history.map(h => h.id);
      const loadedProfiles = await DiscoveryService.getDiscoveryProfiles({}, excludeIds);
      setProfiles(loadedProfiles);
      setLoading(false);
    } catch (error) {
      Logger.error('HomeScreen: Error loading profiles', error);
      setProfiles(initialProfiles);
      setLoading(false);
    }
  };

  const handleSwipeLeft = useCallback(async (profile) => {
    const userId = user?.id || currentUser.id;
    try {
      await MatchService.processSwipe(userId, profile.id, 'pass');
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      Logger.error('HomeScreen: Error processing pass', error);
    }
  }, [user?.id]);

  const handleSwipeRight = useCallback(async (profile) => {
    const userId = user?.id || currentUser.id;
    try {
      const result = await MatchService.processSwipe(userId, profile.id, 'like');
      
      if (result && result.success && result.isMatch) {
        setMatchedProfile(profile);
        setMatchAnimVisible(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        setTimeout(() => {
          setMatchAnimVisible(false);
          setMatchedProfile(null);
        }, 3000);
      }
      
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      Logger.error('HomeScreen: Error processing like', error);
    }
  }, [user?.id]);

  const handleSuperLike = useCallback(async (profile) => {
    const userId = user?.id || currentUser.id;
    try {
      const result = await MatchService.processSwipe(userId, profile.id, 'superlike');
      
      if (result && result.success && result.isMatch) {
        setMatchedProfile(profile);
        setMatchAnimVisible(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        setTimeout(() => {
          setMatchAnimVisible(false);
          setMatchedProfile(null);
        }, 3000);
      }
      
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      Logger.error('HomeScreen: Error processing superlike', error);
    }
  }, [user?.id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            Nincs több profil
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Felső ikonsor - 7 ikon */}
      <View style={styles.topIconBar}>
        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => navigation.navigate('Passport')}
        >
          <Ionicons name="airplane" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => Alert.alert('Verified', 'Csak hitelesített profilok')}
        >
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => navigation.navigate('Boost')}
        >
          <Ionicons name="sparkles" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => navigation.navigate('TopPicks')}
        >
          <Ionicons name="bar-chart" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => navigation.navigate('Search')}
        >
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => navigation.navigate('Premium')}
        >
          <Ionicons name="diamond" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => navigation.navigate('Boost')}
        >
          <Ionicons name="flash" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Profil kártya */}
      <View style={styles.cardContainer}>
        <SwipeCard
          key={currentProfile.id}
          profile={currentProfile}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onSuperLike={handleSuperLike}
          onProfilePress={() => navigation.navigate('ProfileDetail', { profile: currentProfile })}
        />

        {/* Match % jobb felül */}
        {compatibility && (
          <View style={styles.matchBadge}>
            <Text style={styles.matchPercent}>{compatibility.overall}%</Text>
            <Text style={styles.matchText}>Match</Text>
          </View>
        )}

        {/* Refresh és 3 pont jobb oldalt */}
        <View style={styles.rightActions}>
          <TouchableOpacity 
            style={styles.rightActionButton}
            onPress={loadProfiles}
          >
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.rightActionButton}
            onPress={() => Alert.alert('Opciók', 'További beállítások')}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Bal alsó vissza gomb */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Alsó akció gombok - 3 gomb */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={() => handleSwipeLeft(currentProfile)}
        >
          <Ionicons name="close" size={32} color="#FF4444" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.superLikeButton]}
          onPress={() => handleSuperLike(currentProfile)}
        >
          <Ionicons name="star" size={28} color="#4A90E2" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleSwipeRight(currentProfile)}
        >
          <Ionicons name="heart" size={32} color="#FF4444" />
        </TouchableOpacity>
      </View>

      {/* Alsó navigáció - 5 menü */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => {}}
        >
          <Ionicons name="flame" size={28} color="#FF4458" />
          <Text style={[styles.navText, styles.navTextActive]}>Felfedezés</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Events')}
        >
          <Ionicons name="calendar" size={28} color="#999" />
          <Text style={styles.navText}>Események</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Matches')}
        >
          <Ionicons name="heart" size={28} color="#999" />
          <Text style={styles.navText}>Matchek</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Videos')}
        >
          <Ionicons name="play-circle" size={28} color="#999" />
          <Text style={styles.navText}>Videók</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person" size={28} color="#999" />
          <Text style={styles.navText}>Profil</Text>
        </TouchableOpacity>
      </View>

      {/* Match Animation */}
      <MatchAnimation
        visible={matchAnimVisible}
        profile={matchedProfile}
        onClose={() => setMatchAnimVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
  },
  
  // Felső ikonsor
  topIconBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  // Profil kártya
  cardContainer: {
    flex: 1,
    marginTop: 60,
    marginBottom: 140,
  },

  // Match % badge
  matchBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    zIndex: 5,
  },
  matchPercent: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  matchText: {
    color: '#fff',
    fontSize: 12,
  },

  // Jobb oldali akciók
  rightActions: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    gap: 16,
    zIndex: 5,
  },
  rightActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  // Bal alsó vissza gomb
  backButton: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },

  // Alsó akció gombok
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 24,
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  passButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  superLikeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  likeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  // Alsó navigáció
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  navTextActive: {
    color: '#FF4458',
    fontWeight: '600',
  },
});

export default HomeScreen;
