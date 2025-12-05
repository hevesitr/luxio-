/**
 * ProfileService Integration Tests
 *
 * Tests the refactored ProfileService with Repository pattern and DI
 */
import { ProfileService } from '../ProfileService';
import container from '../../core/DIContainer';

// Mock all dependencies
jest.mock('../SupabaseStorageService', () => ({
  uploadImage: jest.fn(),
  deleteFile: jest.fn()
}));
jest.mock('../Logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  success: jest.fn()
}));
jest.mock('../../core/DIContainer', () => ({
  resolve: jest.fn()
}));

describe('ProfileService Integration', () => {
  let profileService;
  let mockRepository;
  let mockStorageService;
  let mockLogger;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock repository
    mockRepository = {
      findById: jest.fn(),
      findByFilters: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn()
    };

    // Create mock storage service
    mockStorageService = {
      uploadImage: jest.fn(),
      deleteFile: jest.fn()
    };

    // Create mock logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      success: jest.fn()
    };

    // Mock container.resolve calls
    container.resolve.mockImplementation((serviceName) => {
      switch (serviceName) {
        case 'profileRepository':
          return mockRepository;
        case 'logger':
          return mockLogger;
        default:
          return {};
      }
    });

    // Create service with mocked dependencies
    profileService = new ProfileService(mockRepository, mockStorageService, mockLogger);
  });

  describe('getProfile', () => {
    it('should return profile data successfully', async () => {
      const mockProfile = {
        id: 'user-123',
        name: 'John Doe',
        age: 25,
        city: 'Budapest'
      };

      mockRepository.findById.mockResolvedValue(mockProfile);

      const result = await profileService.getProfile('user-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProfile);
      expect(mockRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockLogger.debug).toHaveBeenCalledWith('Profile fetched', { userId: 'user-123' });
    });

    it('should handle repository errors', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await profileService.getProfile('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updates = { bio: 'New bio', interests: ['music'] };
      const updatedProfile = { id: 'user-123', ...updates };

      mockRepository.update.mockResolvedValue(updatedProfile);

      const result = await profileService.updateProfile('user-123', updates);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedProfile);
      expect(mockRepository.update).toHaveBeenCalledWith('user-123', updates);
      expect(mockLogger.success).toHaveBeenCalledWith('Profile updated', { userId: 'user-123' });
    });
  });

  describe('uploadProfilePhoto', () => {
    it('should upload and update profile photo', async () => {
      const photoUri = 'file://photo.jpg';
      const uploadResult = { success: true, url: 'https://storage/avatar.jpg' };

      mockStorageService.uploadImage.mockResolvedValue(uploadResult);
      mockRepository.update.mockResolvedValue({});

      const result = await profileService.uploadProfilePhoto('user-123', photoUri);

      expect(result.success).toBe(true);
      expect(result.data.url).toBe(uploadResult.url);
      expect(mockStorageService.uploadImage).toHaveBeenCalledWith('user-123', photoUri, 'avatars');
      expect(mockRepository.update).toHaveBeenCalledWith('user-123', {
        avatar_url: uploadResult.url
      });
    });
  });

  describe('addProfilePhotos', () => {
    it('should upload multiple photos and update profile', async () => {
      const photoUris = ['file://photo1.jpg', 'file://photo2.jpg'];
      const uploadResults = [
        { success: true, url: 'https://storage/photo1.jpg' },
        { success: true, url: 'https://storage/photo2.jpg' }
      ];

      mockStorageService.uploadImage
        .mockResolvedValueOnce(uploadResults[0])
        .mockResolvedValueOnce(uploadResults[1]);

      mockRepository.findById.mockResolvedValue({ photos: ['existing.jpg'] });
      mockRepository.update.mockResolvedValue({});

      const result = await profileService.addProfilePhotos('user-123', photoUris);

      expect(result.success).toBe(true);
      expect(result.data.urls).toEqual(['https://storage/photo1.jpg', 'https://storage/photo2.jpg']);
      expect(mockRepository.update).toHaveBeenCalledWith('user-123', {
        photos: ['existing.jpg', 'https://storage/photo1.jpg', 'https://storage/photo2.jpg']
      });
    });
  });

  describe('searchProfiles', () => {
    it('should search profiles with filters', async () => {
      const filters = { minAge: 20, maxAge: 30 };
      const mockResults = [
        { id: 'user-1', name: 'User 1' },
        { id: 'user-2', name: 'User 2' }
      ];

      mockRepository.findByFilters.mockResolvedValue(mockResults);

      const result = await profileService.searchProfiles(filters);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResults);
      expect(mockRepository.findByFilters).toHaveBeenCalledWith(filters);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage upload errors gracefully', async () => {
      mockStorageService.uploadImage.mockResolvedValue({
        success: false,
        error: 'Upload failed'
      });

      const result = await profileService.uploadProfilePhoto('user-123', 'file://photo.jpg');

      expect(result.success).toBe(false);
      // ErrorHandler gives generic message
      expect(result.error).toContain('Váratlan hiba');
    });

    it('should handle repository update errors gracefully', async () => {
      mockStorageService.uploadImage.mockResolvedValue({
        success: true,
        url: 'https://storage/photo.jpg'
      });
      mockRepository.update.mockRejectedValue(new Error('Update failed'));

      const result = await profileService.uploadProfilePhoto('user-123', 'file://photo.jpg');

      expect(result.success).toBe(false);
      // ErrorHandler gives generic message
      expect(result.error).toContain('Váratlan hiba');
    });
  });
});
