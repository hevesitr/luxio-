/**
 * HomeScreen Integration Example
 * Ez egy példa, hogyan integráld az új service-eket a HomeScreen-be
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useNotifications } from '../contexts/NotificationContext';
import SupabaseMatchService from '../services/SupabaseMatchService';
import LocationService from '../services/LocationService';
import AnalyticsService from '../services/AnalyticsService';
import Logger from '../services/Logger';

export default function HomeScreenIntegration({ navigation, onMatch, matches }) {
  const { user } = useAuth();
  const { getDiscoveryFilters, updateDiscoveryFilters } = usePreferences();
  const { unreadCount } = useNotifications();
  
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [location, setLocation] = useState(null);
  const [swipeLimit, setSwipeLimit] = useState(null);

  // Location permission és betöltés
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Profilok betöltése
  useEffect(() => {
    if (user && location) {
      loadProfiles();
      checkSwipeLimit();
    }
  }, [user, location]);

  // Analytics tracking
  useEffect(() => {
    AnalyticsService.trackScreen('HomeScreen');
  }, []);

  /**
   * Location permission kérése
   */
  const requestLocationPermission = async () => {
    try {
      const permission = await LocationService.requestPermission();
      
      if (permission.success) {
        const loc = await LocationService.getCurrentLocation();
        
        if (loc.success) {
          setLocation(loc.data);
          
          // Felhasználó helyzetének frissítése az adatbázisban
          await LocationService.updateUserLocation(user.id, loc.data);
          
          Logger.success('Location obtained', loc.data);
        }
      } else {
        Alert.alert(
          'Helymeghatározás',
          'A helymeghatározás engedélyezése szükséges a közeli profilok megjelenítéséhez.'
        );
      }
    } catch (error) {
      Logger.error('Location permission failed', error);
    }
  };

  /**
   * Profilok betöltése szűrőkkel
   */
  const loadProfiles = async () => {
    try {
      setLoading(true);

      // Szűrők lekérése a PreferencesContext-ből
      const filters = getDiscoveryFilters();

      // Discovery feed lekérése kompatibilitási pontszámmal
      const result = await SupabaseMatchService.getDiscoveryFeedWithCompatibility(user.id);

      if (result.success) {
        setProfiles(result.data);
        setCurrentIndex(0);
        
        Logger.success('Profiles loaded', { count: result.data.length });
        
        // Analytics event
        AnalyticsService.trackEvent(AnalyticsService.eventTypes.SCREEN_VIEWED, {
          screen: 'discovery_feed',
          profile_count: result.data.length,
        });
      } else {
        Alert.alert('Hiba', result.error);
      }
    } catch (error) {
      Logger.error('Load profiles failed', error);
      Alert.alert('Hiba', 'Nem sikerült betölteni a profilokat');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Napi swipe limit ellenőrzése
   */
  const checkSwipeLimit = async () => {
    try {
      const result = await SupabaseMatchService.checkSwipeLimit(user.id);
      
      if (result.success) {
        setSwipeLimit(result.data);
        
        if (result.data.exceeded) {
          Alert.alert(
            'Napi limit elérve',
            'Elérted a napi 100 swipe limitet. Válts prémiumra a korlátlan swipe-okért!',
            [
              { text: 'Később', style: 'cancel' },
              { text: 'Prémium', onPress: () => navigation.navigate('Premium') },
            ]
          );
        }
      }
    } catch (error) {
      Logger.error('Check swipe limit failed', error);
    }
  };

  /**
   * Swipe right (like)
   */
  const handleSwipeRight = async (profile) => {
    try {
      // Swipe limit ellenőrzése
      if (swipeLimit?.exceeded) {
        Alert.alert(
          'Napi limit elérve',
          'Válts prémiumra a korlátlan swipe-okért!',
          [
            { text: 'Később', style: 'cancel' },
            { text: 'Prémium', onPress: () => navigation.navigate('Premium') },
          ]
        );
        return;
      }

      // Like mentése
      const result = await SupabaseMatchService.saveLike(user.id, profile.id);

      if (result.success) {
        // Analytics event
        AnalyticsService.trackEvent(AnalyticsService.eventTypes.PROFILE_SWIPED_RIGHT, {
          target_user_id: profile.id,
          compatibility_score: profile.compatibilityScore,
        });

        // Ha match történt
        if (result.isMatch) {
          Alert.alert('Match! 💕', `Match-eltél ${profile.first_name}-val!`);
          
          // Match hozzáadása
          if (onMatch) {
            onMatch(profile);
          }

          // Analytics event
          AnalyticsService.trackEvent(AnalyticsService.eventTypes.MATCH_CREATED, {
            matched_user_id: profile.id,
            compatibility_score: profile.compatibilityScore,
          });
        }

        // Következő profil
        setCurrentIndex(prev => prev + 1);
        
        // Swipe limit frissítése
        checkSwipeLimit();
      }
    } catch (error) {
      Logger.error('Swipe right failed', error);
      Alert.alert('Hiba', 'Nem sikerült a like mentése');
    }
  };

  /**
   * Swipe left (pass)
   */
  const handleSwipeLeft = async (profile) => {
    try {
      // Swipe limit ellenőrzése
      if (swipeLimit?.exceeded) {
        Alert.alert(
          'Napi limit elérve',
          'Válts prémiumra a korlátlan swipe-okért!'
        );
        return;
      }

      // Pass mentése
      const result = await SupabaseMatchService.savePass(user.id, profile.id);

      if (result.success) {
        // Analytics event
        AnalyticsService.trackEvent(AnalyticsService.eventTypes.PROFILE_SWIPED_LEFT, {
          target_user_id: profile.id,
        });

        // Következő profil
        setCurrentIndex(prev => prev + 1);
        
        // Swipe limit frissítése
        checkSwipeLimit();
      }
    } catch (error) {
      Logger.error('Swipe left failed', error);
      Alert.alert('Hiba', 'Nem sikerült a pass mentése');
    }
  };

  /**
   * Szűrők frissítése
   */
  const handleUpdateFilters = async (newFilters) => {
    try {
      const result = await updateDiscoveryFilters(newFilters);
      
      if (result.success) {
        // Profilok újratöltése az új szűrőkkel
        loadProfiles();
        
        Alert.alert('Siker', 'Szűrők frissítve');
      }
    } catch (error) {
      Logger.error('Update filters failed', error);
      Alert.alert('Hiba', 'Nem sikerült a szűrők frissítése');
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text style={{ marginTop: 10 }}>Profilok betöltése...</Text>
      </View>
    );
  }

  // Empty state
  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 24, marginBottom: 10 }}>😔</Text>
        <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
          Nincs több profil a környéken
        </Text>
        <Text style={{ textAlign: 'center', color: '#666' }}>
          Próbáld meg bővíteni a szűrőket vagy nézz vissza később!
        </Text>
      </View>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <View style={{ flex: 1 }}>
      {/* Swipe limit indicator */}
      {swipeLimit && !swipeLimit.hasLimit && (
        <View style={{ padding: 10, backgroundColor: '#FFD700' }}>
          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>
            ⭐ Korlátlan swipe-ok (Prémium)
          </Text>
        </View>
      )}
      
      {swipeLimit && swipeLimit.hasLimit && (
        <View style={{ padding: 10, backgroundColor: '#f0f0f0' }}>
          <Text style={{ textAlign: 'center' }}>
            Napi swipe-ok: {swipeLimit.used}/{swipeLimit.limit} (Még {swipeLimit.remaining})
          </Text>
        </View>
      )}

      {/* Unread notifications */}
      {unreadCount > 0 && (
        <View style={{ padding: 10, backgroundColor: '#FF6B6B' }}>
          <Text style={{ textAlign: 'center', color: 'white', fontWeight: 'bold' }}>
            {unreadCount} új értesítés
          </Text>
        </View>
      )}

      {/* Profile card */}
      <View style={{ flex: 1, padding: 20 }}>
        <View style={{ 
          flex: 1, 
          backgroundColor: 'white', 
          borderRadius: 20, 
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 5 }}>
            {currentProfile.first_name}, {currentProfile.age}
          </Text>
          
          {currentProfile.distance && (
            <Text style={{ fontSize: 16, color: '#666', marginBottom: 10 }}>
              📍 {LocationService.formatDistance(currentProfile.distance, 'hu')} távolságra
            </Text>
          )}

          {currentProfile.compatibilityScore && (
            <View style={{ 
              backgroundColor: '#8A2BE2', 
              padding: 10, 
              borderRadius: 10, 
              marginBottom: 10 
            }}>
              <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                🎯 Kompatibilitás: {currentProfile.compatibilityScore}%
              </Text>
            </View>
          )}

          <Text style={{ fontSize: 16, marginBottom: 20 }}>
            {currentProfile.bio}
          </Text>

          {/* Swipe buttons */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-around', 
            marginTop: 'auto' 
          }}>
            <TouchableOpacity
              onPress={() => handleSwipeLeft(currentProfile)}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#FF6B6B',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 30 }}>✕</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSwipeRight(currentProfile)}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#4ECDC4',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 30 }}>♥</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
