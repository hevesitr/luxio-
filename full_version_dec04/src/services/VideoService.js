import * as FileSystem from 'expo-file-system';
import { supabase } from './supabaseClient';
import SupabaseStorageService from './SupabaseStorageService';

class VideoService {
  // Get user's video
  static async getUserVideo(userId) {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting user video:', error);
      throw error;
    }
  }

  // Get video URL for playback
  static async getVideoUrl(videoId) {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('video_path')
        .eq('id', videoId)
        .single();

      if (error) throw error;

      if (!data?.video_path) return null;

      const { data: urlData } = supabase.storage
        .from(SupabaseStorageService.BUCKETS.VIDEOS)
        .getPublicUrl(data.video_path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error getting video URL:', error);
      throw error;
    }
  }

  // Get user's video URL
  static async getUserVideoUrl(userId) {
    try {
      const video = await this.getUserVideo(userId);
      if (!video) return null;

      return this.getVideoUrl(video.id);
    } catch (error) {
      console.error('Error getting user video URL:', error);
      throw error;
    }
  }

  // Upload video
  static async uploadVideo(uri, userId, metadata = {}) {
    try {
      // Validate video file
      const isValid = await this.validateVideo(uri);
      if (!isValid) {
        throw new Error('Invalid video file');
      }

      // Compress video if needed
      const compressedUri = await this.compressVideo(uri);

      // Extract thumbnail
      const thumbnailUri = await this.extractThumbnail(compressedUri);

      // Upload video to storage
      const videoFileName = `video_${userId}_${Date.now()}.mp4`;
      const videoUploadResult = await SupabaseStorageService.uploadFile(
        SupabaseStorageService.BUCKETS.VIDEOS,
        compressedUri,
        videoFileName
      );

      // Upload thumbnail
      const thumbnailFileName = `thumbnail_${userId}_${Date.now()}.jpg`;
      const thumbnailUploadResult = await SupabaseStorageService.uploadFile(
        SupabaseStorageService.BUCKETS.THUMBNAILS,
        thumbnailUri,
        thumbnailFileName
      );

      // Get video duration
      const duration = await this.getVideoDuration(compressedUri);

      // Save video metadata to database
      const { data, error } = await supabase
        .from('videos')
        .insert({
          user_id: userId,
          video_path: videoUploadResult.path,
          thumbnail_path: thumbnailUploadResult.path,
          duration: duration,
          size: videoUploadResult.size,
          metadata: metadata,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  }

  // Delete video
  static async deleteVideo(videoId) {
    try {
      // Get video data first
      const { data: video, error: fetchError } = await supabase
        .from('videos')
        .select('video_path, thumbnail_path')
        .eq('id', videoId)
        .single();

      if (fetchError) throw fetchError;

      // Delete files from storage
      if (video.video_path) {
        await SupabaseStorageService.deleteFile(SupabaseStorageService.BUCKETS.VIDEOS, video.video_path);
      }
      if (video.thumbnail_path) {
        await SupabaseStorageService.deleteFile(SupabaseStorageService.BUCKETS.THUMBNAILS, video.thumbnail_path);
      }

      // Delete from database
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }

  // Update video metadata
  static async updateVideoMetadata(videoId, metadata) {
    try {
      const { data, error } = await supabase
        .from('videos')
        .update({ metadata })
        .eq('id', videoId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating video metadata:', error);
      throw error;
    }
  }

  // Compress video
  static async compressVideo(uri, options = {}) {
    try {
      // For now, return the original URI
      // In a real implementation, you would use a video compression library
      console.log('Video compression not implemented yet, returning original URI');
      return uri;
    } catch (error) {
      console.error('Error compressing video:', error);
      throw error;
    }
  }

  // Extract thumbnail from video
  static async extractThumbnail(videoUri, timestamp = 0) {
    try {
      // For now, return a placeholder
      // In a real implementation, you would extract a frame from the video
      console.log('Thumbnail extraction not implemented yet');
      return null;
    } catch (error) {
      console.error('Error extracting thumbnail:', error);
      throw error;
    }
  }

  // Get video duration
  static async getVideoDuration(uri) {
    try {
      // For now, return a default duration
      // In a real implementation, you would get the actual duration
      console.log('Video duration detection not implemented yet');
      return 30; // 30 seconds default
    } catch (error) {
      console.error('Error getting video duration:', error);
      throw error;
    }
  }

  // Validate video file
  static async validateVideo(uri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (!fileInfo.exists) {
        throw new Error('Video file does not exist');
      }

      // Check file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (fileInfo.size > maxSize) {
        throw new Error('Video file is too large (max 100MB)');
      }

      // Check file extension
      const validExtensions = ['.mp4', '.mov', '.avi', '.mkv'];
      const extension = uri.toLowerCase().substring(uri.lastIndexOf('.'));
      if (!validExtensions.includes(extension)) {
        throw new Error('Invalid video file format');
      }

      return true;
    } catch (error) {
      console.error('Error validating video:', error);
      return false;
    }
  }
}

export default VideoService;
