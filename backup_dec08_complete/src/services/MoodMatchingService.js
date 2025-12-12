/**
 * Mood-Based Matching Service
 *
 * Dynamic matching based on user's current mood and emotional state
 * Enhances user engagement through contextual recommendations
 */

import ErrorHandler from './ErrorHandler';
import Logger from './Logger';
import container from '../core/DIContainer';

class MoodMatchingService {
  constructor(profileRepository = null, matchRepository = null, logger = null) {
    this.profileRepository = profileRepository || container.resolve('profileRepository');
    this.matchRepository = matchRepository || container.resolve('matchRepository');
    this.logger = logger || container.resolve('logger');
  }

  /**
   * Set user's current mood
   * @param {string} userId - User ID
   * @param {string} mood - Current mood
   * @param {Object} metadata - Additional mood data
   * @returns {Promise<Object>} Mood setting result
   */
  async setUserMood(userId, mood, metadata = {}) {
    return ErrorHandler.wrapServiceCall(async () => {
      const validMoods = [
        'romantic', 'adventurous', 'chill', 'party',
        'intellectual', 'social', 'reflective', 'energetic'
      ];

      if (!validMoods.includes(mood)) {
        throw new Error(`Invalid mood: ${mood}`);
      }

      // Store mood in database (we'll need to add a moods table)
      // For now, store in user profile metadata
      const userProfile = await this.profileRepository.findById(userId);
      const moodData = {
        currentMood: mood,
        moodSetAt: new Date().toISOString(),
        moodExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        moodMetadata: metadata
      };

      // Update profile with mood data
      await this.profileRepository.update(userId, {
        mood_data: moodData
      });

      this.logger.info('User mood set', { userId, mood });

      return {
        success: true,
        mood,
        expiresAt: moodData.moodExpiresAt
      };
    }, { operation: 'setUserMood', userId, mood });
  }

  /**
   * Get user's current mood
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Current mood data or null
   */
  async getUserMood(userId) {
    try {
      const profile = await this.profileRepository.findById(userId);
      const moodData = profile.mood_data;

      if (!moodData || !moodData.currentMood) {
        return null;
      }

      // Check if mood has expired
      const expiresAt = new Date(moodData.moodExpiresAt);
      if (expiresAt < new Date()) {
        return null; // Mood expired
      }

      return {
        mood: moodData.currentMood,
        setAt: moodData.moodSetAt,
        expiresAt: moodData.moodExpiresAt,
        metadata: moodData.moodMetadata || {}
      };
    } catch (error) {
      this.logger.warn('Failed to get user mood', { userId, error: error.message });
      return null;
    }
  }

  /**
   * Find mood-compatible matches for user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Mood-compatible profiles
   */
  async findMoodMatches(userId, options = {}) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { limit = 20, includeCompatibility = true } = options;

      const userMood = await this.getUserMood(userId);
      if (!userMood) {
        throw new Error('User has no active mood set');
      }

      // Find profiles with compatible moods
      const compatibleMoods = this.getCompatibleMoods(userMood.mood);

      // Get potential matches (simplified - in real app would use complex filtering)
      const filters = {
        minAge: 18,
        maxAge: 99
      };

      const options = {
        limit: limit * 2 // Get more to filter by mood
      };

      const profiles = await this.profileRepository.findByFilters(filters, options);

      // Filter by mood compatibility and exclude already matched users
      const moodCompatibleProfiles = [];

      for (const profile of profiles) {
        // Skip self
        if (profile.id === userId) continue;

        // Check if profile has active mood
        const profileMood = await this.getUserMood(profile.id);
        if (!profileMood) continue;

        // Check mood compatibility
        if (!compatibleMoods.includes(profileMood.mood)) continue;

        // Check if already matched
        const existingMatch = await this.matchRepository.findMatchBetweenUsers(userId, profile.id);
        if (existingMatch) continue;

        // Add compatibility score if requested
        if (includeCompatibility) {
          profile.moodCompatibility = this.calculateMoodCompatibility(userMood, profileMood);
        }

        moodCompatibleProfiles.push(profile);

        // Limit results
        if (moodCompatibleProfiles.length >= limit) break;
      }

      // Sort by compatibility if requested
      if (includeCompatibility) {
        moodCompatibleProfiles.sort((a, b) => b.moodCompatibility - a.moodCompatibility);
      }

      this.logger.debug('Mood matches found', {
        userId,
        userMood: userMood.mood,
        matchesFound: moodCompatibleProfiles.length
      });

