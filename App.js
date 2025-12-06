import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// ✅ PERFORMANCE: Lazy loading screens - csak akkor töltődnek be, amikor szükséges
const HomeScreen = lazy(() => import('./src/screens/HomeScreen'));
const MatchesScreen = lazy(() => import('./src/screens/MatchesScreen'));
const ChatScreen = lazy(() => import('./src/screens/ChatScreen'));
const ProfileScreen = lazy(() => import('./src/screens/ProfileScreen'));
const SettingsScreen = lazy(() => import('./src/screens/SettingsScreen'));
const PremiumScreen = lazy(() => import('./src/screens/PremiumScreen'));
const BoostScreen = lazy(() => import('./src/screens/BoostScreen'));
const SearchScreen = lazy(() => import('./src/screens/SearchScreen'));
const LikesYouScreen = lazy(() => import('./src/screens/LikesYouScreen'));
const TopPicksScreen = lazy(() => import('./src/screens/TopPicksScreen'));
const PassportScreen = lazy(() => import('./src/screens/PassportScreen'));
const VerificationScreen = lazy(() => import('./src/screens/VerificationScreen'));
const AnalyticsScreen = lazy(() => import('./src/screens/AnalyticsScreen'));
const GamificationScreen = lazy(() => import('./src/screens/GamificationScreen'));
const SafetyScreen = lazy(() => import('./src/screens/SafetyScreen'));
const SocialMediaScreen = lazy(() => import('./src/screens/SocialMediaScreen'));
const EditProfileModal = lazy(() => import('./src/components/EditProfileModal')); // Modal, nem screen
const ProfileDetailScreen = lazy(() => import('./src/screens/ProfileDetailScreen'));
const GiftsScreen = lazy(() => import('./src/screens/GiftsScreen'));
const LookalikesScreen = lazy(() => import('./src/screens/LookalikesScreen'));
const EmailVerificationSuccessScreen = lazy(() => import('./src/screens/EmailVerificationSuccessScreen'));
const BlockedUsersScreen = lazy(() => import('./src/screens/BlockedUsersScreen'));

// Loading component for lazy loading
const ScreenLoader = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#FF3B75" />
    <Text style={{ marginTop: 10, color: '#666' }}>Képernyő betöltése...</Text>
  </View>
);

// Import services
import AuthService from './src/services/AuthService';
import Logger from './src/services/Logger';
import NavigationService from './src/services/NavigationService';
import DeepLinkingService from './src/services/DeepLinkingService';

// Import contexts
import { AuthProvider } from './src/contexts/AuthContext';
import { PreferencesProvider } from './src/contexts/PreferencesContext';
import { NotificationProvider } from './src/contexts/NotificationContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ✅ PERFORMANCE: Lazy loaded Simple Stack Navigator
function SimpleStack() {
  return (
    <Suspense fallback={<ScreenLoader />}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
        <Stack.Screen name="EmailVerificationSuccess" component={EmailVerificationSuccessScreen} />
        <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
        <Stack.Screen name="Matches" component={MatchesScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="TopPicks" component={TopPicksScreen} />
        <Stack.Screen name="Passport" component={PassportScreen} />
        <Stack.Screen name="Boost" component={BoostScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Premium" component={PremiumScreen} />
        <Stack.Screen name="Verification" component={VerificationScreen} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} />
        <Stack.Screen name="Gamification" component={GamificationScreen} />
        <Stack.Screen name="Safety" component={SafetyScreen} />
        <Stack.Screen name="SocialMedia" component={SocialMediaScreen} />
      <Stack.Screen name="Gifts" component={GiftsScreen} />
      <Stack.Screen name="Lookalikes" component={LookalikesScreen} />
      <Stack.Screen name="LikesYou" component={LikesYouScreen} />
    </Stack.Navigator>
    </Suspense>
  );
}

export default function App() {
  const [authInitialized, setAuthInitialized] = useState(false);
  const navigationRef = useRef(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        Logger.info('App.js: Initializing AuthService...');
        await AuthService.initialize();
        Logger.success('App.js: AuthService initialized successfully');
        setAuthInitialized(true);
      } catch (error) {
        Logger.error('App.js: Failed to initialize AuthService', error);
        setAuthInitialized(true); // Continue even on error
      }
    };

    initializeAuth();

    // Initialize DeepLinkingService
    const initializeDeepLinking = async () => {
      try {
        await DeepLinkingService.initialize();

        // Set up deep link event listeners
        const unsubscribe = DeepLinkingService.addListener((event, data) => {
          switch (event) {
            case 'emailVerified':
              Logger.info('Email verification successful, navigating to success screen');
              NavigationService.navigate('EmailVerificationSuccess');
              break;
            case 'passwordResetReady':
              Logger.info('Password reset ready, navigating to reset screen');
              // TODO: Navigate to password reset screen when implemented
              break;
            case 'authCallbackError':
              Logger.error('Auth callback error', data);
              // TODO: Show error message to user
              break;
            default:
              break;
          }
        });

        Logger.success('App.js: DeepLinkingService initialized successfully');
      } catch (error) {
        Logger.error('App.js: Failed to initialize DeepLinkingService', error);
      }
    };

    initializeDeepLinking();
  }, []);

  const onNavigationReady = () => {
    if (navigationRef.current) {
      NavigationService.setTopLevelNavigator(navigationRef.current);
    }
  };

  if (!authInitialized) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Alkalmazás inicializálása...</Text>
      </SafeAreaView>
    );
  }

  return (
    <AuthProvider>
      <PreferencesProvider>
        <NotificationProvider>
          <NavigationContainer ref={navigationRef} onReady={onNavigationReady}>
            <SimpleStack />
          </NavigationContainer>
        </NotificationProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
