/**
 * Optimized ChatScreen with React Query
 * Real-time messaging with infinite scroll and optimistic updates
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Hooks
import {
  useMessages,
  useSendMessage,
  useMarkAsRead,
  useTypingIndicator,
} from '../hooks';
import { useAuth } from '../context/AuthContext';

// Components
import MessageBubble from '../components/chat/MessageBubble';
import TypingIndicator from '../components/chat/TypingIndicator';
import ChatHeader from '../components/chat/ChatHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Services
import Logger from '../services/Logger';

const ChatScreen = ({ route, navigation }) => {
  const { matchId, profile } = route.params;
  const { user } = useAuth();
  
  // State
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  
  // Refs
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // React Query hooks
  const {
    data: messagesData,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useMessages(matchId);
  
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();
  const typingMutation = useTypingIndicator();
  
  // Flatten messages from pages
  const messages = messagesData?.pages?.flat() || [];
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 0, animated: true });
      }, 100);
    }
  }, [messages.length]);
  
  // Mark messages as read when screen is focused
  useEffect(() => {
    const unreadMessages = messages.filter(
      msg => !msg.read_at && msg.sender_id !== user.id
    );
    
    unreadMessages.forEach(msg => {
      markAsReadMutation.mutate({
        messageId: msg.id,
        userId: user.id,
        matchId,
      });
    });
  }, [messages, user.id, markAsReadMutation, matchId]);
  
  // Handle typing indicator
  const handleTyping = useCallback((text) => {
    setMessageText(text);
    
    // Start typing
    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      typingMutation.mutate({
        matchId,
        userId: user.id,
        isTyping: true,
      });
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        typingMutation.mutate({
          matchId,
          userId: user.id,
          isTyping: false,
        });
      }
    }, 2000);
  }, [isTyping, matchId, user.id, typingMutation]);
  
  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim()) return;
    
    const content = messageText.trim();
    setMessageText('');
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      typingMutation.mutate({
        matchId,
        userId: user.id,
        isTyping: false,
      });
    }
    
    try {
      await sendMessageMutation.mutateAsync({
        matchId,
        senderId: user.id,
        content,
        type: 'text',
      });
    } catch (error) {
      Logger.error('Failed to send message', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      // Restore message text on error
      setMessageText(content);
    }
  }, [messageText, isTyping, matchId, user.id, sendMessageMutation, typingMutation]);
  
  // Load more messages
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  // Render message item
  const renderMessage = useCallback(({ item: message, index }) => {
    const isOwnMessage = message.sender_id === user.id;
    const showTimestamp = index === messages.length - 1 || 
      (messages[index + 1] && 
       new Date(message.created_at).getTime() - new Date(messages[index + 1].created_at).getTime() > 300000); // 5 minutes
    
    return (
      <MessageBubble
        message={message}
        isOwnMessage={isOwnMessage}
        showTimestamp={showTimestamp}
        profile={isOwnMessage ? null : profile}
      />
    );
  }, [messages, user.id, profile]);
  
  // Render header
  const renderHeader = useCallback(() => {
    if (!isFetchingNextPage) return null;
    
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading more messages...</Text>
      </View>
    );
  }, [isFetchingNextPage]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing indicator
      if (isTyping) {
        typingMutation.mutate({
          matchId,
          userId: user.id,
          isTyping: false,
        });
      }
    };
  }, [isTyping, matchId, user.id, typingMutation]);
  
  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ChatHeader profile={profile} onBack={() => navigation.goBack()} />
        <LoadingSpinner message="Loading conversation..." />
      </SafeAreaView>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <ChatHeader profile={profile} onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load messages</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <ChatHeader 
          profile={profile} 
          onBack={() => navigation.goBack()}
          isTyping={otherUserTyping}
        />
        
        <KeyboardAvoidingView 
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            inverted
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.messagesList}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={20}
          />
          
          {/* Typing Indicator */}
          {otherUserTyping && (
            <TypingIndicator profile={profile} />
          )}
          
          {/* Message Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={messageText}
                onChangeText={handleTyping}
                placeholder="Type a message..."
                placeholderTextColor="#999"
                multiline
                maxLength={1000}
              />
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!messageText.trim() || sendMessageMutation.isLoading) && styles.sendButtonDisabled
                ]}
                onPress={handleSendMessage}
                disabled={!messageText.trim() || sendMessageMutation.isLoading}
              >
                {sendMessageMutation.isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default ChatScreen;
