import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';

const CHAT_ROOMS = [
  {
    id: '1',
    name: '🔥 Hot Topics',
    description: 'Beszélgess a legforróbb témákról',
    onlineCount: 234,
    lastMessage: 'Szia mindenkinek! 👋',
    unreadCount: 5,
  },
  {
    id: '2',
    name: '💬 Random Chat',
    description: 'Találkozz új emberekkel',
    onlineCount: 156,
    lastMessage: 'Van itt valaki Budapest környékéről?',
    unreadCount: 0,
  },
  {
    id: '3',
    name: '🎮 Gaming',
    description: 'Játékosok találkozóhelye',
    onlineCount: 89,
    lastMessage: 'Ki játszik Valorant-tal?',
    unreadCount: 2,
  },
  {
    id: '4',
    name: '🎵 Music Lovers',
    description: 'Zenei beszélgetések',
    onlineCount: 67,
    lastMessage: 'Melyik a kedvenc zenéd?',
    unreadCount: 0,
  },
  {
    id: '5',
    name: '🌍 Travel',
    description: 'Utazási élmények megosztása',
    onlineCount: 45,
    lastMessage: 'Hol jártál legutóbb?',
    unreadCount: 1,
  },
];

const ChatRoomsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [rooms] = useState(CHAT_ROOMS);

  const handleRoomPress = async (room) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ChatRoom', {
      roomId: room.id,
      roomName: room.name,
    });
  };

  const renderRoom = ({ item }) => (
    <TouchableOpacity
      style={styles.roomContainer}
      onPress={() => handleRoomPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.roomHeader}>
        <Text style={styles.roomName}>{item.name}</Text>
        <View style={styles.onlineContainer}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineCount}>{item.onlineCount}</Text>
        </View>
      </View>
      
      <Text style={styles.roomDescription}>{item.description}</Text>
      
      <View style={styles.roomFooter}>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat Szobák</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Rooms List */}
      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  addButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  roomContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  onlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  onlineCount: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  roomDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  roomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  lastMessage: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
});

export default ChatRoomsScreen;
