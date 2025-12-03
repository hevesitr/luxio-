/**
 * User and Profile Generators for Property-Based Testing
 */
import fc from 'fast-check';

/**
 * Generate a valid user ID (UUID format)
 */
export const userIdGenerator = fc.uuid();

/**
 * Generate a valid user name (2-50 characters)
 */
export const userNameGenerator = fc.string({ minLength: 2, maxLength: 50 });

/**
 * Generate a valid age (18-99 years)
 */
export const ageGenerator = fc.integer({ min: 18, max: 99 });

/**
 * Generate a valid gender
 */
export const genderGenerator = fc.constantFrom('male', 'female', 'other');

/**
 * Generate a list of interests (0-10 items)
 */
export const interestsGenerator = fc.array(
  fc.string({ minLength: 3, maxLength: 20 }),
  { minLength: 0, maxLength: 10 }
);

/**
 * Generate a valid location (lat/long)
 */
export const locationGenerator = fc.record({
  latitude: fc.double({ min: -90, max: 90 }),
  longitude: fc.double({ min: -180, max: 180 }),
});

/**
 * Generate a valid bio (20-500 characters)
 */
export const bioGenerator = fc.string({ minLength: 20, maxLength: 500 });

/**
 * Generate a complete user object
 */
export const userGenerator = fc.record({
  id: userIdGenerator,
  name: userNameGenerator,
  age: ageGenerator,
  gender: genderGenerator,
  interests: interestsGenerator,
  location: locationGenerator,
  bio: bioGenerator,
  isPremium: fc.boolean(),
});

/**
 * Generate a complete profile object
 */
export const profileGenerator = fc.record({
  id: userIdGenerator,
  name: userNameGenerator,
  age: ageGenerator,
  gender: genderGenerator,
  interests: interestsGenerator,
  location: locationGenerator,
  bio: bioGenerator,
  photos: fc.array(fc.webUrl(), { minLength: 2, maxLength: 9 }),
  verified: fc.boolean(),
  relationshipGoal: fc.constantFrom('casual', 'serious', 'friendship', 'unsure'),
});

/**
 * Generate an invalid user (for validation testing)
 */
export const invalidUserGenerator = fc.oneof(
  // Invalid age (too young)
  fc.record({
    id: userIdGenerator,
    name: userNameGenerator,
    age: fc.integer({ min: 0, max: 17 }),
    gender: genderGenerator,
  }),
  // Invalid age (too old)
  fc.record({
    id: userIdGenerator,
    name: userNameGenerator,
    age: fc.integer({ min: 100, max: 150 }),
    gender: genderGenerator,
  }),
  // Invalid name (too short)
  fc.record({
    id: userIdGenerator,
    name: fc.string({ minLength: 0, maxLength: 1 }),
    age: ageGenerator,
    gender: genderGenerator,
  }),
  // Invalid name (too long)
  fc.record({
    id: userIdGenerator,
    name: fc.string({ minLength: 51, maxLength: 100 }),
    age: ageGenerator,
    gender: genderGenerator,
  })
);

/**
 * Generate a pair of users (for mutual like testing)
 */
export const userPairGenerator = fc.tuple(userGenerator, userGenerator);

/**
 * Generate age range filter
 */
export const ageRangeGenerator = fc.record({
  minAge: fc.integer({ min: 18, max: 80 }),
  maxAge: fc.integer({ min: 18, max: 99 }),
}).filter(({ minAge, maxAge }) => minAge <= maxAge);

/**
 * Generate distance filter (in kilometers)
 */
export const distanceFilterGenerator = fc.integer({ min: 1, max: 100 });

/**
 * Generate gender preference filter
 */
export const genderPreferenceGenerator = fc.constantFrom('male', 'female', 'other', 'everyone');

/**
 * Generate profile update object (partial profile data)
 */
export const profileUpdateGenerator = fc.record({
  name: fc.option(userNameGenerator, { nil: undefined }),
  bio: fc.option(bioGenerator, { nil: undefined }),
  interests: fc.option(interestsGenerator, { nil: undefined }),
  location: fc.option(locationGenerator, { nil: undefined }),
}, { requiredKeys: [] });

/**
 * Generate birthdate (for age calculation testing)
 */
export const birthdateGenerator = fc.date({
  min: new Date('1925-01-01'),
  max: new Date('2007-12-31'), // 18 years ago from 2025
});

/**
 * Generate a list of profiles
 */
export const profileListGenerator = fc.array(profileGenerator, { minLength: 0, maxLength: 20 });

export default {
  userIdGenerator,
  userNameGenerator,
  ageGenerator,
  genderGenerator,
  interestsGenerator,
  locationGenerator,
  bioGenerator,
  userGenerator,
  profileGenerator,
  invalidUserGenerator,
  userPairGenerator,
  ageRangeGenerator,
  distanceFilterGenerator,
  genderPreferenceGenerator,
  profileUpdateGenerator,
  birthdateGenerator,
  profileListGenerator,
};
