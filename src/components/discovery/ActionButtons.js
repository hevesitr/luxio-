import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACTION_BUTTON_SIZE = 52;

/**
 * ActionButtons Component
 * 
 * Displays swipe action buttons:
 * - Undo (rewind)
 * - Dislike (X)
 * - Super Like (star)
 * - Like (heart)
 * - Video profile
 */
const ActionButtons = ({
  theme,
  onUndo,
  onDislike,
  onSuperLike,
  onLike,
  onVideoProfile,
  canUndo = false,
  disabled = false,
  visible = true,
}) => {
  const styles = createStyles(theme);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Undo Button */}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={onUndo}
        disabled={!canUndo || disabled}
      >
        <Ionicons
          name="arrow-undo"
          size={20}
          color={canUndo ? '#FFC107' : 'rgba(255, 255, 255, 0.2)'}
        />
      </TouchableOpacity>

      {/* Dislike Button */}
      <TouchableOpacity
        style={[styles.mainActionButton, styles.dislikeButton]}
        onPress={onDislike}
        disabled={disabled}
      >
        <View style={styles.buttonShadow}>
          <Ionicons name="close" size={24} color="#F44336" />
        </View>
      </TouchableOpacity>

      {/* Super Like Button */}
      <TouchableOpacity
        style={[styles.mainActionButton, styles.superLikeButton]}
        onPress={onSuperLike}
        disabled={disabled}
      >
        <View style={styles.buttonShadow}>
          <Ionicons name="star" size={22} color="#2196F3" />
        </View>
      </TouchableOpacity>

      {/* Like Button */}
      <TouchableOpacity
        style={[styles.mainActionButton, styles.likeButton]}
        onPress={onLike}
        disabled={disabled}
      >
        <View style={styles.buttonShadow}>
          <Ionicons name="heart" size={26} color="#4CAF50" />
        </View>
      </TouchableOpacity>

      {/* Video Profile Button */}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={onVideoProfile}
        disabled={disabled}
      >
        <Ionicons name="videocam" size={20} color="#9C27B0" />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      paddingBottom: 8,
      gap: 14,
      backgroundColor: 'transparent',
    },
    mainActionButton: {
      width: ACTION_BUTTON_SIZE,
      height: ACTION_BUTTON_SIZE,
      borderRadius: ACTION_BUTTON_SIZE / 2,
      backgroundColor: 'rgba(20, 20, 20, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 5,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    buttonShadow: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    dislikeButton: {
      borderColor: 'rgba(244, 67, 54, 0.4)',
    },
    likeButton: {
      borderColor: 'rgba(76, 175, 80, 0.4)',
    },
    superLikeButton: {
      borderColor: 'rgba(33, 150, 243, 0.4)',
    },
    secondaryButton: {
      width: ACTION_BUTTON_SIZE,
      height: ACTION_BUTTON_SIZE,
      borderRadius: ACTION_BUTTON_SIZE / 2,
      backgroundColor: 'rgba(20, 20, 20, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 5,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
  });

export default ActionButtons;
