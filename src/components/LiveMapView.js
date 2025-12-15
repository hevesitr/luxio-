import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

// Try to import real map components, fallback to mock if not available
let MapView = null;
let Marker = null;
let Callout = null;

try {
  // Try to import react-native-maps components
  const Maps = require('react-native-maps');
  MapView = Maps.default || Maps.MapView;
  Marker = Maps.Marker;
  Callout = Maps.Callout;
} catch (error) {
  console.warn('react-native-maps not available, using mock map');
}

// Mock map components as fallback
const MockMapView = ({ style, initialRegion, showsUserLocation, children }) => (
  <View style={style}>
    {/* Static map background */}
    <Image
      source={{
        uri: 'https://maps.googleapis.com/maps/api/staticmap?center=47.4979,19.0402&zoom=12&size=400x600&maptype=roadmap&style=feature:all|element:labels|visibility:off&key=demo'
      }}
      style={{ flex: 1, width: '100%', height: '100%' }}
      resizeMode="cover"
    />
    {/* Overlay markers on top of the static map */}
    {children}
  </View>
);

const MockMarker = ({ coordinate, title, description, children }) => (
  <View style={[styles.staticMarker, {
    // Position markers based on coordinates (simplified)
    top: '40%',
    left: '45%'
  }]}>
    <View style={styles.staticMarkerCircle}>
      <Text style={styles.staticMarkerText}>📍</Text>
    </View>
    <View style={styles.staticMarkerLabel}>
      <Text style={styles.staticMarkerLabelText}>{title}</Text>
      <Text style={styles.staticMarkerDescText}>{description}</Text>
    </View>
  </View>
);

// Use real components if available, otherwise mock
const RealMapView = MapView || MockMapView;
const RealMarker = Marker || MockMarker;

