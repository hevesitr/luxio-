# Design Document: Property-Based Testing

## Overview

This design implements comprehensive property-based testing for the Dating Application using fast-check library. Property-based testing validates universal correctness properties across all possible inputs, providing stronger guarantees than example-based tests.

## Architecture

### Testing Stack
- **Framework**: Jest (existing)
- **PBT Library**: fast-check
- **Test Runner**: Jest with fast-check integration
- **Coverage**: Core services (Match, Message, Profile, Location, Safety, Payment)

### Test Organization
```
src/services/__tests__/
├── properties/
│   ├── MatchService.properties.test.js
│   ├── MessageService.properties.test.js
│   ├── ProfileService.properties.test.js
│   ├── LocationService.properties.test.js
│   ├── SafetyService.properties.test.js
│   └── PaymentService.properties.test.js
└── generators/
    ├── userGenerators.js
    ├── profileGenerators.js
    ├── messageGenerators.js
    └── locationGenerators.js
```

## Components and Interfaces

### Generators

Generators produce random test data within specified constraints:

```javascript
// User Generator
fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 2, maxLength: 50 }),
  age: fc.integer({ min: 18, max: 99 }),
  gender: fc.constantFrom('male', 'female', 'other'),
  interests: fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
  location: fc.record({
    latitude: fc.double({ min: -90, max: 90 }),
    longitude: fc.double({ min: -180, max: 180 })
  })
})

// Message Generator
fc.record({
  id: fc.uuid(),
  senderId: fc.uuid(),
  receiverId: fc.uuid(),
  content: fc.string({ minLength: 1, maxLength: 500 }),
  timestamp: fc.date()
})
```

## Data Models

### Test Data Constraints
- User age: 18-99 years
- Message length: 1-500 characters
- Profile name: 2-50 characters
- Interests: 0-10 items
- Location: Valid lat/long coordinates
- Distance: Non-negative kilometers

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Match Service Properties

**Property 1: Like count increment**
*For any* user and profile, when a like is saved, the like count should increase by exactly one.
**Validates: Requirements 2.1**

**Property 2: Mutual like creates match**
*For any* two users who mutually like each other, exactly one match should be created for each user.
**Validates: Requirements 2.2**

**Property 3: Pass exclusion**
*For any* user and passed profile, the passed profile should not appear in subsequent discovery feeds.
**Validates: Requirements 2.3**

**Property 4: Swipe history ordering**
*For any* sequence of swipes, loading the history should return swipes in chronological order.
**Validates: Requirements 2.4**

**Property 5: Daily swipe limit enforcement**
*For any* free user, the 101st swipe in a day should be rejected.
**Validates: Requirements 2.5**

### Message Service Properties

**Property 6: Message persistence round-trip**
*For any* message, sending then retrieving by ID should return an equivalent message.
**Validates: Requirements 3.1**

**Property 7: Message chronological ordering**
*For any* conversation, loading messages should return them in chronological order.
**Validates: Requirements 3.2**

**Property 8: Message deletion consistency**
*For any* message, after deletion, subsequent queries should not return it.
**Validates: Requirements 3.3**

**Property 9: Unmatch cascade deletion**
*For any* conversation, unmatching should delete all messages and return empty results.
**Validates: Requirements 3.4**

**Property 10: Pagination non-overlap**
*For any* conversation with pagination, pages should not overlap and maintain correct ordering.
**Validates: Requirements 3.5**

### Profile Service Properties

**Property 11: Profile update round-trip**
*For any* profile update, writing then reading should return the updated data.
**Validates: Requirements 4.1**

**Property 12: Image compression size limit**
*For any* uploaded image, the compressed result should be under 200KB.
**Validates: Requirements 4.2**

**Property 13: Interest set uniqueness**
*For any* interest list with duplicates, the stored result should contain no duplicates.
**Validates: Requirements 4.3**

**Property 14: Invalid profile rejection**
*For any* invalid profile update, the update should be rejected and the profile should remain unchanged.
**Validates: Requirements 4.4**

**Property 15: Age calculation correctness**
*For any* birthdate, the calculated age should match the actual years since birth.
**Validates: Requirements 4.5**

### Location Service Properties

**Property 16: Distance non-negativity**
*For any* two locations, the calculated distance should be non-negative.
**Validates: Requirements 5.1**

**Property 17: Distance identity**
*For any* location, the distance to itself should be zero.
**Validates: Requirements 5.2**

**Property 18: Haversine accuracy**
*For any* two locations, the Haversine distance should be within 1km of the true distance.
**Validates: Requirements 5.3**

**Property 19: Distance sorting order**
*For any* list of profiles, sorting by distance should produce ascending order.
**Validates: Requirements 5.4**

**Property 20: Location update consistency**
*For any* user location update, distances should be recalculated and the feed should update.
**Validates: Requirements 5.5**

