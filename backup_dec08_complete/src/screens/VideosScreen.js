import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

/**
 * VideosScreen - Video chat és live stream funkciók
 */
const VideosScreen = ({ navigation }) => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Videók</Text>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity 
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.navigate('VideoChat')}
        >
          <Ionicons name="videocam" size={32} color={theme.colors.primary} />
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Video Chat</Text>
          <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
            Indíts video hívást a matcheiddel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.navigate('LiveStream')}
        >
          <Ionicons name="radio" size={32} color={theme.colors.primary} />
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Live Stream</Text>
          <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
            Nézz élő közvetítéseket vagy indíts sajátot
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.navigate('IncomingCall')}
        >
          <Ionicons name="call" size={32} color={theme.colors.primary} />
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Bejövő hívások</Text>
          <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
            Kezeld a bejövő video hívásokat
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default VideosScreen;
