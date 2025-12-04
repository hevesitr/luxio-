import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VoiceMessage from '../VoiceMessage';
import VideoMessage from '../VideoMessage';

const ChatMessage = ({ message, isMe, theme }) => {
  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'voice':
        return <VoiceMessage uri={message.voiceUri} duration={message.duration} />;
      case 'video':
        return <VideoMessage uri={message.videoUri} thumbnail={message.thumbnail} />;
      case 'text':
      default:
        return (
          <Text style={[
            styles.messageText,
            { color: isMe ? '#fff' : theme.colors.text }
          ]}>
            {message.text}
          </Text>
        );
    }
  };

  const getReadStatusIcon = () => {
    if (!isMe) return null;
    
    switch (message.readStatus) {
      case 'sent':
        return <Ionicons name="checkmark" size={14} color="rgba(255, 255, 255, 0.7)" />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={14} color="rgba(255, 255, 255, 0.7)" />;
      case 'read':
        return <Ionicons name="checkmark-done" size={14} color="#4CAF50" />;
      default:
        return null;
    }
  };

  return (
    <View style={[
      styles.messageContainer,
      isMe ? styles.myMessage : styles.theirMessage
    ]}>
      <View style={[
        styles.messageBubble,
        isMe 
          ? { backgroundColor: theme.colors.primary }
          : { backgroundColor: theme.colors.surface }
      ]}>
        {renderMessageContent()}
        
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timestamp,
            { color: isMe ? 'rgba(255, 255, 255, 0.7)' : theme.colors.textSecondary }
          ]}>
            {formatTime(message.timestamp)}
          </Text>
          {getReadStatusIcon()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 4,
    marginHorizontal: 15,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    padding: 12,
    paddingBottom: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
  },
});

export default ChatMessage;
