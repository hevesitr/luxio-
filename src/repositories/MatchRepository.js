/**
 * Match Repository
 *
 * Data access layer for match operations
 * Handles likes, passes, and match creation logic
 */

class MatchRepository {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Create a like between users
   * @param {string} userId - User who likes
   * @param {string} likedUserId - User being liked
   * @returns {Promise<Object>} Like data
   */
  async createLike(userId, likedUserId) {
    // Check if like already exists
    const existingLike = await this.findLike(userId, likedUserId);
    if (existingLike) {
      throw new Error('Like already exists');
    }

    const { data, error } = await this.dataSource
      .from('likes')
      .insert([{
        user_id: userId,
        liked_user_id: likedUserId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Like creation failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a pass between users
   * @param {string} userId - User who passes
   * @param {string} passedUserId - User being passed
   * @returns {Promise<Object>} Pass data
   */
  async createPass(userId, passedUserId) {
    const { data, error } = await this.dataSource
      .from('passes')
      .insert([{
        user_id: userId,
        passed_user_id: passedUserId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Pass creation failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Find existing like
   * @param {string} userId - User ID
   * @param {string} likedUserId - Liked user ID
   * @returns {Promise<Object|null>} Like data or null
   */
  async findLike(userId, likedUserId) {
    const { data, error } = await this.dataSource
      .from('likes')
      .select('*')
      .eq('user_id', userId)
      .eq('liked_user_id', likedUserId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`Like lookup failed: ${error.message}`);
    }

    return data || null;
  }

  /**
   * Check if mutual like exists (creates match)
   * @param {string} userId - User ID
   * @param {string} likedUserId - Liked user ID
   * @returns {Promise<Object|null>} Match data if created, null otherwise
   */
  async checkMutualLike(userId, likedUserId) {
    // Check if the other user also liked this user
    const mutualLike = await this.findLike(likedUserId, userId);

    if (!mutualLike) {
      return null; // No mutual like
    }

    // Create match
    const match = await this.createMatch(userId, likedUserId);
    return match;
  }

  /**
   * Create a match between users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<Object>} Match data
   */
  async createMatch(userId1, userId2) {
    const { data, error } = await this.dataSource
      .from('matches')
      .insert([{
        user_id: userId1,
        matched_user_id: userId2,
        status: 'active',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Match creation failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user's matches
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User's matches with partner data
   */
  async getUserMatches(userId, options = {}) {
    const { limit = 50, offset = 0, status = 'active' } = options;

    const { data, error } = await this.dataSource
      .from('matches')
      .select(`
        *,
        matched_user:profiles!matches_matched_user_id_fkey (
          id,
          name,
          age,
          city,
          photos,
          bio,
          last_active
        )
      `)
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Match retrieval failed: ${error.message}`);
    }

    return data.map(match => this.transformMatch(match, userId));
  }

  /**
   * Update match status
   * @param {string} matchId - Match ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated match
   */
  async updateMatchStatus(matchId, status) {
    const { data, error } = await this.dataSource
      .from('matches')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      throw new Error(`Match update failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete match (soft delete)
   * @param {string} matchId - Match ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteMatch(matchId) {
    const result = await this.updateMatchStatus(matchId, 'unmatched');
    return !!result;
  }

  /**
   * Get match statistics for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Match statistics
   */
  async getMatchStatistics(userId) {
    const { data: matches, error } = await this.dataSource
      .from('matches')
      .select('status, created_at')
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`);

    if (error) {
      throw new Error(`Statistics retrieval failed: ${error.message}`);
    }

    const { data: likes } = await this.dataSource
      .from('likes')
      .select('id')
      .eq('user_id', userId);

    const { data: passes } = await this.dataSource
      .from('passes')
      .select('id')
      .eq('user_id', userId);

    return {
      totalMatches: matches.filter(m => m.status === 'active').length,
      totalLikes: likes.length,
      totalPasses: passes.length,
      matchRate: likes.length > 0 ? (matches.length / likes.length * 100) : 0,
      recentMatches: matches
        .filter(m => m.status === 'active')
        .filter(m => {
          const matchDate = new Date(m.created_at);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return matchDate > weekAgo;
        })
        .length
    };
  }

  /**
   * Transform raw match data
   * @param {Object} rawMatch - Raw match from database
   * @param {string} currentUserId - Current user ID
   * @returns {Object} Transformed match
   */
  transformMatch(rawMatch, currentUserId) {
    // Determine which user is the partner (not the current user)
    const isCurrentUserFirst = rawMatch.user_id === currentUserId;
    const partnerUser = isCurrentUserFirst ? rawMatch.matched_user : {
      id: rawMatch.user_id,
      name: 'Unknown User', // In case of data inconsistency
      age: null,
      city: null,
      photos: [],
      bio: null,
      last_active: null
    };

    return {
      id: rawMatch.id,
      status: rawMatch.status,
      createdAt: rawMatch.created_at,
      partner: {
        id: partnerUser.id,
        name: partnerUser.name,
        age: partnerUser.age,
        city: partnerUser.city,
        photos: partnerUser.photos || [],
        bio: partnerUser.bio,
        lastActive: partnerUser.last_active
      },
      // Additional computed fields
      isActive: rawMatch.status === 'active',
      daysSinceMatch: Math.floor((Date.now() - new Date(rawMatch.created_at)) / (1000 * 60 * 60 * 24))
    };
  }

  /**
   * Check if users are matched
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<Object|null>} Match data or null
   */
  async findMatchBetweenUsers(userId1, userId2) {
    const { data, error } = await this.dataSource
      .from('matches')
      .select('*')
      .or(`and(user_id.eq.${userId1},matched_user_id.eq.${userId2}),and(user_id.eq.${userId2},matched_user_id.eq.${userId1})`)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`Match lookup failed: ${error.message}`);
    }

    return data || null;
  }
}

export default MatchRepository;
