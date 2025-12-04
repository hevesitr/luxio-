/**
 * Storage Service - Biztonságos adattárolás
 * EncryptedStorage használata érzékeny adatokhoz (ha elérhető)
 * Fallback: AsyncStorage Expo Go-ban
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// EncryptedStorage importálása (ha elérhető, különben null)
let EncryptedStorage = null;
try {
  EncryptedStorage = require('react-native-encrypted-storage').default;
} catch (error) {
  // Expo Go-ban nem elérhető, AsyncStorage-t használunk
  console.log('EncryptedStorage not available, using AsyncStorage fallback');
}

class StorageService {
  // Helper: választja a megfelelő storage-t
  _getStorage() {
    // Ha EncryptedStorage elérhető és működik, használjuk
    if (EncryptedStorage && typeof EncryptedStorage.setItem === 'function') {
      return EncryptedStorage;
    }
    // Különben AsyncStorage-t használunk
    return AsyncStorage;
  }

  // Érzékeny adatok (titkosítva, ha lehetséges)
  async setToken(token) {
    try {
      const storage = this._getStorage();
      await storage.setItem('user_token', token);
      return true;
    } catch (error) {
      console.error('Error setting token:', error);
      return false;
    }
  }

  async getToken() {
    try {
      const storage = this._getStorage();
      return await storage.getItem('user_token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async setRefreshToken(token) {
    try {
      const storage = this._getStorage();
      await storage.setItem('refresh_token', token);
      return true;
    } catch (error) {
      console.error('Error setting refresh token:', error);
      return false;
    }
  }

  async getRefreshToken() {
    try {
      const storage = this._getStorage();
      return await storage.getItem('refresh_token');
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  async setUserId(userId) {
    try {
      const storage = this._getStorage();
      await storage.setItem('user_id', userId.toString());
      return true;
    } catch (error) {
      console.error('Error setting user ID:', error);
      return false;
    }
  }

  async getUserId() {
    try {
      const storage = this._getStorage();
      return await storage.getItem('user_id');
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  // Nem érzékeny adatok (AsyncStorage)
  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      return false;
    }
  }

  async getItem(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      return false;
    }
  }

  // Törlés minden adat
  async clear() {
    try {
      const storage = this._getStorage();
      await storage.clear();
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  // Kijelentkezés (csak érzékeny adatok törlése)
  async logout() {
    try {
      const storage = this._getStorage();
      await storage.removeItem('user_token');
      await storage.removeItem('refresh_token');
      await storage.removeItem('user_id');
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }
}

export default new StorageService();

