import React, { useState, useEffect, useRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LocationService from '../services/LocationService';
import RouteService from '../services/RouteService';

// Conditional import for react-native-maps
let MapView, Marker, Callout, Polyline;
try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Callout = maps.Callout;
  Polyline = maps.Polyline;
} catch (error) {
  console.warn('react-native-maps not available, using fallback');
  MapView = null;
  Marker = null;
  Callout = null;
  Polyline = null;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Pulzáló match szívek komponens
const MatchedHeartsMarker = React.memo(() => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const markerStyles = {
    matchedHeartsMarker: {
      width: 56,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 59, 117, 0.25)',
      borderRadius: 28,
      borderWidth: 3,
      borderColor: '#FF3B75',
      position: 'relative',
      shadowColor: '#FF3B75',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 8,
      elevation: 8,
    },
    heartWrapper1: {
      position: 'absolute',
      left: 6,
      top: 10,
      transform: [{ rotate: '-25deg' }],
    },
    heartWrapper2: {
      position: 'absolute',
      right: 6,
      top: 10,
      transform: [{ rotate: '25deg' }],
    },
  };

  return (
    <Animated.View style={[markerStyles.matchedHeartsMarker, { transform: [{ scale: pulseAnim }] }]}>
      <View style={markerStyles.heartWrapper1}>
        <Ionicons name="heart" size={22} color="#FF3B75" />
      </View>
      <View style={markerStyles.heartWrapper2}>
        <Ionicons name="heart" size={22} color="#FF3B75" />
      </View>
    </Animated.View>
  );
});

// Helper function to generate route-like coordinates (simulated road route)
// Note: In production, use Google Directions API or Mapbox Directions API for real routing
const generateRouteCoordinates = (lat1, lon1, lat2, lon2) => {
  // Calculate intermediate points to simulate a road route
  // This creates a curved path with multiple waypoints that simulates following roads
  const numPoints = 25; // More points for smoother curve
  const coordinates = [];
  
  // Calculate distance and direction
  const latDiff = lat2 - lat1;
  const lonDiff = lon2 - lon1;
  const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
  
  // Create waypoints that simulate road routing
  // Use multiple control points to create a more realistic path
  const controlPoint1Lat = lat1 + latDiff * 0.33;
  const controlPoint1Lon = lon1 + lonDiff * 0.33;
  const controlPoint2Lat = lat1 + latDiff * 0.67;
  const controlPoint2Lon = lon1 + lonDiff * 0.67;
  
  // Add perpendicular offsets to simulate road turns
  const perpOffset = Math.min(distance * 0.15, 0.0015); // Max 0.0015 degrees offset
  const perpLat1 = -lonDiff * perpOffset;
  const perpLon1 = latDiff * perpOffset;
  const perpLat2 = lonDiff * perpOffset * 0.7;
  const perpLon2 = -latDiff * perpOffset * 0.7;
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    
    // Cubic Bezier curve for smooth, road-like path
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;
    
    const lat = mt3 * lat1 + 
                3 * mt2 * t * (controlPoint1Lat + perpLat1) + 
                3 * mt * t2 * (controlPoint2Lat + perpLat2) + 
                t3 * lat2;
    
    const lon = mt3 * lon1 + 
                3 * mt2 * t * (controlPoint1Lon + perpLon1) + 
                3 * mt * t2 * (controlPoint2Lon + perpLon2) + 
                t3 * lon2;
    
    coordinates.push({ latitude: lat, longitude: lon });
  }
  
  return coordinates;
};

