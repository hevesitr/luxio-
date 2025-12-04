/**
 * Moderation Service
 *
 * Handles reporting, content filtering, and user moderation
 */
import supabase from './supabaseClient';
import Logger from './Logger';

class ModerationService {
  /**
   * Report types
   */
  static REPORT_TYPES = {
    HARASSMENT: 'harassment',
    INAPPROPRIATE_CONTENT: 'inappropriate_content',
    SPAM: 'spam',
    FAKE_PROFILE: 'fake_profile',
    UNDERAGE: 'underage',
    OTHER: 'other'
  };

  /**
   * Content flag reasons
   */
  static FLAG_REASONS = {
    PROFANITY: 'profanity',
    EXPLICIT: 'explicit',
    HATE_SPEECH: 'hate_speech',
    SPAM: 'spam',
    HARASSMENT: 'harassment'
  };

  /**
   * Submit a report against a user
   * @param {string} reporterId - User submitting the report
   * @param {string} reportedUserId - User being reported
   * @param {string} reportType - Type of report
   * @param {string} description - Additional details
   * @param {Array} evidence - Array of evidence URLs
   * @returns {Promise<Object>} - Result object
   */
  async submitReport(reporterId, reportedUserId, reportType, description = '', evidence = []) {
    try {
      // Validate inputs
      if (!reporterId || !reportedUserId) {
        throw new Error('Reporter and reported user IDs are required');
      }

      if (reporterId === reportedUserId) {
        throw new Error('Cannot report yourself');
      }

      if (!Object.values(ModerationService.REPORT_TYPES).includes(reportType)) {
        throw new Error('Invalid report type');
      }

      // Check for duplicate reports within 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: existingReport } = await supabase
        .from('reports')
        .select('id')
        .eq('reporter_id', reporterId)
        .eq('reported_user_id', reportedUserId)
        .gte('created_at', yesterday)
        .single();

      if (existingReport) {
        throw new Error('Already reported this user within the last 24 hours');
      }

      // Submit report
      const { data: report, error } = await supabase
        .from('reports')
        .insert({
          reporter_id: reporterId,
          reported_user_id: reportedUserId,
          report_type: reportType,
          description: description,
          evidence: evidence,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Check if user should be automatically suspended
      await this.checkAutomaticSuspension(reportedUserId);

      Logger.success('ModerationService: Report submitted successfully', {
        reportId: report.id,
        reporterId,
        reportedUserId,
        reportType
      });

      return {
        success: true,
        report
      };

    } catch (error) {
      Logger.error('ModerationService: Failed to submit report', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check and apply automatic suspension based on report count
   * @param {string} userId - User ID to check
   * @returns {Promise<void>}
   */
  async checkAutomaticSuspension(userId) {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Count reports in last 24 hours
      const { count: reportCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('reported_user_id', userId)
        .gte('created_at', last24Hours);

      // If 3 or more reports in 24 hours, suspend user
      if (reportCount >= 3) {
        await this.suspendUser(userId, 7, `Automatic suspension: ${reportCount} reports in 24 hours`);

        Logger.warn('ModerationService: User automatically suspended', {
          userId,
          reportCount,
          suspensionDays: 7
        });
      }

    } catch (error) {
      Logger.error('ModerationService: Failed to check automatic suspension', error);
    }
  }

  /**
   * Suspend a user account
   * @param {string} userId - User ID to suspend
   * @param {number} days - Number of days to suspend
   * @param {string} reason - Reason for suspension
   * @param {string} moderatorId - Moderator who initiated suspension (optional)
   * @returns {Promise<Object>} - Result object
   */
  async suspendUser(userId, days, reason, moderatorId = null) {
    try {
      const suspensionEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      const { data: suspension, error } = await supabase
        .from('user_suspensions')
        .insert({
          user_id: userId,
          suspension_end: suspensionEnd,
          reason: reason,
          moderator_id: moderatorId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update user status
      await supabase
        .from('profiles')
        .update({
          is_suspended: true,
          suspension_reason: reason,
          suspension_end: suspensionEnd
        })
        .eq('id', userId);

      Logger.success('ModerationService: User suspended', {
        userId,
        days,
        reason,
        suspensionId: suspension.id
      });

      return {
        success: true,
        suspension
      };

    } catch (error) {
      Logger.error('ModerationService: Failed to suspend user', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Filter content for inappropriate material
   * @param {string} content - Content to filter
   * @returns {Object} - Filter result
   */
  filterContent(content) {
    if (!content || typeof content !== 'string') {
      return { isClean: true, flagReasons: [], confidence: 0 };
    }

    const lowerContent = content.toLowerCase();
    const flagReasons = [];
    let matchCount = 0;

    // Profanity detection
    const profanityWords = [
      'bassza', 'basz', 'kurva', 'kurv', 'fasz', 'fasza', 'picsa', 'pina', 'segg',
      'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap'
    ];

    profanityWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerContent.match(regex);
      if (matches) {
        matchCount += matches.length;
        if (!flagReasons.includes(ModerationService.FLAG_REASONS.PROFANITY)) {
          flagReasons.push(ModerationService.FLAG_REASONS.PROFANITY);
        }
      }
    });

    // Explicit content detection
    const explicitPatterns = [
      /\b(sex|porn|naked|nude|boobs|tits|ass|dick|cock|pussy)\b/gi,
      /\b(fuck|bang|screw|cum|suck|blowjob|handjob)\b/gi
    ];

    explicitPatterns.forEach(pattern => {
      if (pattern.test(lowerContent)) {
        matchCount++;
        if (!flagReasons.includes(ModerationService.FLAG_REASONS.EXPLICIT)) {
          flagReasons.push(ModerationService.FLAG_REASONS.EXPLICIT);
        }
      }
    });

    // Hate speech detection
    const hateWords = [
      'nigger', 'nigga', 'faggot', 'tranny', 'chink', 'gook', 'spic', 'wetback',
      'kike', 'heeb', 'raghead', 'sandnigger', 'towelhead'
    ];

    hateWords.forEach(word => {
      if (lowerContent.includes(word)) {
        matchCount++;
        if (!flagReasons.includes(ModerationService.FLAG_REASONS.HATE_SPEECH)) {
          flagReasons.push(ModerationService.FLAG_REASONS.HATE_SPEECH);
        }
      }
    });

    // Spam detection
    const spamPatterns = [
      /(.)\1{4,}/g, // Repeated characters
      /\b(?:https?:\/\/)?(?:www\.)?(?:bit\.ly|tinyurl|goo\.gl|t\.co)\b/gi, // URL shorteners
      /\b\d{10,}\b/g // Long numbers (potentially phone numbers)
    ];

    spamPatterns.forEach(pattern => {
      if (pattern.test(lowerContent)) {
        matchCount++;
        if (!flagReasons.includes(ModerationService.FLAG_REASONS.SPAM)) {
          flagReasons.push(ModerationService.FLAG_REASONS.SPAM);
        }
      }
    });

    // Calculate confidence based on match count and content length
    const contentLength = content.length;
    const confidence = Math.min(100, (matchCount * 20) + (flagReasons.length * 15));

    return {
      isClean: flagReasons.length === 0,
      flagReasons,
      confidence,
      details: {
        matchCount,
        contentLength,
        patterns: flagReasons
      }
    };
  }

  /**
   * Block a user
   * @param {string} blockerId - User doing the blocking
   * @param {string} blockedUserId - User being blocked
   * @returns {Promise<Object>} - Result object
   */
  async blockUser(blockerId, blockedUserId) {
    try {
      if (blockerId === blockedUserId) {
        throw new Error('Cannot block yourself');
      }

      // Check if already blocked
      const { data: existingBlock } = await supabase
        .from('user_blocks')
        .select('id')
        .eq('blocker_id', blockerId)
        .eq('blocked_user_id', blockedUserId)
        .single();

      if (existingBlock) {
        throw new Error('User is already blocked');
      }

      // Create block
      const { data: block, error } = await supabase
        .from('user_blocks')
        .insert({
          blocker_id: blockerId,
          blocked_user_id: blockedUserId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Remove any existing matches
      await this.unmatchUsers(blockerId, blockedUserId);

      Logger.success('ModerationService: User blocked', {
        blockerId,
        blockedUserId,
        blockId: block.id
      });

      return {
        success: true,
        block
      };

    } catch (error) {
      Logger.error('ModerationService: Failed to block user', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unmatch two users and delete conversation
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<Object>} - Result object
   */
  async unmatchUsers(userId1, userId2) {
    try {
      // Find match between users
      const { data: match } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user_id.eq.${userId1},matched_user_id.eq.${userId2}),and(user_id.eq.${userId2},matched_user_id.eq.${userId1})`)
        .single();

      if (!match) {
        throw new Error('No match found between these users');
      }

      // Delete match
      await supabase
        .from('matches')
        .delete()
        .eq('id', match.id);

      // Delete all messages in the conversation
      const { data: deletedMessages } = await supabase
        .from('messages')
        .delete()
        .eq('match_id', match.id)
        .select('id');

      Logger.success('ModerationService: Users unmatched and conversation deleted', {
        userId1,
        userId2,
        matchId: match.id,
        messagesDeleted: deletedMessages?.length || 0
      });

      return {
        success: true,
        matchId: match.id,
        messagesDeleted: deletedMessages?.length || 0
      };

    } catch (error) {
      Logger.error('ModerationService: Failed to unmatch users', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if a user is blocked by another user
   * @param {string} userId - User checking
   * @param {string} otherUserId - Other user
   * @returns {Promise<boolean>} - Whether user is blocked
   */
  async isUserBlocked(userId, otherUserId) {
    try {
      const { data } = await supabase
        .from('user_blocks')
        .select('id')
        .or(`and(blocker_id.eq.${userId},blocked_user_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_user_id.eq.${userId})`)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user's block list
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of blocked users
   */
  async getUserBlocks(userId) {
    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select(`
          id,
          blocked_user_id,
          created_at,
          profiles:blocked_user_id (
            id,
            name,
            photos
          )
        `)
        .eq('blocker_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      Logger.error('ModerationService: Failed to get user blocks', error);
      return [];
    }
  }

  /**
   * Get pending reports for moderation
   * @param {number} limit - Number of reports to fetch
   * @returns {Promise<Array>} - Array of pending reports
   */
  async getPendingReports(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          reporter_id,
          reported_user_id,
          report_type,
          description,
          evidence,
          status,
          created_at,
          profiles:reporter_id (
            id,
            name
          ),
          reported_profile:reported_user_id (
            id,
            name,
            photos
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      Logger.error('ModerationService: Failed to get pending reports', error);
      return [];
    }
  }

  /**
   * Resolve a report
   * @param {string} reportId - Report ID
   * @param {string} action - Action taken ('dismissed', 'warned', 'suspended', 'banned')
   * @param {string} moderatorId - Moderator ID
   * @param {string} notes - Moderator notes
   * @returns {Promise<Object>} - Result object
   */
  async resolveReport(reportId, action, moderatorId, notes = '') {
    try {
      const { data: report, error } = await supabase
        .from('reports')
        .update({
          status: 'resolved',
          action_taken: action,
          moderator_id: moderatorId,
          moderator_notes: notes,
          resolved_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;

      Logger.success('ModerationService: Report resolved', {
        reportId,
        action,
        moderatorId
      });

      return {
        success: true,
        report
      };

    } catch (error) {
      Logger.error('ModerationService: Failed to resolve report', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new ModerationService();
