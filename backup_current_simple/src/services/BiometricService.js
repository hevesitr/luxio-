import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';
const BIOMETRIC_LAST_USED_KEY = '@biometric_last_used';

class BiometricService {
  /**
   * Ellenőrzi, hogy a készülék támogatja-e a biometrikus hitelesítést
   */
  async isAvailable() {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return { available: false, reason: 'A készülék nem támogatja a biometrikus hitelesítést' };
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        return { available: false, reason: 'Nincs beállítva biometrikus hitelesítés a készüléken' };
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return {
        available: true,
        types: types,
        hasFaceID: types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION),
        hasFingerprint: types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT),
      };
    } catch (error) {
      console.error('Biometric check error:', error);
      return { available: false, reason: 'Hiba a biometrikus hitelesítés ellenőrzésekor' };
    }
  }

  /**
   * Biometrikus hitelesítés végrehajtása
   */
  async authenticate(reason = 'Az alkalmazás eléréséhez hitelesítsd magad') {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Mégse',
        disableDeviceFallback: false,
        fallbackLabel: 'PIN kód használata',
      });

      if (result.success) {
        // Mentjük az utolsó sikeres hitelesítés időpontját
        await AsyncStorage.setItem(BIOMETRIC_LAST_USED_KEY, new Date().toISOString());
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Hitelesítés megszakítva',
        };
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: error.message || 'Hiba történt a hitelesítés során',
      };
    }
  }

  /**
   * Beállítja, hogy a biometrikus hitelesítés engedélyezve legyen
   */
  async setEnabled(enabled) {
    try {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, JSON.stringify(enabled));
      return true;
    } catch (error) {
      console.error('Error setting biometric enabled:', error);
      return false;
    }
  }

  /**
   * Ellenőrzi, hogy a biometrikus hitelesítés engedélyezve van-e
   */
  async isEnabled() {
    try {
      const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return value ? JSON.parse(value) : false;
    } catch (error) {
      console.error('Error getting biometric enabled:', error);
      return false;
    }
  }

  /**
   * Visszaadja az utolsó sikeres hitelesítés időpontját
   */
  async getLastUsed() {
    try {
      const value = await AsyncStorage.getItem(BIOMETRIC_LAST_USED_KEY);
      return value ? new Date(value) : null;
    } catch (error) {
      console.error('Error getting last used:', error);
      return null;
    }
  }

  /**
   * Visszaadja a biometrikus hitelesítés típusának felhasználóbarát nevét
   */
  getBiometricTypeName(types) {
    if (!types || !Array.isArray(types)) {
      return 'Biometrikus hitelesítés';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Arc felismerés';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Ujjlenyomat';
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Irisz felismerés';
    }
    return 'Biometrikus hitelesítés';
  }
}

export default new BiometricService();

