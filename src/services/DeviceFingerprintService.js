/**
 * Device Fingerprint Service
 * Generates and validates device fingerprints for session fixation prevention
 * 
 * Property: Property 2 - Session Fixation Prevention
 * Validates: Requirements 3
 */

import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const FINGERPRINT_KEY = '@device_fingerprint';
const FINGERPRINT_STORAGE_KEY = 'device_fingerprint_secure';

class DeviceFingerprintService {
  constructor() {
    this.fingerprint = null;
    this.fingerprintComponents = null;
  }

  /**
   * Generate device fingerprint
   * Combines multiple device characteristics for unique identification
   * @returns {Promise<string>} Device fingerprint hash
   */
  async generateFingerprint() {
    try {
      // Collect device information
      const components = {
        // Device identifiers
        deviceId: Device.deviceId || 'unknown',
        deviceName: Device.deviceName || 'unknown',
        deviceBrand: Device.brand || 'unknown',
        deviceModel: Device.modelName || 'unknown',
        
        // OS information
        osName: Platform.OS,
        osVersion: Platform.Version?.toString() || 'unknown',
        
        // App information
        appVersion: Device.appVersion || 'unknown',
        buildVersion: Device.buildVersion || 'unknown',
        
        // Device characteristics
        isDevice: Device.isDevice,
        isPhysicalDevice: Device.isPhysicalDevice,
        
        // Timestamp for uniqueness
        timestamp: new Date().toISOString(),
      };

      // Create fingerprint string
      const fingerprintString = JSON.stringify(components);

      // Hash the fingerprint
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        fingerprintString
      );

      this.fingerprint = hash;
      this.fingerprintComponents = components;

      console.log('[DeviceFingerprint] Fingerprint generated:', hash.substring(0, 16) + '...');
      return hash;
    } catch (error) {
      console.error('[DeviceFingerprint] Error generating fingerprint:', error);
      throw error;
    }
  }

  /**
   * Store fingerprint securely
   * @param {string} fingerprint - Device fingerprint
   * @returns {Promise<void>}
   */
  async storeFingerprint(fingerprint) {
    try {
      // Store in secure storage
      await SecureStore.setItemAsync(FINGERPRINT_STORAGE_KEY, fingerprint);
      this.fingerprint = fingerprint;
      console.log('[DeviceFingerprint] Fingerprint stored securely');
    } catch (error) {
      console.error('[DeviceFingerprint] Error storing fingerprint:', error);
      // Fallback to regular storage if secure storage fails
      try {
        await AsyncStorage.setItem(FINGERPRINT_KEY, fingerprint);
      } catch (fallbackError) {
        console.error('[DeviceFingerprint] Fallback storage also failed:', fallbackError);
      }
    }
  }

  /**
   * Retrieve stored fingerprint
   * @returns {Promise<string|null>} Stored fingerprint or null
   */
  async getStoredFingerprint() {
    try {
      // Try secure storage first
      let fingerprint = await SecureStore.getItemAsync(FINGERPRINT_STORAGE_KEY);
      
      if (!fingerprint) {
        // Fallback to regular storage
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        fingerprint = await AsyncStorage.getItem(FINGERPRINT_KEY);
      }

      return fingerprint;
    } catch (error) {
      console.error('[DeviceFingerprint] Error retrieving fingerprint:', error);
      return null;
    }
  }

  /**
   * Validate fingerprint matches current device
   * @param {string} storedFingerprint - Fingerprint to validate
   * @returns {Promise<boolean>} True if fingerprint matches
   */
  async validateFingerprint(storedFingerprint) {
    try {
      // Generate current fingerprint
      const currentFingerprint = await this.generateFingerprint();

      // Compare fingerprints
      const matches = currentFingerprint === storedFingerprint;

      if (!matches) {
        console.warn('[DeviceFingerprint] Fingerprint mismatch detected!');
        console.warn('[DeviceFingerprint] Expected:', storedFingerprint.substring(0, 16) + '...');
        console.warn('[DeviceFingerprint] Got:', currentFingerprint.substring(0, 16) + '...');
      } else {
        console.log('[DeviceFingerprint] Fingerprint validated successfully');
      }

      return matches;
    } catch (error) {
      console.error('[DeviceFingerprint] Error validating fingerprint:', error);
      return false;
    }
  }

  /**
   * Clear stored fingerprint
   * @returns {Promise<void>}
   */
  async clearFingerprint() {
    try {
      await SecureStore.deleteItemAsync(FINGERPRINT_STORAGE_KEY);
      
      // Also clear fallback storage
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem(FINGERPRINT_KEY);
      } catch (e) {
        // Ignore fallback errors
      }

      this.fingerprint = null;
      this.fingerprintComponents = null;
      console.log('[DeviceFingerprint] Fingerprint cleared');
    } catch (error) {
      console.error('[DeviceFingerprint] Error clearing fingerprint:', error);
    }
  }

  /**
   * Get fingerprint components for debugging
   * @returns {object} Fingerprint components
   */
  getFingerprintComponents() {
    return this.fingerprintComponents;
  }

  /**
   * Get current fingerprint
   * @returns {string|null} Current fingerprint
   */
  getFingerprint() {
    return this.fingerprint;
  }

  /**
   * Check if device fingerprint has changed
   * @param {string} storedFingerprint - Previously stored fingerprint
   * @returns {Promise<boolean>} True if fingerprint has changed
   */
  async hasChanged(storedFingerprint) {
    try {
      const isValid = await this.validateFingerprint(storedFingerprint);
      return !isValid;
    } catch (error) {
      console.error('[DeviceFingerprint] Error checking if fingerprint changed:', error);
      return true; // Assume changed on error for security
    }
  }

  /**
   * Export fingerprint data for debugging
   * @returns {Promise<object>} Fingerprint data
   */
  async exportData() {
    try {
      const stored = await this.getStoredFingerprint();
      const current = await this.generateFingerprint();

      return {
        stored: stored ? stored.substring(0, 16) + '...' : null,
        current: current.substring(0, 16) + '...',
        matches: stored === current,
        components: this.fingerprintComponents,
      };
    } catch (error) {
      console.error('[DeviceFingerprint] Error exporting data:', error);
      return null;
    }
  }
}

// Export singleton instance
export const deviceFingerprintService = new DeviceFingerprintService();
export default DeviceFingerprintService;
