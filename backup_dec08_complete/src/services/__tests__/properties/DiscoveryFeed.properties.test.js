/**
 * Property-Based Tests for Discovery Feed
 * Feature: property-based-testing
 */
import fc from 'fast-check';
import {
  userGenerator,
  profileGenerator,
  profileListGenerator,
} from '../generators/userGenerators';
import {
  locationGenerator,
} from '../generators/locationGenerators';

// Mock DiscoveryService
const DiscoveryService = {
  /**
   * Filter profiles by age range
   */
  filterByAge(profiles, minAge, maxAge) {
    return profiles.filter(profile => {
      const age = profile.age;
      return age >= minAge && age <= maxAge;
    });
  },

  /**
   * Filter profiles by distance
   */
  filterByDistance(profiles, userLocation, maxDistance) {
    return profiles.filter(profile => {
      if (!profile.location) return false;
      
      const distance = this.calculateDistance(userLocation, profile.location);
      return distance <= maxDistance;
    });
  },

  /**
   * Filter profiles by gender
   */
  filterByGender(profiles, preferredGender) {
    if (!preferredGender || preferredGender === 'all') {
      return profiles;
    }
    
    return profiles.filter(profile => profile.gender === preferredGender);
  },

  /**
   * Calculate distance using Haversine formula
   */
  calculateDistance(loc1, loc2) {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(loc1.latitude * Math.PI / 180) *
      Math.cos(loc2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Exclude seen profiles
   */
  excludeSeenProfiles(profiles, seenIds) {
    return profiles.filter(profile => !seenIds.includes(profile.id));
  },
};

describe('Discovery Feed Properties', () => {
  /**
   * Property 21: Seen profile exclusion
   * Validates: Requirements 6.1
   */
  it('Property 21: Seen profile exclusion - seen profiles should not appear in feed', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileListGenerator,
        fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
        async (profiles, seenIds) => {
          const filtered = DiscoveryService.excludeSeenProfiles(profiles, seenIds);
          
          // Verify no seen profiles in result
          filtered.forEach(profile => {
            expect(seenIds).not.toContain(profile.id);
          });
          
          // Verify all unseen profiles are included
          const unseenProfiles = profiles.filter(p => !seenIds.includes(p.id));
          expect(filtered.length).toBe(unseenProfiles.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 22: Age filter correctness
   * Validates: Requirements 6.2
   */
  it('Property 22: Age filter correctness - all results should be within age range', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileListGenerator,
        fc.integer({ min: 18, max: 50 }),
        fc.integer({ min: 51, max: 99 }),
        async (profiles, minAge, maxAge) => {
          // Ensure minAge <= maxAge
          const [min, max] = minAge <= maxAge ? [minAge, maxAge] : [maxAge, minAge];
          
          const filtered = DiscoveryService.filterByAge(profiles, min, max);
          
          // Verify all results are within range
          filtered.forEach(profile => {
            expect(profile.age).toBeGreaterThanOrEqual(min);
            expect(profile.age).toBeLessThanOrEqual(max);
          });
          
          // Verify no valid profiles were excluded
          const validProfiles = profiles.filter(p => p.age >= min && p.age <= max);
          expect(filtered.length).toBe(validProfiles.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 23: Distance filter correctness
   * Validates: Requirements 6.3
   */
  it('Property 23: Distance filter correctness - all results should be within distance radius', async () => {
    await fc.assert(
      fc.asyncProperty(
        locationGenerator,
        profileListGenerator,
        fc.integer({ min: 1, max: 100 }),
        async (userLocation, profiles, maxDistance) => {
          // Add locations to profiles (use the profiles' existing locations or generate new ones)
          const profilesWithLocation = profiles.map(p => ({
            ...p,
            location: p.location || userLocation, // Use existing or default to user location
          }));
          
          const filtered = DiscoveryService.filterByDistance(
            profilesWithLocation,
            userLocation,
            maxDistance
          );
          
          // Verify all results are within distance
          filtered.forEach(profile => {
            const distance = DiscoveryService.calculateDistance(
              userLocation,
              profile.location
            );
            expect(distance).toBeLessThanOrEqual(maxDistance);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 24: Gender filter correctness
   * Validates: Requirements 6.4
   */
  it('Property 24: Gender filter correctness - all results should match gender preference', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileListGenerator,
        fc.oneof(
          fc.constant('male'),
          fc.constant('female'),
          fc.constant('other'),
          fc.constant('all')
        ),
        async (profiles, preferredGender) => {
          const filtered = DiscoveryService.filterByGender(profiles, preferredGender);
          
          if (preferredGender === 'all') {
            // All profiles should be included
            expect(filtered.length).toBe(profiles.length);
          } else {
            // Only matching gender should be included
            filtered.forEach(profile => {
              expect(profile.gender).toBe(preferredGender);
            });
            
            // Verify no valid profiles were excluded
            const validProfiles = profiles.filter(p => p.gender === preferredGender);
            expect(filtered.length).toBe(validProfiles.length);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
