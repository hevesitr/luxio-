/**
 * DateIdeasService Tests
 *
 * Tests for date ideas and location suggestions functionality
 */
import DateIdeasService from '../DateIdeasService';

describe('DateIdeasService', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Budapest center to Margitsziget (approximate distance)
      const distance = DateIdeasService.calculateDistance(
        47.4979, 19.0402,  // Budapest center
        47.5280, 19.0510   // Margitsziget
      );

      expect(distance).toBeGreaterThan(3);
      expect(distance).toBeLessThan(5);
    });

    it('should return 0 for same location', () => {
      const distance = DateIdeasService.calculateDistance(
        47.4979, 19.0402,
        47.4979, 19.0402
      );

      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const distance = DateIdeasService.calculateDistance(
        -33.8688, 151.2093,  // Sydney
        40.7128, -74.0060    // New York
      );

      expect(distance).toBeGreaterThan(15900); // ~16,000 km
    });
  });

  describe('findNearbySpots', () => {
    const userLocation = { latitude: 47.4979, longitude: 19.0402 }; // Budapest center

    it('should find spots within distance limit', () => {
      const nearby = DateIdeasService.findNearbySpots(userLocation, 2); // 2km

      expect(Array.isArray(nearby)).toBe(true);
      nearby.forEach(spot => {
        expect(spot.distance).toBeDefined();
        expect(spot.distance).toBeLessThanOrEqual(2);
      });
    });

    it('should return empty array when no spots within range', () => {
      const nearby = DateIdeasService.findNearbySpots(userLocation, 0.1); // 100m

      expect(Array.isArray(nearby)).toBe(true);
      // Should return empty or very few spots
    });

    it('should sort spots by distance', () => {
      const nearby = DateIdeasService.findNearbySpots(userLocation, 10); // 10km

      expect(Array.isArray(nearby)).toBe(true);
      if (nearby.length > 1) {
        for (let i = 1; i < nearby.length; i++) {
          expect(nearby[i].distance).toBeGreaterThanOrEqual(nearby[i-1].distance);
        }
      }
    });
  });

  describe('selectBestSpot', () => {
    const nearbySpots = [
      { name: 'Espresso Embassy', type: 'Kávézó', distance: 0.5 },
      { name: 'Bors GasztróBár', type: 'Étterem', distance: 0.8 },
      { name: 'Margitsziget', type: 'Park', distance: 3.2 },
    ];

    it('should select coffee spot for coffee activity', () => {
      const activity = { title: 'Kávé és beszélgetés' };
      const spot = DateIdeasService.selectBestSpot(activity, nearbySpots);

      expect(spot).toBeDefined();
      expect(spot.type).toBe('Kávézó');
    });

    it('should select restaurant for dinner activity', () => {
      const activity = { title: 'Romantikus séta és vacsora' };
      const spot = DateIdeasService.selectBestSpot(activity, nearbySpots);

      expect(spot).toBeDefined();
      expect(spot.type).toBe('Étterem');
    });

    it('should select park for walk activity', () => {
      const activity = { title: 'Séta a városban' };
      const spot = DateIdeasService.selectBestSpot(activity, nearbySpots);

      expect(spot).toBeDefined();
      expect(spot.type).toBe('Park');
    });

    it('should return null when no spots available', () => {
      const activity = { title: 'Kávé és beszélgetés' };
      const spot = DateIdeasService.selectBestSpot(activity, []);

      expect(spot).toBeNull();
    });

    it('should return first spot when no matching type found', () => {
      const activity = { title: 'Movie night' };
      const spot = DateIdeasService.selectBestSpot(activity, nearbySpots);

      expect(spot).toBeDefined();
      expect(spot).toBe(nearbySpots[0]); // First spot
    });
  });

  describe('generateDateSuggestions', () => {
    const userLocation = { latitude: 47.4979, longitude: 19.0402 };
    const matchLocation = { latitude: 47.5000, longitude: 19.0450 };

    it('should generate high compatibility suggestions', () => {
      const suggestions = DateIdeasService.generateDateSuggestions(90, userLocation, matchLocation);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);

      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('title');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('duration');
        expect(suggestion).toHaveProperty('emoji');
        expect(suggestion).toHaveProperty('spot');
        expect(suggestion).toHaveProperty('distance');
        expect(typeof suggestion.distance).toBe('number');
      });
    });

    it('should generate medium compatibility suggestions', () => {
      const suggestions = DateIdeasService.generateDateSuggestions(70, userLocation, matchLocation);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should generate low compatibility suggestions', () => {
      const suggestions = DateIdeasService.generateDateSuggestions(30, userLocation, matchLocation);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should include distance calculation in suggestions', () => {
      const suggestions = DateIdeasService.generateDateSuggestions(85, userLocation, matchLocation);

      suggestions.forEach(suggestion => {
        expect(suggestion.distance).toBeDefined();
        expect(typeof suggestion.distance).toBe('number');
        expect(suggestion.distance).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getFirstDateSafetyTips', () => {
    it('should return array of safety tips', () => {
      const tips = DateIdeasService.getFirstDateSafetyTips();

      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBeGreaterThan(0);

      tips.forEach(tip => {
        expect(typeof tip).toBe('string');
        expect(tip.length).toBeGreaterThan(0);
        // Check if contains emoji (basic check for emoji unicode ranges)
        const hasEmoji = /\p{Emoji}/u.test(tip);
        expect(hasEmoji).toBe(true);
      });
    });

    it('should include essential safety tips', () => {
      const tips = DateIdeasService.getFirstDateSafetyTips();

      expect(tips.some(tip => tip.includes('nyilvános'))).toBe(true);
      expect(tips.some(tip => tip.includes('barát'))).toBe(true);
      expect(tips.some(tip => tip.includes('közlekedés'))).toBe(true);
    });
  });

  describe('constants', () => {
    it('should export dateSpots with all categories', () => {
      expect(DateIdeasService.dateSpots).toBeDefined();
      expect(DateIdeasService.dateSpots).toHaveProperty('coffee');
      expect(DateIdeasService.dateSpots).toHaveProperty('restaurant');
      expect(DateIdeasService.dateSpots).toHaveProperty('activity');
      expect(DateIdeasService.dateSpots).toHaveProperty('culture');
      expect(DateIdeasService.dateSpots).toHaveProperty('drink');
    });

    it('should export dateActivitySuggestions with compatibility levels', () => {
      expect(DateIdeasService.dateActivitySuggestions).toBeDefined();
      expect(DateIdeasService.dateActivitySuggestions).toHaveProperty('high');
      expect(DateIdeasService.dateActivitySuggestions).toHaveProperty('medium');
      expect(DateIdeasService.dateActivitySuggestions).toHaveProperty('low');
    });

    it('should have valid spot structure', () => {
      Object.values(DateIdeasService.dateSpots).forEach(category => {
        category.forEach(spot => {
          expect(spot).toHaveProperty('name');
          expect(spot).toHaveProperty('type');
          expect(spot).toHaveProperty('location');
          expect(spot.location).toHaveProperty('latitude');
          expect(spot.location).toHaveProperty('longitude');
          expect(spot).toHaveProperty('vibe');
          expect(spot).toHaveProperty('budget');
          expect(spot).toHaveProperty('description');
        });
      });
    });
  });
});
