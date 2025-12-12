import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../constants/Colors';
import { currentUser } from '../data/userProfile';
// Haptics disabled

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LiveStreamScreen = ({ route, navigation }) => {
  const { isHost = false, hostName = 'Host' } = route.params || {};
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [viewerCount, setViewerCount] = useState(Math.floor(Math.random() * 50) + 10);
  const [likes, setLikes] = useState(0);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  
  const flatListRef = useRef(null);
  const heartAnim = useRef(new Animated.Value(0)).current;

  // Simulate viewer count changes
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(1, prev + change);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async () => {
    if (inputText.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        user: currentUser.name,
        text: inputText.trim(),
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      // try {
      //   await Haptics.impactAsync('light');
      // } catch (error) {
      //   // Haptics might not be available, ignore error
      // } // DISABLED
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleLike = async () => {
    setLikes(prev => prev + 1);
    setShowHeartAnimation(true);
    // try {
    //   await Haptics.impactAsync('medium');
    // } catch (error) {
    //   // Haptics might not be available, ignore error
    // } // DISABLED
    
    // Animate heart
    heartAnim.setValue(0);
    Animated.sequence([
      Animated.timing(heartAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(heartAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowHeartAnimation(false);
    });
  };

  const handleEndStream = () => {
    navigation.goBack();
  };

  const renderMessage = ({ item }) => (
    <View style={styles.messageContainer}>
      <Text style={styles.messageUser}>{item.user}: </Text>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  const heartScale = heartAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1.2, 0],
  });

  const heartOpacity = heartAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });

  return (
    <View style={styles.container}>
      {/* Video Stream Area (Placeholder) */}
      <View style={styles.videoContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.videoPlaceholder}
        >
          <Ionicons name="videocam" size={80} color="rgba(255,255,255,0.3)" />
          <Text style={styles.videoPlaceholderText}>
            {isHost ? 'Közvetítés folyamatban...' : `${hostName} közvetítése`}
          </Text>
        </LinearGradient>

        {/* Top Bar */}
        <SafeAreaView style={styles.topBar}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          
          <View style={styles.viewerCount}>
            <Ionicons name="eye" size={16} color="#fff" />
            <Text style={styles.viewerCountText}>{viewerCount}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Like Button */}
        <TouchableOpacity
          style={styles.likeButton}
          onPress={handleLike}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={32} color="#fff" />
          <Text style={styles.likeCount}>{likes}</Text>
        </TouchableOpacity>

        {/* Heart Animation */}
        {showHeartAnimation && (
          <Animated.View
            style={[
              styles.heartAnimation,
              {
                opacity: heartOpacity,
                transform: [{ scale: heartScale }],
              },
            ]}
          >
            <Ionicons name="heart" size={100} color="#FF3B75" />
          </Animated.View>
        )}
      </View>

      {/* Chat Area */}
      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Írj egy üzenetet..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={inputText}
            onChangeText={setInputText}
            maxLength={200}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() ? '#fff' : 'rgba(255,255,255,0.3)'} 
            />
          </TouchableOpacity>
        </View>

        {/* End Stream Button (Host only) */}
        {isHost && (
          <TouchableOpacity
            style={styles.endStreamButton}
            onPress={handleEndStream}
          >
            <Text style={styles.endStreamText}>Közvetítés befejezése</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  viewerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  viewerCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeButton: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  heartAnimation: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
  },
  chatContainer: {
    height: 250,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  messageUser: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  messageText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#fff',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endStreamButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FF3B75',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  endStreamText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default LiveStreamScreen;
