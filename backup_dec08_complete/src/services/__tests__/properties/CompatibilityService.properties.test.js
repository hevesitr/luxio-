/**
 * Property-Based Tests for Compatibility Algorithm
 * Feature: property-based-testing
 */
import fc from 'fast-check';
import { profileGenerator } from '../generators/userGenerators';
import { locationGenerator } from '../generators/locationGenerators';

// Mock Compatibility Service
class MockCompatibilityService {
  calculateCompatibility(profile1, profile2) {
    let score = 0;
    let maxScore = 0;

    // Shared interests (40 points)
    maxScore += 40;
    if (profile1.interests && profile2.interests) {
      const interests1 = new Set(profile1.interests);
      const interests2 = new Set(profile2.interests);
      const commonInterests = [...interests1].filter(i => interests2.has(i));
      const maxInterests = Math.max(interests1.size, interests2.size);
      if (maxInterests > 0) {
        score += (commonInterests.length / maxInterests) * 40;
      }
    }

    // Location proximity (30 points)
    maxScore += 30;
    if (profile1.location && profile2.location) {
      const distance = this.calculateDistance(profile1.location, profile2.location);
      if (distance !== null && !isNaN(distance)) {
        if (distance <= 5) score += 30;
        else if (distance <= 20) score += 20;
        else if (distance <= 50) score += 10;
      }
    }

    // Relationship goal (20 points)
    maxScore += 20;
    if (profile1.relationshipGoal && profile2.relationshipGoal) {
      if (profile1.relationshipGoal === profile2.relationshipGoal) {
        score += 20;
      }
    }

    // Activity pattern (10 points)
    maxScore += 10;
    if (profile1.lastActive && profile2.lastActive) {
      const hoursDiff = Math.abs(
        new Date(profile1.lastActive).getHours() -
        new Date(profile2.lastActive).getHours()
      );
      score += Math.max(0, 10 - hoursDiff);
    }

    // Normalize to 0-100
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

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
  }
}

describe('Compatibility Algorithm Properties', () => {
  let compatibilityService;

  beforeEach(() => {
    compatibilityService = new MockCompatibilityService();
  });

  /**
   * Property 25: Compatibility score bounds
   * Validates: Requirements 7.1
   */
  it('Property 25: Compatibility score bounds - score should be between 0 and 100', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileGenerator,
        profileGenerator,
        async (profile1, profile2) => {
          const score = compatibilityService.calculateCompatibility(profile1, profile2);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 26: Identical interests maximum score
   * Validates: Requirements 7.2
   */
  it('Property 26: Identical interests maximum score - identical interests should give max interest score', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 3, maxLength: 10 }),
        async (interests) => {
          const profile1 = {
            interests,
            location: null,
            relationshipGoal: null,
            lastActive: null,
          };
          const profile2 = {
            interests: [...interests], // Same interests
            location: null,
            relationshipGoal: null,
            lastActive: null,
          };

          const score = compatibilityService.calculateCompatibility(profile1, profile2);
          
          // With only interests (40 points out of 100 max), score should be 40
          expect(score).toBe(40);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 27: Same location maximum proximity
   * Validates: Requirements 7.3
   */
  it('Property 27: Same location maximum proximity - same location should give max proximity score', async () => {
    await fc.assert(
      fc.asyncProperty(
        locationGenerator,
        async (location) => {
          const profile1 = {
            interests: [],
            location,
            relationshipGoal: null,
            lastActive: null,
          };
          const profile2 = {
            interests: [],
            location: { ...location }, // Same location
            relationshipGoal: null,
            lastActive: null,
          };

          const score = compatibilityService.calculateCompatibility(profile1, profile2);
          
          // With only location (30 points out of 100 max), score should be 30
          expect(score).toBe(30);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 28: No common interests zero score
   * Validates: Requirements 7.4
   */
  it('Property 28: No common interests zero score - no common interests should give zero interest score', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        async (interests1, interests2) => {
          // Ensure no overlap
          const set1 = new Set(interests1.map(i => `a-${i}`));
          const set2 = new Set(interests2.map(i => `b-${i}`));

          const profile1 = {
            interests: Array.from(set1),
            location: null,
            relationshipGoal: null,
            lastActive: null,
          };
          const profile2 = {
            interests: Array.from(set2),
            location: null,
            relationshipGoal: null,
            lastActive: null,
          };

          const score = compatibilityService.calculateCompatibility(profile1, profile2);
          
          // With no common interests and no other factors, score should be 0
          expect(score).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 29: Compatibility idempotence
   * Validates: Requirements 7.5
   */
  it('Property 29: Compatibility idempotence - calculating multiple times should give same result', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileGenerator,
        profileGenerator,
        async (profile1, profile2) => {
          const score1 = compatibilityService.calculateCompatibility(profile1, profile2);
          const score2 = compatibilityService.calculateCompatibility(profile1, profile2);
          const score3 = compatibilityService.calculateCompatibility(profile1, profile2);

          expect(score1).toBe(score2);
          expect(score2).toBe(score3);
        }
      ),
      { numRuns: 100 }
    );
  });
});
