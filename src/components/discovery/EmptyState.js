import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * EmptyState Component
 * 
 * Displays when no profiles are available
 * Shows message and action button to reset or adjust filters
 */
const EmptyState = ({ theme, onReset }) => {
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Ionicons
        name="heart-dislike"
        size={80}
        color="rgba(255, 255, 255, 0.3)"
      />
      <Text style={styles.title}>Nincs több profil</Text>
      <Text style={styles.subtitle}>
        Elfogytak a profilok ezen a környéken.{'\n'}
        Próbáld újra később vagy módosítsd a szűrőket!
      </Text>
      {onReset && (
        <TouchableOpacity style={styles.button} onPress={onReset}>
          <Text style={styles.buttonText}>Újrakezdés</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
      marginTop: 20,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 30,
    },
    button: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 30,
      paddingVertical: 14,
      borderRadius: 25,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default EmptyState;
