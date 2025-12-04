import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';

const FilterPanel = ({
  theme,
  showOnlyVerified,
  aiModeEnabled,
  sugarDatingMode,
  isBoostActive,
  gpsEnabled,
  onToggleVerified,
  onToggleGPS,
  onToggleAI,
  onOpenMap,
  onOpenSearch,
  onToggleSugarDating,
  onBoost,
}) => {
  return (
    <View style={styles.container}>
      {/* Navigation */}
      <TouchableOpacity style={styles.iconButton}>
        <Ionicons name="navigate" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Verified Filter */}
      <TouchableOpacity 
        style={[styles.iconButton, showOnlyVerified && styles.activeButton]}
        onPress={onToggleVerified}
      >
        <Ionicons name="checkmark-circle" size={24} color={showOnlyVerified ? COLORS.PRIMARY_PINK : '#fff'} />
      </TouchableOpacity>

      {/* AI Mode */}
      <TouchableOpacity 
        style={[styles.iconButton, aiModeEnabled && styles.activeButton]}
        onPress={onToggleAI}
      >
        <Ionicons name="sparkles" size={24} color={aiModeEnabled ? '#FFD700' : '#fff'} />
      </TouchableOpacity>

      {/* Map */}
      <TouchableOpacity style={styles.iconButton} onPress={onOpenMap}>
        <Ionicons name="map" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Search */}
      <TouchableOpacity style={styles.iconButton} onPress={onOpenSearch}>
        <Ionicons name="search" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Premium/Diamond */}
      <TouchableOpacity style={styles.iconButton}>
        <Ionicons name="diamond" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Boost */}
      <TouchableOpacity 
        style={[styles.iconButton, isBoostActive && styles.activeButton]}
        onPress={onBoost}
      >
        <Ionicons name="flash" size={24} color={isBoostActive ? '#FFD700' : '#fff'} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
    paddingHorizontal: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  activeButton: {
    backgroundColor: 'rgba(255, 105, 180, 0.3)',
    borderColor: COLORS.PRIMARY_PINK,
  },
});

export default FilterPanel;
