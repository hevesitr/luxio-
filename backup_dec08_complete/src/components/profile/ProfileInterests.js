import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProfileInterests = ({ interests, theme }) => {
  if (!interests || interests.length === 0) return null;

  return (
    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="heart" size={24} color={theme.colors.primary} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Érdeklődési körök
        </Text>
      </View>
      <View style={styles.interestsContainer}>
        {interests.map((interest, index) => (
          <View 
            key={index} 
            style={[
              styles.interestTag,
              { 
                backgroundColor: `${theme.colors.primary}20`,
                borderColor: `${theme.colors.primary}40`
              }
            ]}
          >
            <Text style={[styles.interestText, { color: theme.colors.primary }]}>
              {interest}
            </Text>
          </View>
        ))}
      </View>
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
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProfileInterests;
