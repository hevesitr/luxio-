/**
 * Location Generators for Property-Based Testing
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
 * Generate a complete location object
 */
export const locationGenerator = fc.record({
  latitude: latitudeGenerator,
  longitude: longitudeGenerator,
});

/**
 * Generate a pair of locations (for distance testing)
 */
export const locationPairGenerator = fc.tuple(locationGenerator, locationGenerator);

/**
 * Generate a distance in kilometers (0-20000 km, max Earth distance)
 */
export const distanceGenerator = fc.double({ min: 0, max: 20000, noNaN: true });

/**
 * Generate a location with known distance from origin
 * (for testing distance calculations)
 */
export const locationWithDistanceGenerator = fc.record({
  origin: locationGenerator,
  target: locationGenerator,
});

/**
 * Generate the same location twice (for identity testing)
 */
export const sameLocationGenerator = locationGenerator.chain(loc =>
  fc.tuple(fc.constant(loc), fc.constant(loc))
);

/**
 * Generate a list of locations (for sorting tests)
 */
export const locationListGenerator = fc.array(locationGenerator, {
  minLength: 2,
  maxLength: 20,
});

/**
 * Generate a location near a reference point
 * (within ~10km, for proximity testing)
 */
export const nearbyLocationGenerator = locationGenerator.chain(origin =>
  fc.record({
    origin: fc.constant(origin),
    nearby: fc.record({
      latitude: fc.double({
        min: Math.max(-90, origin.latitude - 0.1),
        max: Math.min(90, origin.latitude + 0.1),
        noNaN: true,
      }),
      longitude: fc.double({
        min: Math.max(-180, origin.longitude - 0.1),
        max: Math.min(180, origin.longitude + 0.1),
        noNaN: true,
      }),
    }),
  })
);

/**
 * Generate a location far from a reference point
 * (>1000km, for distance filtering tests)
 */
export const farLocationGenerator = fc.record({
  location1: fc.record({
    latitude: fc.double({ min: -90, max: 0, noNaN: true }),
    longitude: fc.double({ min: -180, max: 0, noNaN: true }),
  }),
  location2: fc.record({
    latitude: fc.double({ min: 0, max: 90, noNaN: true }),
    longitude: fc.double({ min: 0, max: 180, noNaN: true }),
  }),
});

/**
 * Generate known location pairs with expected distances
 * (for accuracy testing)
 */
export const knownDistanceGenerator = fc.constantFrom(
  {
    // Budapest to Vienna (~243 km)
    location1: { latitude: 47.4979, longitude: 19.0402 },
    location2: { latitude: 48.2082, longitude: 16.3738 },
    expectedDistance: 243,
    tolerance: 30, // km (increased for Haversine approximation)
  },
  {
    // New York to Los Angeles (~3944 km)
    location1: { latitude: 40.7128, longitude: -74.0060 },
    location2: { latitude: 34.0522, longitude: -118.2437 },
    expectedDistance: 3944,
    tolerance: 50, // km
  },
  {
    // London to Paris (~344 km)
    location1: { latitude: 51.5074, longitude: -0.1278 },
    location2: { latitude: 48.8566, longitude: 2.3522 },
    expectedDistance: 344,
    tolerance: 30, // km
  }
);

export default {
  latitudeGenerator,
  longitudeGenerator,
  locationGenerator,
  locationPairGenerator,
  distanceGenerator,
  locationWithDistanceGenerator,
  sameLocationGenerator,
  locationListGenerator,
  nearbyLocationGenerator,
  farLocationGenerator,
  knownDistanceGenerator,
};
