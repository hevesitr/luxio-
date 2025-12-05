import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileCard from './src/components/discovery/ProfileCard';
import SwipeButtons from './src/components/discovery/SwipeButtons';
import FilterPanel from './src/components/FilterPanel';

const Tab = createBottomTabNavigator();

// Bővített mock profil adatok valódi képekkel és kompatibilitás algoritmussal
const mockProfiles = [
  {
    id: 1,
    name: 'Anna',
    age: 25,
    city: 'Budapest',
    latitude: 47.4979,
    longitude: 19.0402,
    bio: 'Szeretem a jó zenét és a kalandokat! 🎵✈️',
    interests: ['zene', 'utazás', 'koncertek', 'kávézók', 'olvasás'],
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 órája aktív
    photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop'
    ],
    verified: true
  },
  {
    id: 2,
    name: 'Béla',
    age: 28,
    city: 'Debrecen',
    latitude: 47.5316,
    longitude: 21.6273,
    bio: 'Sportos vagyok, szeretek futni és kirándulni 🏃‍♂️⛰️',
    interests: ['futás', 'kirándulás', 'séta', 'egészséges életmód', 'sport'],
    lastActive: new Date(Date.now() - 30 * 60 * 1000), // 30 perce aktív
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=600&h=800&fit=crop'
    ],
    verified: false
  },
  {
    id: 3,
    name: 'Csilla',
    age: 24,
    city: 'Szeged',
    latitude: 46.2530,
    longitude: 20.1414,
    bio: 'Művészlélek, festészet és jóga a szenvedélyem 🎨🧘‍♀️',
    interests: ['festészet', 'jóga', 'művészet', 'zene', 'olvasás', 'kávézók'],
    lastActive: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 órája aktív
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop'
    ],
    verified: true
  },
  {
    id: 4,
    name: 'Dániel',
    age: 30,
    city: 'Pécs',
    latitude: 46.0727,
    longitude: 18.2323,
    bio: 'Szeretek főzni, olvasni és jó beszélgetéseket folytatni 👨‍🍳📚',
    interests: ['főzés', 'olvasás', 'beszélgetések', 'kávé', 'utazás'],
    lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 órája aktív
    photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop'
    ],
    verified: true
  },
  {
    id: 5,
    name: 'Erika',
    age: 26,
    city: 'Győr',
    latitude: 47.6875,
    longitude: 17.6504,
    bio: 'Fotós vagyok, szeretem a természetet és az állatokat 📸🌿🐾',
    interests: ['fotózás', 'természet', 'állatok', 'kirándulás', 'zene'],
    lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 órája aktív
    photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop'
    ],
    verified: false
  },
  {
    id: 6,
    name: 'Ferenc',
    age: 32,
    city: 'Miskolc',
    latitude: 48.1035,
    longitude: 20.7784,
    bio: 'Zenész vagyok, szeretek koncertekre járni és új bandákat felfedezni 🎸🎶',
    interests: ['zene', 'koncertek', 'gitár', 'ének', 'fesztiválok'],
    lastActive: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 órája aktív
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop'
    ],
    verified: true
  },
  {
    id: 4,
    name: 'Dániel',
    age: 27,
    city: 'Pécs',
    latitude: 46.0727,
    longitude: 18.2323,
    bio: 'Szeretek főzni, olvasni és jó beszélgetéseket folytatni 👨‍🍳📚',
    interests: ['főzés', 'olvasás', 'beszélgetések', 'kávé', 'utazás'],
    lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 órája aktív
    photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop'
    ],
    verified: true
  },
  {
    id: 5,
    name: 'Erika',
    age: 26,
    city: 'Győr',
    latitude: 47.6875,
    longitude: 17.6504,
    bio: 'Fotós vagyok, szeretem a természetet és az állatokat 📸🌿🐾',
    interests: ['fotózás', 'természet', 'állatok', 'kirándulás', 'zene'],
    lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 órája aktív
    photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop'
    ],
    verified: false
  },
  {
    id: 6,
    name: 'Ferenc',
    age: 32,
    city: 'Miskolc',
    latitude: 48.1035,
    longitude: 20.7784,
    bio: 'Zenész vagyok, szeretek koncertekre járni és új bandákat felfedezni 🎸🎶',
    interests: ['zene', 'koncertek', 'gitár', 'ének', 'fesztiválok'],
    lastActive: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 órája aktív
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop'
    ],
    verified: true
  }
];

