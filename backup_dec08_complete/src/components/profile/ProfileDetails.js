import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProfileDetails = ({ userProfile, theme }) => {
  const details = [
    { 
      icon: 'resize', 
      label: 'Magasság', 
      value: userProfile.height ? `${userProfile.height} cm` : null 
    },
    { 
      icon: 'star', 
      label: 'Csillagjegy', 
      value: userProfile.zodiacSign 
    },
    { 
      icon: 'bulb', 
      label: 'MBTI', 
      value: userProfile.mbti 
    },
    { 
      icon: 'heart-circle', 
      label: 'Kapcsolat célja', 
      value: userProfile.relationshipGoal === 'serious' 
        ? 'Komoly kapcsolat' 
        : userProfile.relationshipGoal === 'casual' 
        ? 'Laza kapcsolat' 
        : userProfile.relationshipGoal === 'friendship'
        ? 'Barátság'
        : null
    },
  ].filter(detail => detail.value);

  if (details.length === 0) return null;

  return (
    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Részletek
        </Text>
      </View>
      {details.map((detail, index) => (
        <View key={index} style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name={detail.icon} size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.detailContent}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
              {detail.label}
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {detail.value}
            </Text>
          </View>
        </View>
      ))}
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    gap: 15,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 59, 117, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileDetails;
