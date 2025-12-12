import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Animated, Dimensions, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LiveMapView from '../components/LiveMapView';
import LocationService from '../services/LocationService';
import MatchService from '../services/MatchService';
import { profiles } from '../data/profiles';
import ProfileDetailScreen from './ProfileDetailScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MapScreen = ({ navigation, route, onMatch: onMatchProp, matches: matchesProp, onUnmatch: onUnmatchProp }) => {
  // Get onMatch from props (passed from App.js) or route params (fallback)
  const onMatch = onMatchProp || route?.params?.onMatch; // Callback to add match to matches list
  const onUnmatch = onUnmatchProp || route?.params?.onUnmatch; // Callback to remove match from matches list
  const matches = matchesProp || route?.params?.matches || []; // Get matches from App.js
  const returnToMatchPopup = route?.params?.returnToMatchPopup || false; // Flag to return to match popup
  const showOnlySelectedProfile = route?.params?.showOnlySelectedProfile || false; // Flag to limit map to a single profile
  const matchPopupParams = route?.params?.matchPopupParams || null; // Match popup parameters
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyProfiles, setNearbyProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [profileCardVisible, setProfileCardVisible] = useState(false);
  const [matchedProfiles, setMatchedProfiles] = useState(new Set()); // Track matched profile IDs
  const [likedProfiles, setLikedProfiles] = useState(new Set()); // Track liked profile IDs (sent heart)
  const [locationError, setLocationError] = useState(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(300)).current;
  const mapRef = React.useRef(null); // Ref to preserve map region

  // Liked profilok betöltése az alkalmazás indításakor
  useEffect(() => {
    const loadLikedProfiles = async () => {
      try {
        const savedLiked = await MatchService.loadLikedProfiles();
        setLikedProfiles(savedLiked);
        console.log('MapScreen: Liked profiles loaded from storage:', savedLiked.size);
      } catch (error) {
        console.error('MapScreen: Error loading liked profiles:', error);
      }
    };
    loadLikedProfiles();
  }, []);

  // Liked profilok mentése, amikor változnak
  useEffect(() => {
    if (likedProfiles.size > 0) {
      MatchService.saveLikedProfiles(likedProfiles);
    }
  }, [likedProfiles]);

  useEffect(() => {
    loadLocationAndProfiles();
  }, []);

  const loadLocationAndProfiles = async () => {
    try {
      setIsRequestingLocation(true);
      const location = await LocationService.getCurrentLocation();
      setIsRequestingLocation(false);
      if (!location) {
        setLocationError('Nem sikerült lekérni a pozíciódat. Engedélyezd a helyhozzáférést.');
      } else {
        setLocationError(null);
      }
      
      // Ha van selectedProfileId és returnToMatchPopup flag, csak azt a profilt mutassuk
      const selectedProfileId = route?.params?.selectedProfileId;
      if (selectedProfileId && (returnToMatchPopup || showOnlySelectedProfile)) {
        const selectedProfileParam = route?.params?.selectedProfile;
        const profile = profiles.find(p => p.id === selectedProfileId) || selectedProfileParam;
        
        if (profile) {
          // Ensure profile has location (use default if missing)
          const profileLocation = profile.location || { latitude: 47.4979, longitude: 19.0402 }; // Budapest default
          
          // Calculate distance if user location is available
          let distance = null;
          if (location) {
            distance = LocationService.calculateDistance(
              location.latitude,
              location.longitude,
              profileLocation.latitude,
              profileLocation.longitude
            );
          }
          
          const profileWithDistance = {
            ...profile,
            location: profileLocation,
            distance: distance,
          };
          
          // Add to matchedProfiles Set so it shows on map
          setMatchedProfiles(new Set([profile.id]));
          
          setNearbyProfiles([profileWithDistance]);
          setUserLocation(location);
          return; // Exit early, don't load all matches
        }
      }
      
      // Csak a matchelt profilokat mutatjuk
      // Biztosítjuk, hogy matches mindig egy tömb
      const safeMatches = Array.isArray(matches) ? matches : [];
      const matchedProfileIds = new Set(safeMatches.map(m => m?.id).filter(id => id !== undefined));
      
      // Szűrés: csak azok a profilok, akik engedik a térképen való megjelenítést
      const matchedProfilesList = profiles.filter(p => 
        p && 
        p.id && 
        matchedProfileIds.has(p.id) &&
        (p.showOnMap !== false) // Ha nincs beállítva, akkor true (alapértelmezett)
      );
      
      // Frissítsük a matchedProfiles Set-et a matches-ből FIRST
      setMatchedProfiles(matchedProfileIds);
      console.log('MapScreen: Set matchedProfiles to:', Array.from(matchedProfileIds));
      
      // Update nearbyProfiles based on current matches
      // Filter out any profiles that are no longer in matches
      if (location) {
        setUserLocation(location);
        const updatedProfiles = LocationService.updateProfileDistances(matchedProfilesList, location);
        const nearby = updatedProfiles
          .filter(p => p && (!p.distance || p.distance <= 50)) // 50 km-en belül
          .sort((a, b) => (a.distance || 0) - (b.distance || 0));
        setNearbyProfiles(nearby);
      } else {
        // Ha nincs GPS, akkor is mutassuk a matchelt profilokat
        setNearbyProfiles(matchedProfilesList);
      }
      
      // Ha van olyan match, aki nem engedélyezi a térképen való megjelenítést, jelezzük
      const hiddenMatches = safeMatches.filter(m => {
        const profile = profiles.find(p => p.id === m.id);
        return profile && profile.showOnMap === false;
      });
      
      if (hiddenMatches.length > 0) {
        // Csak egyszer jelezzük, ne minden frissítésnél
        const lastNotification = await AsyncStorage.getItem('@map_hidden_notification');
        if (!lastNotification || Date.now() - parseInt(lastNotification) > 60000) { // 1 perc
          Alert.alert(
            'ℹ️ Térkép láthatóság',
            `${hiddenMatches.length} match nem jelenik meg a térképen, mert nem engedélyezték a térképen való megjelenítést.`
          );
          await AsyncStorage.setItem('@map_hidden_notification', Date.now().toString());
        }
      }
    } catch (error) {
      console.error('Error loading location and profiles:', error);
      // Fallback: ha hiba van, mutassunk üres listát
      setNearbyProfiles([]);
      setLocationError('Nem sikerült betölteni a térképet. Ellenőrizd a GPS engedélyt.');
    } finally {
      setIsRequestingLocation(false);
    }
  };
  
  // Check for selected profile from navigation params
  useEffect(() => {
    const selectedProfileId = route?.params?.selectedProfileId;
    const selectedProfileParam = route?.params?.selectedProfile;
    
      if (selectedProfileId) {
      // Find the profile in the profiles list or use the passed profile
      const profile = profiles.find(p => p.id === selectedProfileId) || selectedProfileParam;
      
      if (profile) {
        // If we have a selected profile from navigation, filter to show only that profile
        // First, ensure the profile is in the nearbyProfiles list
        const profileWithLocation = profile.location ? profile : {
          ...profile,
          location: profile.location || { latitude: 47.4979, longitude: 19.0402 } // Budapest default
        };
        
        // Update nearbyProfiles to show only this profile (only if returnToMatchPopup is true)
        if (returnToMatchPopup || showOnlySelectedProfile) {
          // Calculate distance if user location is available
          if (userLocation && profileWithLocation.location) {
            const distance = LocationService.calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              profileWithLocation.location.latitude,
              profileWithLocation.location.longitude
            );
            profileWithLocation.distance = distance;
          }
          
          // Set only this profile in nearbyProfiles
          setNearbyProfiles([profileWithLocation]);
          
          // Add to matchedProfiles Set so it shows on map
          setMatchedProfiles(new Set([profile.id]));
        }
        
        // Set the selected profile and show it on the map
        setSelectedProfile(profile);
        setProfileCardVisible(true);
        
        // Animate card sliding up
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
        
        // Center the map on the selected profile location
        if (profile.location && profile.location.latitude && profile.location.longitude) {
          // The map will center when we update the region
          // We'll pass this to LiveMapView via a key change
        }
      }
    }
  }, [route?.params?.selectedProfileId, showOnlySelectedProfile, returnToMatchPopup]);

  // Frissítés, ha a matches változik
  useEffect(() => {
    if (matches && Array.isArray(matches)) {
      // Create a string representation of match IDs for comparison
      const currentMatchIds = matches.map(m => m?.id).filter(id => id !== undefined).sort().join(',');
      const previousMatchIds = matchedProfiles.size > 0 
        ? [...matchedProfiles].sort().join(',')
        : '';
      
      // Only reload if the match IDs actually changed
      if (currentMatchIds !== previousMatchIds) {
        console.log('MapScreen: Matches changed, reloading profiles');
        loadLocationAndProfiles();
      }
    }
  }, [matches]);

  const handleProfilePress = (profile) => {
    if (!profile || !profile.id) {
      console.warn('MapScreen: handleProfilePress called with invalid profile:', profile);
      return;
    }
    
    try {
      console.log('MapScreen: handleProfilePress - profile:', profile.name, 'location:', profile.location);
      console.log('MapScreen: mapRef.current:', mapRef.current);
      
      setSelectedProfile(profile);
      setProfileCardVisible(true);
      // Animate card sliding up
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
      
      // Animate map to profile location
      // Try to get location from profile.location or find it in nearbyProfiles
      let profileLocation = profile.location;
      
      // If location is not directly on profile, try to find it in nearbyProfiles
      if (!profileLocation) {
        const fullProfile = nearbyProfiles.find(p => p.id === profile.id);
        if (fullProfile && fullProfile.location) {
          profileLocation = fullProfile.location;
          console.log('MapScreen: Found location in nearbyProfiles:', profileLocation);
        }
      }
      
      if (mapRef.current && profileLocation) {
        console.log('MapScreen: Calling animateToProfile with location:', profileLocation);
        mapRef.current.animateToProfile({ ...profile, location: profileLocation });
      } else {
        console.warn('MapScreen: Cannot animate - mapRef.current:', !!mapRef.current, 'profileLocation:', !!profileLocation);
      }
    } catch (error) {
      console.error('Error in handleProfilePress:', error);
    }
  };

  const handleCloseProfileCard = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setProfileCardVisible(false);
      setSelectedProfile(null);
      setShowProfileDetail(false); // Ensure full profile is also closed
    });
  };

  const handleOpenFullProfile = () => {
    // Close the compact card first, then open full profile
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setProfileCardVisible(false);
      // Keep selectedProfile for the full profile screen
      // Then open the full profile
      setShowProfileDetail(true);
    });
  };

  const handleUnmatch = async (profileId) => {
    if (!profileId) {
      console.warn('MapScreen: handleUnmatch called with invalid profileId');
      return;
    }

    try {
      // Remove from matches list in App.js FIRST (this updates the matches prop)
      if (onUnmatch) {
        console.log('MapScreen: Calling onUnmatch with profileId:', profileId);
        onUnmatch(profileId);
      } else {
        console.warn('MapScreen: onUnmatch callback is not available!');
      }

      // Remove from nearbyProfiles list IMMEDIATELY - this is critical!
      // Do this FIRST to ensure the marker disappears immediately
      setNearbyProfiles(prev => {
        const filtered = prev.filter(p => p && p.id !== profileId);
        console.log('MapScreen: Removed profile from nearbyProfiles, new count:', filtered.length);
        return filtered;
      });

      // Remove from matched profiles IMMEDIATELY
      setMatchedProfiles(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(profileId);
        // Create new Set to force React to detect the change
        return new Set([...newSet]);
      });

      // Remove from liked profiles IMMEDIATELY
      setLikedProfiles(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(profileId);
        // Create new Set to force React to detect the change
        return new Set([...newSet]);
      });

      // Close profile card if it's open
      if (selectedProfile && selectedProfile.id === profileId) {
        handleCloseProfileCard();
      }

      // Don't reload profiles immediately - wait for matches prop to update
      // The useEffect will handle the reload when matches.length changes
      // This prevents the profile from reappearing
      
      Alert.alert('✅ Match törölve', 'A match sikeresen törölve.');
    } catch (error) {
      console.error('MapScreen: Error in handleUnmatch:', error);
      Alert.alert('Hiba', 'Hiba történt az unmatch során. Kérlek próbáld újra.');
    }
  };

  const handleLike = (profile = null) => {
    const profileToLike = profile || selectedProfile;
    if (!profileToLike) return;
    
    // Add to liked profiles (sent heart) - always add, even if match
    setLikedProfiles(prev => {
      const newSet = new Set([...prev, profileToLike.id]);
      return newSet;
    });
    
    // Simulate match (30% chance)
    const isMatch = Math.random() < 0.3;
    
    if (isMatch) {
      // Add to matched profiles
      setMatchedProfiles(prev => {
        const newSet = new Set([...prev, profileToLike.id]);
        return newSet;
      });
      
      // Add to matches list (same as HomeScreen)
      if (onMatch) {
        console.log('MapScreen: Calling onMatch with profile:', profileToLike.name);
        onMatch({
          ...profileToLike,
          matchedAt: new Date().toISOString(),
        });
      } else {
        console.warn('MapScreen: onMatch callback is not available!');
      }
      
      // Show match alert - ne resetelje a térképet
      Alert.alert(
        '🎉 Match!',
        `Matcheltél ${profileToLike.name}val!`,
        [
          {
            text: 'Rendben',
            onPress: () => {
              // Don't close if opened from ProfileDetailScreen
              // Ne zárjuk be a profil kártyát, hogy a térkép zoom-ja megmaradjon
            },
          },
        ]
      );
    } else {
      // Just heart sent, no match yet - ne resetelje a térképet
      Alert.alert(
        '❤️ Szív elküldve',
        `Szív elküldve ${profileToLike.name}nak!`,
        [
          {
            text: 'Rendben',
            onPress: () => {
              // Ne zárjuk be a profil kártyát, hogy a térkép zoom-ja megmaradjon
            },
          },
        ]
      );
    }
  };

  const renderProfileItem = ({ item }) => {
    const isNearby = userLocation && item.distance && item.distance <= 10;
    
    return (
      <TouchableOpacity
        style={styles.profileItem}
        onPress={() => handleProfilePress(item)}
      >
        <View style={styles.profileImageContainer}>
          <Text style={styles.profileInitial}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <View style={styles.profileHeader}>
            <Text style={styles.profileName}>
              {item.name}, {item.age}
            </Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={18} color="#2196F3" />
            )}
          </View>
          {item.distance !== undefined && (
            <View style={styles.distanceRow}>
              <Ionicons
                name={isNearby ? 'location' : 'location-outline'}
                size={14}
                color={isNearby ? '#4CAF50' : 'rgba(255, 255, 255, 0.6)'}
              />
              <Text style={[styles.distanceText, isNearby && styles.distanceTextNearby]}>
                {isNearby ? 'Közelben' : `${item.distance} km`}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            // If we came from match popup, return to it
            if (returnToMatchPopup && matchPopupParams) {
              // Save match popup params to AsyncStorage so HomeScreen can read it
              AsyncStorage.setItem('@returnToMatchPopup', JSON.stringify({
                showMatchPopup: true,
                matchPopupParams: matchPopupParams,
              })).then(() => {
                // Navigate back to Home tab
                const parent = navigation.getParent();
                if (parent) {
                  parent.navigate('Felfedezés');
                } else {
                  navigation.goBack();
                }
              });
            } else {
              // Normal back navigation
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('Felfedezés');
              } else {
                navigation.goBack();
              }
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Térkép</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.mapContainer}>
        <LiveMapView
          ref={mapRef}
          key={`map-${matchedProfiles.size}-${likedProfiles.size}-${nearbyProfiles.length}`}
          profiles={nearbyProfiles}
          onProfilePress={handleProfilePress}
          currentUserLocation={userLocation}
          matchedProfiles={matchedProfiles}
          likedProfiles={likedProfiles}
          showProfileImages={true}
        />
        {console.log('MapScreen: Passing to LiveMapView - matchedProfiles:', Array.from(matchedProfiles), 'likedProfiles:', Array.from(likedProfiles), 'nearbyProfiles count:', nearbyProfiles.length)}
        {(locationError || isRequestingLocation) && (
          <View style={styles.locationOverlay}>
            <Ionicons name="navigate" size={22} color="#000" />
            <View style={styles.locationOverlayTexts}>
              <Text style={styles.locationOverlayTitle}>
                {isRequestingLocation ? 'Pozíció lekérése...' : 'Helyhozzáférés szükséges'}
              </Text>
              <Text style={styles.locationOverlaySubtitle}>
                {isRequestingLocation 
                  ? 'Várj egy pillanatot, a térkép frissül.'
                  : locationError || 'Kapcsold be a GPS-t, hogy megmutassuk a közelben lévő matcheket.'}
              </Text>
            </View>
            {!isRequestingLocation && (
              <TouchableOpacity
                style={styles.locationOverlayButton}
                onPress={loadLocationAndProfiles}
                activeOpacity={0.85}
              >
                <Text style={styles.locationOverlayButtonText}>Engedélyezem</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>
          {nearbyProfiles.length > 0 
            ? `${nearbyProfiles.length} Match${nearbyProfiles.length > 1 ? 'ek' : ''} ${userLocation ? 'közelben' : ''}`
            : 'Nincs match a térképen'}
        </Text>
        <FlatList
          data={nearbyProfiles}
          renderItem={renderProfileItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Compact Profile Card */}
      {profileCardVisible && selectedProfile && (
        <Animated.View
          style={[
            styles.profileCardContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.profileCard}
            activeOpacity={0.95}
            onPress={handleOpenFullProfile}
          >
            <View style={styles.profileCardHeader}>
              <View style={styles.profileCardImageContainer}>
                {selectedProfile.photo ? (
                  <Image
                    source={{ uri: selectedProfile.photo }}
                    style={styles.profileCardImage}
                  />
                ) : (
                  <View style={styles.profileCardImagePlaceholder}>
                    <Text style={styles.profileCardInitial}>
                      {selectedProfile.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                {selectedProfile.isVerified && (
                  <View style={styles.profileCardVerifiedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#2196F3" />
                  </View>
                )}
              </View>
              <View style={styles.profileCardInfo}>
                <View style={styles.profileCardNameRow}>
                  <Text style={styles.profileCardName}>
                    {selectedProfile.name}, {selectedProfile.age}
                  </Text>
                </View>
                {selectedProfile.distance !== undefined && (
                  <View style={styles.profileCardDistanceRow}>
                    <Ionicons
                      name={selectedProfile.distance <= 10 ? 'location' : 'location-outline'}
                      size={14}
                      color={selectedProfile.distance <= 10 ? '#4CAF50' : 'rgba(255, 255, 255, 0.6)'}
                    />
                    <Text style={[
                      styles.profileCardDistance,
                      selectedProfile.distance <= 10 && styles.profileCardDistanceNearby
                    ]}>
                      {selectedProfile.distance <= 10 ? 'Közelben' : `${selectedProfile.distance} km`}
                    </Text>
                  </View>
                )}
                {selectedProfile.bio && (
                  <Text style={styles.profileCardBio} numberOfLines={2}>
                    {selectedProfile.bio}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.profileCardCloseButton}
                onPress={handleCloseProfileCard}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.profileCardActions}>
              <TouchableOpacity
                style={styles.profileCardActionButton}
                onPress={() => {
                  // Ha match van, akkor unmatch, különben csak bezárás
                  if (selectedProfile && matchedProfiles.has(selectedProfile.id)) {
                    handleUnmatch(selectedProfile.id);
                  } else {
                    handleCloseProfileCard();
                  }
                }}
              >
                <Ionicons 
                  name={matchedProfiles.has(selectedProfile?.id) ? "heart-dislike" : "close-circle"} 
                  size={24} 
                  color="#F44336" 
                />
                <Text style={styles.profileCardActionText}>
                  {matchedProfiles.has(selectedProfile?.id) ? "Match törlése" : "Pass"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.profileCardActionButton, styles.profileCardActionButtonPrimary]}
                onPress={handleOpenFullProfile}
              >
                <Ionicons name="eye" size={24} color="#fff" />
                <Text style={[styles.profileCardActionText, styles.profileCardActionTextPrimary]}>
                  Részletek
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

              {/* Full Profile Detail Modal */}
              {showProfileDetail && selectedProfile && (
                <Modal
                  visible={showProfileDetail}
                  transparent={true}
                  animationType="slide"
                  onRequestClose={() => setShowProfileDetail(false)}
                >
                  <View style={styles.profileModalOverlay}>
                    <TouchableOpacity
                      style={styles.profileModalBackdrop}
                      activeOpacity={1}
                      onPress={() => setShowProfileDetail(false)}
                    />
                    <View style={styles.profileModalContainer}>
                      <View style={styles.profileModalHandle} />
                      <TouchableOpacity
                        style={styles.profileModalCloseButton}
                        onPress={() => setShowProfileDetail(false)}
                      >
                        <Ionicons name="close" size={24} color="#fff" />
                      </TouchableOpacity>
                      <View style={styles.profileModalContent}>
                        <ProfileDetailScreen
                          route={{ 
                            params: { 
                              profile: selectedProfile,
                              onLike: handleLike,
                              onMatch: onMatch,
                              onUnmatch: handleUnmatch,
                              hideActionButtons: true, // Hide action buttons in map modal
                            } 
                          }}
                          navigation={{
                            goBack: () => {
                              setShowProfileDetail(false);
                            },
                            navigate: navigation.navigate,
                          }}
                        />
                      </View>
                    </View>
                  </View>
                </Modal>
              )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
  locationOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  locationOverlayTexts: {
    flex: 1,
    gap: 4,
  },
  locationOverlayTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  locationOverlaySubtitle: {
    fontSize: 13,
    color: '#333',
  },
  locationOverlayButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  locationOverlayButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  listContainer: {
    height: 120,
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 12,
    marginLeft: 20,
    width: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF3B75',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  distanceTextNearby: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  profileCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  profileCard: {
    backgroundColor: 'rgba(20, 20, 20, 0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    borderLeftColor: 'rgba(255, 255, 255, 0.15)',
    borderRightColor: 'rgba(255, 255, 255, 0.15)',
    maxHeight: SCREEN_HEIGHT * 0.35,
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileCardImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileCardImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FF3B75',
  },
  profileCardImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF3B75',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF3B75',
  },
  profileCardInitial: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  profileCardVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'rgba(20, 20, 20, 0.98)',
    borderRadius: 12,
  },
  profileCardInfo: {
    flex: 1,
    paddingRight: 8,
  },
  profileCardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  profileCardName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginRight: 8,
  },
  profileCardDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  profileCardDistance: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  profileCardDistanceNearby: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  profileCardBio: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  profileCardCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  profileCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileCardActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  profileCardActionButtonPrimary: {
    backgroundColor: '#FF3B75',
  },
  profileCardActionButtonLike: {
    backgroundColor: '#4CAF50',
  },
  profileCardActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profileCardActionTextPrimary: {
    color: '#fff',
  },
  profileModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  profileModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  profileModalContainer: {
    height: '75%',
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  profileModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  profileModalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  profileModalContent: {
    flex: 1,
    overflow: 'hidden',
  },
});

export default MapScreen;

