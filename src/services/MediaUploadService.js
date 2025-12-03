import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabaseClient';
import { Alert } from 'react-native';

/**
 * MediaUploadService - Média feltöltés kezelése
 */
class MediaUploadService {
  constructor() {
    this.MAX_IMAGE_SIZE = 1920;
    this.MAX_VIDEO_SIZE = 50 * 1024 * 1024;
    this.MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;
    this.IMAGE_QUALITY = 0.8;
  }

  async requestCameraPermission() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Kamera Engedély',
          'Az alkalmazásnak szüksége van a kamerához való hozzáférésre.'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      return false;
    }
  }

  async requestMediaLibraryPermission() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Galéria Engedély',
          'Az alkalmazásnak szüksége van a galériához való hozzáférésre.'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Media library permission error:', error);
      return false;
    }
  }

  async pickImageFromCamera() {
    try {
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error('Camera pick error:', error);
      Alert.alert('Hiba', 'Kép készítése sikertelen.');
      return null;
    }
  }

  async pickImageFromGallery() {
    try {
      const hasPermission = await this.requestMediaLibraryPermission();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error('Gallery pick error:', error);
      Alert.alert('Hiba', 'Kép választása sikertelen.');
      return null;
    }
  }

  async resizeImage(uri) {
    // Egyszerűsített verzió - közvetlenül visszaadjuk az URI-t
    // A tényleges resize-t a SupabaseStorageService végzi
    return { uri };
  }

  async uploadImage(uri, userId, fileName) {
    try {
      const resized = await this.resizeImage(uri);
      const response = await fetch(resized.uri);
      const blob = await response.blob();
      
      if (blob.size > this.MAX_IMAGE_FILE_SIZE) {
        throw new Error(`A kép mérete maximum ${this.MAX_IMAGE_FILE_SIZE / (1024 * 1024)} MB lehet.`);
      }
      
      const filePath = `${userId}/${Date.now()}_${fileName}`;
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      return {
        path: filePath,
        url: urlData.publicUrl,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async deleteImage(filePath) {
    try {
      const { error } = await supabase.storage
        .from('photos')
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }
}

export default new MediaUploadService();
