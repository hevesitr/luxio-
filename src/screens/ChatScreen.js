import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import IceBreakerSuggestions from '../components/IceBreakerSuggestions';
import IceBreakerService from '../services/IceBreakerService';
import VoiceMessage from '../components/VoiceMessage';
import VoiceRecorder from '../components/VoiceRecorder';
import VideoMessage from '../components/VideoMessage';
import VideoRecorder from '../components/VideoRecorder';
import AnalyticsService from '../services/AnalyticsService';
import GamificationService from '../services/GamificationService';
import MessageService from '../services/MessageService';
import MessagingService from '../services/MessagingService';
import Logger from '../services/Logger';
import { useTheme } from '../context/ThemeContext';
import { currentUser } from '../data/userProfile';

// ✅ PERFORMANCE: Memoizált MessageItem komponens
const MessageItem = memo(({ item, match, theme, formatTime }) => (
  <View
    style={[
      styles.messageContainer,
      item.sender === 'me' ? styles.myMessage : styles.theirMessage,
    ]}
  >
    {item.sender === 'them' && (
      <Image source={{ uri: match.photo }} style={styles.avatar} />
    )}
    {item.type === 'voice' ? (
      <View style={styles.voiceMessageContainer}>
        <VoiceMessage
          duration={item.duration}
          isOwn={item.sender === 'me'}
        />
        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.timestamp,
              item.sender === 'me' ? styles.myTimestamp : styles.theirTimestamp,
            ]}
          >
            {formatTime(item.timestamp)}
          </Text>
          {item.sender === 'me' && item.readStatus && (
            <Ionicons
              name={
                item.readStatus === 'read'
                  ? 'checkmark-done'
                  : item.readStatus === 'delivered'
                  ? 'checkmark-done-outline'
                  : 'checkmark-outline'
              }
              size={14}
              color={
                item.readStatus === 'read'
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
              style={styles.readIcon}
            />
          )}
        </View>
      </View>
    ) : item.type === 'video' ? (
      <View style={styles.videoMessageContainer}>
        <VideoMessage
          videoUri={item.videoUri}
          thumbnailUri={item.thumbnailUri}
          duration={item.duration}
          isOwn={item.sender === 'me'}
        />
        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.timestamp,
              item.sender === 'me' ? styles.myTimestamp : styles.theirTimestamp,
            ]}
          >
            {formatTime(item.timestamp)}
          </Text>
          {item.sender === 'me' && item.readStatus && (
            <Ionicons
              name={
                item.readStatus === 'read'
                  ? 'checkmark-done'
                  : item.readStatus === 'delivered'
                  ? 'checkmark-done-outline'
                  : 'checkmark-outline'
              }
              size={14}
              color={
                item.readStatus === 'read'
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
              style={styles.readIcon}
            />
          )}
        </View>
      </View>
    ) : (
      <View style={[styles.messageBubble, item.sender === 'me' ? styles.myBubble : styles.theirBubble]}>
        <Text style={[styles.messageText, item.sender === 'me' ? styles.myMessageText : styles.theirMessageText]}>
          {item.text}
        </Text>
        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.timestamp,
              item.sender === 'me' ? styles.myTimestamp : styles.theirTimestamp,
            ]}
          >
            {formatTime(item.timestamp)}
          </Text>
          {item.sender === 'me' && item.readStatus && (
            <Ionicons
              name={
                item.readStatus === 'read'
                  ? 'checkmark-done'
                  : item.readStatus === 'delivered'
                  ? 'checkmark-done-outline'
                  : 'checkmark-outline'
              }
              size={14}
              color={
                item.readStatus === 'read'
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
              style={styles.readIcon}
            />
          )}
        </View>
      </View>
    )}
  </View>
));

