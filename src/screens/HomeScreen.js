import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Text,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import SwipeCard from '../components/SwipeCard';
import MatchAnimation from '../components/MatchAnimation';
import ChatScreen from './ChatScreen';
import VideoProfile from '../components/VideoProfile';
import StoryCircle from '../components/StoryCircle';
import StoryViewer from '../components/StoryViewer';
import ProfileDetailScreen from './ProfileDetailScreen';
import AISearchModal from '../components/discovery/AISearchModal';
import { profiles as initialProfiles } from '../data/profiles';
import { currentUser } from '../data/userProfile';
import { supabase } from '../services/supabaseClient';
import MatchService from '../services/MatchService';
import DiscoveryService from '../services/DiscoveryService';
import CompatibilityService from '../services/CompatibilityService';
import StoryService from '../services/StoryService';
import AIRecommendationService from '../services/AIRecommendationService';
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

// Global theme safety function
const getSafeTheme = (theme) => {
  if (!theme || !theme.colors) {
    console.log('Using global theme safety fallback');
    return {
      colors: {
        primary: '#00D4FF',
        text: '#00D4FF',
        success: '#00FF88',
        error: '#FF0080',
        info: '#06B6D4',
        background: '#0F0F23',
        surface: '#1A1A2E',
        border: '#475569',
        gradient: ['#00D4FF', '#8B5CF6']
      }
    };
  }
  return theme;
};

