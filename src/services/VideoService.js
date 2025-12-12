/**
 * Video Service
 * Handles video upload, recording, compression, and management
 */
import { supabase } from './supabaseClient';
import * as FileSystem from 'expo-file-system';
import Logger from './Logger';
import ErrorHandler from './ErrorHandler';

class VideoService {
  // Video constraints
  static CONSTRAINTS = {
    MAX_DURATION_SECONDS: 30,
    MAX_UPLOAD_SIZE_MB: 50,
    MAX_COMPRESSED_SIZE_MB: 10,
    MIN_RESOLUTION: '720p',
    ALLOWED_FORMAT: 'mp4',
  };

  // Moderation statuses
  static MODERATION_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  };

  /**
   * Extract video metadata
   * @param {string} videoUri - Local video file URI
   * @returns {Promise<Object>} Video metadata
   */
  static async extractVideoMetadata(videoUri) {
    try {
      // In a real implementation, this would use expo-av or ffmpeg to extract metadata
      // For now, return mock metadata for testing
      const fileInfo = await FileSystem.getInfoAsync(videoUri);

      return {
        duration: 15, // mock duration in seconds
        width: 1280,
        height: 720,
        resolution: '720p',
        size: fileInfo.size,
        format: 'mp4'
      };
    } catch (error) {
      Logger.error('Video metadata extraction failed', error);
      throw error;
    }
  }

  /**
   * Validate video file
   * @param {string} videoUri - Local video file URI
   * @returns {Promise<Object>} Validation result
   */
  static async validateVideo(videoUri) {
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      
      if (!fileInfo.exists) {
        return {
          valid: false,
          error: 'Video file not found',
        };
      }

      // Check file size (convert bytes to MB)
      const fileSizeMB = fileInfo.size / (1024 * 1024);
      if (fileSizeMB > this.CONSTRAINTS.MAX_UPLOAD_SIZE_MB) {
        return {
          valid: false,
          error: `Video must be under ${this.CONSTRAINTS.MAX_UPLOAD_SIZE_MB}MB`,
        };
      }

      // Check file format (basic check from URI)
      const fileExtension = videoUri.split('.').pop().toLowerCase();
      if (fileExtension !== this.CONSTRAINTS.ALLOWED_FORMAT) {
        return {
          valid: false,
          error: 'Please upload an MP4 video',
        };
      }

      // Note: Duration validation will be done after loading video metadata
      // This requires expo-av Video component or ffmpeg

      return {
        valid: true,
        fileSizeMB,
        fileExtension,
      };
    } catch (error) {
      Logger.error('Video validation error', error);
      return {
        valid: false,
        error: 'Failed to validate video',
      };
    }
  }

  /**
   * Get video metadata (duration, resolution)
   * @param {string} videoUri - Local video file URI
   * @returns {Promise<Object>} Video metadata
   */
  static async getVideoMetadata(videoUri) {
    try {
      // This will use expo-av to get video metadata
      const { Video } = await import('expo-av');
      
      // Create a temporary video instance to get metadata
      // Note: This is a simplified approach
      // In production, you might want to use ffmpeg for more accurate metadata
      
      return {
        duration: 0, // Will be set when video loads
        resolution: '720p', // Default, will be detected
      };
    } catch (error) {
      Logger.error('Failed to get video metadata', error);
      throw error;
    }
  }

  /**
   * Validate video duration
   * @param {number} durationSeconds - Video duration in seconds
   * @returns {Object} Validation result
   */
  static validateDuration(durationSeconds) {
    if (durationSeconds > this.CONSTRAINTS.MAX_DURATION_SECONDS) {
      return {
        valid: false,
        error: `Video must be ${this.CONSTRAINTS.MAX_DURATION_SECONDS} seconds or less`,
      };
    }
    return { valid: true };
  }

  /**
   * Upload video from device
   * @param {string} userId - User ID
   * @param {string} videoUri - Local video file URI
   * @param {Object} metadata - Optional video metadata (duration, resolution)
   * @returns {Promise<Object>} Upload result with video metadata
   */
  static async uploadVideo(userId, videoUri, metadata = {}) {
    return ErrorHandler.wrapServiceCall(async () => {
      Logger.debug('Starting video upload', { userId, videoUri });

      // 1. Validate video
      const validation = await this.validateVideo(videoUri);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 2. Check if user already has a video
      const existingVideo = await this.getUserVideo(userId);
      if (existingVideo.data) {
        // Delete existing video first
        await this.deleteVideo(userId, existingVideo.data.id);
      }

      // 3. Compress video if needed
      let uploadUri = videoUri;
      let fileSizeMB = validation.fileSizeMB;

      if (fileSizeMB > this.CONSTRAINTS.MAX_COMPRESSED_SIZE_MB) {
        Logger.info('Video needs compression', { fileSizeMB });
        
        const compressionResult = await this.compressVideo(videoUri);
        if (!compressionResult.success) {
          throw new Error('Video processing failed');
        }

        uploadUri = compressionResult.uri;
        fileSizeMB = compressionResult.sizeMB;

        // Verify compressed size
        if (fileSizeMB > this.CONSTRAINTS.MAX_COMPRESSED_SIZE_MB) {
          throw new Error('Video could not be compressed sufficiently');
        }
      }

      // 4. Generate unique storage path
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const storagePath = `${userId}/${timestamp}_${random}.mp4`;

      // 5. Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uploadUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 6. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(storagePath, decode(base64), {
          contentType: 'video/mp4',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 7. Save video metadata to database
      const videoData = {
        user_id: userId,
        storage_path: storagePath,
        duration_seconds: metadata.duration || 0,
        file_size_mb: fileSizeMB,
        resolution: metadata.resolution || '720p',
        moderation_status: this.MODERATION_STATUS.PENDING,
      };

      const { data: dbData, error: dbError } = await supabase
        .from('videos')
        .insert(videoData)
        .select()
        .single();

      if (dbError) {
        // Rollback: delete uploaded file
        await supabase.storage.from('videos').remove([storagePath]);
        throw dbError;
      }

      Logger.success('Video uploaded successfully', { 
        videoId: dbData.id,
        storagePath,
      });

      return {
        success: true,
        data: dbData,
        message: 'Video uploaded successfully. It will be visible after moderation.',
      };
    }, { operation: 'uploadVideo', userId });
  }

  /**
   * Record video in-app
   * @param {string} userId - User ID
   * @param {number} duration - Recording duration in seconds
   * @returns {Promise<Object>} Recording result
   */
  static async recordVideo(userId, duration) {
    return ErrorHandler.wrapServiceCall(async () => {
      Logger.debug('Starting video recording', { userId, duration });

      // This will be implemented in task 3
      throw new Error('Not implemented yet');
    }, { operation: 'recordVideo', userId });
  }

  /**
   * Compress video to target size
   * @param {string} videoUri - Local video file URI
   * @param {number} targetSizeMB - Target size in MB
   * @param {Function} onProgress - Progress callback (0-100)
   * @returns {Promise<Object>} Compression result
   */
  static async compressVideo(videoUri, targetSizeMB = this.CONSTRAINTS.MAX_COMPRESSED_SIZE_MB, onProgress = null) {
    return ErrorHandler.wrapServiceCall(async () => {
      Logger.debug('Starting video compression', { videoUri, targetSizeMB });

      try {
        // Import FFmpeg kit
        const { FFmpegKit, ReturnCode } = await import('ffmpeg-kit-react-native');

        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(videoUri);
        if (!fileInfo.exists) {
          throw new Error('Video file not found');
        }

        // Generate output path
        const outputUri = `${FileSystem.cacheDirectory}compressed_${Date.now()}.mp4`;

        // Calculate target bitrate
        // Target size in bits = targetSizeMB * 8 * 1024 * 1024
        // Assume 30 seconds max duration
        const targetBitrate = Math.floor((targetSizeMB * 8 * 1024 * 1024) / 30); // bits per second
        const videoBitrate = Math.floor(targetBitrate * 0.9); // 90% for video
        const audioBitrate = '128k'; // 128 kbps for audio

        // FFmpeg command to compress video
        // -i: input file
        // -c:v libx264: use H.264 codec
        // -b:v: video bitrate
        // -vf scale: scale to 720p (maintain aspect ratio)
        // -c:a aac: use AAC audio codec
        // -b:a: audio bitrate
        // -preset fast: encoding speed
        const command = `-i "${videoUri}" -c:v libx264 -b:v ${videoBitrate} -vf "scale=-2:720" -c:a aac -b:a ${audioBitrate} -preset fast "${outputUri}"`;

        Logger.debug('FFmpeg command', { command });

        // Execute FFmpeg command
        const session = await FFmpegKit.execute(command);
        const returnCode = await session.getReturnCode();

        if (!ReturnCode.isSuccess(returnCode)) {
          const output = await session.getOutput();
          Logger.error('FFmpeg compression failed', { returnCode, output });
          throw new Error('Video compression failed');
        }

        // Check output file
        const outputInfo = await FileSystem.getInfoAsync(outputUri);
        if (!outputInfo.exists) {
          throw new Error('Compressed video file not found');
        }

        const outputSizeMB = outputInfo.size / (1024 * 1024);

        // Verify output size
        if (outputSizeMB > targetSizeMB) {
          Logger.warn('Compressed video still too large', { 
            outputSizeMB, 
            targetSizeMB 
          });
          // Could retry with lower bitrate, but for now we'll accept it
        }

        Logger.success('Video compressed successfully', {
          originalSize: fileInfo.size / (1024 * 1024),
          compressedSize: outputSizeMB,
          reduction: `${((1 - outputSizeMB / (fileInfo.size / (1024 * 1024))) * 100).toFixed(1)}%`,
        });

        return {
          success: true,
          uri: outputUri,
          sizeMB: outputSizeMB,
          originalSizeMB: fileInfo.size / (1024 * 1024),
        };
      } catch (error) {
        Logger.error('Video compression error', error);
        throw error;
      }
    }, { operation: 'compressVideo', targetSizeMB });
  }

  /**
   * Delete video
   * @param {string} userId - User ID
   * @param {string} videoId - Video ID
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteVideo(userId, videoId) {
    return ErrorHandler.wrapServiceCall(async () => {
      Logger.debug('Deleting video', { userId, videoId });

      // 1. Get video data
      const { data: video, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('Video not found');
        }
        throw fetchError;
      }

      // 2. Delete from storage
      const { error: storageError } = await supabase.storage
        .from('videos')
        .remove([video.storage_path]);

      if (storageError) {
        Logger.error('Failed to delete video from storage', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // 3. Delete from database
      const { error: dbError } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId)
        .eq('user_id', userId);

      if (dbError) throw dbError;

      Logger.success('Video deleted successfully', { videoId });

      return {
        success: true,
        message: 'Video deleted successfully',
      };
    }, { operation: 'deleteVideo', userId, videoId });
  }

  /**
   * Delete all videos for a user (cascade on account deletion)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteUserVideos(userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      Logger.debug('Deleting all videos for user', { userId });

      // 1. Get all user videos
      const { data: videos, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', userId);

      if (fetchError) throw fetchError;

      if (!videos || videos.length === 0) {
        return { success: true, count: 0 };
      }

      // 2. Delete from storage
      const storagePaths = videos.map(v => v.storage_path);
      const { error: storageError } = await supabase.storage
        .from('videos')
        .remove(storagePaths);

      if (storageError) {
        Logger.error('Failed to delete videos from storage', storageError);
      }

      // 3. Delete from database (cascade will handle this automatically)
      // But we can also do it explicitly
      const { error: dbError } = await supabase
        .from('videos')
        .delete()
        .eq('user_id', userId);

      if (dbError) throw dbError;

      Logger.success('All user videos deleted', { userId, count: videos.length });

      return {
        success: true,
        count: videos.length,
      };
    }, { operation: 'deleteUserVideos', userId });
  }

  /**
   * Get video URL
   * @param {string} videoId - Video ID
   * @param {string} currentUserId - Current user ID (to check permissions)
   * @returns {Promise<Object>} Video URL result
   */
  static async getVideoUrl(videoId, currentUserId = null) {
    return ErrorHandler.wrapServiceCall(async () => {
      Logger.debug('Getting video URL', { videoId, currentUserId });

      // 1. Get video data
      const { data: video, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return { success: true, url: null, reason: 'Video not found' };
        }
        throw fetchError;
      }

      // 2. Check moderation status
      // Users can see their own videos regardless of status
      // Other users can only see approved videos
      if (video.user_id !== currentUserId) {
        if (video.moderation_status !== this.MODERATION_STATUS.APPROVED) {
          return { 
            success: true, 
            url: null, 
            reason: 'Video pending moderation',
            status: video.moderation_status,
          };
        }
      }

      // 3. Get signed URL from Supabase Storage
      // Videos are in private bucket, so we need signed URLs
      const { data: urlData, error: urlError } = await supabase.storage
        .from('videos')
        .createSignedUrl(video.storage_path, 3600); // 1 hour expiry

      if (urlError) throw urlError;

      if (!urlData || !urlData.signedUrl) {
        throw new Error('Failed to get video URL');
      }

      return {
        success: true,
        url: urlData.signedUrl,
        video: video,
      };
    }, { operation: 'getVideoUrl', videoId });
  }

  /**
   * Get video URL for user's profile
   * @param {string} userId - User ID
   * @param {string} currentUserId - Current user ID (to check permissions)
   * @returns {Promise<Object>} Video URL result
   */
  static async getUserVideoUrl(userId, currentUserId = null) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Get user's video
      const videoResult = await this.getUserVideo(userId);
      
      if (!videoResult.data) {
        return { success: true, url: null, reason: 'No video' };
      }

      // Get video URL
      return this.getVideoUrl(videoResult.data.id, currentUserId);
    }, { operation: 'getUserVideoUrl', userId });
  }

  /**
   * Submit video for moderation
   * @param {string} videoId - Video ID
   * @returns {Promise<Object>} Submission result
   */
  static async submitForModeration(videoId) {
    return ErrorHandler.wrapServiceCall(async () => {
      Logger.debug('Submitting video for moderation', { videoId });

      // Videos are automatically submitted with 'pending' status on upload
      // This method can be used to re-submit rejected videos
      const { data, error } = await supabase
        .from('videos')
        .update({ 
          moderation_status: this.MODERATION_STATUS.PENDING,
          moderation_notes: null,
          rejected_at: null,
        })
        .eq('id', videoId)
        .select()
        .single();

      if (error) throw error;

      Logger.success('Video submitted for moderation', { videoId });
      return { success: true, data };
    }, { operation: 'submitForModeration', videoId });
  }

  /**
   * Get user's video
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User's video data
   */
  static async getUserVideo(userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return { success: true, data: data || null };
    }, { operation: 'getUserVideo', userId });
  }

  /**
   * Get videos pending moderation
   * @returns {Promise<Object>} List of pending videos
   */
  static async getPendingVideos() {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          profiles:user_id (
            name,
            age,
            avatar_url
          )
        `)
        .eq('moderation_status', this.MODERATION_STATUS.PENDING)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return { success: true, data: data || [] };
    }, { operation: 'getPendingVideos' });
  }

  /**
   * Approve video
   * @param {string} videoId - Video ID
   * @returns {Promise<Object>} Approval result
   */
  static async approveVideo(videoId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('videos')
        .update({ 
          moderation_status: this.MODERATION_STATUS.APPROVED,
          moderation_notes: null,
        })
        .eq('id', videoId)
        .select()
        .single();

      if (error) throw error;

      Logger.success('Video approved', { videoId });
      return { success: true, data };
    }, { operation: 'approveVideo', videoId });
  }

  /**
   * Reject video
   * @param {string} videoId - Video ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Rejection result
   */
  static async rejectVideo(videoId, reason) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('videos')
        .update({ 
          moderation_status: this.MODERATION_STATUS.REJECTED,
          moderation_notes: reason,
        })
        .eq('id', videoId)
        .select()
        .single();

      if (error) throw error;

      Logger.success('Video rejected', { videoId, reason });
      return { success: true, data };
    }, { operation: 'rejectVideo', videoId });
  }

  /**
   * Report video for moderation review
   * @param {string} videoId - Video ID
   * @param {string} reporterId - User ID of reporter
   * @param {string} reason - Report reason
   * @returns {Promise<Object>} Report result
   */
  static async reportVideo(videoId, reporterId, reason) {
    return ErrorHandler.wrapServiceCall(async () => {
      Logger.debug('Reporting video', { videoId, reporterId, reason });

      // Create a report record (you may want to create a separate reports table)
      // For now, we'll flag the video for immediate review by setting it back to pending
      const { data, error } = await supabase
        .from('videos')
        .update({ 
          moderation_status: this.MODERATION_STATUS.PENDING,
          moderation_notes: `Reported by user: ${reason}`,
        })
        .eq('id', videoId)
        .select()
        .single();

      if (error) throw error;

      Logger.success('Video reported', { videoId, reporterId });
      return { 
        success: true, 
        data,
        message: 'Video reported successfully. It will be reviewed by our moderation team.',
      };
    }, { operation: 'reportVideo', videoId, reporterId });
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

export default VideoService;