const ChatScreen = ({ match, onClose, onUpdateLastMessage }) => {
  const { theme } = useTheme();
  
  // Fallback theme protection
  const safeTheme = theme || {
    colors: {
      background: '#0a0a0a',
      surface: '#1a1a1a',
      text: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      primary: '#FF3B75',
      border: 'rgba(255, 255, 255, 0.1)',
    }
  };
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `Szia! Örülök, hogy match-eltünk! 😊`,
      sender: 'them',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      readStatus: 'read', // 'sent', 'delivered', 'read'
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [iceBreakers, setIceBreakers] = useState([]);
  const [showIceBreakers, setShowIceBreakers] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  useEffect(() => {
    // Generálj ice breaker kérdéseket
    const generatedIceBreakers = IceBreakerService.generateIceBreakers(
      currentUser.interests,
      match.interests || []
    );
    setIceBreakers(generatedIceBreakers);
  }, []);

  // Üzenetek betöltése és real-time figyelés
  useEffect(() => {
    if (!match?.matchId) {
      Logger.warn('No matchId available for loading messages');
      return;
    }

    const messagingService = new MessagingService();

    // Üzenetek betöltése
    const loadMessages = async () => {
      try {
        const messages = await messagingService.loadMessages(match.matchId);
        if (messages && messages.length > 0) {
          const formattedMessages = messages.map(msg => ({
            id: msg.id,
            text: msg.content,
            sender: msg.sender_id === currentUser.id ? 'me' : 'them',
            timestamp: new Date(msg.created_at),
            readStatus: msg.status === 'read' ? 'read' : msg.status === 'delivered' ? 'delivered' : 'sent',
            type: msg.type || 'text',
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        Logger.error('Load messages error', error);
      }
    };

    loadMessages();

    // Real-time üzenetek figyelése
    messagingService.subscribeToMessages(match.matchId, (newMessage) => {
      // Csak akkor adjuk hozzá, ha nem mi küldtük
      if (newMessage.sender_id !== currentUser.id) {
        const formattedMessage = {
          id: newMessage.id,
          text: newMessage.content,
          sender: 'them',
          timestamp: new Date(newMessage.created_at),
          readStatus: newMessage.status === 'read' ? 'read' : 'delivered',
          type: newMessage.type || 'text',
        };
        setMessages(prev => [...prev, formattedMessage]);
      }
    });

    // Typing indikátor figyelése
    messagingService.subscribeToTyping(match.matchId, (typingUsers) => {
      setIsTyping(typingUsers.length > 0);
    });

    // Cleanup
    return () => {
      messagingService.unsubscribeFromMessages(match.matchId);
      messagingService.unsubscribeFromTyping(match.matchId);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [match?.matchId]);

  const sendMessage = async (text = null) => {
    const messageText = text || inputText.trim();
    if (messageText && typeof messageText === 'string' && messageText.length > 0) {
      setInputText('');
      setShowIceBreakers(false);

      // Üzenet küldése az új MessagingService-szel
      try {
        if (match?.matchId) {
          const messagingService = new MessagingService();
          const result = await messagingService.sendMessage(
            match.matchId,
            currentUser.id,
            match.id, // receiverId
            {
              content: messageText,
              type: 'text'
            }
          );
          
          if (!result.success) {
            Logger.warn('Message send failed, keeping local message', result.error);
          }
        } else {
          Logger.warn('No matchId available, message only stored locally');
        }
      } catch (error) {
        Logger.error('Send message error', error);
      }

      if (onUpdateLastMessage) {
        onUpdateLastMessage({
          text: messageText,
          sender: 'me',
          type: 'text',
          timestamp: tempMessage.timestamp.toISOString(),
        });
      }
      
      // Track text message
      AnalyticsService.trackEvent('text_message');
      
      // Gamifikáció: üzenet növelése
      GamificationService.incrementMessage();

      // Szimulált válasz typing indicator-ral
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const responses = [
          'Érdekes! 😊',
          'Haha, ez jó! 😄',
          'Mesélj még!',
          'Szuper! ❤️',
          'Egyetértek! 👍',
          'Nagyon klassz! 🎉',
          'Én is így gondolom! 💯',
          'Tényleg? 😮',
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const responseMessage = {
          id: Date.now() + Math.random(),
          text: String(randomResponse),
          sender: 'them',
          timestamp: new Date(),
          readStatus: 'read',
        };
        setMessages((prev) => [
          ...prev,
          responseMessage,
        ]);

        if (onUpdateLastMessage) {
          onUpdateLastMessage({
            text: randomResponse,
            sender: 'them',
            type: 'text',
            timestamp: responseMessage.timestamp.toISOString(),
          });
        }
        
        // Szimuláljuk, hogy a saját üzeneteink "kiszállítva" és "olvasott" státuszba kerülnek
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.sender === 'me' && msg.readStatus === 'sent'
                ? { ...msg, readStatus: 'delivered' }
                : msg
            )
          );
        }, 500);
        
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.sender === 'me' && msg.readStatus === 'delivered'
                ? { ...msg, readStatus: 'read' }
                : msg
            )
          );
        }, 1500);
      }, 1000 + Math.random() * 2000);
    }
  };

  const handleInputChange = async (text) => {
    setInputText(text);

    // Typing indikátor kezelése
    if (match?.matchId) {
      const messagingService = new MessagingService();

      // Előző timeout törlése
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Typing állapot beállítása
      await messagingService.setTypingStatus(match.matchId, currentUser.id, text.length > 0);

      // Új timeout beállítása - 3 másodperc után állítsa le a typing-et
      if (text.length > 0) {
        const timeout = setTimeout(async () => {
          await messagingService.setTypingStatus(match.matchId, currentUser.id, false);
        }, 3000);
        setTypingTimeout(timeout);
      }
    }
  };

  const handleSelectIceBreaker = (question) => {
    sendMessage(question);
  };

  const handleSendVoiceMessage = (voiceData) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      type: 'voice',
      duration: voiceData.duration,
      sender: 'me',
      timestamp: new Date(),
      readStatus: 'sent',
    };
    setMessages([...messages, newMessage]);
    setShowIceBreakers(false);
    setIsRecording(false);

    if (onUpdateLastMessage) {
      onUpdateLastMessage({
        text: '🎙️ Hangüzenet',
        sender: 'me',
        type: 'voice',
        timestamp: newMessage.timestamp.toISOString(),
      });
    }
    
    // Track voice message
    AnalyticsService.trackEvent('voice_message');
  };

  const handleSendVideoMessage = (videoData) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      type: 'video',
      videoUri: videoData.uri,
      thumbnailUri: videoData.thumbnailUri,
      duration: videoData.duration,
      sender: 'me',
      timestamp: new Date(),
      readStatus: 'sent',
    };
    setMessages([...messages, newMessage]);
    setShowIceBreakers(false);
    setIsRecordingVideo(false);

    if (onUpdateLastMessage) {
      onUpdateLastMessage({
        text: '🎥 Videóüzenet',
        sender: 'me',
        type: 'video',
        timestamp: newMessage.timestamp.toISOString(),
      });
    }
    
    // Track video message
    AnalyticsService.trackEvent('video_message');
  };

  const formatTime = (date) => {
    if (!date || !(date instanceof Date)) {
      return '';
    }
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // ✅ PERFORMANCE: Memoizált renderMessage callback
  const renderMessage = useCallback(({ item }) => (
    <MessageItem
      item={item}
      match={match}
      theme={theme}
      formatTime={formatTime}
    />
  ), [match, theme, formatTime]);

  const styles = createStyles(safeTheme);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Image source={{ uri: match.photo }} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{match.name}</Text>
          <Text style={styles.headerStatus}>Online</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {showIceBreakers && messages.length <= 1 && (
        <IceBreakerSuggestions
          iceBreakers={iceBreakers}
          onSelectQuestion={handleSelectIceBreaker}
        />
      )}

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={useCallback((item, index) =>
          item && item.id ? String(item.id) : `message-${index}`, [])}
        contentContainerStyle={styles.messagesContainer}
        inverted={false}
        // ✅ PERFORMANCE: Optimalizált FlatList paraméterek
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        getItemLayout={useCallback((data, index) => ({
          length: 80, // Átlagos üzenet magasság
          offset: 80 * index,
          index,
        }), [])}
        ListFooterComponent={
          isTyping ? (
            <View style={[styles.messageContainer, styles.theirMessage]}>
              <Image source={{ uri: match.photo }} style={styles.avatar} />
              <View style={[styles.messageBubble, styles.theirBubble]}>
                <View style={styles.typingIndicator}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
            </View>
          ) : null
        }
      />

      <View style={styles.inputContainer}>
        {isRecording ? (
          <VoiceRecorder
            onSend={handleSendVoiceMessage}
            onCancel={() => setIsRecording(false)}
          />
        ) : isRecordingVideo ? (
          <VideoRecorder
            onSend={handleSendVideoMessage}
            onCancel={() => setIsRecordingVideo(false)}
          />
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Írj üzenetet..."
              value={inputText}
              onChangeText={handleInputChange}
              multiline
            />
            {inputText.trim() ? (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => {
                  if (inputText.trim()) {
                    sendMessage();
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="send" size={24} color="#FF3B75" />
              </TouchableOpacity>
            ) : (
              <View style={styles.mediaButtons}>
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={() => setIsRecording(true)}
                >
                  <Ionicons name="mic" size={24} color="#FF3B75" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={() => setIsRecordingVideo(true)}
                >
                  <Ionicons name="videocam" size={24} color="#FF3B75" />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'transparent',
    paddingTop: 50,
  },
  backButton: {
    marginRight: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerStatus: {
    fontSize: 12,
    color: '#4CAF50',
  },
  moreButton: {
    padding: 5,
  },
  messagesContainer: {
    padding: 15,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  theirMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 20,
  },
  myBubble: {
    backgroundColor: '#FF3B75',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  theirBubble: {
    backgroundColor: theme.colors.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: theme.colors.text,
  },
  theirMessageText: {
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
    fontSize: 11,
  },
  theirTimestamp: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
  },
  readIcon: {
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  typingDot1: {
    animation: 'bounce 1.4s infinite ease-in-out both',
  },
  typingDot2: {
    animation: 'bounce 1.4s infinite ease-in-out both 0.2s',
  },
  typingDot3: {
    animation: 'bounce 1.4s infinite ease-in-out both 0.4s',
  },
  voiceMessageContainer: {
    maxWidth: '70%',
  },
  videoMessageContainer: {
    maxWidth: '70%',
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  mediaButton: {
    padding: 10,
  },
});

export default ChatScreen;