const LiveMapView = React.forwardRef(({ profiles: profilesProp, nearbyProfiles, onProfilePress, currentUserLocation, matchedProfiles = new Set(), likedProfiles = new Set(), showProfileImages = true }, ref) => {
  const profiles = nearbyProfiles || profilesProp || [];

  // GPS state
  const [gpsEnabled, setGpsEnabled] = useState(true);

  // Animation for user location pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Zoom and pan state for mock map
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const lastGesture = useRef({ x: 0, y: 0, zoom: 1 });
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  useEffect(() => {
    if (gpsEnabled) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
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
    }
  }, [gpsEnabled]);

  // Simple zoom controls (removed complex PanResponder for now)
  const handleZoomIn = () => {
    setZoom(Math.min(3, zoom + 0.3));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(0.5, zoom - 0.3));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Use real Google Maps if available, otherwise fallback to mock
  if (MapView) {
    console.log('LiveMapView: Using real Google Maps!');
    return (
      <View style={styles.container}>
        <RealMapView
          style={styles.realMap}
          initialRegion={{
            latitude: 47.4979,
            longitude: 19.0402,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation={gpsEnabled}
          showsMyLocationButton={false}
          mapType="standard"
          followsUserLocation={gpsEnabled}
          showsCompass={true}
          showsScale={true}
          zoomEnabled={true}
          scrollEnabled={true}
          rotateEnabled={true}
        >
          {/* User location marker with pulse animation */}
          {gpsEnabled && currentUserLocation && (
            <RealMarker
              coordinate={currentUserLocation}
              title="Te vagy itt"
              description="Saját pozíció"
            >
              <Animated.View style={[styles.userLocationDot, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.userLocationInner} />
              </Animated.View>
            </RealMarker>
          )}

          {/* Profile markers */}
          {profiles.map((profile) => (
            <RealMarker
              key={profile.id}
              coordinate={{
                latitude: profile.location?.latitude || 47.4979,
                longitude: profile.location?.longitude || 19.0402,
              }}
              title={profile.name}
              description={`${profile.distance?.toFixed(1) || '?'} km távolságra`}
              onPress={() => onProfilePress && onProfilePress(profile)}
            >
              <View style={styles.markerCircle}>
                {showProfileImages && profile.photo ? (
                  <Image source={{ uri: profile.photo }} style={styles.markerImage} />
                ) : (
                  <View style={[styles.markerPlaceholder, {
                    backgroundColor: matchedProfiles.has(profile.id) ? '#00FF88' :
                                   likedProfiles.has(profile.id) ? '#FF3B75' : '#4285F4'
                  }]}>
                    <Text style={styles.markerInitial}>{profile.name?.charAt(0) || '?'}</Text>
                  </View>
                )}
              </View>
            </RealMarker>
          ))}
        </RealMapView>

        <View style={styles.mapControls}>
          <TouchableOpacity
            style={[styles.controlButton, gpsEnabled && styles.controlButtonActive]}
            onPress={() => {
              setGpsEnabled(!gpsEnabled);
              console.log('GPS toggled:', !gpsEnabled);
            }}
          >
            <Ionicons
              name={gpsEnabled ? "locate" : "locate-outline"}
              size={20}
              color={gpsEnabled ? "#FF3B75" : "#fff"}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Fallback mock map
  console.log('LiveMapView: Using fallback mock map');
  return (
    <View style={styles.container}>
      {/* Mock map background with zoom and pan */}
      <View style={styles.mapBackground}>
        <Animated.View
          style={[
            styles.mapGrid,
            {
              transform: [
                { scale: zoom },
                { translateX: pan.x },
                { translateY: pan.y },
              ],
            },
          ]}
        >
          {/* Profile markers on the map */}
        {profiles.length > 0 ? profiles.slice(0, 6).map((profile, index) => {
            // Calculate position based on coordinates if available
            const lat = profile.location?.latitude || 47.4979;
            const lng = profile.location?.longitude || 19.0402;
            const centerLat = 47.4979;
            const centerLng = 19.0402;

            // Simple coordinate to position conversion
            const top = `${50 - ((lat - centerLat) * 100)}%`;
            const left = `${50 + ((lng - centerLng) * 200)}%`;

            return (
              <View key={profile.id || index} style={[styles.profileMarker, {
                top,
                left,
              }]}>
                <TouchableOpacity onPress={() => onProfilePress && onProfilePress(profile)}>
                  <View style={styles.markerCircle}>
                    {showProfileImages && profile.photo ? (
                      <Image source={{ uri: profile.photo }} style={styles.markerImage} />
                    ) : (
                      <View style={[styles.markerPlaceholder, {
                        backgroundColor: matchedProfiles.has(profile.id) ? '#00FF88' :
                                       likedProfiles.has(profile.id) ? '#FF3B75' : '#4285F4'
                      }]}>
                        <Text style={styles.markerInitial}>{profile.name?.charAt(0) || '?'}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                <View style={styles.markerLabel}>
                  <Text style={styles.markerLabelText}>{profile.name || 'Névtelen'}</Text>
                  {profile.distance && (
                    <Text style={styles.markerDistanceText}>{profile.distance.toFixed(1)} km</Text>
                  )}
                </View>
              </View>
            );
          }) : (
            // Default demo markers
            <>
              <View style={[styles.profileMarker, { top: '30%', left: '30%' }]}>
                <View style={styles.markerCircle}>
                  <View style={[styles.markerPlaceholder, { backgroundColor: '#FF3B75' }]}>
                    <Text style={styles.markerInitial}>A</Text>
                  </View>
                </View>
                <View style={styles.markerLabel}>
                  <Text style={styles.markerLabelText}>Anna</Text>
                  <Text style={styles.markerDistanceText}>2.3 km</Text>
                </View>
              </View>

              <View style={[styles.profileMarker, { top: '60%', right: '25%' }]}>
                <View style={styles.markerCircle}>
                  <View style={[styles.markerPlaceholder, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.markerInitial}>B</Text>
                  </View>
                </View>
                <View style={styles.markerLabel}>
                  <Text style={styles.markerLabelText}>Béla</Text>
                  <Text style={styles.markerDistanceText}>1.8 km</Text>
                </View>
              </View>

              <View style={[styles.profileMarker, { bottom: '35%', left: '50%' }]}>
                <View style={styles.markerCircle}>
                  <View style={[styles.markerPlaceholder, { backgroundColor: '#2196F3' }]}>
                    <Text style={styles.markerInitial}>C</Text>
                  </View>
                </View>
                <View style={styles.markerLabel}>
                  <Text style={styles.markerLabelText}>Csilla</Text>
                  <Text style={styles.markerDistanceText}>3.1 km</Text>
                </View>
              </View>
            </>
          )}

          {/* User location marker - only show when GPS is enabled */}
          {gpsEnabled && (
            <View style={[styles.userLocationMarker, { top: '50%', left: '50%' }]}>
              <Animated.View style={[styles.userLocationDot, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.userLocationInner} />
              </Animated.View>
            </View>
          )}
        </Animated.View>
      </View>

      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleZoomIn}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, gpsEnabled && styles.controlButtonActive]}
          onPress={() => {
            setGpsEnabled(!gpsEnabled);
            console.log('GPS toggled:', !gpsEnabled);
          }}
        >
          <Ionicons
            name={gpsEnabled ? "locate" : "locate-outline"}
            size={20}
            color={gpsEnabled ? "#FF3B75" : "#fff"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={resetView}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleZoomOut}
        >
          <Ionicons name="remove" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="location" size={16} color="#00D4FF" />
        <Text style={styles.infoText}>
          {profiles.length} profil a közelben
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  realMap: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#E8F4FD',
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapGrid: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    position: 'relative',
    borderRadius: 12,
    // Chessboard pattern for better visual
    backgroundImage: `
      linear-gradient(45deg, #E8F4FD 25%, transparent 25%),
      linear-gradient(-45deg, #E8F4FD 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #E8F4FD 75%),
      linear-gradient(-45deg, transparent 75%, #E8F4FD 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
  },
  profileMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    resizeMode: 'cover',
  },
  markerPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInitial: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  markerLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  markerLabelText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  markerDistanceText: {
    color: '#CCC',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  userLocationMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(66, 133, 244, 0.3)',
    borderWidth: 2,
    borderColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  mapControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    gap: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 59, 117, 0.2)',
    borderWidth: 1,
    borderColor: '#FF3B75',
  },
  infoBox: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  infoText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  staticMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  staticMarkerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B75',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  staticMarkerText: {
    fontSize: 16,
  },
  staticMarkerLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    maxWidth: 120,
  },
  staticMarkerLabelText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  staticMarkerDescText: {
    color: '#CCC',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
});

LiveMapView.displayName = 'LiveMapView';

export default LiveMapView;
