import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChatHeader = ({ match, onBack, onVideoCall, onVoiceCall, onMoreOptions, theme }) => {
  return (
    <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.profileInfo} onPress={onMoreOptions}>
        <Image
          source={{ uri: match.photo }}
          style={styles.avatar}
        />
        <View style={styles.nameContainer}>
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {match.name}
          </Text>
          <View style={styles.statusContainer}>
            <View style={[styles.onlineIndicator, { backgroundColor: '#4CAF50' }]} />
            <Text style={[styles.status, { color: theme.colors.textSecondary }]}>
              Online
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onVoiceCall} style={styles.actionButton}>
          <Ionicons name="call" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onVideoCall} style={styles.actionButton}>
          <Ionicons name="videocam" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onMoreOptions} style={styles.actionButton}>
          <Ionicons name="ellipsis-vertical" size={22} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  status: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
});

export default ChatHeader;
