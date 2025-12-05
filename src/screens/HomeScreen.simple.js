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
import DiscoveryService from '../services/DiscoveryService';
import PaymentService from '../services/PaymentService';
import Logger from '../services/Logger';
import { useTheme } from '../context/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../hooks/useNavigation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ACTION_BUTTON_SIZE = 52;

const HomeScreen = ({ onMatch, navigation, matches = [], route }) => {
  const { theme } = useTheme();
  const { getDiscoveryFilters, saveDiscoveryFilters } = usePreferences();
  const { user } = useAuth();
  const navService = useNavigation();

  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchAnimVisible, setMatchAnimVisible] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [stories, setStories] = useState([]);
  const [storiesVisible, setStoriesVisible] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    ageMin: 18,
    ageMax: 35,
    distance: 50,
    verifiedOnly: false,
    searchQuery: '',
  });
  const [history, setHistory] = useState([]);
  const [sugarDatingMode, setSugarDatingMode] = useState(false);
  const [sugarDatingIntroShown, setSugarDatingIntroShown] = useState(false);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      setLoading(true);

      // Load saved filters
      const savedFilters = await getDiscoveryFilters();
      if (savedFilters) {
        setSearchFilters(savedFilters);
      }

      // Load sugar dating preference
      const sugarMode = await AsyncStorage.getItem('sugarDatingMode');
      if (sugarMode === 'true') {
        setSugarDatingMode(true);
      }

      // Load intro shown status
      const introShown = await AsyncStorage.getItem('sugarDatingIntroShown');
      if (introShown === 'true') {
        setSugarDatingIntroShown(true);
      }

      // Initialize profiles
      await loadProfiles();

      // Load stories
      await loadStories();

      setLoading(false);
    } catch (error) {
      Logger.error('HomeScreen: Error initializing screen', error);
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    try {
      // Use DiscoveryService to get profiles
      const discoveryProfiles = await DiscoveryService.getDiscoveryProfiles(searchFilters);
      setProfiles(discoveryProfiles);
    } catch (error) {
      Logger.error('HomeScreen: Error loading profiles', error);
      // Fallback to initial profiles
      setProfiles(initialProfiles);
    }
  };

  const loadStories = async () => {
    try {
      const userStories = await StoryService.getStories();
      setStories(userStories);
    } catch (error) {
      Logger.error('HomeScreen: Error loading stories', error);
    }
  };

  const handleSwipeLeft = async (profile) => {
    try {
      await MatchService.processSwipe(profile.id, 'pass');
      setHistory([...history, { profile, action: 'pass' }]);
      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      Logger.error('HomeScreen: Error processing pass', error);
    }
  };

  const handleSwipeRight = async (profile) => {
    try {
      const result = await MatchService.processSwipe(profile.id, 'like');
      setHistory([...history, { profile, action: 'like' }]);

      if (result.isMatch) {
        // It's a match!
        setMatchedProfile(profile);
        setMatchAnimVisible(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Show match animation for 3 seconds
        setTimeout(() => {
          setMatchAnimVisible(false);
          setMatchedProfile(null);
        }, 3000);
      }

      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      Logger.error('HomeScreen: Error processing like', error);
    }
  };

  const handleSuperLike = async (profile) => {
    try {
      const result = await MatchService.processSwipe(profile.id, 'superlike');
      setHistory([...history, { profile, action: 'superlike' }]);

      if (result.isMatch) {
        setMatchedProfile(profile);
        setMatchAnimVisible(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setTimeout(() => {
          setMatchAnimVisible(false);
          setMatchedProfile(null);
        }, 3000);
      }

      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      Logger.error('HomeScreen: Error processing superlike', error);
    }
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const lastAction = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setCurrentIndex(currentIndex - 1);
      Alert.alert('Visszavonva', `${lastAction.action} visszavonva`);
    }
  };

  const handleStoryPress = (index) => {
    setSelectedStoryIndex(index);
    setStoriesVisible(true);
  };

  const handleOpenVideoProfile = () => {
    setVideoModalVisible(true);
  };

  const handleToggleVerifiedFilter = () => {
    const newFilters = { ...searchFilters, verifiedOnly: !searchFilters.verifiedOnly };
    setSearchFilters(newFilters);
    saveDiscoveryFilters(newFilters);
    loadProfiles();
  };

  const handleBoost = () => {
    navService.goToBoost();
  };

  const handleOpenMap = () => {
    navService.goToPassport();
  };

  const handleOpenSearch = () => {
    navService.goToSearch();
  };

  const handleToggleAI = () => {
    // AI mode toggle logic
  };

  const handleToggleSugarDating = () => {
    setSugarDatingMode(!sugarDatingMode);
    AsyncStorage.setItem('sugarDatingMode', (!sugarDatingMode).toString());
  };

  const handleAIFilter = async () => {
    if (aiInputText && aiInputText.trim()) {
      setAiDescription(aiInputText.trim());
      setAiModalVisible(false);
      setAiInputText('');

      // Apply AI filter
      try {
        const aiProfiles = await AIRecommendationService.getRecommendations(aiInputText.trim());
        setProfiles(aiProfiles);
        setCurrentIndex(0);
      } catch (error) {
        Logger.error('HomeScreen: Error applying AI filter', error);
      }
    }
  };

  const currentProfile = profiles[currentIndex];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Profilok betöltése...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: theme.colors.text }]}>Felfedezés</Text>
        </View>

        <View style={styles.center}>
          <Ionicons name="search" size={50} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            Nincs több profil a jelenlegi szűrők alapján
          </Text>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setAiModalVisible(true)}
          >
            <Text style={styles.filterButtonText}>AI Szűrő módosítása</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: theme.colors.text }]}>Felfedezés</Text>

        {/* Filter Icon */}
        <TouchableOpacity
          style={styles.filterIcon}
          onPress={() => setAiModalVisible(true)}
        >
          <Ionicons name="filter" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stories Bar */}
      <View style={styles.storiesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.addStoryButton}
            onPress={() => Alert.alert('Story', 'Story létrehozás hamarosan elérhető!')}
          >
            <View style={[styles.addStoryIcon, { borderColor: theme.colors.primary }]}>
              <Ionicons name="add" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.addStoryText, { color: theme.colors.text }]}>Saját</Text>
          </TouchableOpacity>

          {stories.map((story, index) => (
            <StoryCircle
              key={story.id}
              story={story}
              onPress={() => handleStoryPress(index)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Profile Card */}
      <View style={styles.cardContainer}>
        <SwipeCard
          profile={currentProfile}
          onSwipeLeft={() => handleSwipeLeft(currentProfile)}
          onSwipeRight={() => handleSwipeRight(currentProfile)}
          onSuperLike={() => handleSuperLike(currentProfile)}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => handleSwipeLeft(currentProfile)}
          disabled={currentIndex >= profiles.length}
        >
          <Ionicons name="close" size={24} color="#FF4444" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.superLikeButton]}
          onPress={() => handleSuperLike(currentProfile)}
          disabled={currentIndex >= profiles.length}
        >
          <Ionicons name="star" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => handleSwipeRight(currentProfile)}
          disabled={currentIndex >= profiles.length}
        >
          <Ionicons name="heart" size={24} color="#FF4444" />
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleUndo}
          disabled={history.length === 0}
        >
          <Ionicons name="refresh" size={20} color={history.length > 0 ? theme.colors.primary : theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleOpenVideoProfile}
          disabled={currentIndex >= profiles.length}
        >
          <Ionicons name="videocam" size={20} color={theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleBoost}
        >
          <Ionicons name="flash" size={20} color="#FFFFFF" />
          <Text style={styles.boostText}>Boost</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleOpenMap}
        >
          <Ionicons name="map" size={20} color={theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleOpenSearch}
        >
          <Ionicons name="search" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Match Animation */}
      <MatchAnimation
        visible={matchAnimVisible}
        profile={matchedProfile}
        onClose={() => setMatchAnimVisible(false)}
      />

      {/* Story Viewer */}
      <StoryViewer
        visible={storiesVisible}
        stories={stories}
        initialIndex={selectedStoryIndex}
        onClose={() => setStoriesVisible(false)}
      />

      {/* Video Profile Modal */}
      <VideoProfile
        visible={videoModalVisible}
        profile={currentProfile}
        onClose={() => setVideoModalVisible(false)}
      />

      {/* AI Filter Modal */}
      <Modal
        visible={aiModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              AI Szűrő
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              Írd le, milyen partnert keresel
            </Text>

            <TextInput
              style={[styles.aiInput, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
              placeholder="Pl: sportos, könyvmoly, kalandvágyó..."
              placeholderTextColor={theme.colors.textSecondary}
              value={aiInputText}
              onChangeText={setAiInputText}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAiModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Mégse</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAIFilter}
              >
                <Text style={styles.modalButtonText}>Alkalmaz</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 20,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  filterIcon: {
    padding: 8,
  },
  storiesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  addStoryButton: {
    alignItems: 'center',
    marginRight: 15,
  },
  addStoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  addStoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 20,
  },
  actionButton: {
    width: ACTION_BUTTON_SIZE,
    height: ACTION_BUTTON_SIZE,
    borderRadius: ACTION_BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  superLikeButton: {
    backgroundColor: '#FFD700',
    transform: [{ scale: 1.1 }],
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  boostText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  aiInput: {
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
