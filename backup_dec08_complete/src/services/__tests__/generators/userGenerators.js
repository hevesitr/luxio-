/**
 * User Generators for Property-Based Testing
 * 
 * These generators create random user and profile data for property tests.
 * All generators use fast-check to produce valid test data within constraints.
 */

import fc from 'fast-check';

/**
 * Generate a valid user ID (UUID format)
 */
export const userIdGenerator = fc.uuid();

/**
 * Generate a valid user name (2-50 characters)
 */
export const userNameGenerator = fc.string({ 
  minLength: 2, 
  maxLength: 50 
}).filter(name => name.trim().length >= 2);

/**
 * Generate a valid age (18-99 years)
 */
export const ageGenerator = fc.integer({ min: 18, max: 99 });

/**
 * Generate a valid gender
 */
export const genderGenerator = fc.constantFrom('male', 'female', 'other');

/**
 * Generate a valid interest string
 */
export const interestGenerator = fc.string({ 
  minLength: 2, 
  maxLength: 30 
}).filter(interest => interest.trim().length >= 2);

/**
 * Generate a list of interests (0-10 items, unique)
 */
export const interestsGenerator = fc.array(interestGenerator, { 
  minLength: 0, 
  maxLength: 10 
}).map(interests => [...new Set(interests)]); // Remove duplicates

/**
 * Generate a valid bio (0-500 characters)
 */
export const bioGenerator = fc.string({ 
  minLength: 0, 
  maxLength: 500 
});

/**
 * Generate a valid location with latitude and longitude
 */
export const locationGenerator = fc.record({
  latitude: fc.double({ min: -90, max: 90, noNaN: true }),
  longitude: fc.double({ min: -180, max: 180, noNaN: true })
});

/**
 * Generate a complete user object
 */
export const userGenerator = fc.record({
  id: userIdGenerator,
  name: userNameGenerator,
  age: ageGenerator,
  gender: genderGenerator,
  email: fc.emailAddress(),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() })
});

/**
 * Generate a valid relationship goal
 */
export const relationshipGoalGenerator = fc.constantFrom(
  'casual',
  'serious',
  'friendship',
  'unsure'
);

/**
 * Generate a valid distance (0-100 km)
 */
export const distanceGenerator = fc.integer({ min: 0, max: 100 });

/**
 * Generate a complete profile object
 */
export const profileGenerator = fc.record({
  id: userIdGenerator,
  userId: userIdGenerator,
  name: userNameGenerator,
  age: ageGenerator,
  gender: genderGenerator,
  bio: bioGenerator,
  interests: interestsGenerator,
  location: locationGenerator,
  relationshipGoal: relationshipGoalGenerator,
  distance: distanceGenerator,
  photos: fc.array(fc.webUrl(), { minLength: 1, maxLength: 6 })
});

/**
 * Generate a user with specific constraints
 */
export const constrainedUserGenerator = (constraints = {}) => {
  const ageGen = constraints.minAge || constraints.maxAge
    ? fc.integer({ 
        min: constraints.minAge || 18, 
        max: constraints.maxAge || 99 
      })
    : ageGenerator;
  
  const genderGen = constraints.gender
    ? fc.constant(constraints.gender)
    : genderGenerator;
  
  return fc.record({
    id: userIdGenerator,
    name: userNameGenerator,
    age: ageGen,
    gender: genderGen,
    email: fc.emailAddress(),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() })
  });
};

/**
 * Generate a profile with specific constraints
 */
export const constrainedProfileGenerator = (constraints = {}) => {
  const ageGen = constraints.minAge || constraints.maxAge
    ? fc.integer({ 
        min: constraints.minAge || 18, 
        max: constraints.maxAge || 99 
      })
    : ageGenerator;
  
  const genderGen = constraints.gender
    ? fc.constant(constraints.gender)
    : genderGenerator;
  
  const relationshipGoalGen = constraints.relationshipGoal
    ? fc.constant(constraints.relationshipGoal)
    : relationshipGoalGenerator;
  
  const interestsGen = constraints.minInterests || constraints.maxInterests
    ? fc.array(interestGenerator, { 
        minLength: constraints.minInterests || 0, 
        maxLength: constraints.maxInterests || 10 
      }).map(interests => [...new Set(interests)])
    : interestsGenerator;
  
  return fc.record({
    id: userIdGenerator,
    userId: userIdGenerator,
    name: userNameGenerator,
    age: ageGen,
    gender: genderGen,
    bio: bioGenerator,
    interests: interestsGen,
    location: locationGenerator,
    relationshipGoal: relationshipGoalGen,
    distance: distanceGenerator,
    photos: fc.array(fc.webUrl(), { minLength: 1, maxLength: 6 })
  });
};

/**
 * Generate two users who could potentially match
 */
export const matchingUsersGenerator = fc.tuple(
  userGenerator,
  userGenerator
).filter(([user1, user2]) => user1.id !== user2.id);

/**
 * Generate a user with premium status
 */
export const premiumUserGenerator = fc.record({
  id: userIdGenerator,
  name: userNameGenerator,
  age: ageGenerator,
  gender: genderGenerator,
  email: fc.emailAddress(),
  isPremium: fc.constant(true),
  subscriptionExpiry: fc.date({ min: new Date(), max: new Date('2025-12-31') }),
  superLikesRemaining: fc.integer({ min: 0, max: 5 })
});

/**
 * Generate a free user
 */
export const freeUserGenerator = fc.record({
  id: userIdGenerator,
  name: userNameGenerator,
  age: ageGenerator,
  gender: genderGenerator,
  email: fc.emailAddress(),
  isPremium: fc.constant(false),
  dailySwipesRemaining: fc.integer({ min: 0, max: 100 })
});

/**
 * Generate a birthdate that results in a specific age range
 */
export const birthdateGenerator = (minAge = 18, maxAge = 99) => {
  const now = new Date();
  const maxDate = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
  const minDate = new Date(now.getFullYear() - maxAge - 1, now.getMonth(), now.getDate());
  
  return fc.date({ min: minDate, max: maxDate });
};

/**
 * Generate a user with a specific birthdate
 */
export const userWithBirthdateGenerator = fc.record({
  id: userIdGenerator,
  name: userNameGenerator,
  gender: genderGenerator,
  birthdate: birthdateGenerator(),
  email: fc.emailAddress()
});
