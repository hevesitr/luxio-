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
import AISearchModal from '../components/discovery/AISearchModal';
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

const HomeScreen = ({ navigation, onMatch, matches = [] }) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeLoading, setSwipeLoading] = useState(false);
  const [matchAnimVisible, setMatchAnimVisible] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [compatibility, setCompatibility] = useState(null);
  const [aiSearchModalVisible, setAiSearchModalVisible] = useState(false);

  const currentProfile = useMemo(() => 
    profiles[currentIndex],
    [profiles, currentIndex]
  );

  // Load profiles
  useEffect(() => {
    console.log('HomeScreen: useEffect triggered, calling loadProfiles');
    loadProfiles();
    
    // Timeout fallback - ha 5 másodperc után még mindig loading, használjuk az initialProfiles-t
    const timeout = setTimeout(() => {
      console.log('HomeScreen: Timeout reached, using initialProfiles');
      if (loading) {
        setProfiles(initialProfiles);
        setLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, []);

  // Calculate compatibility for current profile
  useEffect(() => {
    if (currentProfile && user) {
      const comp = CompatibilityService.calculateCompatibility(user, currentProfile);
      setCompatibility(comp);
    }
  }, [currentProfile, user]);

  const loadProfiles = async () => {
    console.log('HomeScreen: loadProfiles started');
    try {
      setLoading(true);

      // ✅ SECURITY FIX: Only use authenticated user ID
      if (!user?.id) {
        console.warn('HomeScreen: No authenticated user, skipping profile load');
        setProfiles([]);
        setLoading(false);
        return;
      }

      const userId = user.id;
      console.log('HomeScreen: Loading profiles for user:', userId);

      const history = await MatchService.loadHistory(userId).catch(() => []);
      console.log('HomeScreen: history loaded:', history.length);

      const excludeIds = history.map(h => h.id);
      console.log('HomeScreen: excludeIds:', excludeIds);

      const loadedProfiles = await DiscoveryService.getDiscoveryProfiles(
        { userId },
        excludeIds
      );
      console.log('HomeScreen: profiles loaded:', loadedProfiles.length);

      setProfiles(loadedProfiles);
      setLoading(false);
    } catch (error) {
      console.error('HomeScreen: Error loading profiles:', error);
      Logger.error('HomeScreen: Error loading profiles', error);

      // ✅ UX IMPROVEMENT: Show user-friendly error message
      Alert.alert(
        'Hiba a profilok betöltésekor',
        'Nem sikerült betölteni a felfedezésre váró profilokat. Ellenőrizd az internetkapcsolatod.',
        [
          { text: 'Újra próbálkozás', onPress: loadProfiles },
          { text: 'Rendben', style: 'cancel' }
        ]
      );

      // Fallback to empty array instead of mock data for security
      setProfiles([]);
      setLoading(false);
    }
  };

  const handleSwipeLeft = useCallback(async (profile) => {
    if (!user?.id) {
      Alert.alert('Hiba', 'Nem vagy bejelentkezve. Jelentkezz be a folytatáshoz.');
      return;
    }

    if (swipeLoading) return; // Prevent multiple simultaneous swipes

    setSwipeLoading(true);
    try {
      const result = await MatchService.processSwipe(user.id, profile.id, 'pass');

      if (result?.success) {
        setCurrentIndex(prev => prev + 1);
      } else {
        Alert.alert('Hiba', 'Nem sikerült feldolgozni a pass műveletet. Próbáld újra.');
      }
    } catch (error) {
      Logger.error('HomeScreen: Error processing pass', error);

      // ✅ UX IMPROVEMENT: User-friendly error message
      const errorMessage = error.message?.includes('rate_limit')
        ? 'Túl sok műveletet hajtottál végre. Próbáld újra később.'
        : 'Nem sikerült feldolgozni a pass műveletet. Ellenőrizd az internetkapcsolatod.';

      Alert.alert('Hiba', errorMessage);
    } finally {
      setSwipeLoading(false);
    }
  }, [user?.id, swipeLoading]);

  const handleSwipeRight = useCallback(async (profile) => {
    if (!user?.id) {
      Alert.alert('Hiba', 'Nem vagy bejelentkezve. Jelentkezz be a folytatáshoz.');
      return;
    }

    if (swipeLoading) return; // Prevent multiple simultaneous swipes

    setSwipeLoading(true);
    try {
      const result = await MatchService.processSwipe(user.id, profile.id, 'like');

      if (result?.success) {
        // Check for match
        if (result.isMatch) {
          // Add match to matches list
          if (onMatch) {
            console.log('HomeScreen: Match found with profile:', profile.name);
            onMatch({
              ...profile,
              matchedAt: new Date().toISOString(),
            });
          }

          setMatchedProfile(profile);
          setMatchAnimVisible(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Auto-hide match animation after 3 seconds
          setTimeout(() => {
            setMatchAnimVisible(false);
            setMatchedProfile(null);
          }, 3000);
        }

        setCurrentIndex(prev => prev + 1);
      } else {
        Alert.alert('Hiba', 'Nem sikerült feldolgozni a like műveletet. Próbáld újra.');
      }
    } catch (error) {
      Logger.error('HomeScreen: Error processing like', error);

      // ✅ UX IMPROVEMENT: User-friendly error messages
      const errorMessage = error.message?.includes('rate_limit')
        ? 'Túl sok like-ot küldtél. Próbáld újra később.'
        : error.message?.includes('already_liked')
        ? 'Már like-oltad ezt a profilt.'
        : 'Nem sikerült feldolgozni a like műveletet. Ellenőrizd az internetkapcsolatod.';

      Alert.alert('Hiba', errorMessage);
    } finally {
      setSwipeLoading(false);
    }
  }, [user?.id, onMatch, swipeLoading]);

  const handleSuperLike = useCallback(async (profile) => {
    if (!user?.id) {
      Alert.alert('Hiba', 'Nem vagy bejelentkezve. Jelentkezz be a folytatáshoz.');
      return;
    }

    if (swipeLoading) return; // Prevent multiple simultaneous swipes

    setSwipeLoading(true);
    try {
      const result = await MatchService.processSwipe(user.id, profile.id, 'superlike');

      if (result?.success) {
        // Check for match
        if (result.isMatch) {
          // Add match to matches list
          if (onMatch) {
            console.log('HomeScreen: Super match found with profile:', profile.name);
            onMatch({
              ...profile,
              matchedAt: new Date().toISOString(),
            });
          }

          setMatchedProfile(profile);
          setMatchAnimVisible(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Auto-hide match animation after 3 seconds
          setTimeout(() => {
            setMatchAnimVisible(false);
            setMatchedProfile(null);
          }, 3000);
        }

        setCurrentIndex(prev => prev + 1);
      } else {
        Alert.alert('Hiba', 'Nem sikerült feldolgozni a super like műveletet. Próbáld újra.');
      }
    } catch (error) {
      Logger.error('HomeScreen: Error processing superlike', error);

      // ✅ UX IMPROVEMENT: User-friendly error messages
      const errorMessage = error.message?.includes('rate_limit')
        ? 'Túl sok super like-ot küldtél. Próbáld újra később.'
        : error.message?.includes('premium_required')
        ? 'Super like használatához prémium előfizetés szükséges.'
        : 'Nem sikerült feldolgozni a super like műveletet. Ellenőrizd az internetkapcsolatod.';

      Alert.alert('Hiba', errorMessage);
    } finally {
      setSwipeLoading(false);
    }
  }, [user?.id, onMatch, swipeLoading]);

  const handleAISearch = useCallback(async (searchQuery) => {
    try {
      console.log('HomeScreen: AI Search started with query:', searchQuery);
      Logger.info('HomeScreen: AI Search query', { query: searchQuery });
      
      // Close the modal
      setAiSearchModalVisible(false);
      
      // Filter profiles based on search query
      const query = searchQuery.toLowerCase();
      console.log('HomeScreen: Filtering profiles with query:', query);
      
      const filtered = initialProfiles.filter(profile => {
        if (!profile) return false;
        
        // Search in name
        if (profile.name && profile.name.toLowerCase().includes(query)) return true;
        
        // Search in bio
        if (profile.bio && profile.bio.toLowerCase().includes(query)) return true;
        
        // Search in interests
        if (profile.interests && Array.isArray(profile.interests)) {
          if (profile.interests.some(interest => interest.toLowerCase().includes(query))) return true;
        }
        
        // Search in work
        if (profile.work) {
          if (profile.work.company && profile.work.company.toLowerCase().includes(query)) return true;
          if (profile.work.title && profile.work.title.toLowerCase().includes(query)) return true;
        }
        
        // Search in education
        if (profile.education) {
          if (profile.education.school && profile.education.school.toLowerCase().includes(query)) return true;
          if (profile.education.degree && profile.education.degree.toLowerCase().includes(query)) return true;
        }
        
        // Search in relationshipGoal with Hungarian translations
        if (profile.relationshipGoal) {
          const goal = profile.relationshipGoal.toLowerCase();
          if (goal.includes(query)) return true;
          // Hungarian translations
          if (query === 'laza' && goal === 'casual') return true;
          if (query === 'komoly' && goal === 'serious') return true;
          if (query === 'barátság' && goal === 'friendship') return true;
        }
        
        // Search in zodiac sign
        if (profile.zodiacSign && profile.zodiacSign.toLowerCase().includes(query)) return true;
        
        // Search in MBTI
        if (profile.mbti && profile.mbti.toLowerCase().includes(query)) return true;
        
        return false;
      });
      
      console.log('HomeScreen: Filtered profiles count:', filtered.length);
      
      if (filtered.length > 0) {
        setProfiles(filtered);
        setCurrentIndex(0);
        Alert.alert(
          '✨ AI Keresés',
          `${filtered.length} profil találat "${searchQuery}" keresésre`,
          [{ text: 'Rendben' }]
        );
      } else {
        Alert.alert(
          '🔍 Nincs találat',
          `Nem találtunk profilt "${searchQuery}" keresésre.\n\nPróbálj más kulcsszavakat!`,
          [
            { 
              text: 'Vissza az összes profilhoz', 
              onPress: () => {
                setProfiles(initialProfiles);
                setCurrentIndex(0);
              }
            },
            { text: 'Új keresés', onPress: () => setAiSearchModalVisible(true) }
          ]
        );
      }
    } catch (error) {
      console.error('HomeScreen: AI Search error:', error);
      Logger.error('HomeScreen: Error processing AI search', error);
      Alert.alert('Hiba', 'Nem sikerült a keresés: ' + error.message);
    }
  }, []);

  const handleTopIconPress = useCallback((iconName) => {
    console.log('HomeScreen: Top icon pressed:', iconName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch(iconName) {
      case 'passport':
        if (navigation) {
          navigation.navigate('Profil', { screen: 'Map' });
        }
        break;
      case 'verified':
        Alert.alert('Hitelesített Profilok', 'Csak hitelesített felhasználók megjelenítése');
        break;
      case 'sparkles':
        setAiSearchModalVisible(true);
        break;
      case 'chart':
        if (navigation) {
          navigation.navigate('Profil', { screen: 'TopPicks' });
        }
        break;
      case 'search':
        if (navigation) {
          navigation.navigate('Profil', { screen: 'Search' });
        }
        break;
      case 'diamond':
        if (navigation) {
          navigation.navigate('Profil', { screen: 'Premium' });
        }
        break;
      case 'lightning':
        if (navigation) {
          navigation.navigate('Profil', { screen: 'Boost' });
        }
        break;
      default:
        console.log('Unknown icon:', iconName);
    }
  }, [navigation]);

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
      <View style={styles.topIconBar} pointerEvents="box-none">
        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => handleTopIconPress('passport')}
          activeOpacity={0.7}
        >
          <Ionicons name="airplane" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => handleTopIconPress('verified')}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => handleTopIconPress('sparkles')}
          activeOpacity={0.7}
        >
          <Ionicons name="sparkles" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => handleTopIconPress('chart')}
          activeOpacity={0.7}
        >
          <Ionicons name="bar-chart" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => handleTopIconPress('search')}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => handleTopIconPress('diamond')}
          activeOpacity={0.7}
        >
          <Ionicons name="diamond" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => handleTopIconPress('lightning')}
          activeOpacity={0.7}
        >
          <Ionicons name="flash" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Profil kártya */}
      <View style={styles.cardContainer} pointerEvents="box-none">
        <SwipeCard
          key={currentProfile.id}
          profile={currentProfile}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onSuperLike={handleSuperLike}
          onProfilePress={() => {
            console.log('HomeScreen: Opening profile detail');
            if (navigation) {
              navigation.navigate('Profil', { 
                screen: 'ProfileDetail', 
                params: { profile: currentProfile } 
              });
            }
          }}
          isFirst={true}
          userProfile={user || currentUser}
        />

        {/* Jobb oldali akciók */}
        <View style={styles.rightActions} pointerEvents="box-none">
          <TouchableOpacity 
            style={styles.rightActionButton}
            onPress={() => {
              console.log('HomeScreen: Refresh pressed');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              loadProfiles();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.rightActionButton}
            onPress={() => {
              console.log('HomeScreen: Options pressed');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Opciók', 'További beállítások');
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Bal alsó vissza gomb */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            console.log('HomeScreen: Back pressed');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentIndex(prev => Math.max(0, prev - 1));
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Alsó akció gombok - 3 gomb */}
      <View style={styles.actionButtons} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={() => {
            console.log('HomeScreen: Pass button pressed');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleSwipeLeft(currentProfile);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={32} color="#FF4444" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.superLikeButton]}
          onPress={() => {
            console.log('HomeScreen: Super Like button pressed');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            handleSuperLike(currentProfile);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="star" size={28} color="#4A90E2" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => {
            console.log('HomeScreen: Like button pressed');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleSwipeRight(currentProfile);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={32} color="#FF4444" />
        </TouchableOpacity>
      </View>

      {/* Match Animation */}
      <MatchAnimation
        visible={matchAnimVisible}
        profile={matchedProfile}
        onClose={() => setMatchAnimVisible(false)}
        onSendMessage={(profile) => {
          console.log('HomeScreen: onSendMessage called with profile:', profile?.name);
          setMatchAnimVisible(false);
          navigation.navigate('Matchek', {
            screen: 'Chat',
            params: { match: profile }
          });
        }}
        navigation={navigation}
        allMatches={matches}
      />

      {/* AI Search Modal */}
      <AISearchModal
        theme={theme}
        visible={aiSearchModalVisible}
        onClose={() => setAiSearchModalVisible(false)}
        onSearch={handleAISearch}
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
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  topIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Profil kártya
  cardContainer: {
    flex: 1,
    marginTop: 60,
    marginBottom: 140,
    justifyContent: 'center',
    alignItems: 'center',
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
    zIndex: 50,
  },
  rightActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },

  // Bal alsó vissza gomb
  backButton: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Alsó akció gombok
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 24,
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    zIndex: 50,
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
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
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
});

export default HomeScreen;
