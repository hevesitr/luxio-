/**
 * LocationService - Helymeghatározás és távolság számítás
 * Implements Requirements 10.2, 10.5
 */
import * as Location from 'expo-location';
import Logger from './Logger';
import ErrorHandler, { ErrorCodes } from './ErrorHandler';
import { supabase } from './supabaseClient';

class LocationService {
  constructor() {
    this.currentLocation = null;
    this.watchSubscription = null;
  }

  /**
   * Helymeghatározási engedély kérése
   */
  async requestPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        throw ErrorHandler.createError(
          ErrorCodes.BUSINESS_PREMIUM_REQUIRED,
          'Location permission denied',
          { permission: status }
        );
      }

      Logger.success('Location permission granted');
      return { success: true, status };
    } catch (error) {
      return ErrorHandler.wrapServiceCall(
        async () => { throw error; },
        { operation: 'requestPermission' }
      );
    }
  }

  /**
   * Aktuális helyzet lekérése
   */
  async getCurrentLocation() {
    return ErrorHandler.wrapServiceCall(async () => {
      // Engedély ellenőrzése
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      // Helyzet lekérése
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      Logger.debug('Current location fetched', this.currentLocation);
      return this.currentLocation;
    }, { operation: 'getCurrentLocation' });
  }

  /**
   * Távolság számítása két koordináta között (Haversine formula)
   * @param {object} coord1 - { latitude, longitude }
   * @param {object} coord2 - { latitude, longitude }
   * @returns {number} Távolság kilométerben
   */
  calculateDistance(coord1, coord2) {
    try {
      const R = 6371; // Föld sugara km-ben
      
      const lat1 = this.toRadians(coord1.latitude);
      const lat2 = this.toRadians(coord2.latitude);
      const deltaLat = this.toRadians(coord2.latitude - coord1.latitude);
      const deltaLon = this.toRadians(coord2.longitude - coord1.longitude);

      const a = 
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      // Kerekítés 1 km pontosságra
      return Math.round(distance);
    } catch (error) {
      Logger.error('Distance calculation failed', error);
      return null;
    }
  }

  /**
   * Fok -> Radián konverzió
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Távolság formázása locale alapján
   * @param {number} distanceKm - Távolság kilométerben
   * @param {string} locale - 'hu' vagy 'en'
   * @returns {string} Formázott távolság
   */
  formatDistance(distanceKm, locale = 'hu') {
    if (distanceKm === null || distanceKm === undefined) {
      return locale === 'hu' ? 'Ismeretlen' : 'Unknown';
    }

    // Magyar: kilométer
    if (locale === 'hu') {
      if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)} m`;
      }
      return `${distanceKm} km`;
    }

    // Angol: mérföld
    const distanceMiles = distanceKm * 0.621371;
    if (distanceMiles < 1) {
      return `${Math.round(distanceMiles * 5280)} ft`;
    }
    return `${Math.round(distanceMiles)} mi`;
  }

  /**
   * Felhasználó helyzetének frissítése az adatbázisban
   * @param {string} userId 
   * @param {object} coordinates - { latitude, longitude }
   */
  async updateUserLocation(userId, coordinates) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          location: `POINT(${coordinates.longitude} ${coordinates.latitude})`,
          last_location_update: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      Logger.success('User location updated', { userId });
      return coordinates;
    }, { operation: 'updateUserLocation', userId });
  }

  /**
   * Helyzet változás figyelése
   * @param {function} callback - Callback függvény új koordinátákkal
   */
  async subscribeToLocationChanges(callback) {
    try {
      // Engedély ellenőrzése
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      // Figyelés indítása
      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 60000, // 1 perc
          distanceInterval: 100, // 100 méter
        },
        (location) => {
          const coordinates = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          
          this.currentLocation = coordinates;
          Logger.debug('Location changed', coordinates);
          callback(coordinates);
        }
      );

      Logger.success('Location watching started');
      return { success: true, subscription: this.watchSubscription };
    } catch (error) {
      return ErrorHandler.wrapServiceCall(
        async () => { throw error; },
        { operation: 'subscribeToLocationChanges' }
      );
    }
  }

  /**
   * Helyzet változás figyelés leállítása
   */
  unsubscribeFromLocationChanges() {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
      Logger.debug('Location watching stopped');
    }
  }

  /**
   * Profilok szűrése távolság alapján
   * @param {array} profiles - Profil lista
   * @param {object} userLocation - Felhasználó helyzete
   * @param {number} maxDistance - Maximum távolság km-ben
   */
  filterByDistance(profiles, userLocation, maxDistance) {
    if (!userLocation) {
      Logger.warn('User location not available for filtering');
      return profiles;
    }

    return profiles.filter(profile => {
      if (!profile.location) return false;

      const distance = this.calculateDistance(userLocation, profile.location);
      return distance !== null && distance <= maxDistance;
    });
  }

  /**
   * Profilok rendezése távolság szerint
   * @param {array} profiles - Profil lista
   * @param {object} userLocation - Felhasználó helyzete
   */
  sortByDistance(profiles, userLocation) {
    if (!userLocation) {
      Logger.warn('User location not available for sorting');
      return profiles;
    }

    return profiles.sort((a, b) => {
      const distanceA = this.calculateDistance(userLocation, a.location);
      const distanceB = this.calculateDistance(userLocation, b.location);

      if (distanceA === null) return 1;
      if (distanceB === null) return -1;
      
      return distanceA - distanceB;
    });
  }

  /**
   * Geocoding: Cím -> Koordináták
   * @param {string} address 
   */
  async geocodeAddress(address) {
    return ErrorHandler.wrapServiceCall(async () => {
      const results = await Location.geocodeAsync(address);
      
      if (results.length === 0) {
        throw new Error('Address not found');
      }

      const location = {
        latitude: results[0].latitude,
        longitude: results[0].longitude,
      };

      Logger.debug('Address geocoded', { address, location });
      return location;
    }, { operation: 'geocodeAddress', address });
  }

  /**
   * Reverse Geocoding: Koordináták -> Cím
   * @param {object} coordinates - { latitude, longitude }
   */
  async reverseGeocode(coordinates) {
    return ErrorHandler.wrapServiceCall(async () => {
      const results = await Location.reverseGeocodeAsync(coordinates);
      
      if (results.length === 0) {
        throw new Error('Location not found');
      }

      const address = results[0];
      const formattedAddress = [
        address.city,
        address.region,
        address.country,
      ].filter(Boolean).join(', ');

      Logger.debug('Location reverse geocoded', { coordinates, address: formattedAddress });
      return formattedAddress;
    }, { operation: 'reverseGeocode', coordinates });
  }

  /**
   * Két pont közötti középpont számítása
   */
  calculateMidpoint(coord1, coord2) {
    const lat1 = this.toRadians(coord1.latitude);
    const lon1 = this.toRadians(coord1.longitude);
    const lat2 = this.toRadians(coord2.latitude);
    const lon2 = this.toRadians(coord2.longitude);

    const dLon = lon2 - lon1;

    const Bx = Math.cos(lat2) * Math.cos(dLon);
    const By = Math.cos(lat2) * Math.sin(dLon);

    const lat3 = Math.atan2(
      Math.sin(lat1) + Math.sin(lat2),
      Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By)
    );
    const lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);

    return {
      latitude: lat3 * (180 / Math.PI),
      longitude: lon3 * (180 / Math.PI),
    };
  }

  /**
   * Koordináták validálása
   */
  isValidCoordinates(coordinates) {
    if (!coordinates || typeof coordinates !== 'object') return false;
    
    const { latitude, longitude } = coordinates;
    
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }
}

export default new LocationService();
