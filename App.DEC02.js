import React, { useState, useEffect, useRef } from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity, LogBox } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Context providers
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PreferencesProvider } from './src/context/PreferencesContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { DemoModeProvider } from './src/context/DemoModeContext';

// Services
import NetInfo from '@react-native-community/netinfo';
import MatchService from './src/services/MatchService';
import SupabaseMatchService from './src/services/SupabaseMatchService';
import MessageService from './src/services/MessageService';
import ProfileService from './src/services/ProfileService';
import Logger from './src/services/Logger';
import AuthService from './src/services/AuthService';
import SentryService from './src/services/SentryService';
import OfflineQueueService from './src/services/OfflineQueueService';
import SyncManager from './src/services/SyncManager';
import DeepLinkingService from './src/services/DeepLinkingService';
import NotificationService from './src/services/NotificationService';

// Components
import EnhancedErrorBoundary from './src/components/EnhancedErrorBoundary';
import OfflineIndicator from './src/components/OfflineIndicator';

// Screen imports from centralized file
import * as Screens from './src/navigation/screenImports';

// Initialize i18n
import './src/config/i18n';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Require cycle:',
  'VirtualizedLists should never be nested',
  'Non-serializable values were found in the navigation state',
]);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

// Enhanced Suspense wrapper with error boundary for lazy-loaded components
function LazyScreen({ component: Component, ...props }) {
  const Fallback = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <ActivityIndicator size="large" color="#8A2BE2" />
    </View>
  );

  return (
    <EnhancedErrorBoundary
      fallback={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#000' }}>
          <Ionicons name="warning" size={48} color="#FF3B30" />
          <Text style={{ color: '#fff', marginTop: 16, textAlign: 'center' }}>
            Hiba történt a komponens betöltése közben. Kérjük, próbáld újra később.
          </Text>
        </View>
      }
    >
      <React.Suspense fallback={<Fallback />}>
        <Component {...props} />
      </React.Suspense>
    </EnhancedErrorBoundary>
  );
}

