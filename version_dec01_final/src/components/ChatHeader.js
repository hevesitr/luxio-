/**
 * Chat Header Component
 * Header for chat screen with profile info
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

const ChatHeader = ({ profile, onBack, isTyping = false }) => {
  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
      >
        <Ionicons name="chevron-back" size={28} color="#007AFF" />
      </TouchableOpacity>
      
      {/* Profile info */}
      <TouchableOpacity style={styles.profileInfo}>
        <Image
          source={{ uri: profile?.photo_url }}
          style={styles.avatar}
        />
        
        <View style={styles.textContainer}>
          <Text style={styles.name}>{profile?.name}</Text>
          {isTyping && (
            <Text style={styles.typing}>typing...</Text>
          )}
        </View>
      </TouchableOpacity>
      
      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="videocam" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
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
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 8,
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
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  typing: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
});

export default ChatHeader;
