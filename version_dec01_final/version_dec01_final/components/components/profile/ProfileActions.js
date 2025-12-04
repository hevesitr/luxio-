import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProfileActions = ({ onSettingsPress, onLogoutPress, theme }) => {
  return (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
        onPress={onSettingsPress}
      >
        <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
        <Text style={[styles.actionText, { color: theme.colors.text }]}>
          Beállítások
        </Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
        onPress={onLogoutPress}
      >
        <Ionicons name="log-out-outline" size={24} color="#F44336" />
        <Text style={[styles.actionText, { color: '#F44336' }]}>
          Kijelentkezés
        </Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 15,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileActions;
