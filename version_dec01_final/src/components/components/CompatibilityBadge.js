import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * CompatibilityBadge - Kompatibilitási badge komponens
 * 
 * @param {Object} compatibility - Kompatibilitási adatok
 * @param {string} size - Méret: 'normal' vagy 'small'
 */
const CompatibilityBadge = ({ compatibility, size = 'normal' }) => {
  if (!compatibility || typeof compatibility.score !== 'number') {
    return null;
  }

  const getColorAndLevel = (score) => {
    if (score >= 80) {
      return {
        colors: ['#4CAF50', '#66BB6A'],
        level: 'KIVÁLÓ',
        textColor: '#fff',
      };
    } else if (score >= 60) {
      return {
        colors: ['#8BC34A', '#9CCC65'],
        level: 'JÓ',
        textColor: '#fff',
      };
    } else if (score >= 40) {
      return {
        colors: ['#FFC107', '#FFD54F'],
        level: 'KÖZEPES',
        textColor: '#000',
      };
    } else {
      return {
        colors: ['#FF5722', '#FF7043'],
        level: 'ALACSONY',
        textColor: '#fff',
      };
    }
  };

  const { colors, level, textColor } = getColorAndLevel(compatibility.score);
  const isSmall = size === 'small';

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        isSmall ? styles.containerSmall : styles.containerNormal,
      ]}
    >
      <Text style={[
        styles.score,
        isSmall ? styles.scoreSmall : styles.scoreNormal,
        { color: textColor },
      ]}>
        {Math.round(compatibility.score)}%
      </Text>
      {!isSmall && (
        <Text style={[styles.level, { color: textColor }]}>
          {level}
        </Text>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  containerNormal: {
    minWidth: 80,
  },
  containerSmall: {
    minWidth: 50,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  score: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scoreNormal: {
    fontSize: 20,
  },
  scoreSmall: {
    fontSize: 14,
  },
  level: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 1,
  },
});

export default CompatibilityBadge;
