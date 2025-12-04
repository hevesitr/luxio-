/**
 * ProfileService - Profil kezelés Supabase-zel
 */
import { supabase } from './supabaseClient';
import Logger from './Logger';
import SupabaseStorageService from './SupabaseStorageService';
import ErrorHandler, { ErrorCodes } from './ErrorHandler';

class ProfileService {
  /**
   * Profil frissítése
   */
  async updateProfile(userId, updates) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      
      Logger.success('Profile updated', { userId });
      return data;
    }, { operation: 'updateProfile', userId });
  }

  /**
   * Profil lekérése
   */
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      Logger.debug('Profile fetched', { userId });
      return { success: true, data };
    } catch (error) {
      Logger.error('Profile fetch failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Profilkép feltöltése
   */
  async uploadProfilePhoto(userId, photoUri) {
    try {
      // Feltöltés a Storage-ba
      const uploadResult = await SupabaseStorageService.uploadImage(
        photoUri,
        'avatars',
        `${userId}/avatar_${Date.now()}.jpg`
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Profil frissítése az új fotó URL-lel
      const updateResult = await this.updateProfile(userId, {
        avatar_url: uploadResult.url,
      });

      if (!updateResult.success) {
        throw new Error(updateResult.error);
      }

      Logger.success('Profile photo uploaded', { userId });
      return { success: true, url: uploadResult.url };
    } catch (error) {
      Logger.error('Profile photo upload failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Profil fotók hozzáadása
   */
  async addProfilePhotos(userId, photoUris) {
    try {
      const uploadedUrls = [];

      // Feltöltés egyesével
      for (let i = 0; i < photoUris.length; i++) {
        const photoUri = photoUris[i];
        const uploadResult = await SupabaseStorageService.uploadImage(
          photoUri,
          'photos',
          `${userId}/photo_${Date.now()}_${i}.jpg`
        );

        if (uploadResult.success) {
          uploadedUrls.push(uploadResult.url);
        } else {
          Logger.warn('Photo upload failed', { index: i, error: uploadResult.error });
        }
      }

      // Profil frissítése az új fotókkal
      const { data: currentProfile } = await this.getProfile(userId);
      const existingPhotos = currentProfile?.photos || [];
      const newPhotos = [...existingPhotos, ...uploadedUrls];

      const updateResult = await this.updateProfile(userId, {
        photos: newPhotos,
      });

      if (!updateResult.success) {
        throw new Error(updateResult.error);
      }

      Logger.success('Profile photos added', { userId, count: uploadedUrls.length });
      return { success: true, urls: uploadedUrls };
    } catch (error) {
      Logger.error('Profile photos add failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Profil fotó törlése
   */
  async deleteProfilePhoto(userId, photoUrl) {
    try {
      // Törlés a Storage-ból
      const fileName = photoUrl.split('/').pop();
      const deleteResult = await SupabaseStorageService.deleteFile(
        'photos',
        `${userId}/${fileName}`
      );

      if (!deleteResult.success) {
        Logger.warn('Storage delete failed', deleteResult.error);
      }

      // Profil frissítése (fotó eltávolítása a listából)
      const { data: currentProfile } = await this.getProfile(userId);
      const photos = (currentProfile?.photos || []).filter(url => url !== photoUrl);

      const updateResult = await this.updateProfile(userId, { photos });

      if (!updateResult.success) {
        throw new Error(updateResult.error);
      }

      Logger.success('Profile photo deleted', { userId });
      return { success: true };
    } catch (error) {
      Logger.error('Profile photo delete failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Profilok keresése (közeli felhasználók)
   */
  async searchProfiles(filters = {}) {
    try {
      let query = supabase
        .from('profiles')
        .select('*');

      // Szűrők alkalmazása
      if (filters.minAge) {
        query = query.gte('age', filters.minAge);
      }
      if (filters.maxAge) {
        query = query.lte('age', filters.maxAge);
      }
      if (filters.gender) {
        query = query.eq('gender', filters.gender);
      }
      if (filters.relationshipGoal) {
        query = query.eq('relationship_goal', filters.relationshipGoal);
      }

      // Limit
      query = query.limit(filters.limit || 50);

      const { data, error } = await query;

      if (error) throw error;

      Logger.debug('Profiles searched', { count: data.length });
      return { success: true, data };
    } catch (error) {
      Logger.error('Profile search failed', error);
      return { success: false, error: error.message };
    }
  }
}

export default new ProfileService();
