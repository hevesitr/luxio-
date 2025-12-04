/**
 * Supabase Storage Service - CLEAN VERSION
 * Képek és videók feltöltése/törlése Supabase Storage-ban
 */
import { supabase } from './supabaseClient';
import * as FileSystem from 'expo-file-system';
import ImageCompressionService from './ImageCompressionService';
import Logger from './Logger';
import ErrorHandler from './ErrorHandler';

class SupabaseStorageService {
  // Bucket nevek
  static BUCKETS = {
    AVATARS: 'avatars',
    PHOTOS: 'photos',
    VIDEOS: 'videos',
  };

  /**
   * Kép feltöltése Supabase Storage-ba (tömörítéssel)
   */
  static async uploadImage(localUri, bucket, userId, fileName = null) {
    return ErrorHandler.wrapServiceCall(async () => {
      // 1. Kép tömörítése
      Logger.debug('Compressing image', { localUri });
      const compressionResult = await ImageCompressionService.compressImage(localUri);
      
      let imageUri = localUri;
      if (compressionResult.success && compressionResult.data.compressed) {
        imageUri = compressionResult.data.uri;
        Logger.success('Image compressed', { 
          reduction: compressionResult.data.reduction 
        });
      }

      // 2. Fájlnév generálása
      if (!fileName) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        fileName = `${userId}/${timestamp}_${random}.jpg`;
      }

      // 3. Fájl beolvasása base64-ként
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 4. Feltöltés Supabase-be
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, decode(base64), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      // 5. Publikus URL lekérése
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      const publicUrl = urlData?.publicUrl;
      
      if (!publicUrl) {
        throw new Error('Failed to get public URL');
      }

      Logger.success('Image uploaded', { bucket, fileName });
      
      return {
        success: true,
        url: publicUrl,
        path: fileName,
      };
    }, { operation: 'uploadImage', bucket, userId });
  }

  /**
   * Profilkép feltöltése (avatar)
   */
  static async uploadAvatar(localUri, userId) {
    return this.uploadImage(localUri, this.BUCKETS.AVATARS, userId);
  }

  /**
   * Fotó feltöltése (photos)
   */
  static async uploadPhoto(localUri, userId) {
    return this.uploadImage(localUri, this.BUCKETS.PHOTOS, userId);
  }

  /**
   * Fájl törlése
   */
  static async deleteFile(bucket, filePath) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;

      Logger.success('File deleted', { bucket, filePath });
      return { success: true };
    }, { operation: 'deleteFile', bucket, filePath });
  }

  /**
   * Felhasználó összes fájljának törlése
   */
  static async deleteUserFiles(bucket, userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data: files, error: listError } = await supabase.storage
        .from(bucket)
        .list(userId);

      if (listError) throw listError;

      if (files && files.length > 0) {
        const filePaths = files.map(file => `${userId}/${file.name}`);
        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove(filePaths);

        if (deleteError) throw deleteError;
      }

      Logger.success('User files deleted', { bucket, userId, count: files?.length || 0 });
      return { success: true, count: files?.length || 0 };
    }, { operation: 'deleteUserFiles', bucket, userId });
  }
}

// Helper function to decode base64
function decode(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export default SupabaseStorageService;
