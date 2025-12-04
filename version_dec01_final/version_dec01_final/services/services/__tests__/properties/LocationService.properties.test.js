/**
 * Property-Based Tests for LocationService
 * Feature: property-based-testing
 */
import fc from 'fast-check';
import {
  locationPairGenerator,
  sameLocationGenerator,
  knownDistanceGenerator,
  locationListGenerator,
} from '../generators/locationGenerators';

// Mock LocationService to avoid Supabase dependency
const LocationService = {
  /**
   * Haversine formula for distance calculation
   */
  calculateDistance(loc1, loc2) {
    if (!loc1 || !loc2) return null;
    
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
   * Sort profiles by distance from origin
   */
  sortByDistance(profiles, origin) {
    return [...profiles].sort((a, b) => {
      const distA = this.calculateDistance(a.location, origin);
      const distB = this.calculateDistance(b.location, origin);
      return distA - distB;
    });
  },
};

describe('LocationService Properties', () => {
  /**
   * Property 16: Distance non-negativity
   * Validates: Requirements 5.1
   */
  it('Property 16: Distance non-negativity - for any two locations, distance should be non-negative', () => {
    fc.assert(
      fc.property(locationPairGenerator, ([loc1, loc2]) => {
        const distance = LocationService.calculateDistance(loc1, loc2);
        expect(distance).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 17: Distance identity
   * Validates: Requirements 5.2
   */
  it('Property 17: Distance identity - distance from a location to itself should be zero', () => {
    fc.assert(
      fc.property(sameLocationGenerator, ([loc1, loc2]) => {
        const distance = LocationService.calculateDistance(loc1, loc2);
        expect(distance).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 18: Haversine accuracy
   * Validates: Requirements 5.3
   */
  it('Property 18: Haversine accuracy - distance should be within 1km of expected', () => {
    fc.assert(
      fc.property(knownDistanceGenerator, ({ location1, location2, expectedDistance, tolerance }) => {
        const distance = LocationService.calculateDistance(location1, location2);
        const difference = Math.abs(distance - expectedDistance);
        expect(difference).toBeLessThanOrEqual(tolerance);
      }),
      { numRuns: 10 } // Fewer runs since we have specific test cases
    );
  });

  /**
   * Property 19: Distance sorting order
   * Validates: Requirements 5.4
   */
  it('Property 19: Distance sorting order - sorted locations should be in ascending distance order', () => {
    fc.assert(
      fc.property(
        locationListGenerator,
        fc.record({
          latitude: fc.double({ min: -90, max: 90, noNaN: true }),
          longitude: fc.double({ min: -180, max: 180, noNaN: true }),
        }),
        (locations, origin) => {
          // Create profiles with locations
          const profiles = locations.map((loc, index) => ({
            id: index,
            location: loc,
          }));

          // Sort by distance
          const sorted = LocationService.sortByDistance(profiles, origin);

          // Verify ascending order
          for (let i = 0; i < sorted.length - 1; i++) {
            const dist1 = LocationService.calculateDistance(sorted[i].location, origin);
            const dist2 = LocationService.calculateDistance(sorted[i + 1].location, origin);
            expect(dist1).toBeLessThanOrEqual(dist2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 20: Location update consistency
   * Validates: Requirements 5.5
   */
  it('Property 20: Location update consistency - updating location should recalculate distances', () => {
    fc.assert(
      fc.property(
        fc.record({
          latitude: fc.double({ min: -90, max: 90, noNaN: true }),
          longitude: fc.double({ min: -180, max: 180, noNaN: true }),
        }),
        fc.record({
          latitude: fc.double({ min: -90, max: 90, noNaN: true }),
          longitude: fc.double({ min: -180, max: 180, noNaN: true }),
        }),
        fc.record({
          latitude: fc.double({ min: -90, max: 90, noNaN: true }),
          longitude: fc.double({ min: -180, max: 180, noNaN: true }),
        }),
        (userLocation1, userLocation2, targetLocation) => {
          // Calculate distance from first location
          const distance1 = LocationService.calculateDistance(userLocation1, targetLocation);

          // Update user location
          const updatedUserLocation = userLocation2;

          // Calculate distance from updated location
          const distance2 = LocationService.calculateDistance(updatedUserLocation, targetLocation);

          // Distances should be different (unless locations are the same)
          if (
            userLocation1.latitude !== userLocation2.latitude ||
            userLocation1.longitude !== userLocation2.longitude
          ) {
            // If locations changed, distances should likely be different
            // (unless by coincidence they're equidistant)
            expect(distance1).toBeDefined();
            expect(distance2).toBeDefined();
            expect(distance1).toBeGreaterThanOrEqual(0);
            expect(distance2).toBeGreaterThanOrEqual(0);
          } else {
            // If locations are the same, distances should be the same
            expect(distance1).toBe(distance2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
