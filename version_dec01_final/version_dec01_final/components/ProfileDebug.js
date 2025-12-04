import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const ProfileDebug = ({ profile }) => {
  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile Debug: NULL</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile Debug</Text>
      <View style={styles.row}>
        <Text style={styles.label}>ID:</Text>
        <Text style={styles.value}>{JSON.stringify(profile.id)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{JSON.stringify(profile.name)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Age:</Text>
        <Text style={styles.value}>
          {JSON.stringify(profile.age)} (type: {typeof profile.age})
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Gender:</Text>
        <Text style={styles.value}>{JSON.stringify(profile.gender)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Distance:</Text>
        <Text style={styles.value}>{JSON.stringify(profile.distance)}</Text>
      </View>
      <View style={styles.separator} />
      <Text style={styles.subtitle}>Full Object:</Text>
      <Text style={styles.json}>{JSON.stringify(profile, null, 2)}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 15,
    borderRadius: 10,
    maxHeight: 400,
    zIndex: 9999,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    color: '#4CAF50',
    fontWeight: 'bold',
    width: 80,
  },
  value: {
    color: '#fff',
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 10,
  },
  json: {
    color: '#ccc',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});

export default ProfileDebug;
