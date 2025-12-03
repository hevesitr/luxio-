/**
 * Location Generators for Property-Based Testing
 * 
 * These generators create random but valid location data
 * for use in property-based tests with fast-check.
 */

import fc from 'fast-check';

/**
 * Generate a valid latitude (-90 to 90)
 */
export const latitudeGenerator = fc.double({ min: -90, max: 90, noNaN: true });

/**
 * Generate a valid longitude (-180 to 180)
 */
export const longitudeGenerator = fc.double({ min: -180, max: 180, noNaN: true });

/**
 * Generate a valid location object
 * 
 * @example
 * fc.assert(
 *   fc.property(locationGenerator, (location) => {
 *     expect(location.latitude).toBeGreaterThanOrEqual(-90);
 *     expect(location.latitude).toBeLessThanOrEqual(90);
 *   })
 * );
 */
export const locationGenerator = fc.record({
  latitude: latitudeGenerator,
  longitude: longitudeGenerator,
});

/**
 * Generate a distance in kilometers (0-1000 km)
 */
export const distanceGenerator = fc.integer({ min: 0, max: 1000 });

/**
 * Generate a location within a specific region
 * 
 * @param {Object} bounds - Bounds for the location
 * @param {number} bounds.minLat - Minimum latitude
 * @param {number} bounds.maxLat - Maximum latitude
 * @param {number} bounds.minLng - Minimum longitude
 * @param {number} bounds.maxLng - Maximum longitude
 * @returns {fc.Arbitrary} Generator for bounded location
 * 
 * @example
 * // Generate locations in Budapest area
 * const budapestLocation = boundedLocationGenerator({
 *   minLat: 47.3, maxLat: 47.6,
 *   minLng: 18.9, maxLng: 19.3
 * });
 */
export const boundedLocationGenerator = (bounds) => {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  
  return fc.record({
    latitude: fc.double({ min: minLat, max: maxLat, noNaN: true }),
    longitude: fc.double({ min: minLng, max: maxLng, noNaN: true }),
  });
};

/**
 * Generate a location near a specific point
 * 
 * @param {Object} center - Center point
 * @param {number} center.latitude - Center latitude
 * @param {number} center.longitude - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {fc.Arbitrary} Generator for nearby location
 * 
 * @example
 * // Generate locations within 10km of Budapest center
 * const nearbyLocation = nearbyLocationGenerator(
 *   { latitude: 47.4979, longitude: 19.0402 },
 *   10
 * );
 */
export const nearbyLocationGenerator = (center, radiusKm) => {
  // Approximate: 1 degree latitude ≈ 111 km
  // 1 degree longitude ≈ 111 km * cos(latitude)
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(center.latitude * Math.PI / 180));
  
  return fc.record({
    latitude: fc.double({ 
      min: Math.max(-90, center.latitude - latDelta), 
      max: Math.min(90, center.latitude + latDelta),
      noNaN: true
    }),
    longitude: fc.double({ 
      min: Math.max(-180, center.longitude - lngDelta), 
      max: Math.min(180, center.longitude + lngDelta),
      noNaN: true
    }),
  });
};

/**
 * Generate a pair of locations with a specific distance range
 * 
 * @param {number} minDistanceKm - Minimum distance in kilometers
 * @param {number} maxDistanceKm - Maximum distance in kilometers
 * @returns {fc.Arbitrary} Generator for location pair
 * 
 * @example
 * const locationPair = locationPairGenerator(5, 50);
 */
export const locationPairGenerator = (minDistanceKm = 0, maxDistanceKm = 100) => {
  return fc.tuple(locationGenerator, locationGenerator)
    .filter(([loc1, loc2]) => {
      // Calculate approximate distance using Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
      const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(loc1.latitude * Math.PI / 180) * 
        Math.cos(loc2.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      return distance >= minDistanceKm && distance <= maxDistanceKm;
    });
};

/**
 * Common city locations for testing
 */
export const cityLocations = {
  budapest: { latitude: 47.4979, longitude: 19.0402 },
  debrecen: { latitude: 47.5316, longitude: 21.6273 },
  szeged: { latitude: 46.2530, longitude: 20.1414 },
  pecs: { latitude: 46.0727, longitude: 18.2324 },
  gyor: { latitude: 47.6875, longitude: 17.6504 },
};

/**
 * Generate a location from a list of cities
 */
export const cityLocationGenerator = fc.constantFrom(
  ...Object.values(cityLocations)
);
