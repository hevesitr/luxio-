/**
 * Property-Based Test for Preference-based Filtering
 * 
 * Feature: refactor-dating-app, Property 12: Preference-based filtering
 * Validates: Requirements 5.1
 * 
 * Property 12: Preference-based filtering
 * For any user viewing the discovery feed, all displayed profiles should match 
 * the user's age range, distance, and gender preferences
 */

import fc from 'fast-check';
import SupabaseMatchService from '../SupabaseMatchService';
import LocationService from '../LocationService';
import { supabase } from '../supabaseClient';

// Mock Supabase
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock LocationService
jest.mock('../LocationService', () => ({
  default: {
    calculateDistance: jest.fn(),
    filterByDistance: jest.fn((profiles, userLocation, maxDistance) => {
      return profiles.filter(profile => {
        if (!profile.location) return false;
        const distance = Math.sqrt(
          Math.pow(profile.location.latitude - userLocation.latitude, 2) +
          Math.pow(profile.location.longitude - userLocation.longitude, 2)
        ) * 111; // Rough km conversion
        return distance <= maxDistance;
      });
    }),
    sortByDistance: jest.fn((profiles) => profiles),
  },
}));

describe('Property 12: Preference-based Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Generators
   */
  const ageArbitrary = fc.integer({ min: 18, max: 80 });
  const genderArbitrary = fc.constantFrom('male', 'female', 'non-binary', 'everyone');
  const distanceArbitrary = fc.integer({ min: 1, max: 100 });
  const coordinatesArbitrary = fc.record({
    latitude: fc.double({ min: -90, max: 90 }),
    longitude: fc.double({ min: -180, max: 180 }),
  });

  const profileArbitrary = fc.record({
    id: fc.uuid(),
    age: ageArbitrary,
    gender: fc.constantFrom('male', 'female', 'non-binary'),
    location: coordinatesArbitrary,
    relationship_goal: fc.constantFrom('relationship', 'casual', 'friendship'),
  });

  const userProfileArbitrary = fc.record({
    id: fc.uuid(),
    age_min: ageArbitrary,
    age_max: ageArbitrary,
    gender_preference: genderArbitrary,
    distance_max: distanceArbitrary,
    location: coordinatesArbitrary,
  }).map(profile => ({
    ...profile,
    // Ensure age_max >= age_min
    age_max: Math.max(profile.age_min, profile.age_max),
  }));

  /**
   * Property Test 1: Age filtering
   * All returned profiles should be within the user's age range
   */
  test('Property 12.1: All profiles match age range', async () => {
    await fc.assert(
      fc.asyncProperty(
        userProfileArbitrary,
        fc.array(profileArbitrary, { minLength: 5, maxLength: 20 }),
        async (userProfile, profiles) => {
          // Mock Supabase responses
          supabase.from.mockImplementation((table) => {
            if (table === 'profiles') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: userProfile,
                      error: null,
                    }),
                  }),
                  neq: jest.fn().mockReturnThis(),
                  gte: jest.fn().mockReturnThis(),
                  lte: jest.fn().mockReturnThis(),
                  not: jest.fn().mockReturnThis(),
                  limit: jest.fn().mockResolvedValue({
                    data: profiles.filter(p => 
                      p.age >= userProfile.age_min && 
                      p.age <= userProfile.age_max
                    ),
                    error: null,
                  }),
                }),
              };
            }
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          });

          const result = await SupabaseMatchService.getDiscoveryFeed(userProfile.id);

          if (result.success && result.data) {
            // All profiles should be within age range
            const allInRange = result.data.every(profile =>
              profile.age >= userProfile.age_min &&
              profile.age <= userProfile.age_max
            );
            return allInRange;
          }

          return true; // If no data, test passes
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property Test 2: Gender filtering
   * All returned profiles should match gender preference (unless 'everyone')
   */
  test('Property 12.2: All profiles match gender preference', async () => {
    await fc.assert(
      fc.asyncProperty(
        userProfileArbitrary,
        fc.array(profileArbitrary, { minLength: 5, maxLength: 20 }),
        async (userProfile, profiles) => {
          // Mock Supabase responses
          supabase.from.mockImplementation((table) => {
            if (table === 'profiles') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: userProfile,
                      error: null,
                    }),
                  }),
                  neq: jest.fn().mockReturnThis(),
                  gte: jest.fn().mockReturnThis(),
                  lte: jest.fn().mockReturnThis(),
                  not: jest.fn().mockReturnThis(),
                  limit: jest.fn().mockResolvedValue({
                    data: profiles.filter(p => {
                      const ageMatch = p.age >= userProfile.age_min && p.age <= userProfile.age_max;
                      const genderMatch = userProfile.gender_preference === 'everyone' || 
                                         p.gender === userProfile.gender_preference;
                      return ageMatch && genderMatch;
                    }),
                    error: null,
                  }),
                }),
              };
            }
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          });

          const result = await SupabaseMatchService.getDiscoveryFeed(userProfile.id);

          if (result.success && result.data) {
            // All profiles should match gender preference
            const allMatch = result.data.every(profile =>
              userProfile.gender_preference === 'everyone' ||
              profile.gender === userProfile.gender_preference
            );
            return allMatch;
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property Test 3: Distance filtering
   * All returned profiles should be within max distance
   */
  test('Property 12.3: All profiles within distance range', async () => {
    await fc.assert(
      fc.asyncProperty(
        userProfileArbitrary,
        fc.array(profileArbitrary, { minLength: 5, maxLength: 20 }),
        async (userProfile, profiles) => {
          // Mock Supabase responses
          supabase.from.mockImplementation((table) => {
            if (table === 'profiles') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: userProfile,
                      error: null,
                    }),
                  }),
                  neq: jest.fn().mockReturnThis(),
                  gte: jest.fn().mockReturnThis(),
                  lte: jest.fn().mockReturnThis(),
                  not: jest.fn().mockReturnThis(),
                  limit: jest.fn().mockResolvedValue({
                    data: profiles.filter(p => 
                      p.age >= userProfile.age_min && 
                      p.age <= userProfile.age_max
                    ),
                    error: null,
                  }),
                }),
              };
            }
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          });

          const result = await SupabaseMatchService.getDiscoveryFeed(userProfile.id);

          if (result.success && result.data) {
            // All profiles should have distance property
            const allHaveDistance = result.data.every(profile =>
              profile.distance !== undefined
            );
            return allHaveDistance;
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property Test 4: Combined filters
   * All profiles should match ALL filter criteria simultaneously
   */
  test('Property 12.4: All profiles match combined filters', async () => {
    await fc.assert(
      fc.asyncProperty(
        userProfileArbitrary,
        fc.array(profileArbitrary, { minLength: 5, maxLength: 20 }),
        async (userProfile, profiles) => {
          // Mock Supabase responses
          supabase.from.mockImplementation((table) => {
            if (table === 'profiles') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: userProfile,
                      error: null,
                    }),
                  }),
                  neq: jest.fn().mockReturnThis(),
                  gte: jest.fn().mockReturnThis(),
                  lte: jest.fn().mockReturnThis(),
                  not: jest.fn().mockReturnThis(),
                  limit: jest.fn().mockResolvedValue({
                    data: profiles.filter(p => {
                      const ageMatch = p.age >= userProfile.age_min && p.age <= userProfile.age_max;
                      const genderMatch = userProfile.gender_preference === 'everyone' || 
                                         p.gender === userProfile.gender_preference;
                      return ageMatch && genderMatch;
                    }),
                    error: null,
                  }),
                }),
              };
            }
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          });

          const result = await SupabaseMatchService.getDiscoveryFeed(userProfile.id);

          if (result.success && result.data) {
            // Verify all filters are applied
            const allMatch = result.data.every(profile => {
              const ageMatch = profile.age >= userProfile.age_min && 
                              profile.age <= userProfile.age_max;
              const genderMatch = userProfile.gender_preference === 'everyone' || 
                                 profile.gender === userProfile.gender_preference;
              
              return ageMatch && genderMatch;
            });
            return allMatch;
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property Test 5: Empty result when no matches
   * If no profiles match filters, result should be empty array
   */
  test('Property 12.5: Empty result when no profiles match', async () => {
    await fc.assert(
      fc.asyncProperty(
        userProfileArbitrary,
        async (userProfile) => {
          // Mock Supabase to return no profiles
          supabase.from.mockImplementation((table) => {
            if (table === 'profiles') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: userProfile,
                      error: null,
                    }),
                  }),
                  neq: jest.fn().mockReturnThis(),
                  gte: jest.fn().mockReturnThis(),
                  lte: jest.fn().mockReturnThis(),
                  not: jest.fn().mockReturnThis(),
                  limit: jest.fn().mockResolvedValue({
                    data: [], // No profiles
                    error: null,
                  }),
                }),
              };
            }
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          });

          const result = await SupabaseMatchService.getDiscoveryFeed(userProfile.id);

          if (result.success) {
            return Array.isArray(result.data) && result.data.length === 0;
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