const HomeScreen = ({ navigation, onMatch, matches = [] }) => {
  const { user } = useAuth();

  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeLoading, setSwipeLoading] = useState(false);
  const [matchAnimVisible, setMatchAnimVisible] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [compatibility, setCompatibility] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatProfile, setChatProfile] = useState(null);
  const [returnToMatchPopup, setReturnToMatchPopup] = useState(false);

  // Felfedezés oldal megjelenítési beállítások
  const [discoverySettings, setDiscoverySettings] = useState({
    showTopButtons: true,        // Felső gombok (verifikáció, AI, térkép)
    showStories: true,          // Stories container
    showTopIcons: true,         // Felső ikonsor (7 ikon)
    showRightActions: true,     // Jobb oldali akciók
    showBackButton: true,       // Bal alsó vissza gomb
    showActionButtons: true,    // Alsó akció gombok (pass/superlike/like)
    showBottomNav: true         // Alsó navigációs sáv
  });
  const [videoProfileVisible, setVideoProfileVisible] = useState(false);
  const [videoProfile, setVideoProfile] = useState(null);
  const [stories, setStories] = useState([]);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [storyViewerIndex, setStoryViewerIndex] = useState(0);
  const [storiesVisible, setStoriesVisible] = useState(true);
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [searchFilters, setSearchFilters] = useState(null);
  const [aiModeEnabled, setAiModeEnabled] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [sugarDatingMode, setSugarDatingMode] = useState(false);
  const [sugarDatingIntroShown, setSugarDatingIntroShown] = useState(false);
  const [profileDetailVisible, setProfileDetailVisible] = useState(false);
  const [detailProfile, setDetailProfile] = useState(null);
  const [aiSearchModalVisible, setAiSearchModalVisible] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  const currentProfile = useMemo(() => 
    profiles[currentIndex],
    [profiles, currentIndex]
  );

  // Betöltjük a felfedezés oldal beállításait
  const loadDiscoverySettings = useCallback(async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('discoverySettings');
      if (savedSettings) {
        setDiscoverySettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.warn('Failed to load discovery settings:', error);
    }
  }, []);

  // Betöltjük a beállításokat komponens mount és fókusz esetén
  useEffect(() => {
    loadDiscoverySettings();
  }, [loadDiscoverySettings]);

  // Frissítjük a beállításokat minden alkalommal, amikor a képernyő fókuszba kerül
  useFocusEffect(
    useCallback(() => {
      loadDiscoverySettings();
    }, [loadDiscoverySettings])
  );

  // Load profiles
  useEffect(() => {
    console.log('HomeScreen: useEffect triggered, calling loadProfiles');
    loadProfiles();
  }, []);

  // Calculate compatibility for current profile
  useEffect(() => {
    if (currentProfile && user) {
      const comp = CompatibilityService.calculateCompatibility(user, currentProfile);
      setCompatibility(comp);
    }
  }, [currentProfile, user]);

  // Load stories on component mount
  useEffect(() => {
    const loadStories = async () => {
      try {
        const testStories = await StoryService.generateTestStories(initialProfiles);

        // Transform stories for display
        const storiesWithProfile = testStories.map(userStory => {
          const profile = initialProfiles.find(p => p.id === userStory.userId);
          return {
            ...profile,
            stories: userStory.stories.map(story => ({
              ...story,
              timeAgo: StoryService.getTimeAgo(story.createdAt),
            })),
          };
        });

        setStories(storiesWithProfile);
      } catch (error) {
        console.error('HomeScreen: Error loading stories:', error);
      }
    };

    loadStories();
  }, []);

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

      // Check if we're in demo mode (no Supabase connection)
      const isDemoMode = __DEV__ && (!supabase || typeof supabase.from !== 'function' || !supabase.from('profiles').select);

      if (isDemoMode) {
        console.log('HomeScreen: Demo mode detected, using mock profiles');
        // Use DiscoveryService mock profiles instead of initialProfiles
        const mockProfiles = await DiscoveryService.getDiscoveryProfiles(
          { userId },
          []
        );
        console.log('HomeScreen: mock profiles loaded:', mockProfiles.length);
        setProfiles(mockProfiles);
        setLoading(false);
        return;
      }

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
      // Save last action for rewind
      setLastAction({
        type: 'pass',
        profile: profile,
        index: currentIndex,
        timestamp: Date.now()
      });

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
      // Save last action for rewind
      setLastAction({
        type: 'like',
        profile: profile,
        index: currentIndex,
        timestamp: Date.now()
      });

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

  // Chat functions (restored from December 2)
  const handleOpenChatFromMatch = useCallback((profile) => {
    setMatchAnimVisible(false);
    const profileToUse = profile || matchedProfile;
    console.log('HomeScreen: handleOpenChatFromMatch - profile:', profileToUse?.name, profileToUse?.id);
    console.log('HomeScreen: currentUser:', currentUser);

    // Add matchId to the profile object for messaging
    const matchId = `match_${currentUser.id}_${profileToUse.id}`;
    console.log('HomeScreen: Generated matchId:', matchId);

    const profileWithMatchId = {
      ...profileToUse,
      matchId: matchId
    };

    console.log('HomeScreen: profileWithMatchId:', profileWithMatchId);

    // Set chat profile and open chat immediately
    console.log('HomeScreen: Setting chatProfile:', profileWithMatchId);
    setChatProfile(profileWithMatchId);
    setReturnToMatchPopup(true);
    setChatVisible(true);
  }, [matchedProfile]);

  const handleCloseChat = useCallback(() => {
    setChatVisible(false);
    const shouldReturnToMatch = returnToMatchPopup && matchedProfile;
    setChatProfile(null);

    if (shouldReturnToMatch) {
      setTimeout(() => {
        setMatchAnimVisible(true);
      }, 300);
    }

    setReturnToMatchPopup(false);
  }, [returnToMatchPopup, matchedProfile]);

  const handleChatLastMessageUpdate = useCallback((message) => {
    const targetId = chatProfile?.id || matchedProfile?.id;
    if (!targetId || !message) {
      return;
    }
    // Update last message in matches
    if (onMatch) {
      const updatedMatches = matches.map(match =>
        match.id === targetId ? { ...match, lastMessage: message, lastMessageTime: new Date().toISOString() } : match
      );
      // This would typically be handled by parent component or service
      console.log('HomeScreen: Last message updated for match:', targetId, message);
    }
  }, [chatProfile, matchedProfile, matches, onMatch]);

  // Story functions
  const handleStoryPress = useCallback((index) => {
    setStoryViewerIndex(index);
    setStoryViewerVisible(true);
  }, []);

  // Verified filter functions
  const handleToggleVerifiedFilter = useCallback(() => {
    setShowOnlyVerified(!showOnlyVerified);
    // Filter profiles immediately
    let filtered = initialProfiles;
    if (!showOnlyVerified) {
      filtered = filtered.filter(p => p.isVerified === true);
    }
    setProfiles(filtered);
    setCurrentIndex(0);
  }, [showOnlyVerified]);

  // Profile detail functions
  const handleOpenProfileDetail = useCallback((profile) => {
    setDetailProfile(profile);
    setProfileDetailVisible(true);
  }, []);

  const handleCloseProfileDetail = useCallback(() => {
    setProfileDetailVisible(false);
    setDetailProfile(null);
  }, []);

  // Rewind function (undo last swipe)
  const handleRewind = useCallback(async () => {
    if (!lastAction || !user?.id) return;

    // Check if within 5 seconds
    const timeDiff = Date.now() - lastAction.timestamp;
    if (timeDiff > 5000) {
      Alert.alert('Nem lehet visszacsinálni', 'Az utolsó művelet több mint 5 másodperce történt.');
      return;
    }

    try {
      // Go back to previous profile
      setCurrentIndex(lastAction.index);

      // Clear last action
      setLastAction(null);

      Alert.alert('Visszavonva', 'Az utolsó swipe visszavonva.');
    } catch (error) {
      console.error('HomeScreen: Rewind error:', error);
      Alert.alert('Hiba', 'Nem sikerült visszavonni az utolsó műveletet.');
    }
  }, [lastAction, user?.id]);

  // Video profile functions (restored from December 2)
  const handleOpenVideoProfile = useCallback(() => {
    if (currentIndex < profiles.length) {
      const currentProfile = profiles[currentIndex];
      // Temporary disable video profiles due to Pexels 403 errors
      Alert.alert('Videó funkció', 'A videóprofilok jelenleg karbantartás alatt vannak. Hamarosan visszatérnek! 🎬');
    }
  }, [currentIndex, profiles]);

  const handleTopIconPress = useCallback((iconName) => {
    console.log('HomeScreen: Top icon pressed:', iconName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch(iconName) {
      case 'passport':
        if (navigation) {
          navigation.navigate('Profil', {
            screen: 'Map',
            params: {
              nearbyProfiles: profiles.slice(0, 20) // Pass current profiles to map
            }
          });
        }
        break;
      case 'verified':
        handleToggleVerifiedFilter();
        break;
      case 'sparkles':
        if (navigation) {
          // Navigate to live stream (Tinder Party feature)
          navigation.navigate('ChatRooms', {
            screen: 'LiveStream',
            params: { isHost: false, hostName: 'Community' }
          });
        }
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
      <SafeAreaView style={[styles.container, { backgroundColor: '#0F0F23' }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00D4FF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#0F0F23' }]}>
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: '#00D4FF' }]}>
            Nincs több profil
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={['#0F0F23', '#1A1A2E', '#0F0F23']}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={[]}>
      {/* Verifikációs szűrő és térkép gombok */}
      {discoverySettings.showTopButtons && (
        <View style={styles.topButtonsContainer}>
          <TouchableOpacity
            style={[styles.verifiedFilterButton, showOnlyVerified && styles.verifiedFilterButtonActive]}
            onPress={handleToggleVerifiedFilter}
          >
            <Ionicons
              name={showOnlyVerified ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={20}
              color={showOnlyVerified ? '#00D4FF' : '#00D4FF'}
            />
            <Text style={[styles.verifiedFilterText, showOnlyVerified && styles.verifiedFilterTextActive]}>
              {showOnlyVerified ? 'Csak verifikált' : 'Összes'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mapButton, aiModeEnabled && styles.aiButtonActive]}
            onPress={() => {
              if (!aiModeEnabled) {
                setAiSearchModalVisible(true);
              } else {
                setAiDescription('');
                setAiModeEnabled(false);
              }
            }}
          >
            <Ionicons
              name={aiModeEnabled ? "sparkles" : "sparkles-outline"}
              size={20}
              color={aiModeEnabled ? '#00FF88' : '#00D4FF'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => {
              if (navigation) {
                navigation.navigate('Profil', { screen: 'Map' });
              }
            }}
          >
            <Ionicons name="map-outline" size={20} color={'#00D4FF'} />
          </TouchableOpacity>
        </View>
      )}

      {/* Stories Container */}
      {discoverySettings.showStories && stories.length > 0 && storiesVisible && (
        <View style={styles.storiesContainer}>
          <TouchableOpacity
            style={styles.storiesToggleButton}
            onPress={() => setStoriesVisible(false)}
          >
            <Ionicons name="chevron-up" size={24} color={'#00D4FF'} />
          </TouchableOpacity>
          <StoryCircle
            key="own-story"
            user={{
              name: user?.name || 'Te',
              photo: user?.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
              isOwn: true
            }}
            onPress={() => handleStoryPress(0)}
          />
          {stories.slice(0, 5).map((story, index) => (
            <StoryCircle
              key={`story-${story.id}-${index}`}
              user={story}
              isViewed={false}
              onPress={() => handleStoryPress(index + 1)}
            />
          ))}
        </View>
      )}

      {/* Felső ikonsor - 7 ikon */}
      {discoverySettings.showTopIcons && (
        <View style={styles.topIconBar} pointerEvents="box-none">
        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => handleTopIconPress('passport')}
          activeOpacity={0.7}
        >
          <Ionicons name="airplane" size={24} color={'#00D4FF'} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => handleTopIconPress('verified')}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-circle" size={24} color={'#00D4FF'} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => handleTopIconPress('sparkles')}
          activeOpacity={0.7}
        >
          <Ionicons name="sparkles" size={24} color={'#00D4FF'} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => handleTopIconPress('chart')}
          activeOpacity={0.7}
        >
          <Ionicons name="bar-chart" size={24} color={'#00D4FF'} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => handleTopIconPress('search')}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={24} color={'#00D4FF'} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => handleTopIconPress('diamond')}
          activeOpacity={0.7}
        >
          <Ionicons name="diamond" size={24} color={'#00D4FF'} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topIcon}
          onPress={() => handleTopIconPress('lightning')}
          activeOpacity={0.7}
        >
          <Ionicons name="flash" size={24} color={'#00D4FF'} />
        </TouchableOpacity>
        </View>
      )}

      {/* Hidden Stories Toggle */}
      {stories.length > 0 && !storiesVisible && (
        <TouchableOpacity
          style={styles.storiesToggleButtonHidden}
          onPress={() => setStoriesVisible(true)}
        >
          <Ionicons name="chevron-down" size={24} color={'#00D4FF'} />
        </TouchableOpacity>
      )}

      {/* Profil kártya */}
      <View style={[styles.cardContainer, !storiesVisible && styles.cardContainerFullScreen]} pointerEvents="box-none">
        <SwipeCard
          key={currentProfile.id}
          profile={currentProfile}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onSuperLike={handleSuperLike}
          onProfilePress={() => handleOpenProfileDetail(currentProfile)}
          isFirst={true}
          userProfile={user || currentUser}
          theme={theme}
          fullScreen={true}
        />

        {/* Premium funkciók megjelenítése */}
        {discoverySettings.boostEnabled && (
          <View style={[styles.premiumBadge, { top: 100, right: 20 }]}>
            <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.premiumBadgeGradient}>
              <Ionicons name="flash" size={16} color="#000" />
              <Text style={styles.premiumBadgeText}>BOOST</Text>
            </LinearGradient>
          </View>
        )}

        {discoverySettings.spotlightEnabled && (
          <View style={[styles.premiumBadge, { top: 140, right: 20 }]}>
            <LinearGradient colors={['#FF6B9D', '#C44569']} style={styles.premiumBadgeGradient}>
              <Ionicons name="sparkles" size={16} color="#fff" />
              <Text style={styles.premiumBadgeText}>SPOTLIGHT</Text>
            </LinearGradient>
          </View>
        )}

        {/* Stories megjelenítése */}
        {discoverySettings.storiesEnabled && stories.length > 0 && storiesVisible && (
          <View style={styles.storiesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {stories.map((story, index) => (
                <StoryCircle
                  key={story.id}
                  story={story}
                  onPress={() => handleStoryPress(index)}
                  size={60}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Jobb oldali akciók */}
        {discoverySettings.showRightActions && (
          <View style={styles.rightActions} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.rightActionButton}
            onPress={handleRewind}
            activeOpacity={0.7}
            disabled={!lastAction || (Date.now() - lastAction.timestamp) > 5000}
          >
            <Ionicons
              name="refresh"
              size={24}
              color={(!lastAction || (Date.now() - lastAction.timestamp) > 5000) ? '#64748B' : '#00D4FF'}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.rightActionButton}
            onPress={() => {
              console.log('HomeScreen: Refresh pressed');
              // Safe Haptics call - prevent crashes if expo-haptics is not available
              try {
                if (Haptics && typeof Haptics.impactAsync === 'function') {
                  Haptics.impactAsync('medium');
                }
              } catch (error) {
                console.warn('Haptics not available:', error.message);
              }
              loadProfiles();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-circle" size={24} color={'#00D4FF'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rightActionButton}
            onPress={handleOpenVideoProfile}
            activeOpacity={0.7}
            disabled={currentIndex >= profiles.length}
          >
            <Ionicons name="videocam" size={24} color={'#8B5CF6'} />
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
            <Ionicons name="ellipsis-vertical" size={24} color={'#00D4FF'} />
          </TouchableOpacity>
          </View>
        )}

        {/* Bal alsó vissza gomb */}
        {discoverySettings.showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              console.log('HomeScreen: Back pressed');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrentIndex(prev => Math.max(0, prev - 1));
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={'#00D4FF'} />
          </TouchableOpacity>
        )}
      </View>

      {/* Alsó akció gombok - 3 gomb */}
      {discoverySettings.showActionButtons && (
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
          <Ionicons name="close" size={32} color={'#FF0080'} />
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
          <Ionicons name="star" size={28} color={'#06B6D4'} />
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
          <Ionicons name="heart" size={32} color={'#FF0080'} />
        </TouchableOpacity>
        </View>
      )}

      {/* Match Animation */}
      <MatchAnimation
        visible={matchAnimVisible}
        profile={matchedProfile}
        onClose={() => setMatchAnimVisible(false)}
        onSendMessage={handleOpenChatFromMatch}
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

      {/* Video Profile Modal - Restored from December 2 */}
      <VideoProfile
        visible={videoProfileVisible}
        profile={videoProfile}
        allProfiles={profiles}
        userProfile={user}
        onClose={() => setVideoProfileVisible(false)}
        onLike={(profile) => {
          handleSwipeRight(profile);
          setVideoProfileVisible(false);
        }}
        onSkip={(profile) => {
          handleSwipeLeft(profile);
          setVideoProfileVisible(false);
        }}
        onQuickLike={(profile) => {
          // Handle match but don't close video profile
          const isMatch = Math.random() < 0.3; // 30% chance of match for demo
          if (isMatch) {
            setMatchedProfile(profile);
            if (onMatch) onMatch(profile);
            // Don't show match animation in video profile, just add to matches
          }
          // Update history but keep video profile open
          setHistory((prev) => [...prev, { profile, action: 'right', index: currentIndex, isMatch }]);
        }}
      />

      {/* Chat Modal - Restored from December 2 */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        onRequestClose={handleCloseChat}
      >
        {chatProfile && (
          <ChatScreen
            match={chatProfile}
            onClose={handleCloseChat}
            onUpdateLastMessage={handleChatLastMessageUpdate}
          />
        )}
      </Modal>

      {/* Story Viewer Modal - Restored from December 2 */}
      <StoryViewer
        visible={storyViewerVisible}
        stories={stories}
        initialIndex={storyViewerIndex}
        onClose={() => setStoryViewerVisible(false)}
        onUserPress={(user) => {
          setStoryViewerVisible(false);
          // Optionally navigate to user profile
        }}
      />

      {/* Profile Detail Modal - Restored from December 2 */}
      <Modal
        visible={profileDetailVisible}
        animationType="slide"
        onRequestClose={handleCloseProfileDetail}
      >
        {detailProfile && (
          <ProfileDetailScreen
            profile={detailProfile}
            onClose={handleCloseProfileDetail}
            onLike={() => handleSwipeRight(detailProfile)}
            onPass={() => handleSwipeLeft(detailProfile)}
          />
        )}
      </Modal>
    </SafeAreaView>
    </LinearGradient>
  );
};

// Global theme safety function
const safeTheme = (theme) => {
  if (!theme || !theme.colors) {
    console.log('Using global theme fallback');
    return {
      colors: {
        primary: '#00D4FF',
        text: '#00D4FF',
        success: '#00FF88',
        error: '#FF0080',
        info: '#06B6D4',
        background: '#0F0F23',
        surface: '#1A1A2E',
        border: '#475569',
        gradient: ['#00D4FF', '#8B5CF6']
      }
    };
  }
  return theme;
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    position: 'relative',
  },
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

  // Verifikációs és térkép gombok
  topButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  verifiedFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  verifiedFilterButtonActive: {
    borderColor: '#00D4FF',
    backgroundColor: 'rgba(255, 59, 117, 0.1)',
  },
  verifiedFilterText: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: '500',
  },
  verifiedFilterTextActive: {
    color: '#00D4FF',
  },
  mapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },

  // Stories
  storiesContainer: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 40,
  },
  storiesToggleButton: {
    position: 'absolute',
    top: -10,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 60,
  },
  storiesToggleButtonHidden: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 60,
  },
  
  // Felső ikonsor
  topIconBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    position: 'absolute',
    top: 170,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'rgba(15, 15, 35, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: 25,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
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

  // Profil kártya - teljes képernyő
  cardContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainerFullScreen: {
    // Már alapértelmezetten teljes képernyő
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
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.5)',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
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

  // Premium badge-ek
  premiumBadge: {
    position: 'absolute',
    zIndex: 100,
  },
  premiumBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  premiumBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },

  // Stories container
  storiesContainer: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    zIndex: 40,
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
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 255, 0.6)',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 15,
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
