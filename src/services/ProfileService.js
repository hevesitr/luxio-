/**
 * ProfileService - Profil kezelés Repository pattern-nel
 *
 * SOLID Principles:
 * - Single Responsibility: Only profile operations
 * - Open/Closed: Extensible via repository pattern
 * - Liskov Substitution: Repository interface consistency
 * - Interface Segregation: Focused profile methods
 * - Dependency Inversion: Repository abstraction
 */
import Logger from './Logger';
import SupabaseStorageService from './SupabaseStorageService';
import ErrorHandler from './ErrorHandler';
import container from '../core/DIContainer';

class ProfileService {
  constructor(repository = null, storageService = null, logger = null) {
    this.repository = repository || container.resolve('profileRepository');
    this.storageService = storageService || SupabaseStorageService;
    this.logger = logger || container.resolve('logger');
  }

  /**
   * Profil frissítése - Repository pattern használatával
   */
  async updateProfile(userId, updates) {
    return ErrorHandler.wrapServiceCall(async () => {
      const data = await this.repository.update(userId, updates);

      this.logger.success('Profile updated', { userId });
      return data;
    }, { operation: 'updateProfile', userId });
  }

  /**
   * Profil lekérése - Repository pattern használatával
   */
  async getProfile(userId) {
    try {
      const data = await this.repository.findById(userId);

      this.logger.debug('Profile fetched', { userId });
      return { success: true, data };
    } catch (error) {
      this.logger.error('Profile fetch failed', error, { userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Profilkép feltöltése - Repository + Storage integration
   */
  async uploadProfilePhoto(userId, photoUri) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Feltöltés a Storage-ba
      const uploadResult = await this.storageService.uploadImage(
        userId,
        photoUri,
        'avatars'
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Profil frissítése az új fotó URL-lel
      await this.repository.update(userId, {
        avatar_url: uploadResult.url,
      });

      this.logger.success('Profile photo uploaded', { userId });
      return { success: true, url: uploadResult.url };
    }, { operation: 'uploadProfilePhoto', userId });
  }

  /**
   * Profil fotók hozzáadása - Batch upload optimization
   */
  async addProfilePhotos(userId, photoUris) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Batch feltöltés párhuzamosan
      const uploadPromises = photoUris.map((photoUri, index) =>
        this.storageService.uploadImage(userId, photoUri, 'photos')
          .catch(error => {
            this.logger.warn('Photo upload failed', { index, error: error.message });
            return null; // Skip failed uploads
          })
      );

      const uploadResults = await Promise.all(uploadPromises);
      const uploadedUrls = uploadResults
        .filter(result => result && result.success)
        .map(result => result.url);

      // Profil frissítése az új fotókkal
      const currentProfile = await this.repository.findById(userId);
      const existingPhotos = currentProfile.photos || [];
      const newPhotos = [...existingPhotos, ...uploadedUrls];

      await this.repository.update(userId, { photos: newPhotos });

      this.logger.success('Profile photos added', { userId, count: uploadedUrls.length });
      return { success: true, urls: uploadedUrls };
    }, { operation: 'addProfilePhotos', userId, photoCount: photoUris.length });
  }

  /**
   * Profil fotó törlése - Storage + Repository coordination
   */
  async deleteProfilePhoto(userId, photoUrl) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Törlés a Storage-ból
      const deleteResult = await this.storageService.deleteFile(photoUrl, 'photos');

      if (!deleteResult.success) {
        this.logger.warn('Storage delete failed', { error: deleteResult.error });
        // Continue anyway - profile update is more important
      }

      // Profil frissítése (fotó eltávolítása a listából)
      const currentProfile = await this.repository.findById(userId);
      const photos = (currentProfile.photos || []).filter(url => url !== photoUrl);

      await this.repository.update(userId, { photos });

      this.logger.success('Profile photo deleted', { userId });
      return { success: true };
    }, { operation: 'deleteProfilePhoto', userId });
  }

  /**
   * Profilok keresése - Repository pattern használatával
   */
  async searchProfiles(filters = {}) {
    try {
      const data = await this.repository.findByFilters(filters);

      this.logger.debug('Profiles searched', { count: data.length });
      return { success: true, data };
    } catch (error) {
      this.logger.error('Profile search failed', error, { filters });
      return { success: false, error: error.message };
    }
  }
}

// Export the class for testing
export { ProfileService };

// Factory function for DI container
export function createProfileService() {
  return new ProfileService();
}

// Default export - singleton instance for backward compatibility
const profileServiceInstance = new ProfileService();
export default profileServiceInstance;

// Register with DI container (only if not in test environment)
if (typeof jest === 'undefined') {
  container.registerFactory('profileService', () => new ProfileService());
}
