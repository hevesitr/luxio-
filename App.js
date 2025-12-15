import { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PreferencesProvider } from './src/context/PreferencesContext';
import { NotificationProvider } from './src/context/NotificationContext';
import CookieConsentManager from './src/components/CookieConsentManager';
import MatchService from './src/services/MatchService';
import { queryClient } from './src/config/queryClient';

// Phase 1: Critical Security Services
import { idempotencyService } from './src/services/IdempotencyService';
import { deviceFingerprintService } from './src/services/DeviceFingerprintService';
import { piiRedactionService } from './src/services/PIIRedactionService';

// Phase 2: High Priority Services
import { NetworkProvider } from './src/context/NetworkContext';
import OfflineModeIndicator from './src/components/OfflineModeIndicator';

// ✅ REAL SCREEN IMPLEMENTATIONS - Import actual screens from src/screens/
import HomeScreen from './src/screens/HomeScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
// ✅ REAL SCREEN IMPLEMENTATIONS - Import all actual screens
import SettingsScreen from './src/screens/SettingsScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import VerificationScreen from './src/screens/VerificationScreen';
import SafetyScreen from './src/screens/SafetyScreen';
import BoostScreen from './src/screens/BoostScreen';
import LikesYouScreen from './src/screens/LikesYouScreen';
import TopPicksScreen from './src/screens/TopPicksScreen';
import PremiumScreen from './src/screens/PremiumScreen';
import PassportScreen from './src/screens/PassportScreen';
import ProfileDetailScreen from './src/screens/ProfileDetailScreen';
import SocialMediaScreen from './src/screens/SocialMediaScreen';
import SpotifyScreen from './src/screens/SpotifyScreen';
import GhostModeScreen from './src/screens/GhostModeScreen';
import GiftsScreen from './src/screens/GiftsScreen';
import CreditsScreen from './src/screens/CreditsScreen';
import ProfileViewsScreen from './src/screens/ProfileViewsScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import LookalikesScreen from './src/screens/LookalikesScreen';
import VideoChatScreen from './src/screens/VideoChatScreen';
import ChatScreen from './src/screens/ChatScreen';
import AIRecommendationsScreen from './src/screens/AIRecommendationsScreen';
import MapScreen from './src/screens/MapScreen';
import VideosScreen from './src/screens/VideosScreen';
import SugarDaddyScreen from './src/screens/SugarDaddyScreen';
import SugarBabyScreen from './src/screens/SugarBabyScreen';
import EventsScreen from './src/screens/EventsScreen';
import ProfilePromptsScreen from './src/screens/ProfilePromptsScreen';
import PersonalityTestScreen from './src/screens/PersonalityTestScreen';
import GamificationScreen from './src/screens/GamificationScreen';
import SearchScreen from './src/screens/SearchScreen';
import ConsentScreen from './src/screens/ConsentScreen';
import DataExportScreen from './src/screens/DataExportScreen';
import DeleteAccountScreen from './src/screens/DeleteAccountScreen';
import PrivacySettingsScreen from './src/screens/PrivacySettingsScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import PasswordResetScreen from './src/screens/PasswordResetScreen';
import WebViewScreen from './src/screens/WebViewScreen';
import LiveStreamScreen from './src/screens/LiveStreamScreen';
import IncomingCallScreen from './src/screens/IncomingCallScreen';
import ChatRoomScreen from './src/screens/ChatRoomScreen';
import ChatRoomsScreen from './src/screens/ChatRoomsScreen';
import PhotoUploadScreen from './src/screens/PhotoUploadScreen';
import HelpScreen from './src/screens/HelpScreen';
// ✅ Phase 3: Legal Screens
import TermsScreen from './src/screens/TermsScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
// ✅ Phase 4: Missing Screens - Added Dec 07, 2025
import BlockedUsersScreen from './src/screens/BlockedUsersScreen';
import PauseAccountScreen from './src/screens/PauseAccountScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import PasswordResetRequestScreen from './src/screens/PasswordResetRequestScreen';
import PasswordChangeScreen from './src/screens/PasswordChangeScreen';
import NewPasswordScreen from './src/screens/NewPasswordScreen';
import EmailVerificationSuccessScreen from './src/screens/EmailVerificationSuccessScreen';
import LegalUpdateScreen from './src/screens/LegalUpdateScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

function AuthStackScreens() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="PasswordReset" component={PasswordResetScreen} />
      <AuthStack.Screen name="Consent" component={ConsentScreen} />
      <AuthStack.Screen name="WebView" component={WebViewScreen} />
    </AuthStack.Navigator>
  );
}

