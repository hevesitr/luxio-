/**
 * Supabase Storage Service
 * Képek és videók feltöltése/törlése Supabase Storage-ban
 */
import { supabase } from './supabaseClient';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

const extra =
  Constants?.expoConfig?.extra ||
  Constants?.manifest?.extra ||
  {};

const SUPABASE_URL = extra?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = extra?.SUPABASE_ANON_KEY || '';

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
        // Ha van megadva fájlnév, adj hozzá timestamp-et, hogy egyedi legyen
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        const fileExtension = fileName.split('.').pop() || 'jpg';
        const baseName = fileName.replace(`.${fileExtension}`, '');
        fileName = `${userId}/${baseName}_${timestamp}_${random}.${fileExtension}`;
      }

      // Fájl típus meghatározása
      const fileExtension = localUri.split('.').pop() || 'jpg';
      const fileType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';

      // Ellenőrizd, hogy be van-e jelentkezve
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      // React Native-ben a fájlt FormData-val kell feltölteni
      // A Supabase Storage REST API-t használjuk közvetlenül
      const formData = new FormData();
      
      // React Native FormData formátum
      // @ts-ignore - React Native FormData formátum
      formData.append('file', {
        uri: localUri,
        type: fileType,
        name: fileName.split('/').pop(),
      });

      // Supabase Storage REST API endpoint
      // A session már deklarálva van fentebb, nem kell újra deklarálni

      // Supabase URL és anon key
      const supabaseUrl = SUPABASE_URL;
      const supabaseKey = SUPABASE_ANON_KEY;
      
      // Storage API endpoint
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${fileName}`;
      
      try {
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabaseKey,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Upload error response:', errorText);
          throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }

        const uploadData = await uploadResponse.json();
        console.log('Upload successful via REST API:', uploadData);
        
        // Sikeres feltöltés, de nincs data objektum, mert REST API-t használunk
        // Folytassuk a publikus URL lekérésével
      } catch (uploadError) {
        console.error('REST API upload error:', uploadError);
        return { success: false, error: uploadError.message };
      }

      // Publikus URL lekérése (ez már működik)
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      let publicUrl = urlData?.publicUrl;
      
      if (!publicUrl) {
        console.error('Failed to get public URL');
        return { success: false, error: 'Failed to get public URL' };
      }

      // React Native Image komponens kompatibilitás: biztosítsd, hogy a URL helyes formátumú
      publicUrl = publicUrl.trim();
      
      // Ellenőrizd, hogy a URL érvényes-e
      try {
        new URL(publicUrl);
      } catch (e) {
        console.error('Invalid URL format:', publicUrl);
        return { success: false, error: 'Invalid URL format' };
      }

      console.log('Upload successful:', {
        bucket,
        fileName,
        publicUrl,
      });

      return {
        success: true,
        url: publicUrl,
        path: fileName,
      };

      console.log('Upload successful:', {
        bucket,
        fileName,
        publicUrl,
      });

      return {
        success: true,
        url: publicUrl,
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

      const filePath = `${userId}/${fileName}`;

      // React Native-ben közvetlenül a fájl URI-t használjuk
      const file = {
        uri: localUri,
        type: 'video/mp4',
        name: fileName,
      };

      // Feltöltés
      const { data, error } = await supabase.storage
        .from(this.BUCKETS.VIDEOS)
        .upload(filePath, file, {
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

