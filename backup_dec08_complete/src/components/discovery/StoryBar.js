import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StoryCircle from '../StoryCircle';

/**
 * StoryBar Component
 * 
 * Displays user stories at the top of discovery feed
 * - Own story creation button
 * - Other users' stories
 * - Toggle visibility
 * - Empty state with CTA
 */
const StoryBar = ({
  theme,
  stories = [],
  currentUser,
  visible = true,
  onToggleVisibility,
  onStoryPress,
  onCreateStory,
}) => {
  const styles = createStyles(theme);

  // Empty state
  if (stories.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyTextContainer}>
          <Text style={styles.emptyTitle}>Oszd meg a napodat</Text>
          <Text style={styles.emptySubtitle}>
            A story-k akár 3x több match-et hoznak. Mutasd meg, merre jársz!
          </Text>
        </View>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={onCreateStory}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#000" />
          <Text style={styles.emptyButtonText}>Story feltöltése</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Toggle button when hidden
  if (!visible) {
    return (
      <TouchableOpacity
        style={styles.toggleButtonHidden}
        onPress={onToggleVisibility}
      >
        <Ionicons name="chevron-down" size={24} color={theme.colors.text} />
      </TouchableOpacity>
    );
  }

  // Story bar with stories
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.toggleButton} onPress={onToggleVisibility}>
        <Ionicons name="chevron-up" size={24} color={theme.colors.text} />
      </TouchableOpacity>

      {/* Own Story */}
      <StoryCircle
        key="own-story"
        user={{
          photo: currentUser?.location
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop'
            : '',
        }}
        isOwnStory={true}
        onPress={onCreateStory}
      />

      {/* Other Stories */}
      {stories.map((story, index) => (
        <StoryCircle
          key={`story-${story.id}-${index}`}
          user={story}
          isViewed={false}
          onPress={() => onStoryPress(index)}
        />
      ))}
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingVertical: 8,
      paddingTop: 50,
      backgroundColor: 'transparent',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 80,
      zIndex: 10,
    },
    toggleButton: {
      position: 'absolute',
      top: 52,
      right: 16,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(20, 20, 20, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 5,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    toggleButtonHidden: {
      position: 'absolute',
      top: 52,
      right: 16,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(20, 20, 20, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 5,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    emptyCard: {
      marginTop: 120,
      marginHorizontal: 16,
      padding: 18,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
    },
    emptyTextContainer: {
      flex: 1,
      gap: 6,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#fff',
    },
    emptySubtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      lineHeight: 20,
    },
    emptyButton: {
      backgroundColor: '#fff',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    emptyButtonText: {
      color: '#000',
      fontSize: 13,
      fontWeight: '700',
    },
  });

export default StoryBar;
