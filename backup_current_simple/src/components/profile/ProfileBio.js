import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProfileBio = ({ bio, theme }) => {
  if (!bio) return null;

  return (
    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="document-text" size={24} color={theme.colors.primary} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Rólam
        </Text>
      </View>
      <Text style={[styles.bio, { color: theme.colors.textSecondary }]}>
        {bio}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
  },
});

export default ProfileBio;
