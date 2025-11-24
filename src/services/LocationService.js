import * as Location from 'expo-location';

class LocationService {
  static currentLocation = null;

  // Kér helymeghatározási engedélyt
  static async requestPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  }

  // Megkapja a jelenlegi pozíciót
  static async getCurrentLocation() {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      return this.currentLocation;
    } catch (error) {
      console.error('Get location error:', error);
      return null;
    }
  }

  // Számítja a távolságot két pont között (Haversine formula)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Föld sugara km-ben
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance);
  }

  static deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  // Frissíti a profilok távolságát a jelenlegi helyzethez képest
  static updateProfileDistances(profiles, currentLocation) {
    if (!currentLocation) return profiles;
    if (!profiles || !Array.isArray(profiles)) return [];

    return profiles.map(profile => {
      // Ellenőrizzük, hogy a profilnak van-e location adata
      if (!profile.location || 
          typeof profile.location.latitude !== 'number' || 
          typeof profile.location.longitude !== 'number') {
        return profile; // Visszaadja változatlanul ha nincs location
      }

      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        profile.location.latitude,
        profile.location.longitude
      );

      return {
        ...profile,
        distance,
      };
    });
  }
}

export default LocationService;

