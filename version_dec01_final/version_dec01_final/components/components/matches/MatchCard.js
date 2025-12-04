/**
 * Match Card Component
 * Displays a match in the matches list
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

const MatchCard = ({ match, onPress, onUnmatch }) => {
  const formatMatchTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
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
    
    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
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
      <Image
        source={{ uri: match.profile?.photo_url }}
        style={styles.photo}
        resizeMode="cover"
      />
      
      {/* Match info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{match.profile?.name}</Text>
          {match.profile?.is_verified && (
            <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
          )}
        </View>
        
        <Text style={styles.matchTime}>
          Matched {formatMatchTime(match.created_at)}
        </Text>
        
        {match.is_super_like && (
          <View style={styles.superLikeBadge}>
            <Ionicons name="star" size={12} color="#007AFF" />
            <Text style={styles.superLikeText}>Super Liked You</Text>
          </View>
        )}
      </View>
      
      {/* Actions */}
      <TouchableOpacity
        style={styles.messageButton}
        onPress={onPress}
      >
        <Ionicons name="chatbubble" size={20} color="#007AFF" />
      </TouchableOpacity>
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
  photo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginRight: 4,
  },
  matchTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  superLikeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  superLikeText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '600',
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MatchCard;
