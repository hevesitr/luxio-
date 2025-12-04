/**
 * Message Bubble Component
 * Displays individual message in chat
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

const MessageBubble = ({ message, isOwnMessage, showTimestamp, profile }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now';
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    
    // Show date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.containerOwn : styles.containerOther
    ]}>
      {/* Profile photo for other user */}
      {!isOwnMessage && profile && (
        <Image
          source={{ uri: profile.photo_url }}
          style={styles.avatar}
        />
      )}
      
      <View style={[
        styles.bubble,
        isOwnMessage ? styles.bubbleOwn : styles.bubbleOther
      ]}>
        {/* Message content */}
        <Text style={[
          styles.text,
          isOwnMessage ? styles.textOwn : styles.textOther
        ]}>
          {message.content}
        </Text>
        
        {/* Message status */}
        {isOwnMessage && (
          <View style={styles.status}>
            {message.sending ? (
              <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
            ) : message.read_at ? (
              <Ionicons name="checkmark-done" size={12} color="rgba(255,255,255,0.7)" />
            ) : (
              <Ionicons name="checkmark" size={12} color="rgba(255,255,255,0.7)" />
            )}
          </View>
        )}
      </View>
      
      {/* Timestamp */}
      {showTimestamp && (
        <Text style={[
          styles.timestamp,
          isOwnMessage ? styles.timestampOwn : styles.timestampOther
        ]}>
          {formatTime(message.created_at)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  containerOwn: {
    justifyContent: 'flex-end',
  },
  containerOther: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  bubble: {
    maxWidth: '70%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bubbleOwn: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  textOwn: {
    color: '#fff',
  },
  textOther: {
    color: '#000',
  },
  status: {
    position: 'absolute',
    bottom: 4,
    right: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  timestampOwn: {
    textAlign: 'right',
    marginRight: 8,
  },
  timestampOther: {
    textAlign: 'left',
    marginLeft: 48,
  },
});

export default MessageBubble;