function AuthStackScreens() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={Screens.LoginScreen} />
      <AuthStack.Screen name="Register" component={Screens.RegisterScreen} />
      <AuthStack.Screen name="AgeVerification">
        {(props) => <LazyScreen component={Screens.AgeVerificationScreen} {...props} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="Onboarding" component={Screens.OnboardingScreen} />
      <AuthStack.Screen name="Demo" component={Screens.DemoScreen} />
      <AuthStack.Screen name="PasswordReset">
        {(props) => <LazyScreen component={Screens.PasswordResetScreen} {...props} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="ResetPassword">
        {(props) => <LazyScreen component={Screens.ResetPasswordScreen} {...props} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="Consent">
        {(props) => <LazyScreen component={Screens.ConsentScreen} {...props} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="PrivacyPolicy">
        {(props) => <LazyScreen component={Screens.PrivacyPolicyScreen} {...props} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="TermsOfService">
        {(props) => <LazyScreen component={Screens.TermsOfServiceScreen} {...props} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="CommunityGuidelines">
        {(props) => <LazyScreen component={Screens.CommunityGuidelinesScreen} {...props} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="WebView">
        {(props) => <LazyScreen component={Screens.WebViewScreen} {...props} />}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function ProfileStack({ addMatch, matches, removeMatch }) {
  const navigation = useNavigation();

  // Reset stack when tab comes into focus - simplified approach
  useEffect(() => {
    const parent = navigation.getParent();
    if (!parent) return;

    const unsubscribe = parent.addListener('tabPress', (e) => {
      // Always navigate to ProfileMain when tab is pressed
      navigation.reset({
        index: 0,
        routes: [{ name: 'ProfileMain' }],
      });
    });

    return unsubscribe;
  }, [navigation]);

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
      <Stack.Screen name="ProfileMain" component={Screens.ProfileScreen} />
      <Stack.Screen name="SocialMedia">
        {(props) => <LazyScreen component={Screens.SocialMediaScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="Settings">
        {(props) => <LazyScreen component={Screens.SettingsScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="PhotoUpload" component={Screens.PhotoUploadScreen} />
      <Stack.Screen name="Analytics">
        {(props) => <LazyScreen component={Screens.AnalyticsScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="Verification">
        {(props) => <LazyScreen component={Screens.VerificationScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="Safety">
        {(props) => <LazyScreen component={Screens.SafetyScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="Boost">
        {(props) => <LazyScreen component={Screens.BoostScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="LikesYou">
        {(props) => <LazyScreen component={Screens.LikesYouScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="TopPicks">
        {(props) => <LazyScreen component={Screens.TopPicksScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="Premium">
        {(props) => <LazyScreen component={Screens.PremiumScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="SubscriptionManagement">
        {(props) => <LazyScreen component={Screens.SubscriptionManagementScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="Passport">
        {(props) => <LazyScreen component={Screens.PassportScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="ProfileDetail">
        {(props) => <LazyScreen component={Screens.ProfileDetailScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="Gifts">
        {(props) => <LazyScreen component={Screens.GiftsScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="Credits">
        {(props) => <LazyScreen component={Screens.CreditsScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="ProfileViews">
        {(props) => <LazyScreen component={Screens.ProfileViewsScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="Favorites">
        {(props) => <LazyScreen component={Screens.FavoritesScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="Lookalikes">
        {(props) => <LazyScreen component={Screens.LookalikesScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="VideoChat">
        {(props) => <LazyScreen component={Screens.VideoChatScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="AIRecommendations">
        {(props) => <LazyScreen component={Screens.AIRecommendationsScreen} {...props} onMatch={addMatch} />}
      </Stack.Screen>
      <Stack.Screen name="Map" component={Screens.MapScreen} matches={matches} onMatch={addMatch} onUnmatch={removeMatch} />
      <Stack.Screen name="SugarDaddy" component={Screens.SugarDaddyScreen} />
      <Stack.Screen name="SugarBaby">
        {(props) => <LazyScreen component={Screens.SugarBabyScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="Events" component={Screens.EventsScreen} />
      <Stack.Screen name="ProfilePrompts">
        {(props) => <LazyScreen component={Screens.ProfilePromptsScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="PersonalityTest">
        {(props) => <LazyScreen component={Screens.PersonalityTestScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="Gamification">
        {(props) => <LazyScreen component={Screens.GamificationScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="Search">
        {(props) => <LazyScreen component={Screens.SearchScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="Consent">
        {(props) => <LazyScreen component={Screens.ConsentScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="DataExport">
        {(props) => <LazyScreen component={Screens.DataExportScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="DeleteAccount">
        {(props) => <LazyScreen component={Screens.DeleteAccountScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="BlockedUsers">
        {(props) => <LazyScreen component={Screens.BlockedUsersScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="ChangePassword">
        {(props) => <LazyScreen component={Screens.ChangePasswordScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="NotificationPreferences">
        {(props) => <LazyScreen component={Screens.NotificationPreferencesScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="PrivacyPolicy">
        {(props) => <LazyScreen component={Screens.PrivacyPolicyScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="TermsOfService">
        {(props) => <LazyScreen component={Screens.TermsOfServiceScreen} {...props} />}
      </Stack.Screen>
      {/* Chat and Call Screens */}
      <Stack.Screen name="ChatRooms" component={Screens.ChatRoomsScreen} />
      <Stack.Screen name="ChatRoom" component={Screens.ChatRoomScreen} />
      <Stack.Screen name="PrivateChat" component={Screens.PrivateChatScreen} />
      <Stack.Screen
        name="EnhancedChat"
        component={Screens.EnhancedChatScreen}
        options={({ route }) => ({
          title: route.params?.match?.name || 'Csevegés',
          headerBackTitle: 'Vissza'
        })}
      />
      <Stack.Screen name="VoiceCall" component={Screens.VoiceCallScreen} options={{ headerShown: false }} />
      <Stack.Screen name="LiveStream" component={Screens.LiveStreamScreen} options={{ headerShown: false }} />
      <Stack.Screen name="IncomingCall" component={Screens.IncomingCallScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VideoCall" component={Screens.VideoCallScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CommunityGuidelines">
        {(props) => <LazyScreen component={Screens.CommunityGuidelinesScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="WebView">
        {(props) => <LazyScreen component={Screens.WebViewScreen} {...props} />}
      </Stack.Screen>
      <Stack.Screen name="OTPVerification">
        {(props) => <LazyScreen component={Screens.OTPVerificationScreen} {...props} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function TabNavigator({ matches, addMatch, removeMatch }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Felfedezés') {
            iconName = focused ? 'flame' : 'flame-outline';
          } else if (route.name === 'Események') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Matchek') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Videók') {
            iconName = focused ? 'play-circle' : 'play-circle-outline';
          } else if (route.name === 'Profil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          // Matchek gomb nagyobb legyen (középen)
          const iconSize = route.name === 'Matchek' ? size + 6 : size;

          return <Ionicons name={iconName} size={iconSize} color={color} />;
        },
        headerShown: false,
        tabBarActiveTintColor: theme.primary || '#FF69B4',
        tabBarInactiveTintColor: theme.textSecondary || 'rgba(255, 255, 255, 0.5)',
        tabBarStyle: {
          backgroundColor: theme.background || '#000',
          borderTopWidth: 1,
          borderTopColor: theme.border || 'rgba(255, 255, 255, 0.1)',
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
          paddingHorizontal: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
      })}
    >
      <Tab.Screen
        name="Felfedezés"
        children={(props) => <Screens.HomeScreen {...props} route={props.route} onMatch={addMatch} matches={matches} />}
        options={{
          tabBarLabel: 'Felfedezés',
        }}
      />
      <Tab.Screen
        name="Események"
        component={Screens.EventsScreen}
        options={{
          tabBarLabel: 'Események',
        }}
      />
      <Tab.Screen
        name="Matchek"
        children={(props) => <Screens.MatchesScreen {...props} matches={matches} removeMatch={removeMatch} />}
        options={{
          tabBarLabel: 'Matchek',
        }}
      />
      <Tab.Screen
        name="Videók"
        component={Screens.ShortVideosScreen}
        options={{
          tabBarLabel: 'Videók',
        }}
      />
      <Tab.Screen
        name="Profil"
        options={{
          unmountOnBlur: true,
          tabBarLabel: 'Profil',
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default behavior
            e.preventDefault();
            // Navigate to ProfileMain directly
            navigation.navigate('Profil', {
              screen: 'ProfileMain',
              initial: false,
            });
          },
        })}
      >
        {(props) => (
          <ProfileStack
            {...props}
            addMatch={addMatch}
            matches={matches}
            removeMatch={removeMatch}
            navigation={props.navigation}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const RootNavigator = ({ matches, addMatch, removeMatch }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
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
};

const App = () => {
  const [matches, setMatches] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const navigationRef = useRef(null);

  // Initialize Sentry, AuthService, and Offline services on app startup
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize Sentry first for crash reporting
        Logger.info('App.js: Initializing Sentry...');
        SentryService.initialize();
        Logger.success('App.js: Sentry initialized successfully');

        // Initialize AuthService
        Logger.info('App.js: Initializing AuthService...');
        await AuthService.initialize();
        Logger.success('App.js: AuthService initialized successfully');

        // Initialize Offline Queue Service - TEMPORARILY DISABLED
        // Logger.info('App.js: Initializing OfflineQueueService...');
        // await OfflineQueueService.initialize();
        // Logger.success('App.js: OfflineQueueService initialized successfully');

        // Initialize Sync Manager - TEMPORARILY DISABLED
        // Logger.info('App.js: Initializing SyncManager...');
        // await SyncManager.initialize();
        // Logger.success('App.js: SyncManager initialized successfully');

        // Initialize offline support for services
        Logger.info('App.js: Initializing offline support for services...');
        await MatchService.initializeOfflineSupport();
        await MessageService.initializeOfflineSupport();
        await ProfileService.initializeOfflineSupport();
        Logger.success('App.js: Offline support initialized for all services');

        // Initialize NotificationService - TEMPORARILY DISABLED (causing critical error)
        // Logger.info('App.js: Initializing NotificationService...');
        // await NotificationService.initialize();
        // Logger.success('App.js: NotificationService initialized successfully');

        setAuthInitialized(true);
      } catch (error) {
        Logger.error('App.js: Failed to initialize services', error);
        SentryService.captureException(error, { context: 'App initialization' });
        // Allow app to start even if initialization fails
        setAuthInitialized(true);
      }
    };
    initializeServices();
  }, []);

  // Initialize DeepLinkingService when navigation is ready
  useEffect(() => {
    if (navigationRef.current) {
      Logger.info('App.js: Initializing DeepLinkingService...');
      DeepLinkingService.initialize(navigationRef);
      Logger.success('App.js: DeepLinkingService initialized successfully');
    }
  }, [navigationRef.current]);

  // Matchek betöltése az alkalmazás indításakor
  useEffect(() => {
    const loadMatches = async () => {
      try {
        const savedMatches = await MatchService.loadMatches();
        setMatches(savedMatches);
        Logger.info('App.js: Matches loaded from storage', { count: savedMatches.length });
      } catch (error) {
        Logger.error('App.js: Error loading matches', error);
      } finally {
        setIsLoadingMatches(false);
      }
    };
    loadMatches();
  }, []);

  // Offline sync: NetInfo listener a hálózat állapot változásához
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      Logger.debug('Network state changed', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable
      });

      // Ha online lett a kapcsolat, szinkronizáljuk az offline match-eket
      if (state.isConnected && state.isInternetReachable) {
        Logger.info('Network restored, syncing offline matches');
        syncOfflineMatches();
      }
    });

    return () => unsubscribe();
  }, []);

  // Offline match-ek szinkronizálása
  const syncOfflineMatches = async () => {
    try {
      // TODO: Implementáld a currentUser.id lekérését az AuthContext-ből
      // Egyelőre kikapcsolva, mert nincs valódi user ID
      Logger.debug('Offline sync skipped - no authenticated user');
      return;

      /* Uncomment when authentication is implemented:
      const { user } = useAuth();
      if (!user?.id) {
        Logger.debug('Offline sync skipped - no user ID');
        return;
      }

      const result = await SupabaseMatchService.syncOfflineMatches(user.id);

      if (result.success) {
        Logger.success('Offline matches synced', { count: result.count });
      } else {
        Logger.warn('Offline sync failed', { error: result.error });
      }
      */
    } catch (error) {
      Logger.error('Offline sync error', error);
    }
  };

  // Matchek mentése, amikor változnak
  useEffect(() => {
    if (!isLoadingMatches) {
      MatchService.saveMatches(matches);
    }
  }, [matches, isLoadingMatches]);

  const addMatch = async (profile) => {
    Logger.debug('App.js: addMatch called', {
      profileName: profile?.name,
      profileId: profile?.id
    });
    // Ellenőrizd, hogy már létezik-e ez a match
    setMatches(prev => {
      const alreadyMatched = prev.some(match => match.id === profile.id);
      if (alreadyMatched) {
        Logger.debug('App.js: Profile already matched, skipping', { profileName: profile.name });
        return prev; // Ne add hozzá újra
      }
      Logger.success('App.js: Adding new match', { profileName: profile.name });
      const newMatches = [...prev, { ...profile, matchedAt: new Date().toISOString() }];
      // Async mentés
      MatchService.saveMatches(newMatches);
      return newMatches;
    });
  };

  const removeMatch = async (profileId) => {
    Logger.debug('App.js: removeMatch called', { profileId });
    try {
      setMatches(prev => {
        const filtered = prev.filter(match => match.id !== profileId);
        Logger.info('App.js: Match removed', { remainingMatches: filtered.length });
        MatchService.saveMatches(filtered);
        return filtered;
      });
    } catch (error) {
      Logger.error('App.js: Error removing match', error);
    }
  };

  if (!authInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  return (
    <EnhancedErrorBoundary
      showDetails={__DEV__}
      onError={(error, errorInfo) => {
        console.error('App Error Boundary caught an error:', error, errorInfo);
        if (SentryService.captureException) {
          SentryService.captureException(error, { extra: { errorInfo } });
        }
      }}
      fallback={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
          <Ionicons name="sad-outline" size={64} color="#8A2BE2" />
          <Text style={{ color: '#fff', fontSize: 18, marginTop: 16, textAlign: 'center', paddingHorizontal: 20 }}>
            Sajnáljuk, váratlan hiba történt az alkalmazásban.
          </Text>
          <Text style={{ color: '#888', marginTop: 8, textAlign: 'center', paddingHorizontal: 20 }}>
            Az alkalmazás újraindításához kérjük, indítsd újra az alkalmazást.
          </Text>
        </View>
      }
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AuthProvider>
            <PreferencesProvider>
              <NotificationProvider>
                <NetworkProvider>
                  <DemoModeProvider>
                    <SafeAreaProvider>
                      <NavigationContainer
                        ref={navigationRef}
                        theme={{
                          dark: false,
                          colors: {
                            primary: '#8A2BE2',
                            background: '#000',
                            card: '#1A1A1A',
                            text: '#FFFFFF',
                            border: '#333333',
                            notification: '#FF3B30',
                          },
                        }}
                        onReady={() => {
                          console.log('Navigation is ready');
                        }}
                        onStateChange={(state) => {
                          console.log('Navigation state changed');
                        }}
                      >
                        <EnhancedErrorBoundary>
                          <RootNavigator
                            matches={matches}
                            addMatch={addMatch}
                            removeMatch={removeMatch}
                          />
                        </EnhancedErrorBoundary>
                        <OfflineIndicator />
                      </NavigationContainer>
                    </SafeAreaProvider>
                  </DemoModeProvider>
                </NetworkProvider>
              </NotificationProvider>
            </PreferencesProvider>
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </EnhancedErrorBoundary>
  );
};

export default App;