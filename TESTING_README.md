# Testing Guide

## Overview

This project uses **property-based testing** with [fast-check](https://github.com/dubzzz/fast-check) to ensure correctness of critical business logic.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

```
src/services/__tests__/
├── LocationService.distance.test.js      # Property 30: Distance calculation
├── MatchService.filtering.test.js        # Property 12: Preference filtering
├── MatchService.swipe.test.js            # Property 13: Swipe processing
└── BaseService.errors.test.js            # Property 8: Error handling
```

## Property Tests

### What is Property-Based Testing?

Property-based testing validates that certain properties (rules) hold true for all possible inputs, not just specific examples.

**Example:**
```javascript
// Traditional unit test
test('distance from Budapest to Paris is ~1245km', () => {
  expect(calculateDistance(budapest, paris)).toBe(1245);
});

// Property-based test
test('distance is always non-negative', () => {
  fc.assert(
    fc.property(
      coordinatesArbitrary,
      coordinatesArbitrary,
      (coord1, coord2) => {
        return calculateDistance(coord1, coord2) >= 0;
      }
    ),
    { numRuns: 100 } // Tests 100 random coordinate pairs!
  );
});
```

### Implemented Properties

#### Property 30: Haversine Distance Calculation
**Tests:** 8 | **Iterations:** 800 | **Status:** ✅ PASSED

Validates mathematical correctness of GPS distance calculations:
- Non-negativity: d(A,B) ≥ 0
- Identity: d(A,A) = 0
- Symmetry: d(A,B) = d(B,A)
- Triangle inequality: d(A,C) ≤ d(A,B) + d(B,C)

#### Property 12: Preference-based Filtering
**Tests:** 5 | **Iterations:** 250 | **Status:** ✅ PASSED

Validates discovery feed filtering logic:
- Age range filtering
- Gender preference filtering
- Distance filtering
- Combined filter application

#### Property 13: Swipe Processing
**Tests:** 5 | **Iterations:** 500 | **Status:** ✅ PASSED

Validates swipe and matching logic:
- Mutual likes create matches
- Single likes don't create matches
- Symmetry of mutual likes
- Order independence
- Idempotency

#### Property 8: Error Handling Consistency
**Tests:** 8 | **Iterations:** 800 | **Status:** ✅ PASSED

Validates standardized error handling:
- All errors are ServiceError instances
- Required fields present
- Naming conventions
- Context preservation
- User-friendly messages

## Test Results

```
Test Suites: 4 passed, 4 total
Tests:       26 passed, 26 total
Time:        ~4-5 seconds
Iterations:  2,350+
Success Rate: 100%
```

## Writing New Property Tests

### 1. Create Test File

```javascript
// src/services/__tests__/MyService.test.js
import fc from 'fast-check';
import MyService from '../MyService';

describe('Property X: My Property', () => {
  test('Property X.1: Description', () => {
    fc.assert(
      fc.property(
        fc.integer(), // Generator
        (value) => {
          // Test logic
          return value >= 0; // Property to verify
        }
      ),
      { numRuns: 100 } // Number of iterations
    );
  });
});
```

### 2. Common Generators

```javascript
// Primitives
fc.integer({ min: 0, max: 100 })
fc.double({ noNaN: true })
fc.string({ minLength: 5, maxLength: 50 })
fc.boolean()
fc.uuid()

// Collections
fc.array(fc.integer(), { minLength: 1, maxLength: 10 })
fc.record({ name: fc.string(), age: fc.integer() })

// Custom
const coordinatesArbitrary = fc.record({
  latitude: fc.double({ min: -90, max: 90, noNaN: true }),
  longitude: fc.double({ min: -180, max: 180, noNaN: true }),
});
```

### 3. Best Practices

✅ **DO:**
- Use `noNaN: true` for numeric generators
- Set realistic min/max bounds
- Test 100+ iterations for good coverage
- Use descriptive test names
- Document which requirement is validated

❌ **DON'T:**
- Generate invalid inputs (use constraints)
- Test implementation details
- Use complex mocks (prefer simple helpers)
- Ignore edge cases

## Debugging Failed Properties

When a property test fails, fast-check provides a counterexample:

```
Property failed after 42 tests
Counterexample: [{"latitude":0,"longitude":NaN}]
Shrunk 15 time(s)
```

This means:
1. Test failed on the 42nd iteration
2. The failing input was `{latitude:0, longitude:NaN}`
3. fast-check simplified (shrunk) the input 15 times to find the minimal failing case

**Fix:** Add `noNaN: true` to the generator!

## CI/CD Integration

Tests run automatically on:
- Every commit (pre-commit hook)
- Every pull request (GitHub Actions)
- Nightly builds (extended iterations)

## Coverage Goals

- **Unit Tests:** 80%+ coverage
- **Property Tests:** All critical business logic
- **Integration Tests:** Key user flows
- **E2E Tests:** Happy paths

## Resources

- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Property-Based Testing Guide](https://fsharpforfunandprofit.com/posts/property-based-testing/)
- [Jest Documentation](https://jestjs.io/)

## Support

For questions or issues with tests:
1. Check test output for counterexamples
2. Review generator constraints
3. Consult property testing documentation
4. Ask the team in #testing channel

---

**Last Updated:** 2025-12-03  
**Test Success Rate:** 100% (26/26)  
**Total Iterations:** 2,350+
