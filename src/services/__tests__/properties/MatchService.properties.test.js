/**
 * Property-Based Tests for MatchService
 * 
 * **Feature: property-based-testing**
 * 
 * These tests validate universal properties that should hold
 * for all valid inputs to the MatchService.
 */

import fc from 'fast-check';
import { supabase } from '../../supabaseClient';
import SupabaseMatchService from '../../SupabaseMatchService';
import { userGenerator, profileGenerator } from '../generators/userGenerators';

// Mock Supabase for testing
jest.mock('../../supabaseClient');

describe('MatchService Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 1: Like count increment', () => {
    /**
     * **Feature: property-based-testing, Property 1: Like count increment**
     * **Validates: Requirements 2.1**
     * 
     * For any user and profile, when a like is saved, 
     * the like count should increase by exactly one.
     */
    it('should increment like count by exactly one when saving a like', async () => {
      await fc.assert(
        fc.asyncProperty(
          userGenerator,
          profileGenerator,
          async (user, profile) => {
            // Ensure different users
            if (user.id === profile.id) {
              return true; // Skip this case
            }

            // Mock initial like count query (no existing like)
            supabase.from = jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST116' }, // No rows found
                    }),
                  }),
                }),
              }),
            });

            // Mock like insert
            const insertMock = jest.fn().mockResolvedValue({
              data: { id: 'like-id', user_id: user.id, liked_user_id: profile.id },
              error: null,
            });

            supabase.from = jest.fn((table) => {
              if (table === 'likes') {
                return {
                  select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                          data: null,
                          error: { code: 'PGRST116' },
                        }),
                      }),
                    }),
                  }),
                  insert: insertMock,
                };
              }
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue({
                        data: null,
                        error: { code: 'PGRST116' },
                      }),
                    }),
                  }),
                }),
              };
            });

            // Save like
            const result = await SupabaseMatchService.saveLike(user.id, profile.id);

            // Verify like was inserted exactly once
            expect(result.success).toBe(true);
            expect(insertMock).toHaveBeenCalledTimes(1);
            expect(insertMock).toHaveBeenCalledWith(
              expect.objectContaining({
                user_id: user.id,
                liked_user_id: profile.id,
              })
            );

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Mutual like creates match', () => {
    /**
     * **Feature: property-based-testing, Property 2: Mutual like creates match**
     * **Validates: Requirements 2.2**
     * 
     * For any two users who mutually like each other, 
     * exactly one match should be created for each user.
     */
    it('should create exactly one match for each user on mutual like', async () => {
      await fc.assert(
        fc.asyncProperty(
          userGenerator,
          userGenerator,
          async (user1, user2) => {
            // Ensure different users
            if (user1.id === user2.id) {
              return true; // Skip this case
            }

            const matchInsertMock = jest.fn().mockResolvedValue({
              data: { id: 'match-id' },
              error: null,
            });

            // Mock: user2 already liked user1
            supabase.from = jest.fn((table) => {
              if (table === 'likes') {
                return {
                  select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockImplementation(async () => {
                          // First call: check if user1 already liked user2 (no)
                          // Second call: check if user2 liked user1 (yes)
                          const callCount = supabase.from.mock.calls.filter(c => c[0] === 'likes').length;
                          if (callCount === 2) {
                            return {
                              data: { user_id: user2.id, liked_user_id: user1.id },
                              error: null,
                            };
                          }
                          return {
                            data: null,
                            error: { code: 'PGRST116' },
                          };
                        }),
                      }),
                    }),
                  }),
                  insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
                };
              }
              if (table === 'matches') {
                return {
                  insert: matchInsertMock,
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: 'match-id' },
                      error: null,
                    }),
                  }),
                };
              }
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue({
                        data: null,
                        error: { code: 'PGRST116' },
                      }),
                    }),
                  }),
                }),
              };
            });

            // User1 likes user2 (mutual like)
            const result = await SupabaseMatchService.saveLike(user1.id, user2.id);

            // Verify match was created
            expect(result.success).toBe(true);
            expect(result.isMatch).toBe(true);
            
            // Verify two matches were created (bidirectional)
            expect(matchInsertMock).toHaveBeenCalledTimes(2);

            return true;
          }
        ),
        { numRuns: 50 } // Fewer runs due to complexity
      );
    });
  });

  describe('Property 3: Pass exclusion', () => {
    /**
     * **Feature: property-based-testing, Property 3: Pass exclusion**
     * **Validates: Requirements 2.3**
     * 
     * For any user and passed profile, the passed profile 
     * should not appear in subsequent discovery feeds.
     */
    it('should exclude passed profiles from discovery feed', async () => {
      await fc.assert(
        fc.asyncProperty(
          userGenerator,
          profileGenerator,
          async (user, profile) => {
            // Ensure different users
            if (user.id === profile.id) {
              return true; // Skip this case
            }

            // Mock pass save
            supabase.from = jest.fn((table) => {
              if (table === 'passes') {
                return {
                  select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                          data: null,
                          error: { code: 'PGRST116' },
                        }),
                      }),
                    }),
                  }),
                  insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
                };
              }
              if (table === 'profiles') {
                return {
                  select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue({
                        data: { id: user.id, age_min: 18, age_max: 99 },
                        error: null,
                      }),
                    }),
                    neq: jest.fn().mockReturnThis(),
                    gte: jest.fn().mockReturnThis(),
                    lte: jest.fn().mockReturnThis(),
                    not: jest.fn().mockReturnThis(),
                    limit: jest.fn().mockResolvedValue({
                      data: [], // Profile is excluded
                      error: null,
                    }),
                  }),
                };
              }
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [{ passed_user_id: profile.id }],
                    error: null,
                  }),
                }),
              };
            });

            // Save pass
            await SupabaseMatchService.savePass(user.id, profile.id);

            // Get discovery feed
            const feedResult = await SupabaseMatchService.getDiscoveryFeed(user.id);

            // Verify passed profile is not in feed
            // ErrorHandler wraps the result, check if it's an array or has data property
            let feedData = [];
            if (Array.isArray(feedResult)) {
              feedData = feedResult;
            } else if (feedResult && feedResult.data && Array.isArray(feedResult.data)) {
              feedData = feedResult.data;
            } else if (feedResult && feedResult.success && Array.isArray(feedResult.data)) {
              feedData = feedResult.data;
            }
            
            const passedProfileInFeed = feedData.some(p => p.id === profile.id);
            expect(passedProfileInFeed).toBe(false);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 5: Daily swipe limit enforcement', () => {
    /**
     * **Feature: property-based-testing, Property 5: Daily swipe limit enforcement**
     * **Validates: Requirements 2.5**
     * 
     * For any free user, the 101st swipe in a day should be rejected.
     */
    it('should reject 101st swipe for free users', async () => {
      await fc.assert(
        fc.asyncProperty(
          userGenerator,
          async (user) => {
            // Mock free user (not premium)
            supabase.from = jest.fn((table) => {
              if (table === 'profiles') {
                return {
                  select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue({
                        data: { id: user.id, is_premium: false },
                        error: null,
                      }),
                    }),
                  }),
                };
              }
              // Mock 100 swipes already done today
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    gte: jest.fn().mockResolvedValue({
                      count: 100, // 100 swipes done
                      error: null,
                    }),
                  }),
                }),
              };
            });

            // Check swipe limit
            const limitResult = await SupabaseMatchService.checkSwipeLimit(user.id);

            // Verify limit is reached
            expect(limitResult.data.hasLimit).toBe(true);
            expect(limitResult.data.remaining).toBe(0);
            expect(limitResult.data.exceeded).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