const LiveMapView = React.forwardRef(({ profiles, onProfilePress, currentUserLocation, matchedProfiles = new Set(), likedProfiles = new Set(), showProfileImages = true }, ref) => {
  const [userLocation, setUserLocation] = useState(currentUserLocation);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [mapRegion, setMapRegion] = useState(null); // Preserve map region
  const [profileLocations, setProfileLocations] = useState(new Map()); // Track profile locations for real-time updates
  const [routeCoordinates, setRouteCoordinates] = useState(new Map()); // Cache route coordinates per profile
  const mapViewRef = useRef(null); // Ref for MapView to enable animateToRegion
  const isAnimatingRef = useRef(false); // Track if we're currently animating

  useEffect(() => {
    loadUserLocation();
  }, []);

  // Update profile locations when profiles prop changes
  useEffect(() => {
    const locations = new Map();
    profiles.forEach(profile => {
      if (profile && profile.id && profile.location) {
        locations.set(profile.id, {
          latitude: profile.location.latitude,
          longitude: profile.location.longitude,
          timestamp: Date.now(),
        });
      }
    });
    setProfileLocations(locations);
  }, [profiles]);

  // Real-time location updates for online users (simulate with interval)
  useEffect(() => {
    if (profiles.length === 0) return;

    // Simulate real-time location updates for online users
    // In a real app, this would come from a WebSocket or polling API
    const interval = setInterval(() => {
      setProfileLocations(prev => {
        const updated = new Map(prev);
        profiles.forEach(profile => {
          if (profile && profile.id && profile.location && profile.online) {
            // Simulate small movement for online users (in real app, get from server)
            const current = prev.get(profile.id);
            if (current) {
              // Add small random movement (0.0001 degrees ≈ 11 meters)
              const movement = 0.0001;
              updated.set(profile.id, {
                latitude: current.latitude + (Math.random() - 0.5) * movement * 0.1,
                longitude: current.longitude + (Math.random() - 0.5) * movement * 0.1,
                timestamp: Date.now(),
              });
            }
          }
        });
        return updated;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [profiles]);

  const loadUserLocation = async () => {
    const location = await LocationService.getCurrentLocation();
    if (location) {
      setUserLocation(location);
      setIsLocationEnabled(true);
    }
  };

  const toggleLocation = async () => {
    if (isLocationEnabled) {
      setIsLocationEnabled(false);
      setUserLocation(null);
    } else {
      await loadUserLocation();
    }
  };

  // Use preserved region if available, otherwise calculate from user location or profiles
  // If there's only one profile, center on it with a tighter zoom
  const region = mapRegion || (profiles.length === 1 && profiles[0].location
    ? {
        latitude: profiles[0].location.latitude,
        longitude: profiles[0].location.longitude,
        latitudeDelta: 0.05, // Tighter zoom for single profile
        longitudeDelta: 0.05,
      }
    : userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }
    : profiles.length > 0 && profiles[0].location
    ? {
        latitude: profiles[0].location.latitude,
        longitude: profiles[0].location.longitude,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      }
    : {
        latitude: 47.4979, // Budapest default
        longitude: 19.0402,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
  
  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    animateToProfile: (profile) => {
      if (!profile || !profile.location) {
        console.warn('LiveMapView: animateToProfile called with invalid profile or location:', profile);
        return;
      }
      
      if (mapViewRef.current && MapView) {
        const region = {
          latitude: profile.location.latitude,
          longitude: profile.location.longitude,
          latitudeDelta: 0.01, // Close zoom
          longitudeDelta: 0.01,
        };
        
        console.log('LiveMapView: Animating to profile', profile.name, region);
        // Set animating flag to prevent handleRegionChangeComplete from interfering
        isAnimatingRef.current = true;
        
        // Always force animation by directly calling animateToRegion
        // Don't use setMapRegion here, let the animation handle it
        if (mapViewRef.current) {
          mapViewRef.current.animateToRegion(region, 500);
          // Reset animating flag after animation completes
          setTimeout(() => {
            isAnimatingRef.current = false;
            setMapRegion(region);
          }, 600);
        }
      } else {
        console.warn('LiveMapView: Cannot animate - mapViewRef.current:', !!mapViewRef.current, 'MapView:', !!MapView);
      }
    },
    animateToCoordinate: (latitude, longitude) => {
      if (mapViewRef.current && MapView) {
        const region = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        mapViewRef.current.animateToRegion(region, 500);
        setMapRegion(region);
      }
    },
  }));

  // Handle region change to preserve zoom
  const handleRegionChangeComplete = (newRegion) => {
    // Only update mapRegion if we're not currently animating programmatically
    if (!isAnimatingRef.current) {
      setMapRegion(newRegion);
    }
  };

  // Fallback if MapView is not available
  if (!MapView) {
    return (
      <View style={styles.container}>
        <View style={styles.fallbackContainer}>
          <Ionicons name="map-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
          <Text style={styles.fallbackText}>Térkép nem elérhető</Text>
          <Text style={styles.fallbackSubtext}>
            A térkép funkcióhoz react-native-maps szükséges
          </Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, isLocationEnabled && styles.controlButtonActive]}
            onPress={toggleLocation}
          >
            <Ionicons
              name={isLocationEnabled ? 'location' : 'location-outline'}
              size={24}
              color={isLocationEnabled ? '#FF3B75' : '#fff'}
            />
            <Text style={[styles.controlText, isLocationEnabled && styles.controlTextActive]}>
              {isLocationEnabled ? 'GPS be' : 'GPS ki'}
            </Text>
          </TouchableOpacity>
        </View>
        {isLocationEnabled && userLocation && (
          <View style={styles.infoBox}>
            <Ionicons name="location" size={16} color="#FF3B75" />
            <Text style={styles.infoText}>
              {profiles.filter(p => {
                if (!p.location || !userLocation || 
                    typeof p.location.latitude !== 'number' || 
                    typeof p.location.longitude !== 'number') return false;
                const dist = LocationService.calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  p.location.latitude,
                  p.location.longitude
                );
                return dist <= 10;
              }).length} profil a közelben (10 km-en belül)
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapViewRef}
        style={styles.map}
        initialRegion={region}
        region={mapRegion || region}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={isLocationEnabled}
        showsMyLocationButton={false}
        mapType="standard"
      >
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Te"
            pinColor="#FF3B75"
          />
        )}
                {profiles.map((profile) => {
                  if (!profile || !profile.id) {
                    return null;
                  }
                  
                  // Use real-time location if available, otherwise fallback to profile.location
                  const realTimeLocation = profileLocations.get(profile.id);
                  const profileLocation = realTimeLocation || profile.location;
                  
                  if (!profileLocation || 
                      typeof profileLocation.latitude !== 'number' || 
                      typeof profileLocation.longitude !== 'number') {
                    return null;
                  }
                  
                  const distance = userLocation
                    ? LocationService.calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        profileLocation.latitude,
                        profileLocation.longitude
                      )
                    : profile.distance || 0;

                  const isMatched = matchedProfiles && matchedProfiles.has(profile.id);
                  const isLiked = likedProfiles && likedProfiles.has(profile.id);
                  const isOnline = profile.online !== false; // Default to true if not specified
                  
                  // Debug: log all profiles to see what's happening
                  console.log(`LiveMapView: Profile ${profile.id} (${profile.name}) - isMatched: ${isMatched}, isLiked: ${isLiked}, matchedProfiles size: ${matchedProfiles?.size || 0}, likedProfiles size: ${likedProfiles?.size || 0}`);

                  return (
                    <React.Fragment key={`profile-${profile.id}-${realTimeLocation?.timestamp || 'static'}`}>
                      {/* Green dot marker for matched/liked profiles */}
                      {(isMatched || isLiked) && (
                        <Marker
                          key={`${profile.id}-green-dot-${realTimeLocation?.timestamp || 'static'}`}
                          coordinate={{
                            latitude: profileLocation.latitude,
                            longitude: profileLocation.longitude,
                          }}
                          pinColor="#4CAF50"
                          anchor={{ x: 0.5, y: 1 }}
                          tracksViewChanges={false}
                          onPress={() => {
                            if (onProfilePress && profile) {
                              onProfilePress(profile);
                            }
                          }}
                        >
                          {Callout && (
                            <Callout tooltip={false}>
                              <View style={styles.calloutContainer}>
                                <Text style={styles.calloutName}>
                                  {profile.name}, {typeof profile.age === 'number' && !isNaN(profile.age) && profile.age > 0 ? profile.age : '?'}
                                </Text>
                                {profile.address && (
                                  <Text style={styles.calloutAddress}>{profile.address}</Text>
                                )}
                                <Text style={styles.calloutDistance}>{Math.round(distance)} km távolságra</Text>
                              </View>
                            </Callout>
                          )}
                        </Marker>
                      )}
                      {/* Profile image marker floating above the green dot */}
                      {(isMatched || isLiked) && (
                        <Marker
                          key={`${profile.id}-profile-image-${realTimeLocation?.timestamp || 'static'}`}
                          coordinate={{
                            latitude: profileLocation.latitude + 0.0001, // Slightly above the green dot
                            longitude: profileLocation.longitude,
                          }}
                          anchor={{ x: 0.5, y: 1 }}
                          tracksViewChanges={false}
                          onPress={() => {
                            if (onProfilePress && profile) {
                              onProfilePress(profile);
                            }
                          }}
                        >
                          <View style={styles.profileImageFloating}>
                            {profile.photo ? (
                              <Image 
                                source={{ uri: profile.photo }} 
                                style={styles.profileImageFloatingImage}
                              />
                            ) : (
                              <View style={styles.profileImageFloatingPlaceholder}>
                                <Text style={styles.profileImageFloatingInitial}>
                                  {profile.name.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                            {profile.isVerified && (
                              <View style={styles.profileImageFloatingVerified}>
                                <Ionicons name="checkmark" size={8} color="#fff" />
                              </View>
                            )}
                          </View>
                        </Marker>
                      )}
                      {/* Regular marker for non-matched profiles */}
                      {!(isMatched || isLiked) && (
                        <Marker
                          key={`${profile.id}-normal-${realTimeLocation?.timestamp || 'static'}`}
                          coordinate={{
                            latitude: profileLocation.latitude,
                            longitude: profileLocation.longitude,
                          }}
                          title={`${profile.name || 'Névtelen'}, ${profile.age || '?'}`}
                          description={`${Math.round(distance)} km távolságra`}
                          anchor={{ x: 0.5, y: 0.5 }}
                          tracksViewChanges={false}
                          onPress={() => {
                            if (onProfilePress && profile) {
                              onProfilePress(profile);
                            }
                          }}
                        >
                        <View style={styles.customMarker}>
                          <View style={styles.markerImageContainer}>
                            <Text style={styles.markerInitial}>
                              {profile.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          {profile.isVerified && (
                            <View style={styles.verifiedBadge}>
                              <Ionicons name="checkmark" size={10} color="#fff" />
                            </View>
                          )}
                        </View>
                        </Marker>
                      )}
                    </React.Fragment>
                  );
        })}
        {/* Draw routes from user location to matched/liked profiles */}
        {userLocation && Polyline && profiles.map((profile) => {
          if (!profile || !profile.id) return null;
          
          const realTimeLocation = profileLocations.get(profile.id);
          const profileLocation = realTimeLocation || profile.location;
          
          if (!profileLocation || 
              typeof profileLocation.latitude !== 'number' || 
              typeof profileLocation.longitude !== 'number') {
            return null;
          }
          
          const isMatched = matchedProfiles && matchedProfiles.has(profile.id);
          const isLiked = likedProfiles && likedProfiles.has(profile.id);
          
          if ((isMatched || isLiked) && userLocation) {
            // Get route coordinates using RouteService (Google/Mapbox API or fallback)
            const routeKey = `${profile.id}-${userLocation.latitude.toFixed(4)}-${userLocation.longitude.toFixed(4)}-${profileLocation.latitude.toFixed(4)}-${profileLocation.longitude.toFixed(4)}`;
            const cachedRoute = routeCoordinates.get(routeKey);
            
            // Use cached route if available
            if (cachedRoute && cachedRoute.length > 0) {
              return (
                <Polyline
                  key={`route-${profile.id}-${realTimeLocation?.timestamp || 'static'}`}
                  coordinates={cachedRoute}
                  strokeColor="#4CAF50"
                  strokeWidth={3}
                  lineDashPattern={[5, 5]}
                />
              );
            } else {
              // Fetch route asynchronously (will update when ready)
              RouteService.getRouteCoordinates(
                userLocation.latitude,
                userLocation.longitude,
                profileLocation.latitude,
                profileLocation.longitude,
                'google' // Change to 'mapbox' if using Mapbox
              ).then(coords => {
                if (coords && coords.length > 0) {
                  setRouteCoordinates(prev => {
                    const newMap = new Map(prev);
                    newMap.set(routeKey, coords);
                    return newMap;
                  });
                }
              }).catch(err => {
                console.error('RouteService: Error fetching route:', err);
              });
              
              // Show simulated route while loading real route
              const simulatedRoute = generateRouteCoordinates(
                userLocation.latitude,
                userLocation.longitude,
                profileLocation.latitude,
                profileLocation.longitude
              );
              
              return (
                <Polyline
                  key={`route-${profile.id}-${realTimeLocation?.timestamp || 'static'}-simulated`}
                  coordinates={simulatedRoute}
                  strokeColor="#4CAF50"
                  strokeWidth={3}
                  lineDashPattern={[5, 5]}
                  strokeOpacity={0.6}
                />
              );
            }
          }
          return null;
        })}
      </MapView>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isLocationEnabled && styles.controlButtonActive]}
          onPress={toggleLocation}
        >
          <Ionicons
            name={isLocationEnabled ? 'location' : 'location-outline'}
            size={24}
            color={isLocationEnabled ? '#FF3B75' : '#fff'}
          />
          <Text style={[styles.controlText, isLocationEnabled && styles.controlTextActive]}>
            {isLocationEnabled ? 'GPS be' : 'GPS ki'}
          </Text>
        </TouchableOpacity>
      </View>

      {isLocationEnabled && userLocation && (
        <View style={styles.infoBox}>
          <Ionicons name="location" size={16} color="#FF3B75" />
          <Text style={styles.infoText}>
            {profiles.filter(p => {
              if (!p.location || !userLocation || 
                  typeof p.location.latitude !== 'number' || 
                  typeof p.location.longitude !== 'number') return false;
              const dist = LocationService.calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                p.location.latitude,
                p.location.longitude
              );
              return dist <= 10;
            }).length} profil a közelben (10 km-en belül)
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  controls: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  controlButton: {
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  controlButtonActive: {
    borderColor: '#FF3B75',
    backgroundColor: 'rgba(255, 59, 117, 0.2)',
  },
  controlText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  controlTextActive: {
    color: '#FF3B75',
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF3B75',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  heartMarker: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  profileImageMarkerWrapper: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
    zIndex: 1000,
  },
  profileImageMarkerContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#4CAF50',
    overflow: 'hidden',
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageCallout: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
    overflow: 'hidden',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 8,
  },
  profileImageCalloutImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    resizeMode: 'cover',
  },
  profileImageCalloutPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageCalloutInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  profileImageCalloutVerified: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileImageFloating: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
    overflow: 'hidden',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  profileImageFloatingImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    resizeMode: 'cover',
  },
  profileImageFloatingPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageFloatingInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  profileImageFloatingVerified: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  calloutContainer: {
    padding: 8,
    minWidth: 150,
  },
  calloutName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  calloutDistance: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  calloutContainer: {
    padding: 8,
    minWidth: 150,
  },
  calloutName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  calloutDistance: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  profileMarkerImageDirect: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  profileMarkerPlaceholderDirect: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  profileMarkerInitialDirect: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  profileMarkerImageSimple: {
    width: 50,
    height: 50,
    borderRadius: 25,
    resizeMode: 'cover',
  },
  profileMarkerPlaceholderSimple: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileMarkerInitialSimple: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  profileMarkerVerifiedBadgeSimple: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileImageMarker: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#4CAF50',
    overflow: 'hidden',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  profileMarkerImage: {
    width: 56,
    height: 56,
    resizeMode: 'cover',
  },
  profileMarkerPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileMarkerInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  profileMarkerVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0a0a0a',
  },
  matchedHeartsMarker: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 117, 0.25)',
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#FF3B75',
    position: 'relative',
    shadowColor: '#FF3B75',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  heartWrapper1: {
    position: 'absolute',
    left: 6,
    top: 10,
    transform: [{ rotate: '-25deg' }],
  },
  heartWrapper2: {
    position: 'absolute',
    right: 6,
    top: 10,
    transform: [{ rotate: '25deg' }],
  },
  infoBox: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  infoText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 40,
  },
  fallbackText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  fallbackSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
  },
  greenMarkerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 3,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 5,
  },
  matchedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B75',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

LiveMapView.displayName = 'LiveMapView';

export default LiveMapView;

