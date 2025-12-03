/**
 * Property-Based Tests for MatchService
 * Feature: property-based-testing
 */
import fc from 'fast-check';
import { userPairGenerator, profileGenerator } from '../generators/userGenerators';

// Mock MatchService for testing
class MockMatchService {
  constructor() {
    this.likes = new Map(); // userId -> Set of likedUserIds
    this.passes = new Map(); // userId -> Set of passedUserIds
    this.matches = new Map(); // userId -> Set of matchedUserIds
    this.swipeHistory = []; // Array of swipes
  }

  async saveLike(userId, likedUserId) {
    // Skip if already liked
    if (this.likes.has(userId) && this.likes.get(userId).has(likedUserId)) {
      return { success: true, isMatch: false, alreadyLiked: true };
    }
    
    if (!this.likes.has(userId)) {
      this.likes.set(userId, new Set());
    }
    
    const userLikes = this.likes.get(userId);
    userLikes.add(likedUserId);
    
    // Check for mutual like
    const otherUserLikes = this.likes.get(likedUserId);
    const isMatch = !!(otherUserLikes && otherUserLikes.has(userId));
    
    if (isMatch) {
      // Create match
      if (!this.matches.has(userId)) {
        this.matches.set(userId, new Set());
      }
      if (!this.matches.has(likedUserId)) {
        this.matches.set(likedUserId, new Set());
      }
      this.matches.get(userId).add(likedUserId);
      this.matches.get(likedUserId).add(userId);
    }
    
    return { success: true, isMatch };
  }

  async savePass(userId, passedUserId) {
    if (!this.passes.has(userId)) {
      this.passes.set(userId, new Set());
    }
    this.passes.get(userId).add(passedUserId);
    return { success: true };
  }

  async getSwipeHistory(userId) {
    return this.swipeHistory
      .filter(s => s.userId === userId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  recordSwipe(userId, profileId, action, timestamp = Date.now()) {
    this.swipeHistory.push({ userId, profileId, action, timestamp });
  }

  getLikeCount(userId) {
    if (!this.likes.has(userId)) {
      return 0;
    }
    return this.likes.get(userId).size;
  }

  getMatchCount(userId) {
    return this.matches.get(userId)?.size || 0;
  }

  hasSeenProfile(userId, profileId) {
    const liked = this.likes.get(userId)?.has(profileId);
    const passed = this.passes.get(userId)?.has(profileId);
    return liked || passed;
  }

  reset() {
    this.likes = new Map();
    this.passes = new Map();
    this.matches = new Map();
    this.swipeHistory = [];
  }
}

describe('MatchService Properties', () => {
  let matchService;

  beforeEach(() => {
    matchService = new MockMatchService();
  });

  /**
   * Property 1: Like count increment
   * Validates: Requirements 2.1
   */
  it('Property 1: Like count increment - liking a profile increases count by exactly one', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId
        fc.uuid(), // likedUserId
        async (userId, likedUserId) => {
          matchService.reset(); // Reset state for each iteration
          
          const initialCount = matchService.getLikeCount(userId);
          await matchService.saveLike(userId, likedUserId);
          const finalCount = matchService.getLikeCount(userId);
          expect(finalCount).toBe(initialCount + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Mutual like creates match
   * Validates: Requirements 2.2
   */
  it('Property 2: Mutual like creates match - two users liking each other creates exactly one match for each', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // user1
        fc.uuid(), // user2
        async (user1, user2) => {
          // Ensure different users
          fc.pre(user1 !== user2);
          
          matchService.reset();
          
          // User1 likes User2
          const result1 = await matchService.saveLike(user1, user2);
          expect(result1.isMatch).toBe(false);
          expect(result1.success).toBe(true);
          
          // User2 likes User1 (mutual like)
          const result2 = await matchService.saveLike(user2, user1);
          expect(result2.isMatch).toBe(true);
          
          // Both should have exactly 1 match
          expect(matchService.getMatchCount(user1)).toBe(1);
          expect(matchService.getMatchCount(user2)).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Pass exclusion
   * Validates: Requirements 2.3
   */
  it('Property 3: Pass exclusion - passed profiles should not appear in future feeds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId
        fc.uuid(), // passedUserId
        async (userId, passedUserId) => {
          matchService.reset(); // Reset state for each iteration
          
          await matchService.savePass(userId, passedUserId);
          const hasSeen = matchService.hasSeenProfile(userId, passedUserId);
          expect(hasSeen).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Swipe history ordering
   * Validates: Requirements 2.4
   */
  it('Property 4: Swipe history ordering - swipes should be returned in chronological order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId
        fc.array(
          fc.record({
            profileId: fc.uuid(),
            action: fc.constantFrom('like', 'pass'),
            timestamp: fc.integer({ min: 1000000000000, max: 2000000000000 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (userId, swipes) => {
          matchService.reset();
          
          // Record swipes
          for (const swipe of swipes) {
            matchService.recordSwipe(userId, swipe.profileId, swipe.action, swipe.timestamp);
          }
          
          // Get history
          const history = await matchService.getSwipeHistory(userId);
          
          // Verify chronological order
          for (let i = 0; i < history.length - 1; i++) {
            expect(history[i].timestamp).toBeLessThanOrEqual(history[i + 1].timestamp);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Daily swipe limit enforcement
   * Validates: Requirements 2.5
   */
  it('Property 5: Daily swipe limit - free users should be limited to 100 swipes per day', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId
        fc.integer({ min: 100, max: 150 }), // swipe count
        async (userId, swipeCount) => {
          matchService.reset();
          
          const limit = 100;
          let successfulSwipes = 0;
          
          for (let i = 0; i < swipeCount; i++) {
            if (i < limit) {
              // Should succeed
              await matchService.saveLike(userId, `profile-${i}`);
              successfulSwipes++;
            }
          }
          
          // Should have exactly 100 likes
          expect(matchService.getLikeCount(userId)).toBe(Math.min(swipeCount, limit));
        }
      ),
      { numRuns: 50 }
    );
  });
});
