/**
 * Tests for Location Generators
 * 
 * These tests verify that the generators produce valid location data
 */

import fc from 'fast-check';
import {
  locationGenerator,
  latitudeGenerator,
  longitudeGenerator,
  distanceGenerator,
  boundedLocationGenerator,
  nearbyLocationGenerator,
  cityLocationGenerator,
} from './locationGenerators';

describe('Location Generators', () => {
  describe('latitudeGenerator', () => {
    it('should generate latitudes between -90 and 90', () => {
      fc.assert(
        fc.property(latitudeGenerator, (lat) => {
          expect(lat).toBeGreaterThanOrEqual(-90);
          expect(lat).toBeLessThanOrEqual(90);
          expect(isNaN(lat)).toBe(false);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('longitudeGenerator', () => {
    it('should generate longitudes between -180 and 180', () => {
      fc.assert(
        fc.property(longitudeGenerator, (lng) => {
          expect(lng).toBeGreaterThanOrEqual(-180);
          expect(lng).toBeLessThanOrEqual(180);
          expect(isNaN(lng)).toBe(false);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('locationGenerator', () => {
    it('should generate valid location objects', () => {
      fc.assert(
        fc.property(locationGenerator, (location) => {
          // Check required fields exist
          expect(location).toHaveProperty('latitude');
          expect(location).toHaveProperty('longitude');

          // Check latitude constraints
          expect(location.latitude).toBeGreaterThanOrEqual(-90);
          expect(location.latitude).toBeLessThanOrEqual(90);
          expect(isNaN(location.latitude)).toBe(false);

          // Check longitude constraints
          expect(location.longitude).toBeGreaterThanOrEqual(-180);
          expect(location.longitude).toBeLessThanOrEqual(180);
          expect(isNaN(location.longitude)).toBe(false);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('distanceGenerator', () => {
    it('should generate distances between 0 and 1000 km', () => {
      fc.assert(
        fc.property(distanceGenerator, (distance) => {
          expect(distance).toBeGreaterThanOrEqual(0);
          expect(distance).toBeLessThanOrEqual(1000);
          expect(Number.isInteger(distance)).toBe(true);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('boundedLocationGenerator', () => {
    it('should generate locations within specified bounds', () => {
      const bounds = {
        minLat: 47.3,
        maxLat: 47.6,
        minLng: 18.9,
        maxLng: 19.3,
      };
      const generator = boundedLocationGenerator(bounds);

      fc.assert(
        fc.property(generator, (location) => {
          expect(location.latitude).toBeGreaterThanOrEqual(bounds.minLat);
          expect(location.latitude).toBeLessThanOrEqual(bounds.maxLat);
          expect(location.longitude).toBeGreaterThanOrEqual(bounds.minLng);
          expect(location.longitude).toBeLessThanOrEqual(bounds.maxLng);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('nearbyLocationGenerator', () => {
    it('should generate locations near a center point', () => {
      const center = { latitude: 47.4979, longitude: 19.0402 }; // Budapest
      const radiusKm = 10;
      const generator = nearbyLocationGenerator(center, radiusKm);

      fc.assert(
        fc.property(generator, (location) => {
          // Calculate approximate distance
          const R = 6371; // Earth's radius in km
          const dLat = (location.latitude - center.latitude) * Math.PI / 180;
          const dLon = (location.longitude - center.longitude) * Math.PI / 180;
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(center.latitude * Math.PI / 180) * 
            Math.cos(location.latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          // Allow some margin for approximation
          expect(distance).toBeLessThanOrEqual(radiusKm * 1.5);
          return true;
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('cityLocationGenerator', () => {
    it('should generate valid city locations', () => {
      fc.assert(
        fc.property(cityLocationGenerator, (location) => {
          expect(location).toHaveProperty('latitude');
          expect(location).toHaveProperty('longitude');
          expect(location.latitude).toBeGreaterThanOrEqual(-90);
          expect(location.latitude).toBeLessThanOrEqual(90);
          expect(location.longitude).toBeGreaterThanOrEqual(-180);
          expect(location.longitude).toBeLessThanOrEqual(180);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
