import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  Text,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Components
import SwipeCard from '../components/SwipeCard';
import MatchAnimation from '../components/MatchAnimation';
import ChatScreen from './ChatScreen';
import StoryViewer from '../components/StoryViewer';
import VideoProfile from '../components/VideoProfile';
import ProfileDetailScreen from './ProfileDetailScreen';

// Discovery Components
import {
  FilterBar,
  ActionButtons,
  StoryBar,
  AISearchModal,
  SugarDatingModal,
  EmptyState,
} from '../components/discovery';

// Data & Services
import { profiles as initialProfiles } from '../data/profiles';
import { currentUser } from '../data/userProfile';
import StoryService from '../services/StoryService';
import GamificationService from '../services/GamificationService';
import AIRecommendationService from '../services/AIRecommendationService';
import MatchService from '../services/MatchService';
import SupabaseMatchService from '../services/SupabaseMatchService';
import PaymentService from '../services/PaymentService';
import Logger from '../services/Logger';

// Contexts
import { useTheme } from '../context/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HomeScreen = ({ onMatch, navigation, matches = [], route }) => {
  const { theme } = useTheme();
  const { getDiscoveryFilters, saveDiscoveryFilters } = usePreferences();
  const { user } = useAuth();

  // Profile state
  const [profiles, setProfiles] = useState(initialProfiles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Match state
  const [matchAnimVisible, setMatchAnimVisible] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);

  // Chat state
  const [chatVisible, setChatVisible] = useState(false);
  const [chatProfile, setChatProfile] = useState(null);
  const [returnToMatchPopup, setReturnToMatchPopup] = useState(false);

  // Story state
  const [stories, setStories] = useState([]);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [storyViewerIndex, setStoryViewerIndex] = useState(0);
  const [storiesVisible, setStoriesVisible] = useState(true);

  // Video state
  const [videoProfileVisible, setVideoProfileVisible] = useState(false);
  const [videoProfile, setVideoProfile] = useState(null);

  // Profile detail state
  const [profileDetailVisible, setProfileDetailVisible] = useState(false);
  const [detailProfile, setDetailProfile] = useState(null);

  // Filter state
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [searchFilters, setSearchFilters] = useState(null);

  // AI mode state
  const [aiModeEnabled, setAiModeEnabled] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [aiModalVisible, setAiModalVisible] = useState(false);

  // Sugar dating state
  const [sugarDatingMode, setSugarDatingMode] = useState(false);
  const [sugarDatingIntroShown, setSugarDatingIntroShown] = useState(false);

  const cardRef = useRef(null);