function ProfileStack({ addMatch, matches, removeMatch }) {
  // Note: We removed the ref because function components cannot receive refs directly
  // The tab reset functionality is handled by React Navigation automatically

  return (
    <Stack.Navigator
      initialRouteName="ProfileMain"
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="SocialMedia" component={SocialMediaScreen} />
      <Stack.Screen name="Spotify" component={SpotifyScreen} />
      <Stack.Screen name="GhostMode" component={GhostModeScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Verification" component={VerificationScreen} />
      <Stack.Screen name="Safety" component={SafetyScreen} />
      <Stack.Screen name="Boost" component={BoostScreen} />
      <Stack.Screen name="LikesYou" component={LikesYouScreen} />
      <Stack.Screen name="TopPicks" component={TopPicksScreen} />
      <Stack.Screen name="Premium" component={PremiumScreen} />
      <Stack.Screen name="Passport" component={PassportScreen} />
      <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
      <Stack.Screen name="Gifts" component={GiftsScreen} />
      <Stack.Screen name="Credits" component={CreditsScreen} />
      <Stack.Screen name="ProfileViews" component={ProfileViewsScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="Lookalikes" component={LookalikesScreen} />
      <Stack.Screen name="VideoChat" component={VideoChatScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="AIRecommendations">
        {(props) => <AIRecommendationsScreen {...props} onMatch={addMatch} />}
      </Stack.Screen>
      <Stack.Screen name="Map">
        {(props) => <MapScreen {...props} onMatch={addMatch} onUnmatch={removeMatch} matches={matches} />}
      </Stack.Screen>
      <Stack.Screen name="SugarDaddy" component={SugarDaddyScreen} />
      <Stack.Screen name="SugarBaby" component={SugarBabyScreen} />
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="ProfilePrompts" component={ProfilePromptsScreen} />
      <Stack.Screen name="PersonalityTest" component={PersonalityTestScreen} />
      <Stack.Screen name="Gamification" component={GamificationScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Consent" component={ConsentScreen} />
      <Stack.Screen name="DataExport" component={DataExportScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
      <Stack.Screen name="WebView" component={WebViewScreen} />
      <Stack.Screen name="Videos" component={VideosScreen} />
      <Stack.Screen name="LiveStream" component={LiveStreamScreen} />
      <Stack.Screen name="IncomingCall" component={IncomingCallScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen name="ChatRooms" component={ChatRoomsScreen} />
      <Stack.Screen name="PhotoUpload" component={PhotoUploadScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      {/* ✅ Missing Screens - Added Dec 07, 2025 */}
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
      <Stack.Screen name="PauseAccount" component={PauseAccountScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="PasswordResetRequest" component={PasswordResetRequestScreen} />
      <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />
      <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
      <Stack.Screen name="EmailVerificationSuccess" component={EmailVerificationSuccessScreen} />
      <Stack.Screen name="LegalUpdate" component={LegalUpdateScreen} />
      {/* ✅ Legal Screens */}
      <Stack.Screen 
        name="Terms" 
        component={TermsScreen}
        options={{ title: 'ÁSZF' }}
      />
      <Stack.Screen 
        name="Privacy" 
        component={PrivacyScreen}
        options={{ title: 'Adatvédelem' }}
      />
    </Stack.Navigator>
  );
}

function TabNavigator({ matches, addMatch, removeMatch }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [profileStackKey, setProfileStackKey] = useState(0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Felfedezés') {
              iconName = focused ? 'flame' : 'flame-outline';
            } else if (route.name === 'Matchek') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'Profil') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          headerShown: false,
          tabBarActiveTintColor: theme.colors.text,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.colors.background,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            paddingTop: 8,
          },
        })}
    >
      <Tab.Screen
        name="Felfedezés"
        children={(props) => <HomeScreen {...props} route={props.route} onMatch={addMatch} matches={matches} />}
      />
      <Tab.Screen
        name="Matchek"
        children={(props) => <MatchesScreen {...props} matches={matches} navigation={props.navigation} removeMatch={removeMatch} />}
      />
      <Tab.Screen
        name="Profil"
        options={{ unmountOnBlur: true }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            // Always force navigation to ProfileMain and remount the stack
            setProfileStackKey(prev => prev + 1);
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{
                  name: 'Profil',
                  state: {
                    routes: [{
                      name: 'ProfileMain',
                      params: {
                        resetTimestamp: Date.now(),
                      },
                    }],
                  },
                }],
              })
            );
          },
        })}
      >
        {(props) => (
          <ProfileStack
            key={`profile-stack-${profileStackKey}`}
            {...props}
            addMatch={addMatch}
            matches={matches}
            removeMatch={removeMatch}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function RootNavigator({ matches, addMatch, removeMatch }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  if (!user) {
    return <AuthStackScreens />;
  }

  return (
    <TabNavigator matches={matches} addMatch={addMatch} removeMatch={removeMatch} />
  );
}

// ✅ Styles removed - screens now use their own styles

export default function App() {
  const [matches, setMatches] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [servicesInitialized, setServicesInitialized] = useState(false);

  // Phase 1: Initialize Critical Security Services
  useEffect(() => {
    const initializeSecurityServices = async () => {
      try {
        console.log('[App] Initializing basic app services...');
        console.log('[App] ✓ Basic services ready');
        
        setServicesInitialized(true);
        console.log('[App] ✅ App initialized successfully');
      } catch (error) {
        console.error('[App] Error initializing app:', error);
        // Continue app initialization even if some services fail
        setServicesInitialized(true);
      }
    };

    const initializePhase2Services = async () => {
      try {
        console.log('[App] Initializing Phase 2 services...');

        const { rateLimitService } = await import('./src/services/RateLimitService');
        const { encryptionService } = await import('./src/services/EncryptionService');
        const { auditService } = await import('./src/services/AuditService');

        await rateLimitService.initialize();
        console.log('[App] ✓ Rate limit service initialized');

        await encryptionService.initialize();
        console.log('[App] ✓ Encryption service initialized');

        await auditService.initialize();
        console.log('[App] ✓ Audit service initialized');

        console.log('[App] ✅ All Phase 2 services initialized');
      } catch (error) {
        console.error('[App] ❌ Phase 2 init error:', error);
      }
    };

    initializeSecurityServices();
    initializePhase2Services();
  }, []);

  // Matchek betöltése az alkalmazás indításakor
  useEffect(() => {
    const loadMatches = async () => {
      try {
        const userId = 'guest'; // Default user ID for initial load
        const savedMatches = await MatchService.loadMatches(userId);
        setMatches(savedMatches || []); // Ensure matches is always an array
        console.log('App.js: Matches loaded from storage for user', userId, ':', savedMatches?.length || 0);
      } catch (error) {
        console.error('App.js: Error loading matches:', error);
        setMatches([]); // Set empty array on error
      } finally {
        setIsLoadingMatches(false);
      }
    };

    // Wait for services to initialize before loading matches
    if (servicesInitialized) {
      loadMatches();
    }
  }, [servicesInitialized]);

  // Matchek mentése, amikor változnak
  useEffect(() => {
    if (!isLoadingMatches && matches && matches.length > 0) {
      const userId = 'guest'; // Default user ID for saving
      MatchService.saveMatches(matches, userId);
      console.log('App.js: Matches saved for user', userId, ':', matches.length);
    }
  }, [matches, isLoadingMatches])

  const addMatch = async (profile) => {
    console.log('App.js: addMatch called with profile:', profile?.name, profile?.id);
    const userId = 'guest'; // Default user ID
    setMatches(prev => {
      const prevMatches = prev || []; // Ensure prev is an array
      const alreadyMatched = prevMatches.some(match => match.id === profile.id);
      if (alreadyMatched) {
        console.log('App.js: Profile already matched, skipping:', profile.name);
        return prevMatches;
      }
      console.log('App.js: Adding new match:', profile.name);
      const newMatches = [...prevMatches, { ...profile, matchedAt: new Date().toISOString() }];
      MatchService.saveMatches(newMatches, userId);
      return newMatches;
    });
  };

  const removeMatch = async (profileId) => {
    console.log('App.js: removeMatch called with profileId:', profileId);
    try {
      const userId = 'guest'; // Default user ID
      setMatches(prev => {
        const prevMatches = prev || []; // Ensure prev is an array
        const filtered = prevMatches.filter(match => match.id !== profileId);
        console.log('App.js: Match removed, remaining matches:', filtered.length);
        MatchService.saveMatches(filtered, userId);
        return filtered;
      });
    } catch (error) {
      console.error('App.js: Error removing match:', error);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <PreferencesProvider>
            <NotificationProvider>
              <NetworkProvider>
                <SafeAreaProvider>
                  <NavigationContainer>
                    <RootNavigator matches={matches} addMatch={addMatch} removeMatch={removeMatch} />
                    <OfflineModeIndicator />
                    <CookieConsentManager />
                  </NavigationContainer>
                </SafeAreaProvider>
              </NetworkProvider>
            </NotificationProvider>
          </PreferencesProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

