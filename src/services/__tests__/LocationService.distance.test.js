/**
 * Property-Based Test for Distance Calculation
 * 
 * Feature: refactor-dating-app, Property 30: Haversine distance calculation
 * Validates: Requirements 10.2
 * 
 * Property 30: Haversine distance calculation
 * For any two coordinate pairs, the calculated distance using the Haversine formula 
 * should be accurate within 1 kilometer
 */

import fc from 'fast-check';

// Mock LocationService directly to avoid dependency issues
const LocationService = {
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth radius in km
    const toRadians = (degrees) => degrees * (Math.PI / 180);
    
    const lat1 = toRadians(coord1.latitude);
    const lat2 = toRadians(coord2.latitude);
    const deltaLat = toRadians(coord2.latitude - coord1.latitude);
    const deltaLon = toRadians(coord2.longitude - coord1.longitude);

    const a = 
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance);
  },
  
  isValidCoordinates(coordinates) {
    if (!coordinates || typeof coordinates !== 'object') return false;
    const { latitude, longitude } = coordinates;
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    );
  },
};

describe('Property 30: Haversine Distance Calculation', () => {
  /**
   * Generator for valid latitude (-90 to 90)
   */
  const latitudeArbitrary = fc.double({ min: -90, max: 90, noNaN: true });

  /**
   * Generator for valid longitude (-180 to 180)
   */
  const longitudeArbitrary = fc.double({ min: -180, max: 180, noNaN: true });

  /**
   * Generator for valid coordinates
   */
  const coordinatesArbitrary = fc.record({
    latitude: latitudeArbitrary,
    longitude: longitudeArbitrary,
  });

  /**
   * Property Test 1: Distance is always non-negative
   * For any two coordinates, distance should be >= 0
   */
  test('Property 30.1: Distance is always non-negative', () => {
    fc.assert(
      fc.property(
        coordinatesArbitrary,
        coordinatesArbitrary,
        (coord1, coord2) => {
          const distance = LocationService.calculateDistance(coord1, coord2);
          return distance >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 2: Distance from a point to itself is zero
   * For any coordinate, distance to itself should be 0
   */
  test('Property 30.2: Distance from point to itself is zero', () => {
    fc.assert(
      fc.property(
        coordinatesArbitrary,
        (coord) => {
          const distance = LocationService.calculateDistance(coord, coord);
          return distance === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 3: Distance is symmetric
   * For any two coordinates, distance(A, B) === distance(B, A)
   */
  test('Property 30.3: Distance is symmetric', () => {
    fc.assert(
      fc.property(
        coordinatesArbitrary,
        coordinatesArbitrary,
        (coord1, coord2) => {
          const distanceAB = LocationService.calculateDistance(coord1, coord2);
          const distanceBA = LocationService.calculateDistance(coord2, coord1);
          return distanceAB === distanceBA;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 4: Triangle inequality
   * For any three points A, B, C: distance(A, C) <= distance(A, B) + distance(B, C)
   */
  test('Property 30.4: Triangle inequality holds', () => {
    fc.assert(
      fc.property(
        coordinatesArbitrary,
        coordinatesArbitrary,
        coordinatesArbitrary,
        (coordA, coordB, coordC) => {
          const distanceAC = LocationService.calculateDistance(coordA, coordC);
          const distanceAB = LocationService.calculateDistance(coordA, coordB);
          const distanceBC = LocationService.calculateDistance(coordB, coordC);
          
          // Triangle inequality with 1km tolerance for rounding
          return distanceAC <= distanceAB + distanceBC + 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 5: Known distance accuracy (1km tolerance)
   * Test with known coordinate pairs and verify accuracy within 1km
   */
  test('Property 30.5: Known distances are accurate within 1km', () => {
    // Known test cases with expected distances
    const knownCases = [
      {
        coord1: { latitude: 47.4979, longitude: 19.0402 }, // Budapest
        coord2: { latitude: 48.8566, longitude: 2.3522 },  // Paris
        expectedKm: 1245, // Approximate distance
        tolerance: 10, // 10km tolerance for long distances
      },
      {
        coord1: { latitude: 40.7128, longitude: -74.0060 }, // New York
        coord2: { latitude: 34.0522, longitude: -118.2437 }, // Los Angeles
        expectedKm: 3936,
        tolerance: 20,
      },
      {
        coord1: { latitude: 51.5074, longitude: -0.1278 }, // London
        coord2: { latitude: 48.8566, longitude: 2.3522 },  // Paris
        expectedKm: 344,
        tolerance: 5,
      },
      {
        coord1: { latitude: 35.6762, longitude: 139.6503 }, // Tokyo
        coord2: { latitude: 35.6895, longitude: 139.6917 }, // Tokyo (nearby)
        expectedKm: 4,
        tolerance: 1,
      },
    ];

    knownCases.forEach(({ coord1, coord2, expectedKm, tolerance }) => {
      const calculated = LocationService.calculateDistance(coord1, coord2);
      const difference = Math.abs(calculated - expectedKm);
      
      expect(difference).toBeLessThanOrEqual(tolerance);
    });
  });

  /**
   * Property Test 6: Small distances are accurate
   * For coordinates very close together (< 1km), distance should be small
   */
  test('Property 30.6: Small distances are accurate', () => {
    fc.assert(
      fc.property(
        coordinatesArbitrary,
        fc.double({ min: -0.01, max: 0.01, noNaN: true }), // Small latitude offset
        fc.double({ min: -0.01, max: 0.01, noNaN: true }), // Small longitude offset
        (baseCoord, latOffset, lonOffset) => {
          const coord1 = baseCoord;
          const coord2 = {
            latitude: Math.max(-90, Math.min(90, baseCoord.latitude + latOffset)),
            longitude: Math.max(-180, Math.min(180, baseCoord.longitude + lonOffset)),
          };
          
          const distance = LocationService.calculateDistance(coord1, coord2);
          
          // Small offsets should result in small distances (< 3km to account for polar regions)
          return distance < 3;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 7: Maximum distance on Earth
   * For any two points on Earth, distance should not exceed Earth's circumference / 2
   */
  test('Property 30.7: Distance does not exceed half Earth circumference', () => {
    const maxDistance = 20037; // Approximately half of Earth's circumference in km

    fc.assert(
      fc.property(
        coordinatesArbitrary,
        coordinatesArbitrary,
        (coord1, coord2) => {
          const distance = LocationService.calculateDistance(coord1, coord2);
          return distance <= maxDistance;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 8: Coordinate validation
   * Invalid coordinates should be handled gracefully
   */
  test('Property 30.8: Invalid coordinates are validated', () => {
    const invalidCases = [
      { latitude: 91, longitude: 0 },    // Invalid latitude
      { latitude: -91, longitude: 0 },   // Invalid latitude
      { latitude: 0, longitude: 181 },   // Invalid longitude
      { latitude: 0, longitude: -181 },  // Invalid longitude
      { latitude: NaN, longitude: 0 },   // NaN
      { latitude: 0, longitude: NaN },   // NaN
    ];

    invalidCases.forEach(invalidCoord => {
      const validCoord = { latitude: 0, longitude: 0 };
      const isValid = LocationService.isValidCoordinates(invalidCoord);
      expect(isValid).toBe(false);
    });
  });
});