// Aktuális felhasználó profil (a kompatibilitás számítás alapja)
const currentUserProfile = {
  id: 0,
  name: 'Teszt Felhasználó',
  age: 27,
  city: 'Budapest',
  latitude: 47.4979,
  longitude: 19.0402,
  interests: ['zene', 'olvasás', 'sport', 'utazás', 'kávézók', 'művészet'],
  lastActive: new Date(),
  photos: 5,
  verified: true
};

// Kompatibilitás algoritmus implementáció
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Föld sugara km-ben
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const calculateSharedInterestsScore = (interests1, interests2) => {
  if (!interests1 || !interests2 || interests1.length === 0 || interests2.length === 0) {
    return 0;
  }

  const set1 = new Set(interests1);
  const set2 = new Set(interests2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return union.size === 0 ? 0 : (intersection.size / union.size) * 100;
};

const calculateLocationProximityScore = (profile1, profile2, maxDistance = 100) => {
  if (!profile1.latitude || !profile1.longitude || !profile2.latitude || !profile2.longitude) {
    return 50; // Közepes pontszám hiányzó koordináták esetén
  }

  const distance = calculateDistance(profile1.latitude, profile1.longitude, profile2.latitude, profile2.longitude);
  const score = Math.max(0, 100 - (distance / maxDistance) * 100);
  return Math.round(score);
};

const calculateActivityPatternsScore = (lastActive) => {
  if (!lastActive) return 50;

  const now = new Date();
  const diffHours = (now - lastActive) / (1000 * 60 * 60);

  if (diffHours < 1) return 100; // 1 órán belül aktív
  if (diffHours < 6) return 90;  // 6 órán belül aktív
  if (diffHours < 24) return 70; // 24 órán belül aktív
  if (diffHours < 72) return 50; // 3 napon belül aktív
  return 30; // Régebben aktív
};

const calculateCompatibility = (profile1, profile2) => {
  if (!profile1 || !profile2) return 0;

  // Megosztott érdeklődések (40% súly)
  const sharedInterestsScore = calculateSharedInterestsScore(profile1.interests, profile2.interests);

  // Helyközeliség (30% súly)
  const locationScore = calculateLocationProximityScore(profile1, profile2);

  // Aktivitási minták (30% súly)
  const activityScore = calculateActivityPatternsScore(profile2.lastActive);

  // Teljes kompatibilitási pontszám
  const totalScore = (sharedInterestsScore * 0.4) + (locationScore * 0.3) + (activityScore * 0.3);

  return Math.round(totalScore);
};

// Szűrés és rendezés
const filterAndSortProfiles = (profiles, filters = {}) => {
  let filtered = [...profiles];

  // Kor szűrés
  if (filters.ageMin || filters.ageMax) {
    filtered = filtered.filter(profile => {
      const age = profile.age;
      const minAge = filters.ageMin || 18;
      const maxAge = filters.ageMax || 99;
      return age >= minAge && age <= maxAge;
    });
  }

  // Távolság szűrés
  if (filters.distance && currentUserProfile.latitude && currentUserProfile.longitude) {
    filtered = filtered.filter(profile => {
      if (!profile.latitude || !profile.longitude) return false;
      const distance = calculateDistance(
        currentUserProfile.latitude, currentUserProfile.longitude,
        profile.latitude, profile.longitude
      );
      return distance <= filters.distance;
    });
  }

  // Ellenőrzött profilok szűrése
  if (filters.verifiedOnly) {
    filtered = filtered.filter(profile => profile.verified);
  }

  // Kompatibilitás szerinti rendezés
  filtered.sort((a, b) => {
    const scoreA = calculateCompatibility(currentUserProfile, a);
    const scoreB = calculateCompatibility(currentUserProfile, b);
    return scoreB - scoreA; // Csökkenő sorrend
  });

  return filtered;
};

const mockMatches = [
  { id: 1, name: 'Dóra', age: 26, city: 'Pécs', matchedAt: '2025-01-15', compatibility: 85 },
  { id: 2, name: 'Elek', age: 30, city: 'Győr', matchedAt: '2025-01-14', compatibility: 72 }
];

// Discovery képernyő fejlett szűrőkkel és kompatibilitással
function HomeScreen() {
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [likedProfiles, setLikedProfiles] = useState([]);
  const [filters, setFilters] = useState({
    ageMin: 18,
    ageMax: 35,
    distance: 50,
    verifiedOnly: false
  });
  const [showFilters, setShowFilters] = useState(false);

  // Szűrt és rendezett profilok
  const filteredProfiles = filterAndSortProfiles(mockProfiles, filters);

  const handleLike = () => {
    const profile = filteredProfiles[currentProfileIndex];
    if (profile) {
      setLikedProfiles([...likedProfiles, profile]);
      const compatibility = calculateCompatibility(currentUserProfile, profile);
      Alert.alert(
        'Kedvelve! 💖',
        `${profile.name} hozzáadva a kedvencekhez!\nKompatibilitás: ${compatibility}%`
      );
      nextProfile();
    }
  };

  const handlePass = () => {
    nextProfile();
  };

  const handleSuperLike = () => {
    const profile = filteredProfiles[currentProfileIndex];
    if (profile) {
      setLikedProfiles([...likedProfiles, profile]);
      Alert.alert(
        'Super Like! ⭐',
        `${profile.name} super kedvelve!`
      );
      nextProfile();
    }
  };

  const nextProfile = () => {
    setCurrentProfileIndex((prevIndex) => (prevIndex + 1) % filteredProfiles.length);
  };

  const profile = filteredProfiles[currentProfileIndex];

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="search" size={50} color="#CCC" />
          <Text style={styles.emptyText}>Nincs több profil a szűrők alapján</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.filterButtonText}>Szűrők módosítása</Text>
          </TouchableOpacity>
      </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Felfedezés</Text>
        <TouchableOpacity
          style={styles.filterIcon}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <FilterPanel
          theme={{ colors: { primary: '#FF6B6B', text: '#333', textSecondary: '#666', border: '#DDD' } }}
          showOnlyVerified={filters.verifiedOnly}
          onToggleVerified={() => setFilters({...filters, verifiedOnly: !filters.verifiedOnly})}
          onToggleGPS={() => {}}
          onToggleAI={() => {}}
          onOpenMap={() => {}}
          onOpenSearch={() => {}}
          onToggleSugarDating={() => {}}
          onBoost={() => {}}
          gpsEnabled={false}
          aiModeEnabled={false}
          sugarDatingMode={false}
          isBoostActive={false}
        />
      )}

      {/* Profile Card */}
      <View style={styles.cardContainer}>
        <ProfileCard
          profile={profile}
          isActive={true}
          onSwipeLeft={handlePass}
          onSwipeRight={handleLike}
        />
      </View>

      {/* Action Buttons */}
      <SwipeButtons
        onPass={handlePass}
        onLike={handleLike}
        onSuperLike={handleSuperLike}
        disabled={false}
      />

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          Kedvencek: {likedProfiles.length} | Megnézve: {currentProfileIndex + 1}/{filteredProfiles.length}
        </Text>
      </View>
    </SafeAreaView>
  );
}

