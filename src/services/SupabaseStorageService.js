/**
 * Supabase Storage Service
 * Képek és videók feltöltése/törlése Supabase Storage-ban
 */
import { supabase } from './supabaseClient';

class SupabaseStorageService {
  // Bucket nevek
  static BUCKETS = {
    AVATARS: 'avatars',
    PHOTOS: 'photos',
    VIDEOS: 'videos',
  };

  /**
   * Kép feltöltése Supabase Storage-ba
   * @param {string} localUri - Lokális fájl URI (pl. file://... vagy content://...)
   * @param {string} bucket - Bucket neve (avatars, photos, videos)
   * @param {string} userId - Felhasználó ID
   * @param {string} fileName - Fájl neve (opcionális, ha nincs megadva, generál egyet)
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  static async uploadImage(localUri, bucket, userId, fileName = null) {
    try {
      // Generálj egyedi fájlnevet, ha nincs megadva
      if (!fileName) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        fileName = `${userId}/${timestamp}_${random}.jpg`;
      } else {
        // Biztosítsd, hogy a userId mappában legyen
        fileName = `${userId}/${fileName}`;
      }

      // React Native FormData használata
      const formData = new FormData();
      
      // Fájl neve a FormData-ban
      const fileExtension = localUri.split('.').pop() || 'jpg';
      const fileType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
      
      formData.append('file', {
        uri: localUri,
        type: fileType,
        name: fileName.split('/').pop(), // Csak a fájlnév, mappa nélkül
      } as any);

      // Feltöltés Supabase Storage-ba
      // Megjegyzés: Supabase Storage API közvetlenül nem támogatja a FormData-t
      // Ezért fetch-et használunk a Supabase Storage REST API-jával
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      // Olvasd be a fájlt blob-ként
      const response = await fetch(localUri);
      const blob = await response.blob();

      // Feltöltés Supabase Storage-ba
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, {
          contentType: fileType,
          upsert: false, // Ne írja felül, ha már létezik
        });

      if (error) {
        console.error('Storage upload error:', error);
        return { success: false, error: error.message };
      }

      // Publikus URL lekérése
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return {
        success: true,
        url: urlData.publicUrl,
        path: fileName,
      };
    } catch (error) {
      console.error('Upload image error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Profilkép feltöltése (avatar)
   * @param {string} localUri - Lokális fájl URI
   * @param {string} userId - Felhasználó ID
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  static async uploadAvatar(localUri, userId) {
    return this.uploadImage(
      localUri,
      this.BUCKETS.AVATARS,
      userId,
      'avatar.jpg'
    );
  }

  /**
   * Profil fotó feltöltése
   * @param {string} localUri - Lokális fájl URI
   * @param {string} userId - Felhasználó ID
   * @param {number} photoIndex - Fotó indexe (opcionális)
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  static async uploadPhoto(localUri, userId, photoIndex = null) {
    const fileName = photoIndex !== null ? `photo_${photoIndex}.jpg` : null;
    return this.uploadImage(localUri, this.BUCKETS.PHOTOS, userId, fileName);
  }

  /**
   * Videó feltöltése
   * @param {string} localUri - Lokális fájl URI
   * @param {string} userId - Felhasználó ID
   * @param {string} fileName - Fájl neve
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  static async uploadVideo(localUri, userId, fileName) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      // Olvasd be a videót blob-ként
      const response = await fetch(localUri);
      const blob = await response.blob();

      const filePath = `${userId}/${fileName}`;

      // Feltöltés
      const { data, error } = await supabase.storage
        .from(this.BUCKETS.VIDEOS)
        .upload(filePath, blob, {
          contentType: 'video/mp4',
          upsert: false,
        });

      if (error) {
        console.error('Storage upload error:', error);
        return { success: false, error: error.message };
      }

      // Publikus URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKETS.VIDEOS)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath,
      };
    } catch (error) {
      console.error('Upload video error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fájl törlése Storage-ból
   * @param {string} bucket - Bucket neve
   * @param {string} filePath - Fájl elérési útja
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async deleteFile(bucket, filePath) {
    try {
      const { error } = await supabase.storage.from(bucket).remove([filePath]);

      if (error) {
        console.error('Storage delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete file error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Publikus URL generálása
   * @param {string} bucket - Bucket neve
   * @param {string} filePath - Fájl elérési útja
   * @returns {string} Publikus URL
   */
  static getPublicUrl(bucket, filePath) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  }
}

export default SupabaseStorageService;

