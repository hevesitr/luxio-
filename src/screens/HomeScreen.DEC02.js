import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Text,
  Modal,
  TextInput,
  Switch,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import SwipeCard from '../components/SwipeCard';
import MatchAnimation from '../components/MatchAnimation';
import AISearchModal from '../components/discovery/AISearchModal';
import ChatScreen from './ChatScreen';
import StoryCircle from '../components/StoryCircle';
import StoryViewer from '../components/StoryViewer';
import VideoProfile from '../components/VideoProfile';
import ProfileDetailScreen from './ProfileDetailScreen';
import { profiles as initialProfiles } from '../data/profiles';
import { currentUser } from '../data/userProfile';
import StoryService from '../services/StoryService';
import GamificationService from '../services/GamificationService';
import AIRecommendationService from '../services/AIRecommendationService';
import MatchService from '../services/MatchService';
import SupabaseMatchService from '../services/SupabaseMatchService';
import PaymentService from '../services/PaymentService';
import Logger from '../services/Logger';
import { useTheme } from '../context/ThemeContext';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ACTION_BUTTON_SIZE = 52;

const HomeScreen = ({ onMatch, navigation, matches = [], route }) => {
  const { theme } = useTheme();
  const { getDiscoveryFilters, saveDiscoveryFilters } = usePreferences();
  const { user } = useAuth();
  
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [matchAnimVisible, setMatchAnimVisible] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatProfile, setChatProfile] = useState(null);
  const [returnToMatchPopup, setReturnToMatchPopup] = useState(false);
  const [stories, setStories] = useState([]);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [storyViewerIndex, setStoryViewerIndex] = useState(0);
  const [videoProfileVisible, setVideoProfileVisible] = useState(false);
  const [videoProfile, setVideoProfile] = useState(null);
  const [profileDetailVisible, setProfileDetailVisible] = useState(false);
  const [detailProfile, setDetailProfile] = useState(null);
  const [storiesVisible, setStoriesVisible] = useState(true);
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [searchFilters, setSearchFilters] = useState(null);
  const [aiModeEnabled, setAiModeEnabled] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [sugarDatingMode, setSugarDatingMode] = useState(false);
  const [sugarDatingIntroShown, setSugarDatingIntroShown] = useState(false);
  const cardRef = useRef(null);

  // Prioritásos szűrés: ha laza kapcsolatot keres, először csak azokat mutassa
  const filterProfilesByPriority = (profilesList) => {
    let filtered = profilesList;
    
    // Keresési szűrők alkalmazása (ha vannak)
    if (searchFilters) {
      // Szöveges keresés
      if (searchFilters.searchQuery) {
        const query = searchFilters.searchQuery.toLowerCase();
        filtered = filtered.filter(p => {
          const nameMatch = p.name?.toLowerCase().includes(query) || false;
          const bioMatch = p.bio?.toLowerCase().includes(query) || false;
          const interestsMatch = Array.isArray(p.interests) && 
            p.interests.some(i => i?.toLowerCase().includes(query));
          return nameMatch || bioMatch || interestsMatch;
        });
      }
      
      // Kor szűrés
      if (searchFilters.ageMin) {
        filtered = filtered.filter(p => p.age >= searchFilters.ageMin);
      }
      if (searchFilters.ageMax) {
        filtered = filtered.filter(p => p.age <= searchFilters.ageMax);
      }
      
      // Távolság szűrés (ha be van kapcsolva)
      if (searchFilters.distance !== null) {
        filtered = filtered.filter(p => !p.distance || p.distance <= searchFilters.distance);
      }
      
      // Verifikáció szűrés
      if (searchFilters.showOnlyVerified) {
        filtered = filtered.filter(p => p.isVerified === true);
      }
      
      // Kapcsolati cél szűrés
      if (searchFilters.relationshipGoal) {
        filtered = filtered.filter(p => p.relationshipGoal === searchFilters.relationshipGoal);
      }
      
      // Érdeklődési körök szűrése
      if (searchFilters.interests && searchFilters.interests.length > 0) {
        filtered = filtered.filter(p => 
          p.interests && 
          searchFilters.interests.some(interest => p.interests.includes(interest))
        );
      }
      
      // Magasság szűrés
      if (searchFilters.heightMin !== null) {
        filtered = filtered.filter(p => 
          p.height && p.height.value >= searchFilters.heightMin
        );
      }
      if (searchFilters.heightMax !== null) {
        filtered = filtered.filter(p => 
          p.height && p.height.value <= searchFilters.heightMax
        );
      }
      
      // További szűrők...
      if (searchFilters.education) {
        filtered = filtered.filter(p => p.education === searchFilters.education);
      }
      if (searchFilters.smoking) {
        filtered = filtered.filter(p => p.smoking === searchFilters.smoking);
      }
      if (searchFilters.drinking) {
        filtered = filtered.filter(p => p.drinking === searchFilters.drinking);
      }
      if (searchFilters.exercise) {
        filtered = filtered.filter(p => p.exercise === searchFilters.exercise);
      }
      if (searchFilters.zodiacSign) {
        filtered = filtered.filter(p => p.zodiacSign === searchFilters.zodiacSign);
      }
      if (searchFilters.mbti) {
        filtered = filtered.filter(p => p.mbti === searchFilters.mbti);
      }
      if (searchFilters.gender) {
        filtered = filtered.filter(p => p.gender === searchFilters.gender);
      }
    } else {
      // Alapértelmezett szűrés: csak azokat mutassuk, akiket a felhasználó keres
      // DE csak akkor, ha van lookingFor beállítás, különben mutassunk mindent
      if (currentUser.lookingFor && currentUser.lookingFor.length > 0) {
        filtered = filtered.filter(p => 
          p.gender && currentUser.lookingFor.includes(p.gender)
        );
      }
      // Ha nincs keresési szűrő, akkor a régi logikát használjuk
      // Verifikációs szűrés (ha be van kapcsolva)
      if (showOnlyVerified) {
        filtered = filtered.filter(p => p.isVerified === true);
      }
      
      // Ha a szűrés után túl kevés profil maradt, mutassunk többet
      // (legalább 10 profilt, ha van elég)
      if (filtered.length < 10 && profilesList.length >= 10) {
        // Ha van lookingFor, akkor is mutassunk többet, de prioritizálva
        if (currentUser.lookingFor && currentUser.lookingFor.length > 0) {
          const preferred = profilesList.filter(p => 
            p.gender && currentUser.lookingFor.includes(p.gender)
          );
          const others = profilesList.filter(p => 
            !p.gender || !currentUser.lookingFor.includes(p.gender)
          );
          filtered = [...preferred, ...others].slice(0, Math.max(10, filtered.length));
        } else {
          filtered = profilesList.slice(0, Math.max(10, filtered.length));
        }
      }
      
      if (currentUser.relationshipGoal) {
        const userGoal = currentUser.relationshipGoal;
        
        // Ha laza kapcsolatot keres, prioritizáljuk azokat
        if (userGoal === 'casual') {
          const casualProfiles = filtered.filter(p => p.relationshipGoal === 'casual');
          const otherProfiles = filtered.filter(p => p.relationshipGoal !== 'casual');
          return [...casualProfiles, ...otherProfiles];
        }
        
        // Ha komoly kapcsolatot keres, prioritizáljuk azokat
        if (userGoal === 'serious') {
          const seriousProfiles = filtered.filter(p => p.relationshipGoal === 'serious');
          const otherProfiles = filtered.filter(p => p.relationshipGoal !== 'serious');
          return [...seriousProfiles, ...otherProfiles];
        }
        
        // Ha barátságot keres, prioritizáljuk azokat
        if (userGoal === 'friends') {
          const friendsProfiles = filtered.filter(p => p.relationshipGoal === 'friends');
          const otherProfiles = filtered.filter(p => p.relationshipGoal !== 'friends');
          return [...friendsProfiles, ...otherProfiles];
        }
      }
    }
    
    return filtered;
  };

  // Előzmények betöltése az alkalmazás indításakor
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const savedHistory = await MatchService.loadHistory();
        if (savedHistory.length > 0) {
          setHistory(savedHistory);
          // Állítsuk be a currentIndex-t az utolsó elem után
          const lastIndex = savedHistory[savedHistory.length - 1]?.index || 0;
          const newIndex = lastIndex + 1;
          // IMPORTANT: Reset to 0 if index is beyond available profiles
          // This happens when profiles are filtered differently or history is stale
          setCurrentIndex(newIndex);
          console.log('HomeScreen: History loaded from storage:', savedHistory.length);
          console.log('HomeScreen: Setting currentIndex to:', newIndex);
        }
      } catch (error) {
        console.error('HomeScreen: Error loading history:', error);
      }
    };
    loadHistory();
  }, []);

  // Előzmények mentése, amikor változnak
  useEffect(() => {
    if (history.length > 0) {
      MatchService.saveHistory(history);
    }
  }, [history]);

  // Handle navigation from Map screen to show match popup
  useFocusEffect(
    React.useCallback(() => {
      const checkForMatchPopup = async () => {
        try {
          // Check AsyncStorage for match popup flag
          const storedData = await AsyncStorage.getItem('@returnToMatchPopup');
          if (storedData) {
            const { showMatchPopup, matchPopupParams } = JSON.parse(storedData);
            if (showMatchPopup && matchPopupParams) {
              const { profile, allMatches, currentMatchIndex } = matchPopupParams;
              if (profile) {
                setMatchedProfile(profile);
                setTimeout(() => {
                  setMatchAnimVisible(true);
                }, 300);
              }
              // Clear the stored data
              await AsyncStorage.removeItem('@returnToMatchPopup');
            }
          }
          
          // Also check route params (fallback)
          if (route?.params?.showMatchPopup && route?.params?.matchPopupParams) {
            const { profile, allMatches, currentMatchIndex } = route.params.matchPopupParams;
            if (profile) {
              setMatchedProfile(profile);
              setTimeout(() => {
                setMatchAnimVisible(true);
              }, 300);
            }
            // Clear the params to prevent showing again
            if (navigation.setParams) {
              navigation.setParams({ showMatchPopup: false, matchPopupParams: null });
            }
          }
        } catch (error) {
          console.error('HomeScreen: Error checking for match popup:', error);
        }
      };
      
      checkForMatchPopup();
    }, [route?.params?.showMatchPopup, route?.params?.matchPopupParams])
  );

  // Load discovery feed
  useEffect(() => {
    const loadDiscoveryFeed = async () => {
      try {
        setIsLoading(true);
        
        // Use local profiles (Supabase profiles table is empty)
        Logger.info('Using local profiles');
        console.log('=== HOMESCREEN LOAD DISCOVERY FEED ===');
        console.log('Initial profiles count:', initialProfiles.length);
        console.log('First profile:', initialProfiles[0]);
        console.log('currentUser.lookingFor:', currentUser.lookingFor);
        console.log('showOnlyVerified:', showOnlyVerified);
        console.log('searchFilters:', searchFilters);
        
        // Apply filters
        const filtered = filterProfilesByPriority(initialProfiles);
        console.log('Filtered profiles count:', filtered.length);
        console.log('First filtered profile:', filtered[0]);
        console.log('First 3 filtered profiles:', filtered.slice(0, 3));
        
        if (filtered.length === 0) {
          console.error('NO PROFILES AFTER FILTERING!');
          console.log('Using all profiles as fallback');
          setProfiles(initialProfiles);
        } else {
          setProfiles(filtered);
        }
      } catch (error) {
        Logger.error('Discovery feed load error', error);
        console.error('Error details:', error);
        // Fallback to all local profiles
        setProfiles(initialProfiles);
      } finally {
        setIsLoading(false);
      }
    };

    loadDiscoveryFeed();
  }, []);

  // Separate useEffect to handle currentIndex reset when profiles change
  useEffect(() => {
    if (profiles.length > 0 && currentIndex >= profiles.length) {
      console.warn(`currentIndex (${currentIndex}) is beyond profiles (${profiles.length}). Resetting to 0.`);
      setCurrentIndex(0);
    }
  }, [profiles, currentIndex]);

  // Simulate loading and load stories
  useEffect(() => {
    const init = async () => {
      // Generate test stories
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
    };
    
    init();
  }, []);

  // Check if sugar dating intro has been shown
  useEffect(() => {
    const checkSugarDatingIntro = async () => {
      try {
        const shown = await AsyncStorage.getItem('sugarDatingIntroShown');
        if (shown === 'true') {
          setSugarDatingIntroShown(true);
        }
      } catch (error) {
        console.error('Error checking sugar dating intro:', error);
      }
    };
    checkSugarDatingIntro();
  }, []);

  // AI mód változásakor újraszűrés
  useEffect(() => {
    if (aiModeEnabled && aiDescription.trim()) {
      // AI alapú keresés
      const recommendations = AIRecommendationService.getRecommendations(aiDescription, currentUser);
      const aiProfiles = recommendations.map(rec => rec.profile);
      setProfiles(aiProfiles);
      setCurrentIndex(0);
    } else if (!aiModeEnabled && !searchFilters && !sugarDatingMode) {
      // Visszaállítás normál szűrésre (csak ha nincs keresési szűrő és nincs sugar dating mód)
      const filtered = filterProfilesByPriority(initialProfiles);
      setProfiles(filtered);
      setCurrentIndex(0);
    }
  }, [aiModeEnabled, aiDescription]);

  // Sugar Dating mód változásakor újraszűrés
  useEffect(() => {
    if (sugarDatingMode) {
      // Csak sugar dating profilokat mutassunk
      const sugarProfiles = initialProfiles.filter(p => p.isSugarDating === true);
      setProfiles(sugarProfiles);
      setCurrentIndex(0);
      
      // Ha még nem látta az intro-t, mutassuk meg
      if (!sugarDatingIntroShown) {
        // Késleltetés, hogy a profilok betöltődjenek
        setTimeout(() => {
          // Modal automatikusan megjelenik, mert sugarDatingIntroShown false
        }, 500);
      }
    } else if (!aiModeEnabled && !searchFilters) {
      // Visszaállítás normál szűrésre
      const filtered = filterProfilesByPriority(initialProfiles);
      setProfiles(filtered);
      setCurrentIndex(0);
    }
  }, [sugarDatingMode]);

  const handleSwipeLeft = (profile) => {
    console.log('Swipe left:', profile.name);
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // DISABLED
    setHistory((prev) => [...prev, { profile, action: 'left', index: currentIndex }]);
    // Immediate index update - no timeout
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSwipeRight = async (profile) => {
    Logger.debug('Swipe right', { profileName: profile.name });
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // DISABLED
    
    // Like mentése Supabase-be
    try {
      const result = await SupabaseMatchService.saveLike(currentUser.id, profile.id);
      
      if (result.success && result.isMatch) {
        // Match történt!
        // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // DISABLED
        setMatchedProfile(profile);
        setTimeout(() => {
          setMatchAnimVisible(true);
          onMatch(profile);
        }, 500);
        
        // Gamifikáció: match növelése
        GamificationService.incrementMatch();
      }
    } catch (error) {
      Logger.error('Swipe right error', error);
      Alert.alert('Hiba', 'Nem sikerült menteni a like-ot. Ellenőrizd az internetkapcsolatot.');
    }
    
    setHistory((prev) => [...prev, { profile, action: 'right', index: currentIndex }]);
    setCurrentIndex((prev) => prev + 1);
    
    // Gamifikáció: like növelése
    GamificationService.incrementLike();
  };

  const handleCloseMatchAnim = () => {
    setMatchAnimVisible(false);
    setMatchedProfile(null);
  };

  const handleOpenChatFromMatch = (profile) => {
    setMatchAnimVisible(false);
    // Use the profile passed as parameter (current profile from match popup)
    const profileToUse = profile || matchedProfile;
    console.log('HomeScreen: handleOpenChatFromMatch - profile:', profileToUse?.name, profileToUse?.id);
    setChatProfile(profileToUse);
    setReturnToMatchPopup(true); // Flag that we should return to match popup when chat closes
    setChatVisible(true);
  };

  const handleCloseChat = () => {
    setChatVisible(false);
    const shouldReturnToMatch = returnToMatchPopup && matchedProfile;
    setChatProfile(null);
    
    // If we came from match popup, reopen it
    if (shouldReturnToMatch) {
      setTimeout(() => {
        setMatchAnimVisible(true);
      }, 300);
    }
    
    setReturnToMatchPopup(false);
    // Don't clear matchedProfile here, as we might want to return to the popup
  };

  const handleChatLastMessageUpdate = React.useCallback((message) => {
    const targetId = chatProfile?.id || matchedProfile?.id;
    if (!targetId || !message) {
      return;
    }
    MatchService.updateLastMessage(targetId, message).catch((error) => {
      console.error('HomeScreen: Error updating last message metadata:', error);
    });
  }, [chatProfile, matchedProfile]);

  const handleUndo = async () => {
    if (history.length === 0) return;
    
    if (!user?.id) {
      Alert.alert('Hiba', 'Jelentkezz be a visszavonáshoz');
      return;
    }

    try {
      // Check if user is premium
      const isPremiumResult = await PaymentService.isPremiumUser(user.id);
      
      if (!isPremiumResult.success || !isPremiumResult.data) {
        // Not premium, show upgrade prompt
        Alert.alert(
          '↩️ Rewind',
          'A Rewind prémium funkció. Szeretnéd aktiválni a prémium előfizetést?',
          [
            { text: 'Mégsem', style: 'cancel' },
            { 
              text: 'Prémium', 
              onPress: () => navigation.navigate('Premium')
            }
          ]
        );
        return;
      }

      // Use rewind
      const result = await PaymentService.useRewind(user.id);
      
      if (result.success) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const lastAction = history[history.length - 1];
        setHistory((prev) => prev.slice(0, -1));
        setCurrentIndex(lastAction.index);
        Alert.alert('↩️ Visszafordítva', 'Az utolsó döntésed visszavonva!');
      }
    } catch (error) {
      console.error('Rewind error:', error);
      Alert.alert('Hiba', error.message || 'Nem sikerült visszavonni a döntést');
    }
  };

  const handleLikePress = () => {
    if (currentIndex < profiles.length && cardRef.current) {
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // DISABLED
      cardRef.current.swipeRight();
    }
  };

  const handleDislikePress = () => {
    if (currentIndex < profiles.length && cardRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      cardRef.current.swipeLeft();
    }
  };

  const handleSuperLikePress = async () => {
    if (currentIndex >= profiles.length) return;
    
    if (!user?.id) {
      Alert.alert('Hiba', 'Jelentkezz be a Super Like használatához');
      return;
    }

    const profile = profiles[currentIndex];
    
    try {
      // Check if user is premium
      const isPremiumResult = await PaymentService.isPremiumUser(user.id);
      
      if (!isPremiumResult.success || !isPremiumResult.data) {
        // Not premium, show upgrade prompt
        Alert.alert(
          '⭐ Super Like',
          'A Super Like prémium funkció. Szeretnéd aktiválni a prémium előfizetést?',
          [
            { text: 'Mégsem', style: 'cancel' },
            { 
              text: 'Prémium', 
              onPress: () => navigation.navigate('Premium')
            }
          ]
        );
        return;
      }

      // Use super like
      const result = await PaymentService.useSuperLike(user.id, profile.id);
      
      if (result.success) {
        // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // DISABLED
        Alert.alert(
          '⭐ Super Like!',
          `${profile.name}-nak Super Like-ot küldtél!\n${result.data.remaining} Super Like maradt ma.`,
          [{ text: 'OK' }]
        );
        
        // Animate the card
        if (cardRef.current && cardRef.current.superLike) {
          cardRef.current.superLike();
        } else if (cardRef.current) {
          cardRef.current.swipeRight();
        }
        
        onMatch(profile);
      }
    } catch (error) {
      console.error('Super like error:', error);
      
      // Check if it's a daily limit error
      if (error.message?.includes('limit')) {
        Alert.alert(
          'Napi limit elérve',
          'Elérted a napi 5 Super Like limitet. Holnap újra használhatod!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Hiba', error.message || 'Nem sikerült elküldeni a Super Like-ot');
      }
    }
  };

  useEffect(() => {
    if (currentIndex >= profiles.length) {
      Alert.alert(
        'Nincs több profil',
        'Elfogytak a profilok ezen a környéken. Próbáld újra később!',
        [
          {
            text: 'Újrakezdés',
            onPress: () => setCurrentIndex(0),
          },
        ]
      );
    }
  }, [currentIndex]);

  const visibleProfiles = profiles.slice(currentIndex, currentIndex + 2);
  
  // DEBUG: Log visible profiles
  useEffect(() => {
    console.log('=== VISIBLE PROFILES DEBUG ===');
    console.log('profiles.length:', profiles.length);
    console.log('currentIndex:', currentIndex);
    console.log('visibleProfiles.length:', visibleProfiles.length);
    if (visibleProfiles.length > 0) {
      console.log('First visible profile:', JSON.stringify(visibleProfiles[0]));
      console.log('First visible profile name:', visibleProfiles[0]?.name);
      console.log('First visible profile age:', visibleProfiles[0]?.age);
      console.log('First visible profile age type:', typeof visibleProfiles[0]?.age);
    }
  }, [profiles, currentIndex, visibleProfiles]);

  // Create styles with theme - must be before any return statements
  const styles = createStyles(theme);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Profilok betöltése...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleStoryPress = (index) => {
    setStoryViewerIndex(index);
    setStoryViewerVisible(true);
  };

  const handleOpenVideoProfile = () => {
    if (currentIndex < profiles.length) {
      const currentProfile = profiles[currentIndex];
      const hasAnyVideo = profiles.some((p) => !!p.videoProfile);
      if (currentProfile.videoProfile || hasAnyVideo) {
        setVideoProfile(currentProfile.videoProfile ? currentProfile : null);
        setVideoProfileVisible(true);
      } else {
        Alert.alert('Nincs videó', 'Jelenleg nincs elérhető videóprofil.');
      }
    }
  };

  const handleProfileDoubleTap = (profile) => {
    if (!profile) return;
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // DISABLED
    setDetailProfile(profile);
    setProfileDetailVisible(true);
  };

  const handleToggleVerifiedFilter = () => {
    setShowOnlyVerified(!showOnlyVerified);
    const filtered = filterProfilesByPriority(initialProfiles);
    setProfiles(filtered);
    setCurrentIndex(0); // Reset to start
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Verifikációs szűrő és térkép gombok */}
      <View style={styles.topButtonsContainer}>
        <TouchableOpacity
          style={[styles.verifiedFilterButton, showOnlyVerified && styles.verifiedFilterButtonActive]}
          onPress={handleToggleVerifiedFilter}
        >
          <Ionicons
            name={showOnlyVerified ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={20}
            color={showOnlyVerified ? theme.colors.primary : theme.colors.text}
          />
          <Text style={[styles.verifiedFilterText, showOnlyVerified && styles.verifiedFilterTextActive]}>
            {showOnlyVerified ? 'Csak verifikált' : 'Összes'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.mapButton, aiModeEnabled && styles.aiButtonActive]}
          onPress={() => {
            if (!aiModeEnabled) {
              // Ha bekapcsoljuk, mutassuk az AI modal-t
              setAiInputText(aiDescription);
              setAiModalVisible(true);
            } else {
              // Ha kikapcsoljuk, töröljük a leírást és visszaállítjuk a normál szűrést
              setAiDescription('');
              setAiModeEnabled(false);
            }
          }}
        >
          <Ionicons 
            name={aiModeEnabled ? "sparkles" : "sparkles-outline"} 
            size={20} 
            color={aiModeEnabled ? "#FFD700" : theme.colors.text} 
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
          <Ionicons name="map-outline" size={20} color={theme.colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => {
            if (navigation) {
              navigation.navigate('Profil', { 
                screen: 'Search',
                params: {
                  onApplyFilters: (filters) => {
                    // Először beállítjuk a szűrőket
                    setSearchFilters(filters);
                    // Aztán szűrünk a kapott szűrőkkel
                    let filtered = initialProfiles;
                    
                    // Szöveges keresés
                    if (filters.searchQuery) {
                      const query = filters.searchQuery.toLowerCase();
                      filtered = filtered.filter(p => 
                        p.name?.toLowerCase().includes(query) ||
                        p.bio?.toLowerCase().includes(query) ||
                        p.interests?.some(i => i.toLowerCase().includes(query))
                      );
                    }
                    
                    // Kor szűrés
                    if (filters.ageMin) {
                      filtered = filtered.filter(p => p.age >= filters.ageMin);
                    }
                    if (filters.ageMax) {
                      filtered = filtered.filter(p => p.age <= filters.ageMax);
                    }
                    
                    // Távolság szűrés
                    if (filters.distance !== null) {
                      filtered = filtered.filter(p => !p.distance || p.distance <= filters.distance);
                    }
                    
                    // Verifikáció szűrés
                    if (filters.showOnlyVerified) {
                      filtered = filtered.filter(p => p.isVerified === true);
                    }
                    
                    // Kapcsolati cél szűrés
                    if (filters.relationshipGoal) {
                      filtered = filtered.filter(p => p.relationshipGoal === filters.relationshipGoal);
                    }
                    
                    // Érdeklődési körök szűrése
                    if (filters.interests && filters.interests.length > 0) {
                      filtered = filtered.filter(p => 
                        p.interests && 
                        filters.interests.some(interest => p.interests.includes(interest))
                      );
                    }
                    
                    // Magasság szűrés
                    if (filters.heightMin !== null) {
                      filtered = filtered.filter(p => 
                        p.height && p.height.value >= filters.heightMin
                      );
                    }
                    if (filters.heightMax !== null) {
                      filtered = filtered.filter(p => 
                        p.height && p.height.value <= filters.heightMax
                      );
                    }
                    
                    // További szűrők
                    if (filters.education) {
                      filtered = filtered.filter(p => p.education === filters.education);
                    }
                    if (filters.smoking) {
                      filtered = filtered.filter(p => p.smoking === filters.smoking);
                    }
                    if (filters.drinking) {
                      filtered = filtered.filter(p => p.drinking === filters.drinking);
                    }
                    if (filters.exercise) {
                      filtered = filtered.filter(p => p.exercise === filters.exercise);
                    }
                    if (filters.zodiacSign) {
                      filtered = filtered.filter(p => p.zodiacSign === filters.zodiacSign);
                    }
                    if (filters.mbti) {
                      filtered = filtered.filter(p => p.mbti === filters.mbti);
                    }
                    
                    setProfiles(filtered);
                    setCurrentIndex(0);
                  }
                }
              });
            }
          }}
        >
          <Ionicons name="search" size={20} color={theme.colors.text} />
        </TouchableOpacity>

        {/* Sugar Dating kapcsoló - 18+ */}
        <TouchableOpacity
          style={[styles.mapButton, sugarDatingMode && styles.sugarDatingButtonActive]}
          onPress={() => {
            setSugarDatingMode(!sugarDatingMode);
          }}
        >
          <View style={styles.sugarDatingContainer}>
            <View style={styles.ageBadge}>
              <Text style={styles.ageBadgeText}>18+</Text>
            </View>
            <Ionicons 
              name={sugarDatingMode ? "diamond" : "diamond-outline"} 
              size={18} 
              color={sugarDatingMode ? "#FFD700" : theme.colors.text} 
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Story empty state */}
      {stories.length === 0 && (
        <View style={styles.storyEmptyCard}>
          <View style={styles.storyEmptyTextContainer}>
            <Text style={styles.storyEmptyTitle}>Oszd meg a napodat</Text>
            <Text style={styles.storyEmptySubtitle}>
              A story-k akár 3x több match-et hoznak. Mutasd meg, merre jársz!
            </Text>
          </View>
          <TouchableOpacity
            style={styles.storyEmptyButton}
            onPress={() => Alert.alert('Story', 'Story feltöltés hamarosan elérhető.')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#000" />
            <Text style={styles.storyEmptyButtonText}>Story feltöltése</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stories */}
      {stories.length > 0 && storiesVisible && (
        <View style={styles.storiesContainer}>
          <TouchableOpacity
            style={styles.storiesToggleButton}
            onPress={() => setStoriesVisible(false)}
          >
            <Ionicons name="chevron-up" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <StoryCircle
            key="own-story"
            user={{
              photo: currentUser.location
                ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop'
                : '',
            }}
            isOwnStory={true}
            onPress={() => Alert.alert('Story', 'Saját story létrehozása - hamarosan!')}
          />
          {stories.map((story, index) => (
            <StoryCircle
              key={`story-${story.id}-${index}`}
              user={story}
              isViewed={false}
              onPress={() => handleStoryPress(index)}
            />
          ))}
        </View>
      )}
      
      {/* Stories Toggle Button (when hidden) */}
      {stories.length > 0 && !storiesVisible && (
        <TouchableOpacity
          style={styles.storiesToggleButtonHidden}
          onPress={() => setStoriesVisible(true)}
        >
          <Ionicons name="chevron-down" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      )}

      <View style={[
        styles.cardContainer,
        !storiesVisible && styles.cardContainerFullScreen
      ]}>
        {visibleProfiles.length > 0 ? (
          visibleProfiles
            .reverse()
            .map((profile, index) => (
              <SwipeCard
                key={`${profile.id}-${currentIndex}`}
                ref={index === visibleProfiles.length - 1 ? cardRef : null}
                profile={profile}
                userProfile={currentUser}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onDoubleTap={handleProfileDoubleTap}
                onProfilePress={handleProfileDoubleTap}
                isFirst={index === visibleProfiles.length - 1}
                fullScreen={!storiesVisible}
              />
            ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="heart-dislike" size={80} color="rgba(255, 255, 255, 0.3)" />
          </View>
        )}
      </View>

      {/* All Action Buttons in One Row */}
      {storiesVisible && (
      <View style={styles.allButtonsContainer}>
        <TouchableOpacity
          style={[styles.secondaryButton]}
          onPress={handleUndo}
          disabled={history.length === 0}
        >
          <Ionicons 
            name="arrow-undo" 
            size={20} 
            color={history.length > 0 ? "#FFC107" : "rgba(255, 255, 255, 0.2)"} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainActionButton, styles.dislikeButton]}
          onPress={handleDislikePress}
          disabled={currentIndex >= profiles.length}
        >
          <View style={styles.buttonShadow}>
            <Ionicons name="close" size={24} color="#F44336" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainActionButton, styles.superLikeButton]}
          onPress={handleSuperLikePress}
          disabled={currentIndex >= profiles.length}
        >
          <View style={styles.buttonShadow}>
            <Ionicons name="star" size={22} color="#2196F3" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainActionButton, styles.likeButton]}
          onPress={handleLikePress}
          disabled={currentIndex >= profiles.length}
        >
          <View style={styles.buttonShadow}>
            <Ionicons name="heart" size={26} color="#4CAF50" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton]}
          onPress={handleOpenVideoProfile}
          disabled={currentIndex >= profiles.length}
        >
          <Ionicons name="videocam" size={20} color="#9C27B0" />
        </TouchableOpacity>
      </View>
      )}

      <MatchAnimation
        visible={matchAnimVisible}
        onClose={handleCloseMatchAnim}
        onSendMessage={handleOpenChatFromMatch}
        profile={matchedProfile}
        allMatches={matches}
        navigation={navigation}
      />

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

      <VideoProfile
        visible={videoProfileVisible}
        profile={videoProfile}
        allProfiles={profiles}
        userProfile={currentUser}
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
          const isMatch = Math.random() < 0.5; // 50% chance of match
          if (isMatch) {
            setMatchedProfile(profile);
            onMatch(profile);
            // Don't show match animation in video profile, just add to matches
          }
          // Update history but keep video profile open
          setHistory((prev) => [...prev, { profile, action: 'right', index: currentIndex, isMatch }]);
        }}
      />

      <Modal
        visible={profileDetailVisible}
        animationType="slide"
        onRequestClose={() => setProfileDetailVisible(false)}
      >
        {detailProfile && (
          <ProfileDetailScreen
            route={{ 
              params: { 
                profile: detailProfile,
                onLike: (profile) => {
                  handleSwipeRight(profile);
                  setProfileDetailVisible(false);
                },
                onSuperLike: (profile) => {
                  handleSuperLikePress();
                  setProfileDetailVisible(false);
                },
                onDislike: (profile) => {
                  handleSwipeLeft(profile);
                  setProfileDetailVisible(false);
                },
              } 
            }}
            navigation={{ goBack: () => setProfileDetailVisible(false) }}
          />
        )}
      </Modal>

      {/* AI Keresés Modal */}
      <Modal
        visible={aiModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View style={styles.aiModalOverlay}>
          <View style={styles.aiModalContainer}>
            <View style={styles.aiModalHeader}>
              <Text style={styles.aiModalTitle}>AI Keresés</Text>
              <TouchableOpacity
                onPress={() => setAiModalVisible(false)}
                style={styles.aiModalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.aiModalSubtitle}>
              Írd le, milyen párt keresel. Megadhatod a kapcsolati célját (laza/komoly/barátság), helyszínt (pl: budapest), korát, stb.
            </Text>
            <TextInput
              style={styles.aiModalInput}
              placeholder="Pl: laza kapcsolatot keresek, budapest, 25-30 éves, sportos"
              placeholderTextColor={theme.colors.textTertiary}
              value={aiInputText}
              onChangeText={setAiInputText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.aiModalButtons}>
              <TouchableOpacity
                style={[styles.aiModalButton, styles.aiModalButtonCancel]}
                onPress={() => {
                  setAiModalVisible(false);
                  setAiInputText('');
                }}
              >
                <Text style={styles.aiModalButtonTextCancel}>Mégse</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.aiModalButton, styles.aiModalButtonSearch]}
                onPress={() => {
                  if (aiInputText && aiInputText.trim()) {
                    setAiDescription(aiInputText.trim());
                    setAiModeEnabled(true);
                    setAiModalVisible(false);
                    setAiInputText('');
                  } else {
                    Alert.alert('Hiányzó leírás', 'Kérlek írj be egy leírást!');
                  }
                }}
              >
                <Text style={styles.aiModalButtonTextSearch}>Keresés</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sugar Dating Intro Modal */}
      <Modal
        visible={sugarDatingMode && !sugarDatingIntroShown}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setSugarDatingIntroShown(true);
          AsyncStorage.setItem('sugarDatingIntroShown', 'true');
        }}
      >
        <View style={styles.sugarIntroOverlay}>
          <View style={styles.sugarIntroContainer}>
            <View style={styles.sugarIntroHeader}>
              <View style={styles.ageBadgeLarge}>
                <Text style={styles.ageBadgeTextLarge}>18+</Text>
              </View>
              <Text style={styles.sugarIntroTitle}>Sugar Dating</Text>
              <TouchableOpacity
                onPress={() => {
                  setSugarDatingIntroShown(true);
                  AsyncStorage.setItem('sugarDatingIntroShown', 'true');
                }}
                style={styles.sugarIntroCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.sugarIntroContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.sugarIntroSubtitle}>
                Mi a Sugar Dating?
              </Text>
              <Text style={styles.sugarIntroText}>
                A Sugar Dating egy olyan kapcsolatforma, ahol generózus, sikeres férfiak (Sugar Daddies) és ambiciózus, fiatal nők (Sugar Babies) találkoznak.
              </Text>
              
              <Text style={styles.sugarIntroSubtitle}>
                Hogyan működik?
              </Text>
              <Text style={styles.sugarIntroText}>
                • A Sugar Daddies anyagi támogatást nyújthatnak{'\n'}
                • A Sugar Babies társaságot és kompaniát nyújthatnak{'\n'}
                • Mindkét fél tisztán kommunikál az elvárásokról{'\n'}
                • Diszkréció és biztonság a legfontosabb
              </Text>
              
              <Text style={styles.sugarIntroSubtitle}>
                Fontos tudnivalók
              </Text>
              <Text style={styles.sugarIntroText}>
                ⚠️ Ez a funkció csak 18 év feletti felhasználók számára elérhető.{'\n'}
                ⚠️ Mindig legyél óvatos és találkozz nyilvános helyeken.{'\n'}
                ⚠️ Tisztán kommunikálj az elvárásokról és határokról.
              </Text>
            </ScrollView>
            
            <View style={styles.sugarIntroButtons}>
              <TouchableOpacity
                style={[styles.sugarIntroButton, styles.sugarIntroButtonPrimary]}
                onPress={() => {
                  setSugarDatingIntroShown(true);
                  AsyncStorage.setItem('sugarDatingIntroShown', 'true');
                }}
              >
                <Text style={styles.sugarIntroButtonTextPrimary}>Értem, folytatom</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 10,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    marginTop: 85,
    marginBottom: 0,
  },
  cardContainerFullScreen: {
    marginTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  allButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 14,
    backgroundColor: 'transparent',
  },
  mainActionButton: {
    width: ACTION_BUTTON_SIZE,
    height: ACTION_BUTTON_SIZE,
    borderRadius: ACTION_BUTTON_SIZE / 2,
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  buttonShadow: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dislikeButton: {
    borderColor: 'rgba(244, 67, 54, 0.4)',
  },
  likeButton: {
    borderColor: 'rgba(76, 175, 80, 0.4)',
  },
  superLikeButton: {
    borderColor: 'rgba(33, 150, 243, 0.4)',
  },
  secondaryButton: {
    width: ACTION_BUTTON_SIZE,
    height: ACTION_BUTTON_SIZE,
    borderRadius: ACTION_BUTTON_SIZE / 2,
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  storiesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingTop: 50,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 10,
  },
  storiesToggleButton: {
    position: 'absolute',
    top: 52,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  storiesToggleButtonHidden: {
    position: 'absolute',
    top: 52,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  storyEmptyCard: {
    marginTop: 120,
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  storyEmptyTextContainer: {
    flex: 1,
    gap: 6,
  },
  storyEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  storyEmptySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  storyEmptyButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storyEmptyButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  topButtonsContainer: {
    position: 'absolute',
    top: 12,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 20,
  },
  verifiedFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  verifiedFilterButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  verifiedFilterText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  verifiedFilterTextActive: {
    color: theme.colors.primary,
  },
  mapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  aiButtonActive: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  aiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  aiModalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  aiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  aiModalCloseButton: {
    padding: 5,
  },
  aiModalSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 15,
    lineHeight: 20,
  },
  aiModalInput: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 100,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  aiModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  aiModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiModalButtonCancel: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  aiModalButtonSearch: {
    backgroundColor: theme.colors.primary,
  },
  aiModalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  aiModalButtonTextSearch: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sugarDatingButtonActive: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  sugarDatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ageBadge: {
    backgroundColor: '#FF3B75',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  ageBadgeLarge: {
    backgroundColor: '#FF3B75',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'center',
    marginBottom: 10,
  },
  ageBadgeTextLarge: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sugarIntroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sugarIntroContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sugarIntroHeader: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  sugarIntroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 10,
  },
  sugarIntroCloseButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 5,
  },
  sugarIntroContent: {
    maxHeight: 400,
    marginBottom: 20,
  },
  sugarIntroSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  sugarIntroText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 15,
  },
  sugarIntroButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sugarIntroButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sugarIntroButtonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  sugarIntroButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default HomeScreen;

