/**
 * Message Repository
 *
 * Data access layer for message operations
 * Handles real-time messaging and message history
 */

class MessageRepository {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Send a text message
   * @param {string} matchId - Match ID
   * @param {string} senderId - Sender user ID
   * @param {string} content - Message content
   * @returns {Promise<Object>} Message data
   */
  async sendMessage(matchId, senderId, content) {
    const { data, error } = await this.dataSource
      .from('messages')
      .insert([{
        match_id: matchId,
        sender_id: senderId,
        content,
        message_type: 'text',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Message send failed: ${error.message}`);
    }

    return this.transformMessage(data);
  }

  /**
   * Send a voice message
   * @param {string} matchId - Match ID
   * @param {string} senderId - Sender user ID
   * @param {string} audioUrl - Audio file URL
   * @param {number} duration - Audio duration in seconds
   * @returns {Promise<Object>} Message data
   */
  async sendVoiceMessage(matchId, senderId, audioUrl, duration) {
    const { data, error } = await this.dataSource
      .from('messages')
      .insert([{
        match_id: matchId,
        sender_id: senderId,
        content: audioUrl,
        message_type: 'voice',
        metadata: { duration },
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Voice message send failed: ${error.message}`);
    }

    return this.transformMessage(data);
  }

  /**
   * Send a video message
   * @param {string} matchId - Match ID
   * @param {string} senderId - Sender user ID
   * @param {string} videoUrl - Video file URL
   * @param {Object} metadata - Video metadata
   * @returns {Promise<Object>} Message data
   */
  async sendVideoMessage(matchId, senderId, videoUrl, metadata = {}) {
    const { data, error } = await this.dataSource
      .from('messages')
      .insert([{
        match_id: matchId,
        sender_id: senderId,
        content: videoUrl,
        message_type: 'video',
        metadata,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Video message send failed: ${error.message}`);
    }

    return this.transformMessage(data);
  }

  /**
   * Get messages for a match
   * @param {string} matchId - Match ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Messages with pagination
   */
  async getMessages(matchId, options = {}) {
    const { limit = 50, offset = 0, beforeMessageId = null } = options;

    let query = this.dataSource
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey (
          id,
          name,
          photos
        )
      `)
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (beforeMessageId) {
      // Get messages before a specific message ID for pagination
      const { data: referenceMessage } = await this.dataSource
        .from('messages')
        .select('created_at')
        .eq('id', beforeMessageId)
        .single();

      if (referenceMessage) {
        query = query.lt('created_at', referenceMessage.created_at);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Message retrieval failed: ${error.message}`);
    }

    // Check if there are more messages
    const { count } = await this.dataSource
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId);

    const messages = data.map(msg => this.transformMessage(msg)).reverse(); // Oldest first

    return {
      messages,
      hasMore: offset + limit < count,
      totalCount: count,
      nextOffset: offset + limit
    };
  }

  /**
   * Mark messages as read
   * @param {string} matchId - Match ID
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of messages marked as read
   */
  async markAsRead(matchId, userId) {
    const { data, error } = await this.dataSource
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('match_id', matchId)
      .neq('sender_id', userId) // Don't mark own messages as read
      .eq('is_read', false)
      .select('id');

    if (error) {
      throw new Error(`Mark as read failed: ${error.message}`);
    }

    return data.length;
  }

  /**
   * Get unread message count for user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread message count
   */
  async getUnreadCount(userId) {
    // Get all matches for user
    const { data: matches, error: matchError } = await this.dataSource
      .from('matches')
      .select('id')
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`)
      .eq('status', 'active');

    if (matchError) {
      throw new Error(`Match lookup failed: ${matchError.message}`);
    }

    if (matches.length === 0) {
      return 0;
    }

    const matchIds = matches.map(m => m.id);

    const { count, error } = await this.dataSource
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('match_id', matchIds)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error(`Unread count failed: ${error.message}`);
    }

    return count;
  }

  /**
   * Delete message
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID (for permission check)
   * @returns {Promise<boolean>} Success status
   */
  async deleteMessage(messageId, userId) {
    const { error } = await this.dataSource
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', userId); // Only sender can delete

    if (error) {
      throw new Error(`Message deletion failed: ${error.message}`);
    }

    return true;
  }

  /**
   * Get message statistics for match
   * @param {string} matchId - Match ID
   * @returns {Promise<Object>} Message statistics
   */
  async getMessageStatistics(matchId) {
    const { data, error } = await this.dataSource
      .from('messages')
      .select('sender_id, message_type, created_at')
      .eq('match_id', matchId);

    if (error) {
      throw new Error(`Statistics retrieval failed: ${error.message}`);
    }

    const stats = {
      totalMessages: data.length,
      messageTypes: {},
      dailyActivity: {},
      participants: new Set()
    };

    data.forEach(message => {
      // Count message types
      stats.messageTypes[message.message_type] =
        (stats.messageTypes[message.message_type] || 0) + 1;

      // Track participants
      stats.participants.add(message.sender_id);

      // Daily activity
      const date = new Date(message.created_at).toDateString();
      stats.dailyActivity[date] = (stats.dailyActivity[date] || 0) + 1;
    });

    stats.participants = Array.from(stats.participants);

    return stats;
  }

  /**
   * Search messages in a match
   * @param {string} matchId - Match ID
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Matching messages
   */
  async searchMessages(matchId, query, options = {}) {
    const { limit = 20 } = options;

    const { data, error } = await this.dataSource
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey (
          id,
          name,
          photos
        )
      `)
      .eq('match_id', matchId)
      .eq('message_type', 'text')
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Message search failed: ${error.message}`);
    }

    return data.map(msg => this.transformMessage(msg));
  }

  /**
   * Transform raw message data
   * @param {Object} rawMessage - Raw message from database
   * @returns {Object} Transformed message
   */
  transformMessage(rawMessage) {
    return {
      id: rawMessage.id,
      matchId: rawMessage.match_id,
      senderId: rawMessage.sender_id,
      content: rawMessage.content,
      messageType: rawMessage.message_type,
      metadata: rawMessage.metadata || {},
      isRead: rawMessage.is_read || false,
      readAt: rawMessage.read_at,
      createdAt: rawMessage.created_at,
      // Additional computed fields
      isOwn: false, // Set by consumer based on current user
      sender: rawMessage.sender ? {
        id: rawMessage.sender.id,
        name: rawMessage.sender.name,
        avatar: rawMessage.sender.photos?.[0] || null
      } : null,
      // Formatting helpers
      formattedTime: this.formatMessageTime(rawMessage.created_at),
      isRecent: this.isRecentMessage(rawMessage.created_at)
    };
  }

  /**
   * Format message timestamp
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted time string
   */
  formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('hu-HU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('hu-HU', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('hu-HU', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  /**
   * Check if message is recent (within last 5 minutes)
   * @param {string} timestamp - ISO timestamp
   * @returns {boolean} Whether message is recent
   */
  isRecentMessage(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);

    return diffInMinutes <= 5;
  }
}

export default MessageRepository;
