/**
 * ChatRoomScreen Integration Example
 * Ez egy példa, hogyan integráld a real-time messaging-et
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import MessageService from '../services/MessageService';
import AnalyticsService from '../services/AnalyticsService';
import Logger from '../services/Logger';

export default function ChatRoomIntegration({ route, navigation }) {
  const { matchId, otherUser } = route.params;
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageSubscription = useRef(null);
  const presenceChannel = useRef(null);

  // Üzenetek betöltése és real-time feliratkozás
  useEffect(() => {
    loadMessages();
    subscribeToMessages();
    subscribeToPresence();

    // Analytics
    AnalyticsService.trackEvent(AnalyticsService.eventTypes.CONVERSATION_OPENED, {
      match_id: matchId,
      other_user_id: otherUser.id,
    });

    return () => {
      // Cleanup
      if (messageSubscription.current) {
        MessageService.unsubscribeFromMessages(messageSubscription.current);
      }
      if (presenceChannel.current) {
        presenceChannel.current.unsubscribe();
      }
      if (isTyping) {
        MessageService.stopTypingIndicator(matchId, user.id);
      }
    };
  }, [matchId]);

  /**
   * Üzenetek betöltése
   */
  const loadMessages = async () => {
    try {
      setLoading(true);
      
      const result = await MessageService.getMessagesPaginated(matchId, 50, 0);
      
      if (result.success) {
        setMessages(result.data.messages);
        
        // Üzenetek olvasottnak jelölése
        await MessageService.markAllAsRead(matchId, user.id);
        
        Logger.success('Messages loaded', { count: result.data.messages.length });
      }
    } catch (error) {
      Logger.error('Load messages failed', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Real-time üzenet feliratkozás
   */
  const subscribeToMessages = () => {
    messageSubscription.current = MessageService.subscribeToMessages(
      matchId,
      (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        // Ha nem mi küldtük, jelöljük olvasottnak
        if (newMessage.sender_id !== user.id) {
          MessageService.markAsRead(newMessage.id);
          
          // Analytics
          AnalyticsService.trackEvent(AnalyticsService.eventTypes.MESSAGE_RECEIVED, {
            match_id: matchId,
            sender_id: newMessage.sender_id,
          });
        }
      }
    );
  };

  /**
   * Presence tracking - typing indicators
   */
  const subscribeToPresence = () => {
    presenceChannel.current = MessageService.subscribeToPresence(
      matchId,
      (event) => {
        if (event.type === 'sync') {
          // Check if other user is typing
          const presences = Object.values(event.state);
          const otherPresence = presences.find(p => 
            p[0]?.user_id !== user.id
          );
          
          if (otherPresence && otherPresence[0]) {
            setOtherUserTyping(otherPresence[0].typing || false);
          }
        }
      }
    );
  };

  /**
   * Üzenet küldése
   */
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      
      const messageText = newMessage.trim();
      setNewMessage(''); // Clear input immediately

      // Stop typing indicator
      if (isTyping) {
        await MessageService.stopTypingIndicator(matchId, user.id);
        setIsTyping(false);
      }

      // Send message
      const result = await MessageService.sendMessage(
        matchId,
        user.id,
        messageText,
        'text'
      );

      if (result.success) {
        // Message will be added via real-time subscription
        
        // Analytics
        AnalyticsService.trackEvent(AnalyticsService.eventTypes.MESSAGE_SENT, {
          match_id: matchId,
          recipient_id: otherUser.id,
          message_length: messageText.length,
        });

        Logger.success('Message sent');
      } else {
        // Restore message on error
        setNewMessage(messageText);
        Alert.alert('Hiba', result.error);
      }
    } catch (error) {
      Logger.error('Send message failed', error);
      Alert.alert('Hiba', 'Nem sikerült elküldeni az üzenetet');
    } finally {
      setSending(false);
    }
  };

  /**
   * Typing indicator kezelése
   */
  const handleTextChange = (text) => {
    setNewMessage(text);

    // Start typing indicator
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      MessageService.sendTypingIndicator(matchId, user.id);
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        MessageService.stopTypingIndicator(matchId, user.id);
      }
    }, 3000);

    // Stop typing if input is empty
    if (text.length === 0 && isTyping) {
      setIsTyping(false);
      MessageService.stopTypingIndicator(matchId, user.id);
    }
  };

  /**
   * Régebbi üzenetek betöltése (infinite scroll)
   */
  const loadMoreMessages = async () => {
    try {
      const result = await MessageService.getMessagesPaginated(
        matchId,
        50,
        messages.length
      );

      if (result.success && result.data.messages.length > 0) {
        setMessages(prev => [...result.data.messages, ...prev]);
      }
    } catch (error) {
      Logger.error('Load more messages failed', error);
    }
  };

  /**
   * Üzenet renderelése
   */
  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_id === user.id;
    
    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
          marginVertical: 5,
          paddingHorizontal: 10,
        }}
      >
        <View
          style={{
            maxWidth: '70%',
            backgroundColor: isMyMessage ? '#8A2BE2' : '#f0f0f0',
            borderRadius: 15,
            padding: 12,
          }}
        >
          <Text
            style={{
              color: isMyMessage ? 'white' : 'black',
              fontSize: 16,
            }}
          >
            {item.content}
          </Text>
          
          <Text
            style={{
              color: isMyMessage ? 'rgba(255,255,255,0.7)' : '#999',
              fontSize: 11,
              marginTop: 5,
              textAlign: 'right',
            }}
          >
            {new Date(item.created_at).toLocaleTimeString('hu-HU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {isMyMessage && item.is_read && ' ✓✓'}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: 'white' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 15,
          borderBottomWidth: 1,
          borderBottomColor: '#e0e0e0',
          backgroundColor: 'white',
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 24, marginRight: 15 }}>←</Text>
        </TouchableOpacity>
        
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
            {otherUser.first_name}
          </Text>
          {otherUserTyping && (
            <Text style={{ fontSize: 12, color: '#8A2BE2' }}>
              gépel...
            </Text>
          )}
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 10 }}
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.5}
        inverted={false}
      />

      {/* Input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 10,
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          backgroundColor: 'white',
        }}
      >
        <TextInput
          style={{
            flex: 1,
            backgroundColor: '#f0f0f0',
            borderRadius: 20,
            paddingHorizontal: 15,
            paddingVertical: 10,
            marginRight: 10,
            fontSize: 16,
          }}
          placeholder="Írj üzenetet..."
          value={newMessage}
          onChangeText={handleTextChange}
          multiline
          maxLength={500}
        />
        
        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: newMessage.trim() ? '#8A2BE2' : '#ccc',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={{ fontSize: 20 }}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