### Discovery Feed Properties

**Property 21: Seen profile exclusion**
*For any* user with seen profiles, the discovery feed should exclude all seen profiles.
**Validates: Requirements 6.1**

**Property 22: Age filter correctness**
*For any* age range filter, all returned profiles should be within the specified range.
**Validates: Requirements 6.2**

**Property 23: Distance filter correctness**
*For any* distance filter, all returned profiles should be within the specified radius.
**Validates: Requirements 6.3**

**Property 24: Gender filter correctness**
*For any* gender preference, all returned profiles should match the preference.
**Validates: Requirements 6.4**

### Compatibility Algorithm Properties

**Property 25: Compatibility score bounds**
*For any* two profiles, the compatibility score should be between 0 and 100 inclusive.
**Validates: Requirements 7.1**

**Property 26: Identical interests maximum score**
*For any* two profiles with identical interests, the interest component should be maximum.
**Validates: Requirements 7.2**

**Property 27: Same location maximum proximity**
*For any* two profiles at the same location, the proximity component should be maximum.
**Validates: Requirements 7.3**

**Property 28: No common interests zero score**
*For any* two profiles with no common interests, the interest component should be zero.
**Validates: Requirements 7.4**

**Property 29: Compatibility idempotence**
*For any* two profiles, calculating compatibility multiple times should return identical scores.
**Validates: Requirements 7.5**

### Premium Features Properties

**Property 30: Premium unlimited swipes**
*For any* premium user, swipe count should never be limited regardless of daily usage.
**Validates: Requirements 8.1**

**Property 31: Super like decrement**
*For any* premium user using a super like, the daily count should decrease by exactly one.
**Validates: Requirements 8.2**

**Property 32: Rewind restoration**
*For any* swipe followed by rewind, the profile should be restored to the feed.
**Validates: Requirements 8.3**

**Property 33: Subscription expiration revocation**
*For any* expired subscription, premium features should be immediately revoked.
**Validates: Requirements 8.4**

**Property 34: Super like daily reset**
*For any* premium user at midnight, super like count should reset to 5.
**Validates: Requirements 8.5**

### Safety Features Properties

**Property 35: Block communication prevention**
*For any* blocked user pair, no messages should be deliverable between them.
**Validates: Requirements 9.1**

**Property 36: Report record creation**
*For any* report submission, a report record with timestamp should be created.
**Validates: Requirements 9.2**

**Property 37: Profanity detection completeness**
*For any* text containing profane words, all profane words should be detected.
**Validates: Requirements 9.3**

**Property 38: Automatic suspension trigger**
*For any* user receiving 3 reports in 24 hours, the account should be automatically suspended.
**Validates: Requirements 9.4**

**Property 39: Unmatch cleanup**
*For any* unmatch operation, the conversation and match should be completely removed.
**Validates: Requirements 9.5**

### Data Integrity Properties

**Property 40: Serialization round-trip**
*For any* data object, serializing then deserializing should produce an equivalent object.
**Validates: Requirements 10.1**

**Property 41: Cache invalidation correctness**
*For any* cached data that changes, the cache should be invalidated and return fresh data.
**Validates: Requirements 10.4**

**Property 42: Offline sync preservation**
*For any* offline changes, syncing should preserve all changes without data loss.
**Validates: Requirements 10.5**

## Error Handling

### Property Test Failures
- Shrink to minimal counterexample
- Log failing input for reproduction
- Report property name and requirement reference
- Fail fast on first counterexample

### Test Timeouts
- Set reasonable timeout per property (5 seconds)
- Log slow properties for optimization
- Skip flaky tests in CI with clear marking

## Testing Strategy

### Test Configuration
```javascript
// jest.config.js
module.exports = {
  testMatch: ['**/__tests__/**/*.properties.test.js'],
  testTimeout: 10000, // 10 seconds per test
  collectCoverageFrom: ['src/services/**/*.js'],
};
```

### Property Test Template
```javascript
import fc from 'fast-check';

describe('MatchService Properties', () => {
  it('Property 1: Like count increment', () => {
    fc.assert(
      fc.property(
        userGenerator,
        profileGenerator,
        async (user, profile) => {
          const initialCount = await getLikeCount(user.id);
          await MatchService.saveLike(user.id, profile.id);
          const finalCount = await getLikeCount(user.id);
          expect(finalCount).toBe(initialCount + 1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Execution
- Run 100 iterations per property (minimum)
- Use seed for reproducibility
- Parallel execution where possible
- Fail fast on first failure

### Coverage Goals
- 100% of critical properties tested
- 80% code coverage from property tests
- All services have property tests
- Integration with CI/CD pipeline

## Implementation Plan

See `tasks.md` for detailed implementation tasks.

