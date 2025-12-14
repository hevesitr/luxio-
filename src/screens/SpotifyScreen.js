import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Mock Spotify data
const mockArtists = [
  { id: 1, name: 'Taylor Swift', image: 'https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3132a15fbb0', genres: ['Pop', 'Country'] },
  { id: 2, name: 'The Weeknd', image: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb', genres: ['R&B', 'Pop'] },
  { id: 3, name: 'Dua Lipa', image: 'https://i.scdn.co/image/ab6761610000e5eb8c6b993c05d1b4ef54e8df4b', genres: ['Pop', 'Dance'] },
  { id: 4, name: 'Ed Sheeran', image: 'https://i.scdn.co/image/ab6761610000e5eb9e6902254aa048e60d27b4a0', genres: ['Pop', 'Folk'] },
  { id: 5, name: 'Billie Eilish', image: 'https://i.scdn.co/image/ab6761610000e5eb9e6902254aa048e60d27b4a0', genres: ['Alternative', 'Pop'] },
  { id: 6, name: 'Bruno Mars', image: 'https://i.scdn.co/image/ab6761610000e5eb6d622ea8c858b716f4021964', genres: ['Pop', 'R&B'] },
];

const mockSongs = [
  { id: 1, title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours' },
  { id: 2, title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia' },
  { id: 3, title: 'Good 4 U', artist: 'Olivia Rodrigo', album: 'SOUR' },
  { id: 4, title: 'Stay', artist: 'The Kid Laroi & Justin Bieber', album: 'F*CK LOVE 3: OVER YOU' },
  { id: 5, title: 'Peaches', artist: 'Justin Bieber ft. Daniel Caesar & Giveon', album: 'Justice' },
  { id: 6, title: 'Drivers License', artist: 'Olivia Rodrigo', album: 'SOUR' },
];

const SpotifyScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [selectedArtists, setSelectedArtists] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('artists');

  // Fallback theme protection
  const safeTheme = theme || {
    colors: {
      background: '#0a0a0a',
      surface: '#1a1a1a',
      text: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      primary: '#1DB954',
      border: 'rgba(255, 255, 255, 0.1)',
    }
  };

  const toggleArtist = (artist) => {
    setSelectedArtists(prev =>
      prev.find(a => a.id === artist.id)
        ? prev.filter(a => a.id !== artist.id)
        : [...prev, artist]
    );
  };

  const toggleSong = (song) => {
    setSelectedSongs(prev =>
      prev.find(s => s.id === song.id)
        ? prev.filter(s => s.id !== song.id)
        : [...prev, song]
    );
  };

  const handleSave = async () => {
    try {
      // Here you would save to user's profile
      Alert.alert(
        'Mentve!',
        'A zenei preferenciáid elmentve a profilodba.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Hiba', 'Nem sikerült menteni a zenei preferenciákat.');
    }
  };

  const filteredArtists = mockArtists.filter(artist =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artist.genres.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredSongs = mockSongs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const styles = createStyles(safeTheme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={safeTheme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spotify Zene</Text>
        <TouchableOpacity
          style={[styles.saveButton, (selectedArtists.length > 0 || selectedSongs.length > 0) && styles.saveButtonActive]}
          onPress={handleSave}
          disabled={selectedArtists.length === 0 && selectedSongs.length === 0}
        >
          <Text style={[styles.saveButtonText, (selectedArtists.length > 0 || selectedSongs.length > 0) && styles.saveButtonTextActive]}>
            Mentés
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={safeTheme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Keresés előadókra, dalokra..."
          placeholderTextColor={safeTheme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'artists' && styles.activeTab]}
          onPress={() => setActiveTab('artists')}
        >
          <Text style={[styles.tabText, activeTab === 'artists' && styles.activeTabText]}>
            Előadók
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'songs' && styles.activeTab]}
          onPress={() => setActiveTab('songs')}
        >
          <Text style={[styles.tabText, activeTab === 'songs' && styles.activeTabText]}>
            Dalok
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'artists' ? (
          <View style={styles.grid}>
            {filteredArtists.map((artist) => (
              <TouchableOpacity
                key={artist.id}
                style={[
                  styles.artistCard,
                  selectedArtists.find(a => a.id === artist.id) && styles.artistCardSelected,
                ]}
                onPress={() => toggleArtist(artist)}
              >
                <View style={styles.artistImageContainer}>
                  <Text style={styles.artistImageText}>
                    {artist.name.charAt(0)}
                  </Text>
                  {selectedArtists.find(a => a.id === artist.id) && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                  )}
                </View>
                <Text style={styles.artistName} numberOfLines={1}>
                  {artist.name}
                </Text>
                <Text style={styles.artistGenres} numberOfLines={1}>
                  {artist.genres.join(' • ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.songList}>
            {filteredSongs.map((song) => (
              <TouchableOpacity
                key={song.id}
                style={[
                  styles.songCard,
                  selectedSongs.find(s => s.id === song.id) && styles.songCardSelected,
                ]}
                onPress={() => toggleSong(song)}
              >
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>
                    {song.title}
                  </Text>
                  <Text style={styles.songArtist} numberOfLines={1}>
                    {song.artist} • {song.album}
                  </Text>
                </View>
                {selectedSongs.find(s => s.id === song.id) && (
                  <Ionicons name="checkmark-circle" size={24} color={safeTheme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Info */}
      {(selectedArtists.length > 0 || selectedSongs.length > 0) && (
        <View style={styles.bottomInfo}>
          <Text style={styles.infoText}>
            {selectedArtists.length + selectedSongs.length} kiválasztva
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  saveButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  saveButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 25,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 21,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  artistCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  artistCardSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  artistImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  artistImageText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  checkmark: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  artistGenres: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  songList: {
    paddingBottom: 20,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  songCardSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  bottomInfo: {
    padding: 15,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});

export default SpotifyScreen;
