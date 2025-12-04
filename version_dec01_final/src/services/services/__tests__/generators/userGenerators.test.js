/**
 * Tests for User Generators
 * 
 * These tests verify that the generators produce valid data
 */

import fc from 'fast-check';
import {
  userGenerator,
  profileGenerator,
  ageGenerator,
  userNameGenerator,
  constrainedUserGenerator,
  constrainedProfileGenerator,
} from './userGenerators';

describe('User Generators', () => {
  describe('ageGenerator', () => {
    it('should generate ages between 18 and 99', () => {
      fc.assert(
        fc.property(ageGenerator, (age) => {
          expect(age).toBeGreaterThanOrEqual(18);
          expect(age).toBeLessThanOrEqual(99);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('userNameGenerator', () => {
    it('should generate names with 2-50 characters', () => {
      fc.assert(
        fc.property(userNameGenerator, (name) => {
          expect(name.trim().length).toBeGreaterThanOrEqual(2);
          expect(name.length).toBeLessThanOrEqual(50);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('userGenerator', () => {
    it('should generate valid user objects', () => {
      fc.assert(
        fc.property(userGenerator, (user) => {
          // Check required fields exist
          expect(user).toHaveProperty('id');
          expect(user).toHaveProperty('name');
          expect(user).toHaveProperty('age');
          expect(user).toHaveProperty('gender');
          expect(user).toHaveProperty('email');

          // Check age constraints
          expect(user.age).toBeGreaterThanOrEqual(18);
          expect(user.age).toBeLessThanOrEqual(99);

          // Check name constraints
          expect(user.name.trim().length).toBeGreaterThanOrEqual(2);
          expect(user.name.length).toBeLessThanOrEqual(50);

          // Check gender is valid
          expect(['male', 'female', 'other']).toContain(user.gender);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('profileGenerator', () => {
    it('should generate valid profile objects', () => {
      fc.assert(
        fc.property(profileGenerator, (profile) => {
          // Check required fields exist
          expect(profile).toHaveProperty('id');
          expect(profile).toHaveProperty('name');
          expect(profile).toHaveProperty('age');
          expect(profile).toHaveProperty('bio');
          expect(profile).toHaveProperty('interests');
          expect(profile).toHaveProperty('location');
          expect(profile).toHaveProperty('relationshipGoal');

          // Check age constraints
          expect(profile.age).toBeGreaterThanOrEqual(18);
          expect(profile.age).toBeLessThanOrEqual(99);

          // Check interests constraints
          expect(profile.interests.length).toBeLessThanOrEqual(10);

          // Check location constraints
          expect(profile.location.latitude).toBeGreaterThanOrEqual(-90);
          expect(profile.location.latitude).toBeLessThanOrEqual(90);
          expect(profile.location.longitude).toBeGreaterThanOrEqual(-180);
          expect(profile.location.longitude).toBeLessThanOrEqual(180);

          // Check distance constraints
          expect(profile.distance).toBeGreaterThanOrEqual(0);
          expect(profile.distance).toBeLessThanOrEqual(100);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('constrainedUserGenerator', () => {
    it('should respect age constraints', () => {
      const generator = constrainedUserGenerator({ minAge: 25, maxAge: 35 });
      
      fc.assert(
        fc.property(generator, (user) => {
          expect(user.age).toBeGreaterThanOrEqual(25);
          expect(user.age).toBeLessThanOrEqual(35);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should respect gender constraints', () => {
      const generator = constrainedUserGenerator({ gender: 'female' });
      
      fc.assert(
        fc.property(generator, (user) => {
          expect(user.gender).toBe('female');
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('constrainedProfileGenerator', () => {
    it('should respect relationship goal constraints', () => {
      const generator = constrainedProfileGenerator({ relationshipGoal: 'serious' });
      
      fc.assert(
        fc.property(generator, (profile) => {
          expect(profile.relationshipGoal).toBe('serious');
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should respect interests count constraints', () => {
      const generator = constrainedProfileGenerator({ minInterests: 3, maxInterests: 5 });
      
      fc.assert(
        fc.property(generator, (profile) => {
          expect(profile.interests.length).toBeGreaterThanOrEqual(3);
          expect(profile.interests.length).toBeLessThanOrEqual(5);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
