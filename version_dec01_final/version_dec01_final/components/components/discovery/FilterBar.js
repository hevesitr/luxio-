import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * FilterBar Component
 * 
 * Displays filter buttons for discovery feed:
 * - Verified filter toggle
 * - AI search
 * - Map view
 * - Advanced search
 * - Sugar dating mode (18+)
 */
const FilterBar = ({
  theme,
  showOnlyVerified,
  aiModeEnabled,
  sugarDatingMode,
  onToggleVerified,
  onToggleAI,
  onOpenMap,
  onOpenSearch,
  onToggleSugarDating,
}) => {
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {/* Verified Filter */}
      <TouchableOpacity
        style={[
          styles.verifiedFilterButton,
          showOnlyVerified && styles.verifiedFilterButtonActive,
        ]}
        onPress={onToggleVerified}
      >
        <Ionicons
          name={showOnlyVerified ? 'checkmark-circle' : 'checkmark-circle-outline'}
          size={20}
          color={showOnlyVerified ? theme.colors.primary : theme.colors.text}
        />
        <Text
          style={[
            styles.verifiedFilterText,
            showOnlyVerified && styles.verifiedFilterTextActive,
          ]}
        >
          {showOnlyVerified ? 'Csak verifikált' : 'Összes'}
        </Text>
      </TouchableOpacity>

      {/* AI Search */}
      <TouchableOpacity
        style={[styles.iconButton, aiModeEnabled && styles.aiButtonActive]}
        onPress={onToggleAI}
      >
        <Ionicons
          name={aiModeEnabled ? 'sparkles' : 'sparkles-outline'}
          size={20}
          color={aiModeEnabled ? '#FFD700' : theme.colors.text}
        />
      </TouchableOpacity>

      {/* Map View */}
      <TouchableOpacity style={styles.iconButton} onPress={onOpenMap}>
        <Ionicons name="map-outline" size={20} color={theme.colors.text} />
      </TouchableOpacity>

      {/* Advanced Search */}
      <TouchableOpacity style={styles.iconButton} onPress={onOpenSearch}>
        <Ionicons name="search" size={20} color={theme.colors.text} />
      </TouchableOpacity>

      {/* Sugar Dating Mode (18+) */}
      <TouchableOpacity
        style={[
          styles.iconButton,
          sugarDatingMode && styles.sugarDatingButtonActive,
        ]}
        onPress={onToggleSugarDating}
      >
        <View style={styles.sugarDatingContainer}>
          <View style={styles.ageBadge}>
            <Text style={styles.ageBadgeText}>18+</Text>
          </View>
          <Ionicons
            name={sugarDatingMode ? 'diamond' : 'diamond-outline'}
            size={18}
            color={sugarDatingMode ? '#FFD700' : theme.colors.text}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 12,
      left: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      zIndex: 20,
    },
    verifiedFilterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(20, 20, 20, 0.8)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 5,
    },
    verifiedFilterButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '20',
    },
    verifiedFilterText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '600',
    },
    verifiedFilterTextActive: {
      color: theme.colors.primary,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(20, 20, 20, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 5,
    },
    aiButtonActive: {
      borderColor: '#FFD700',
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
    },
    sugarDatingButtonActive: {
      borderColor: '#FFD700',
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
    },
    sugarDatingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    ageBadge: {
      backgroundColor: '#FF3B75',
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 2,
      minWidth: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ageBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
    },
  });

export default FilterBar;
