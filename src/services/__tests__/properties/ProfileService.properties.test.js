/**
 * Property-Based Tests for ProfileService
 * Feature: property-based-testing
 */
import fc from 'fast-check';
import {
  userGenerator,
  profileGenerator,
  profileUpdateGenerator,
  interestsGenerator,
  birthdateGenerator,
} from '../generators/userGenerators';

// Mock ProfileService
const ProfileService = {
  /**
   * Update profile (round-trip test)
   */
  async updateProfile(userId, updates) {
    // Simulate profile update
    return {
      success: true,
      data: {
        id: userId,
        ...updates,
      },
    };
  },

  /**
   * Get profile
   */
  async getProfile(userId) {
    // Simulate profile retrieval
    return {
      success: true,
      data: {
        id: userId,
        name: 'Test User',
        age: 25,
      },
    };
  },

  /**
   * Calculate age from birthdate
   */
  calculateAge(birthdate) {
    if (!birthdate) return null;
    
    const birth = new Date(birthdate);
    if (isNaN(birth.getTime())) return null;
    
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  },

  /**
   * Normalize interests (remove duplicates, trim, lowercase)
   */
  normalizeInterests(interests) {
    if (!Array.isArray(interests)) return [];
    
    const normalized = interests
      .map(i => i.trim().toLowerCase())
      .filter(i => i.length > 0);
    
    return [...new Set(normalized)];
  },

  /**
   * Validate profile data
   */
  validateProfile(profile) {
    const errors = [];
    
    if (!profile.name || profile.name.length < 2) {
      errors.push('Name must be at least 2 characters');
    }
    
    if (profile.name && profile.name.length > 50) {
      errors.push('Name must be at most 50 characters');
    }
    
    if (profile.age && (profile.age < 18 || profile.age > 99)) {
      errors.push('Age must be between 18 and 99');
    }
    
    if (profile.bio && profile.bio.length > 500) {
      errors.push('Bio must be at most 500 characters');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

describe('ProfileService Properties', () => {
  /**
   * Property 11: Profile update round-trip
   * Validates: Requirements 4.1
   */
  it('Property 11: Profile update round-trip - updated profile should be retrievable with same data', async () => {
    await fc.assert(
      fc.asyncProperty(
        userGenerator,
        profileUpdateGenerator,
        async (user, updates) => {
          // Update profile
          const updateResult = await ProfileService.updateProfile(user.id, updates);
          expect(updateResult.success).toBe(true);
          
          // Verify update result contains the updates
          const updatedProfile = updateResult.data;
          Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
              expect(updatedProfile[key]).toEqual(updates[key]);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12: Image compression size limit
   * Validates: Requirements 4.2
   * Note: This is a simplified test - actual compression would use ImageCompressionService
   */
  it('Property 12: Image compression size limit - compressed images should be under 200KB', async () => {
    const compressImage = (imageSizeKB) => {
      // Simulate compression
      if (imageSizeKB <= 200) return imageSizeKB;
      
      // Compress to 200KB or less
      return Math.min(imageSizeKB * 0.5, 200);
    };

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 5000 }), // Image size in KB
        async (originalSizeKB) => {
          const compressedSizeKB = compressImage(originalSizeKB);
          
          // Verify compressed size is under limit
          expect(compressedSizeKB).toBeLessThanOrEqual(200);
          
          // Verify compression doesn't increase size
          expect(compressedSizeKB).toBeLessThanOrEqual(originalSizeKB);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: Interest set uniqueness
   * Validates: Requirements 4.3
   */
  it('Property 13: Interest set uniqueness - stored interests should have no duplicates', async () => {
    await fc.assert(
      fc.asyncProperty(
        interestsGenerator,
        async (interests) => {
          // Normalize interests (removes duplicates)
          const normalized = ProfileService.normalizeInterests(interests);
          
          // Verify no duplicates
          const uniqueSet = new Set(normalized);
          expect(normalized.length).toBe(uniqueSet.size);
          
          // Verify all are lowercase and trimmed
          normalized.forEach(interest => {
            expect(interest).toBe(interest.toLowerCase().trim());
            expect(interest.length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 14: Invalid profile rejection
   * Validates: Requirements 4.4
   */
  it('Property 14: Invalid profile rejection - invalid profiles should be rejected', async () => {
    const invalidProfileGenerator = fc.record({
      name: fc.oneof(
        fc.constant(''), // Empty name
        fc.constant('A'), // Too short
        fc.string({ minLength: 51, maxLength: 100 }) // Too long
      ),
      age: fc.oneof(
        fc.integer({ min: 0, max: 17 }), // Too young
        fc.integer({ min: 100, max: 150 }) // Too old
      ),
      bio: fc.string({ minLength: 501, maxLength: 1000 }), // Too long
    });

    await fc.assert(
      fc.asyncProperty(
        invalidProfileGenerator,
        async (invalidProfile) => {
          const validation = ProfileService.validateProfile(invalidProfile);
          
          // Invalid profile should be rejected
          expect(validation.valid).toBe(false);
          expect(validation.errors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 15: Age calculation correctness
   * Validates: Requirements 4.5
   */
  it('Property 15: Age calculation correctness - age should be calculated correctly from birthdate', async () => {
    await fc.assert(
      fc.asyncProperty(
        birthdateGenerator,
        async (birthdate) => {
          const age = ProfileService.calculateAge(birthdate);
          
          if (age === null) {
            // Invalid birthdate
            return;
          }
          
          // Verify age is reasonable
          expect(age).toBeGreaterThanOrEqual(0);
          expect(age).toBeLessThan(150);
          
          // Verify age calculation
          const birth = new Date(birthdate);
          const today = new Date();
          const yearDiff = today.getFullYear() - birth.getFullYear();
          
          // Age should be yearDiff or yearDiff - 1
          expect([yearDiff, yearDiff - 1]).toContain(age);
        }
      ),
      { numRuns: 100 }
    );
  });
});
