import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import MatchService from './src/services/MatchService';

import HomeScreen from './src/screens/HomeScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
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
import GiftsScreen from './src/screens/GiftsScreen';
import CreditsScreen from './src/screens/CreditsScreen';
import ProfileViewsScreen from './src/screens/ProfileViewsScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import LookalikesScreen from './src/screens/LookalikesScreen';
import VideoChatScreen from './src/screens/VideoChatScreen';
import AIRecommendationsScreen from './src/screens/AIRecommendationsScreen';
import MapScreen from './src/screens/MapScreen';
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
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import PasswordResetScreen from './src/screens/PasswordResetScreen';
import WebViewScreen from './src/screens/WebViewScreen';

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

function ProfileStack({ addMatch, matches, removeMatch, navigation: tabNavigation }) {
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
      <Stack.Screen name="WebView" component={WebViewScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
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
        listeners={{
          tabPress: (e) => {
            // Reset navigation stack when switching to Home tab
            const navigation = e.target?.split('-')[0];
            if (navigation) {
              // No need to reset, HomeScreen is a direct screen
            }
          },
        }}
      />
      <Tab.Screen 
        name="Matchek" 
        children={(props) => <MatchesScreen {...props} matches={matches} navigation={props.navigation} removeMatch={removeMatch} />}
        listeners={{
          tabPress: (e) => {
            // Reset navigation stack when switching to Matches tab
            const navigation = e.target?.split('-')[0];
            if (navigation) {
              // No need to reset, MatchesScreen is a direct screen
            }
          },
        }}
      />
      <Tab.Screen 
        name="Profil"
        options={{ unmountOnBlur: true }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            // Force remount of the Profile stack so it always opens on ProfileMain
            setProfileStackKey(prev => prev + 1);
            navigation.dispatch(
              CommonActions.navigate({
                name: 'Profil',
                params: {
                  screen: 'ProfileMain',
                  params: {
                    resetTimestamp: Date.now(),
                  },
                },
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
            navigation={props.navigation}
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

export default function App() {
  const [matches, setMatches] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  // Matchek betöltése az alkalmazás indításakor
  useEffect(() => {
    const loadMatches = async () => {
      try {
        const savedMatches = await MatchService.loadMatches();
        setMatches(savedMatches);
        console.log('App.js: Matches loaded from storage:', savedMatches.length);
      } catch (error) {
        console.error('App.js: Error loading matches:', error);
      } finally {
        setIsLoadingMatches(false);
      }
    };
    loadMatches();
  }, []);

  // Matchek mentése, amikor változnak
  useEffect(() => {
    if (!isLoadingMatches) {
      MatchService.saveMatches(matches);
    }
  }, [matches, isLoadingMatches]);

  const addMatch = async (profile) => {
    console.log('App.js: addMatch called with profile:', profile?.name, profile?.id);
    // Ellenőrizd, hogy már létezik-e ez a match
    setMatches(prev => {
      const alreadyMatched = prev.some(match => match.id === profile.id);
      if (alreadyMatched) {
        console.log('App.js: Profile already matched, skipping:', profile.name);
        return prev; // Ne add hozzá újra
      }
      console.log('App.js: Adding new match:', profile.name);
      const newMatches = [...prev, { ...profile, matchedAt: new Date().toISOString() }];
      // Async mentés
      MatchService.saveMatches(newMatches);
      return newMatches;
    });
  };

  const removeMatch = async (profileId) => {
    console.log('App.js: removeMatch called with profileId:', profileId);
    try {
      setMatches(prev => {
        const filtered = prev.filter(match => match.id !== profileId);
        console.log('App.js: Match removed, remaining matches:', filtered.length);
        // Async mentés
        MatchService.saveMatches(filtered);
        return filtered;
      });
    } catch (error) {
      console.error('App.js: Error removing match:', error);
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <RootNavigator matches={matches} addMatch={addMatch} removeMatch={removeMatch} />
          </NavigationContainer>
        </SafeAreaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

