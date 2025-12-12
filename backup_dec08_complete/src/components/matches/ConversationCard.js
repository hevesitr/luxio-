/**
 * Conversation Card Component
 * Displays a conversation in the messages list
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ConversationCard = ({ conversation, onPress, onUnmatch }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) {
      return 'Now';
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h`;
    }
    
    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d`;
    }
    
    // Show date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Profile photo */}
      <View style={styles.photoContainer}>
        <Image
          source={{ uri: conversation.profile?.photo_url }}
          style={styles.photo}
          resizeMode="cover"
        />
        {conversation.is_online && (
          <View style={styles.onlineIndicator} />
        )}
      </View>
      
      {/* Conversation info */}
      <View style={styles.info}>
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <Text style={[
              styles.name,
              conversation.unread_count > 0 && styles.nameUnread
            ]}>
              {conversation.profile?.name}
            </Text>
            {conversation.profile?.is_verified && (
              <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
            )}
          </View>
          
          <Text style={[
            styles.time,
            conversation.unread_count > 0 && styles.timeUnread
          ]}>
            {formatTime(conversation.last_message_at)}
          </Text>
        </View>
        
        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.lastMessage,
              conversation.unread_count > 0 && styles.lastMessageUnread
            ]}
            numberOfLines={1}
          >
            {conversation.last_message_preview || 'Say hi! 👋'}
          </Text>
          
          {conversation.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#fff',
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '400',
    color: '#000',
    marginRight: 4,
  },
  nameUnread: {
    fontWeight: '600',
  },
  time: {
    fontSize: 14,
    color: '#999',
  },
  timeUnread: {
    color: '#007AFF',
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    marginRight: 8,
  },
  lastMessageUnread: {
    color: '#000',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ConversationCard;