// Matchek képernyő listával
function MatchesScreen() {
  const [matches, setMatches] = useState(mockMatches);

  const removeMatch = (id) => {
    Alert.alert(
      'Match eltávolítása',
      'Biztosan el szeretnéd távolítani ezt a match-et?',
      [
        { text: 'Mégsem', style: 'cancel' },
        { text: 'Eltávolít', onPress: () => setMatches(matches.filter(m => m.id !== id)) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Matchek</Text>
        <Text style={styles.subtitle}>{matches.length} aktív match</Text>
      </View>

      <ScrollView style={styles.matchesList}>
        {matches.map((match) => (
          <TouchableOpacity key={match.id} style={styles.matchCard}>
            <View style={styles.matchHeader}>
              <View style={styles.matchCompatibilityBadge}>
                <Text style={styles.matchCompatibilityText}>{match.compatibility}%</Text>
              </View>
              <View style={styles.matchAvatar}>
                <Ionicons name="person-circle" size={50} color="#FF6B6B" />
              </View>
            </View>

            <View style={styles.matchInfo}>
              <Text style={styles.matchName}>{match.name}, {match.age}</Text>
              <Text style={styles.matchCity}>
                <Ionicons name="location" size={14} color="#666" /> {match.city}
          </Text>
              <Text style={styles.matchDate}>
                <Ionicons name="calendar" size={14} color="#666" /> Match: {match.matchedAt}
          </Text>
            </View>

            <View style={styles.matchActions}>
              <TouchableOpacity style={styles.messageButton}>
                <Ionicons name="chatbubble" size={24} color="#FF6B6B" />
                <Text style={styles.messageText}>Üzenet</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeMatch(match.id)}
              >
                <Ionicons name="trash" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// Profil képernyő beállításokkal
function ProfileScreen() {
  const [profileComplete, setProfileComplete] = useState(85);

  const settings = [
    { icon: 'camera', label: 'Fotók módosítása', action: () => Alert.alert('Fotók', 'Fotó módosítás funkció hamarosan!') },
    { icon: 'create', label: 'Adatok szerkesztése', action: () => Alert.alert('Szerkesztés', 'Adat szerkesztés funkció hamarosan!') },
    { icon: 'settings', label: 'Beállítások', action: () => Alert.alert('Beállítások', 'Beállítások menü hamarosan!') },
    { icon: 'help-circle', label: 'Súgó', action: () => Alert.alert('Súgó', 'Súgó funkció hamarosan!') }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Profil</Text>
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          <Ionicons name="person-circle" size={80} color="#FF6B6B" />
        </View>

        <View style={styles.profileDetails}>
          <Text style={styles.userName}>Teszt Felhasználó</Text>
          <Text style={styles.userAge}>27 éves</Text>

          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Profil teljesség: {profileComplete}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${profileComplete}%` }]} />
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.settingsList}>
        {settings.map((setting, index) => (
          <TouchableOpacity
            key={index}
            style={styles.settingItem}
            onPress={setting.action}
          >
            <View style={styles.settingIcon}>
              <Ionicons name={setting.icon} size={24} color="#FF6B6B" />
            </View>
            <Text style={styles.settingLabel}>{setting.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },

  // Felfedezés képernyő - Refaktorált komponensekhez
  cardContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 10,
  },
  filterIcon: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 8,
  },
  stats: {
    padding: 15,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // Matchek képernyő
  matchesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginVertical: 8,
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  matchHeader: {
    position: 'relative',
    marginBottom: 10,
  },
  matchCompatibilityBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchCompatibilityText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  matchAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  matchCity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  matchDate: {
    fontSize: 12,
    color: '#999',
  },
  matchActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    padding: 8,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  messageText: {
    marginLeft: 5,
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
  },

  // Discovery képernyő új stílusok
  filterIcon: {
    position: 'absolute',
    right: 20,
    top: 20,
  },
  filtersContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  filterOptionActive: {
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  filterOptionTextActive: {
    color: '#FF6B6B',
    fontWeight: '500',
  },

  // Profil kártya új elemei
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  compatibilityBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  compatibilityText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  photoCount: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoCountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },

  // Érdeklődések
  interestsContainer: {
    marginTop: 15,
  },
  interestsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  interestText: {
    fontSize: 12,
    color: '#666',
  },
  moreInterests: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Üres állapot
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  filterButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  filterButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },

  // Match kártyák új elemei
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchCompatibilityBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 10,
  },
  matchCompatibilityText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageText: {
    fontSize: 10,
    color: '#FF6B6B',
    marginTop: 2,
    textAlign: 'center',
  },

  // Profil képernyő
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatar: {
    marginRight: 20,
  },
  profileDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  userAge: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#EEE',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 3,
  },
  settingsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginVertical: 5,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Felfedezés') {
              iconName = focused ? 'flame' : 'flame-outline';
            } else if (route.name === 'Matchek') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'Profil') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#FF6B6B',
          tabBarInactiveTintColor: '#666',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Felfedezés" component={HomeScreen} />
        <Tab.Screen name="Matchek" component={MatchesScreen} />
        <Tab.Screen name="Profil" component={ProfileScreen} />
      </Tab.Navigator>
                        </NavigationContainer>
  );
}
