import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '1m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be below 10%
  },
};

// Base URL for the API (would be configured for actual testing)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Mock data for testing
const testUsers = Array.from({ length: 100 }, (_, i) => ({
  id: `user_${i + 1}`,
  email: `user${i + 1}@test.com`,
  name: `Test User ${i + 1}`,
  age: 20 + (i % 30),
  interests: ['music', 'sports', 'travel', 'food'][i % 4],
}));

export default function () {
  // Simulate user behavior patterns

  // 1. Profile viewing (most common action)
  const viewProfile = () => {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)];
    const response = http.get(`${BASE_URL}/api/profiles/${user.id}`);

    check(response, {
      'profile view status is 200': (r) => r.status === 200,
      'profile view response time < 300ms': (r) => r.timings.duration < 300,
    });

    sleep(Math.random() * 2 + 0.5); // Random sleep 0.5-2.5s
  };

  // 2. Spark score calculation (AI feature)
  const calculateSpark = () => {
    const user1 = testUsers[Math.floor(Math.random() * testUsers.length)];
    const user2 = testUsers[Math.floor(Math.random() * testUsers.length)];

    if (user1.id !== user2.id) {
      const payload = JSON.stringify({
        userId: user1.id,
        targetUserId: user2.id
      });

      const response = http.post(`${BASE_URL}/api/spark-score`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      check(response, {
        'spark calculation status is 200': (r) => r.status === 200,
        'spark calculation response time < 1000ms': (r) => r.timings.duration < 1000,
      });

      sleep(Math.random() * 3 + 1); // Random sleep 1-4s
    }
  };

  // 3. Mood setting and matching
  const setMoodAndMatch = () => {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)];
    const moods = ['romantic', 'adventurous', 'chill', 'party'];

    const moodPayload = JSON.stringify({
      userId: user.id,
      mood: moods[Math.floor(Math.random() * moods.length)]
    });

    // Set mood
    const setMoodResponse = http.put(`${BASE_URL}/api/user/mood`, moodPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(setMoodResponse, {
      'mood setting status is 200': (r) => r.status === 200,
      'mood setting response time < 200ms': (r) => r.timings.duration < 200,
    });

    sleep(0.5);

    // Find mood matches
    const matchResponse = http.get(`${BASE_URL}/api/matches/mood-based?userId=${user.id}`);

    check(matchResponse, {
      'mood matching status is 200': (r) => r.status === 200,
      'mood matching response time < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(Math.random() * 2 + 1);
  };

  // 4. Date suggestions
  const getDateSuggestions = () => {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)];

    const response = http.get(`${BASE_URL}/api/date-suggestions?userId=${user.id}&location=47.5,19.04`);

    check(response, {
      'date suggestions status is 200': (r) => r.status === 200,
      'date suggestions response time < 800ms': (r) => r.timings.duration < 800,
    });

    sleep(Math.random() * 3 + 2);
  };

  // 5. Compatibility rainbow (heavy computation)
  const getCompatibility = () => {
    const user1 = testUsers[Math.floor(Math.random() * testUsers.length)];
    const user2 = testUsers[Math.floor(Math.random() * testUsers.length)];

    if (user1.id !== user2.id) {
      const response = http.get(`${BASE_URL}/api/compatibility/rainbow/${user1.id}/${user2.id}`);

      check(response, {
        'compatibility status is 200': (r) => r.status === 200,
        'compatibility response time < 1500ms': (r) => r.timings.duration < 1500,
      });

      sleep(Math.random() * 4 + 2); // Longer sleep for heavy computation
    }
  };

  // Execute different user behavior patterns based on virtual user ID
  const vuId = __VU; // Virtual user ID (1-based)
  const pattern = vuId % 5; // 5 different behavior patterns

  switch (pattern) {
    case 0:
      // Profile browsing user
      viewProfile();
      viewProfile();
      viewProfile();
      break;

    case 1:
      // AI features user
      viewProfile();
      calculateSpark();
      break;

    case 2:
      // Social mood-based user
      setMoodAndMatch();
      viewProfile();
      break;

    case 3:
      // Date planning user
      getDateSuggestions();
      viewProfile();
      break;

    case 4:
      // Compatibility explorer
      viewProfile();
      getCompatibility();
      break;
  }
}

// Setup function - runs before the test starts
export function setup() {
  console.log('🚀 Starting load test setup...');

  // Could create test data here if needed
  // For now, we use mock data

  console.log('✅ Load test setup complete');
  return { testUsers };
}

// Teardown function - runs after the test completes
export function teardown(data) {
  console.log('🧹 Load test teardown...');
  console.log(`Test completed with ${data.testUsers.length} test users`);
}