      return moodCompatibleProfiles;
    }, { operation: 'findMoodMatches', userId });
  }

  /**
   * Get mood-based activity suggestions
   * @param {string} mood - Current mood
   * @param {Object} preferences - User preferences
   * @returns {Promise<Array>} Activity suggestions
   */
  async getMoodActivities(mood, preferences = {}) {
    const { location, budget = 'medium', groupSize = 2 } = preferences;

    const moodActivities = {
      romantic: [
        { name: 'Romantikus séta a parkban', type: 'outdoor', budget: 'free', emoji: '🌳' },
        { name: 'Kávéház romantikus sarokban', type: 'indoor', budget: 'low', emoji: '☕' },
        { name: 'Színház vagy koncert', type: 'cultural', budget: 'medium', emoji: '🎭' },
        { name: 'Piknik a szabadban', type: 'outdoor', budget: 'low', emoji: '🧺' }
      ],
      adventurous: [
        { name: 'Hegymászás vagy túrázás', type: 'outdoor', budget: 'free', emoji: '🏔️' },
        { name: 'Új étterem felfedezése', type: 'food', budget: 'medium', emoji: '🍽️' },
        { name: 'Kalandpark vagy paintball', type: 'activity', budget: 'medium', emoji: '🎯' },
        { name: 'Városnézés új környéken', type: 'cultural', budget: 'low', emoji: '🏛️' }
      ],
      chill: [
        { name: 'Otthoni film-maraton', type: 'home', budget: 'free', emoji: '🏠' },
        { name: 'Könyvtár vagy olvasás', type: 'quiet', budget: 'free', emoji: '📚' },
        { name: 'Yoga vagy meditáció', type: 'wellness', budget: 'low', emoji: '🧘' },
        { name: 'Kert vagy park relaxálás', type: 'outdoor', budget: 'free', emoji: '🌳' }
      ],
      party: [
        { name: 'Klub vagy bár látogatás', type: 'nightlife', budget: 'medium', emoji: '🎉' },
        { name: 'Zenei fesztivál vagy koncert', type: 'music', budget: 'high', emoji: '🎵' },
        { name: 'Táncóra vagy party játékok', type: 'social', budget: 'low', emoji: '💃' },
        { name: 'Karaoke bár', type: 'entertainment', budget: 'medium', emoji: '🎤' }
      ],
      intellectual: [
        { name: 'Múzeum vagy kiállítás', type: 'cultural', budget: 'low', emoji: '🏛️' },
        { name: 'Könyvesbolt kávézó', type: 'quiet', budget: 'low', emoji: '📖' },
        { name: 'Vitaklub vagy előadás', type: 'social', budget: 'free', emoji: '💭' },
        { name: 'Tudományos központ látogatás', type: 'educational', budget: 'medium', emoji: '🔬' }
      ]
    };

    const activities = moodActivities[mood] || moodActivities.chill;

    // Filter by budget and group size
    return activities
      .filter(activity => {
        // Budget filtering
        if (budget === 'free' && activity.budget !== 'free') return false;
        if (budget === 'low' && activity.budget === 'high') return false;

        // Group size consideration (some activities are better for couples)
        return true; // For now, allow all
      })
      .map(activity => ({
        ...activity,
        mood,
        suitability: this.calculateActivitySuitability(activity, mood, preferences)
      }))
      .sort((a, b) => b.suitability - a.suitability)
      .slice(0, 6); // Return top 6
  }

  /**
   * Get compatible moods for a given mood
   * @param {string} mood - Base mood
   * @returns {Array} Compatible moods
   */
  getCompatibleMoods(mood) {
    const compatibilityMap = {
      romantic: ['romantic', 'chill', 'intellectual'],
      adventurous: ['adventurous', 'party', 'energetic'],
      chill: ['chill', 'romantic', 'intellectual', 'reflective'],
      party: ['party', 'adventurous', 'social', 'energetic'],
      intellectual: ['intellectual', 'chill', 'romantic', 'reflective'],
      social: ['social', 'party', 'chill'],
      reflective: ['reflective', 'intellectual', 'chill'],
      energetic: ['energetic', 'adventurous', 'party']
    };

    return compatibilityMap[mood] || [mood];
  }

  /**
   * Calculate mood compatibility score
   * @param {Object} mood1 - First mood data
   * @param {Object} mood2 - Second mood data
   * @returns {number} Compatibility score (0-100)
   */
  calculateMoodCompatibility(mood1, mood2) {
    // Exact mood match
    if (mood1.mood === mood2.mood) {
      return 100;
    }

    // Compatible mood match
    const compatibleMoods = this.getCompatibleMoods(mood1.mood);
    if (compatibleMoods.includes(mood2.mood)) {
      return 75;
    }

    // Partial compatibility
    const moodCategories = {
      emotional: ['romantic', 'reflective'],
      active: ['adventurous', 'energetic', 'party'],
      calm: ['chill', 'intellectual', 'social']
    };

    for (const category of Object.values(moodCategories)) {
      if (category.includes(mood1.mood) && category.includes(mood2.mood)) {
        return 50;
      }
    }

    return 25; // Low compatibility
  }

  /**
   * Calculate activity suitability for mood
   * @param {Object} activity - Activity data
   * @param {string} mood - Current mood
   * @param {Object} preferences - User preferences
   * @returns {number} Suitability score (0-100)
   */
  calculateActivitySuitability(activity, mood, preferences) {
    let score = 50; // Base score

    // Mood alignment
    const moodActivityMap = {
      romantic: ['cultural', 'food', 'outdoor'],
      adventurous: ['activity', 'outdoor', 'cultural'],
      chill: ['home', 'quiet', 'wellness'],
      party: ['nightlife', 'music', 'social'],
      intellectual: ['cultural', 'educational', 'quiet']
    };

    if (moodActivityMap[mood]?.includes(activity.type)) {
      score += 30;
    }

    // Budget alignment
    if (preferences.budget === activity.budget) {
      score += 10;
    } else if (preferences.budget === 'free' && activity.budget !== 'free') {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get mood statistics for analytics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Mood usage statistics
   */
  async getMoodStatistics(userId) {
    // In a real implementation, this would query a mood_history table
    // For now, return mock data
    return {
      totalMoodsSet: 15,
      favoriteMood: 'romantic',
      moodDistribution: {
        romantic: 5,
        adventurous: 3,
        chill: 4,
        party: 2,
        intellectual: 1
      },
      averageMoodDuration: 18, // hours
      lastMoodChange: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    };
  }
}

// Register with DI container
container.registerFactory('moodMatchingService', () => new MoodMatchingService());

export default MoodMatchingService;
