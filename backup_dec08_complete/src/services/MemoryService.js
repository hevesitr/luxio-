/**
 * Memory Lane Service - Emotional Connection Builder
 *
 * Creates meaningful memories and flashback reminders to build
 * emotional connections and increase user retention
 */

import ErrorHandler from './ErrorHandler';
import Logger from './Logger';
import container from '../core/DIContainer';

class MemoryService {
  constructor(profileRepository = null, matchRepository = null, logger = null) {
    this.profileRepository = profileRepository || container.resolve('profileRepository');
    this.matchRepository = matchRepository || container.resolve('matchRepository');
    this.logger = logger || container.resolve('logger');
  }

  /**
   * Create a memory milestone
   * @param {string} userId - User who creates the memory
   * @param {string} partnerId - Partner user ID
   * @param {string} type - Memory type
   * @param {Object} metadata - Additional memory data
   * @returns {Promise<Object>} Created memory
   */
  async createMemory(userId, partnerId, type, metadata = {}) {
    return ErrorHandler.wrapServiceCall(async () => {
      const validTypes = [
        'first_match', 'first_date', 'anniversary', 'streak_milestone',
        'compatibility_high', 'special_moment', 'milestone_achieved'
      ];

      if (!validTypes.includes(type)) {
        throw new Error(`Invalid memory type: ${type}`);
      }

      // Verify users exist and are matched (for relationship memories)
      if (type !== 'streak_milestone' && type !== 'milestone_achieved') {
        const match = await this.matchRepository.findMatchBetweenUsers(userId, partnerId);
        if (!match) {
          throw new Error('Users must be matched to create relationship memories');
        }
      }

      const memory = {
        user_id: userId,
        partner_id: partnerId,
        type,
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString()
        },
        is_shared: false,
        created_at: new Date().toISOString()
      };

      // In a real implementation, this would save to a memories table
      // For now, we'll simulate with local storage or profile metadata
      const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Schedule flashback reminders
      await this.scheduleFlashback(memoryId, type);

      this.logger.info('Memory created', { userId, partnerId, type, memoryId });

      return {
        id: memoryId,
        ...memory,
        nextFlashback: this.calculateNextFlashback(type, memory.created_at)
      };
    }, { operation: 'createMemory', userId, partnerId, type });
  }

  /**
   * Get user's memory timeline
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User's memories
   */
  async getMemoryTimeline(userId, options = {}) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { limit = 20, type = null, partnerId = null } = options;

      // In a real implementation, this would query a memories table
      // For now, return mock memories based on user's matches

      const matches = await this.matchRepository.getUserMatches(userId, { limit: 10 });
      const memories = [];

      // Generate mock memories from matches
      matches.forEach((match, index) => {
        if (match.status === 'active') {
          const daysSinceMatch = match.daysSinceMatch || 0;

          // First match memory
          if (index === 0 || daysSinceMatch === 0) {
            memories.push({
              id: `mem_first_match_${match.id}`,
              type: 'first_match',
              partner_id: match.partner.id,
              partner: match.partner,
              created_at: match.createdAt,
              metadata: {
                matchId: match.id,
                createdAt: match.createdAt
              },
              timeAgo: this.getTimeAgo(match.createdAt),
              nextFlashback: this.calculateNextFlashback('first_match', match.createdAt)
            });
          }

          // Anniversary memories
          if (daysSinceMatch > 0 && daysSinceMatch % 30 === 0) {
            memories.push({
              id: `mem_anniversary_${match.id}_${daysSinceMatch}`,
              type: 'anniversary',
              partner_id: match.partner.id,
              partner: match.partner,
              created_at: new Date(Date.now() - daysSinceMatch * 24 * 60 * 60 * 1000).toISOString(),
              metadata: {
                days: daysSinceMatch,
                matchId: match.id
              },
              timeAgo: `${daysSinceMatch} napja`,
              nextFlashback: null // One-time memory
            });
          }
        }
      });

      // Filter by type if specified
      let filteredMemories = type ?
        memories.filter(m => m.type === type) :
        memories;

      // Filter by partner if specified
      if (partnerId) {
        filteredMemories = filteredMemories.filter(m => m.partner_id === partnerId);
      }

      // Sort by creation date (newest first)
      filteredMemories.sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      );

      return filteredMemories.slice(0, limit);
    }, { operation: 'getMemoryTimeline', userId });
  }

  /**
   * Schedule flashback reminders for a memory
   * @param {string} memoryId - Memory ID
   * @param {string} type - Memory type
   * @returns {Promise<void>}
   */
  async scheduleFlashback(memoryId, type) {
    const intervals = {
      first_match: [7, 30, 90, 365], // days
      first_date: [30, 90, 180, 365],
      anniversary: [365], // yearly
      compatibility_high: [14, 60],
      special_moment: [30, 180],
      streak_milestone: [7], // immediate
      milestone_achieved: [1] // next day
    };

    const daysArray = intervals[type] || [30];

    // In a real implementation, this would create scheduled notifications
    // For now, just log the scheduling
    daysArray.forEach(days => {
      const scheduledFor = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      this.logger.debug('Flashback scheduled', {
        memoryId,
        type,
        scheduledFor: scheduledFor.toISOString(),
        daysFromNow: days
      });
    });
  }

  /**
   * Calculate next flashback date for a memory
   * @param {string} type - Memory type
   * @param {string} createdAt - Memory creation date
   * @returns {string|null} Next flashback date or null
   */
  calculateNextFlashback(type, createdAt) {
    const intervals = {
      first_match: [7, 30, 90, 365],
      first_date: [30, 90, 180, 365],
      anniversary: [365],
      compatibility_high: [14, 60],
      special_moment: [30, 180]
    };

    const daysArray = intervals[type];
    if (!daysArray) return null;

    const createdDate = new Date(createdAt);
    const now = new Date();

    // Find the next upcoming flashback date
    for (const days of daysArray) {
      const flashbackDate = new Date(createdDate.getTime() + days * 24 * 60 * 60 * 1000);
      if (flashbackDate > now) {
        return flashbackDate.toISOString();
      }
    }

    return null; // No upcoming flashbacks
  }

  /**
   * Share a memory with partner
   * @param {string} memoryId - Memory ID
   * @param {string} userId - User sharing the memory
   * @param {string} message - Optional message
   * @returns {Promise<Object>} Share result
   */
  async shareMemory(memoryId, userId, message = '') {
    return ErrorHandler.wrapServiceCall(async () => {
      // In a real implementation, this would:
      // 1. Find the memory
      // 2. Create a notification for the partner
      // 3. Send a message about the memory

      // For now, simulate sharing
      this.logger.info('Memory shared', { memoryId, userId, message });

      return {
        success: true,
        memoryId,
        sharedWithPartner: true,
        message: message || 'Emlékeztem rád... 💕'
      };
    }, { operation: 'shareMemory', userId, memoryId });
  }

  /**
   * Get memory statistics for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Memory statistics
   */
  async getMemoryStatistics(userId) {
    const timeline = await this.getMemoryTimeline(userId, { limit: 100 });

    const stats = {
      totalMemories: timeline.length,
      memoriesByType: {},
      averageTimeBetweenMemories: 0,
      mostCommonPartner: null,
      longestMemoryStreak: 0,
      upcomingFlashbacks: []
    };

    // Count by type
    timeline.forEach(memory => {
      stats.memoriesByType[memory.type] =
        (stats.memoriesByType[memory.type] || 0) + 1;
    });

    // Find most common partner
    const partnerCount = {};
    timeline.forEach(memory => {
      const partnerId = memory.partner_id;
      partnerCount[partnerId] = (partnerCount[partnerId] || 0) + 1;
    });

    if (Object.keys(partnerCount).length > 0) {
      const mostCommonPartnerId = Object.keys(partnerCount)
        .reduce((a, b) => partnerCount[a] > partnerCount[b] ? a : b);
      stats.mostCommonPartner = mostCommonPartnerId;
    }

    // Calculate upcoming flashbacks
    timeline.forEach(memory => {
      if (memory.nextFlashback) {
        const flashbackDate = new Date(memory.nextFlashback);
        if (flashbackDate > new Date()) {
          stats.upcomingFlashbacks.push({
            memoryId: memory.id,
            type: memory.type,
            date: memory.nextFlashback,
            partner: memory.partner
          });
        }
      }
    });

    // Sort upcoming flashbacks by date
    stats.upcomingFlashbacks.sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    return stats;
  }

  /**
   * Get time ago string for a date
   * @param {string} dateString - ISO date string
   * @returns {string} Human readable time ago
   */
  getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Ma';
    if (diffInDays === 1) return 'Tegnap';
    if (diffInDays < 7) return `${diffInDays} napja`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} hete`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} hónapja`;
    return `${Math.floor(diffInDays / 365)} éve`;
  }

  /**
   * Generate memory insights for user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Memory insights
   */
  async getMemoryInsights(userId) {
    const stats = await this.getMemoryStatistics(userId);
    const insights = [];

    // Memory count insights
    if (stats.totalMemories === 0) {
      insights.push({
        type: 'encouragement',
        title: 'Kezdd el az emlékgyűjtést!',
        description: 'Az első emlék létrehozásával kezdődik a varázslat.',
        action: 'create_first_memory'
      });
    } else if (stats.totalMemories < 5) {
      insights.push({
        type: 'growth',
        title: 'Még több emlék vár rád!',
        description: `${stats.totalMemories} emléked van már. Folytasd!`,
        action: 'create_more_memories'
      });
    } else {
      insights.push({
        type: 'achievement',
        title: 'Emlékművész vagy!',
        description: `${stats.totalMemories} emlék gyűlt össze az idő során.`,
        action: 'view_timeline'
      });
    }

    // Upcoming flashbacks
    if (stats.upcomingFlashbacks.length > 0) {
      const nextFlashback = stats.upcomingFlashbacks[0];
      const daysUntil = Math.ceil(
        (new Date(nextFlashback.date) - new Date()) / (1000 * 60 * 60 * 24)
      );

      insights.push({
        type: 'reminder',
        title: 'Közelgő emlék!',
        description: `${daysUntil} nap múlva emlékezel meg egy különleges pillanatra.`,
        action: 'view_upcoming'
      });
    }

    // Partner insights
    if (stats.mostCommonPartner) {
      insights.push({
        type: 'connection',
        title: 'Leggyakoribb emlékpartner',
        description: 'Egy bizonyos személlyel sok emléked gyűlt össze.',
        action: 'view_partner_memories'
      });
    }

    return insights;
  }
}

// Register with DI container
container.registerFactory('memoryService', () => new MemoryService());

export default MemoryService;
