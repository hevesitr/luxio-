/**
 * API Service - Centralizált API hívások
 * Certificate pinning és error handling
 */
import StorageService from './StorageService';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api/v1'
  : 'https://api.datingapp.com/api/v1';

// Certificate pinning (opcionális - csak ha react-native-cert-pinner telepítve van)
let fetchWithPinning = null;
let isPinningAvailable = false;

try {
  // Próbáljuk meg betölteni a react-native-cert-pinner-t
  const certPinner = require('react-native-cert-pinner');
  if (certPinner && certPinner.fetch) {
    fetchWithPinning = certPinner.fetch;
    isPinningAvailable = true;
    console.log('Certificate pinning enabled');
  } else {
    fetchWithPinning = fetch;
  }
} catch (error) {
  // react-native-cert-pinner nincs telepítve, használjuk a normál fetch-et
  fetchWithPinning = fetch;
  console.log('Certificate pinning not available, using standard fetch');
}

class APIService {
  /**
   * Base API hívás
   */
  async request(endpoint, options = {}) {
    try {
      const token = await StorageService.getToken();
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // HTTPS ellenőrzés
      if (!API_BASE_URL.startsWith('https://') && !__DEV__) {
        throw new Error('API endpoint must use HTTPS in production');
      }

      // Certificate pinning konfiguráció
      const pinningConfig = isPinningAvailable ? {
        pins: [
          // Production certificate hash (cseréld le a valós hash-re)
          'sha256/YOUR_PRODUCTION_CERTIFICATE_HASH_HERE',
          // Backup certificate hash (ha van)
          // 'sha256/YOUR_BACKUP_CERTIFICATE_HASH_HERE',
        ],
        // Allow fallback to system trust store if pinning fails
        // Csak development-ben, production-ben ne!
        ...(__DEV__ && { fallback: true }),
      } : {};

      const response = await fetchWithPinning(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        ...pinningConfig,
      });

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return { success: true, data: null };
      }

      const data = await response.json();

      // Handle token expiration
      if (response.status === 401 && data.error?.code === 'TOKEN_EXPIRED') {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request
          return this.request(endpoint, options);
        } else {
          // Refresh failed, logout
          await StorageService.logout();
          throw new Error('Session expired. Please login again.');
        }
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * Token refresh
   */
  async refreshToken() {
    try {
      const refreshToken = await StorageService.getRefreshToken();
      
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        await StorageService.setToken(data.data.token);
        await StorageService.setRefreshToken(data.data.refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  /**
   * GET request
   */
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  /**
   * File upload
   */
  async upload(endpoint, file, additionalData = {}) {
    try {
      const token = await StorageService.getToken();
      
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || 'photo.jpg',
      });

      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }
}

export default new APIService();

