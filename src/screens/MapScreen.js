import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  TextInput,
  Modal,
  Animated,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LiveMapView from '../components/LiveMapView';
import ProfilePreviewCard from '../components/ProfilePreviewCard';

const { width, height } = Dimensions.get('window');

// Nézet típusok
const VIEW_TYPES = {
  MAP: 'map',
  LIST: 'list',
  CARDS: 'cards'
};

const MapScreen = ({ navigation, route }) => {
  // Állapotok
  const [currentView, setCurrentView] = useState(VIEW_TYPES.MAP);

  // Nézet betöltése
  useEffect(() => {
    const loadCurrentView = async () => {
      try {
        const savedView = await AsyncStorage.getItem('mapCurrentView');
        if (savedView && Object.values(VIEW_TYPES).includes(savedView)) {
          setCurrentView(savedView);
        }
      } catch (error) {
        console.warn('Failed to load current view:', error);
      }
    };
    loadCurrentView();
  }, []);

  const saveCurrentView = async (view) => {
    setCurrentView(view);
    try {
      await AsyncStorage.setItem('mapCurrentView', view);
    } catch (error) {
      console.warn('Failed to save current view:', error);
    }
  };
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Keresési lekérdezés betöltése
  useEffect(() => {
    const loadSearchQuery = async () => {
      try {
        const savedQuery = await AsyncStorage.getItem('mapSearchQuery');
        if (savedQuery) {
          setSearchQuery(savedQuery);
        }
      } catch (error) {
        console.warn('Failed to load search query:', error);
      }
    };
    loadSearchQuery();
  }, []);

  const saveSearchQuery = async (query) => {
    setSearchQuery(query);
    try {
      await AsyncStorage.setItem('mapSearchQuery', query);
    } catch (error) {
      console.warn('Failed to save search query:', error);
    }
  };
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxDistance: 50,
    minAge: 18,
    maxAge: 65,
    gender: 'all' // all, male, female
  });

  // Szűrők betöltése és mentése
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const savedFilters = await AsyncStorage.getItem('mapFilters');
        if (savedFilters) {
          setFilters(JSON.parse(savedFilters));
        }
      } catch (error) {
        console.warn('Failed to load map filters:', error);
      }
    };
    loadFilters();
  }, []);

  const saveFilters = async (newFilters) => {
    setFilters(newFilters);
    try {
      await AsyncStorage.setItem('mapFilters', JSON.stringify(newFilters));
    } catch (error) {
      console.warn('Failed to save map filters:', error);
    }
  };

  // Animációk
  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);

  // Mock profil adatok
  const allProfiles = route?.params?.nearbyProfiles || [
    {
      id: 1,
      name: 'Anna',
      age: 25,
      gender: 'female',
      photo: 'https://randomuser.me/api/portraits/women/1.jpg',
      location: { latitude: 47.4979, longitude: 19.0402 },
      distance: 2.3,
      bio: 'Szeretem a jó zenét és a hosszú sétákat! 🎵🚶‍♀️',
      interests: ['Zene', 'Séta', 'Kávé']
    },
    {
      id: 2,
      name: 'Béla',
      age: 28,
      gender: 'male',
      photo: 'https://randomuser.me/api/portraits/men/2.jpg',
      location: { latitude: 47.5079, longitude: 19.0502 },
      distance: 1.8,
      bio: 'Sportos srác, szeretem a természetet és a kalandokat! 🏔️⚽',
      interests: ['Sport', 'Természet', 'Kaland']
    },
    {
      id: 3,
      name: 'Csilla',
      age: 24,
      gender: 'female',
      photo: 'https://randomuser.me/api/portraits/women/3.jpg',
      location: { latitude: 47.4879, longitude: 19.0302 },
      distance: 3.1,
      bio: 'Művészlélek, szeretek alkotni és új dolgokat tanulni! 🎨📚',
      interests: ['Művészet', 'Olvasás', 'Fotózás']
    },
    {
      id: 4,
      name: 'Dávid',
      age: 30,
      gender: 'male',
      photo: 'https://randomuser.me/api/portraits/men/4.jpg',
      location: { latitude: 47.4779, longitude: 19.0202 },
      distance: 4.2,
      bio: 'Tech geek és gamer, szeretek programozni és játékokat fejleszteni! 💻🎮',
      interests: ['Tech', 'Gaming', 'Programozás']
    },
    {
      id: 5,
      name: 'Eszter',
      age: 26,
      gender: 'female',
      photo: 'https://randomuser.me/api/portraits/women/5.jpg',
      location: { latitude: 47.5179, longitude: 19.0602 },
      distance: 2.7,
      bio: 'Utazni szerető lány, már jártam 15 országban! ✈️🌍',
      interests: ['Utazás', 'Fotózás', 'Kultúra']
    },
    {
      id: 6,
      name: 'Gábor',
      age: 32,
      gender: 'male',
      photo: 'https://randomuser.me/api/portraits/men/6.jpg',
      location: { latitude: 47.4679, longitude: 19.0102 },
      distance: 5.1,
      bio: 'Szeretem a jó ételeket és a főzést! 🍳🍝',
      interests: ['Főzés', 'Ételek', 'Bor']
    }
  ];

  // Szűrt profilok
  const filteredProfiles = useMemo(() => {
    return allProfiles.filter(profile => {
      // Keresés szűrő - név, bio és érdeklődési körök alapján
      const matchesSearch = searchQuery === '' ||
        profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (profile.interests && profile.interests.some(interest =>
          interest.toLowerCase().includes(searchQuery.toLowerCase())
        ));

      // Távolság szűrő
      const matchesDistance = profile.distance <= filters.maxDistance;

      // Kor szűrő
      const matchesAge = profile.age >= filters.minAge && profile.age <= filters.maxAge;

      // Nem szűrő
      const matchesGender = filters.gender === 'all' || profile.gender === filters.gender;

      return matchesSearch && matchesDistance && matchesAge && matchesGender;
    });
  }, [allProfiles, searchQuery, filters]);

  // Nézet váltás animáció
  const switchView = (newView) => {
    // Különböző animációk különböző nézetekhez
    let slideValue = 0;
    if (newView === VIEW_TYPES.LIST) slideValue = -width;
    else if (newView === VIEW_TYPES.CARDS) slideValue = -width * 2;

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: slideValue,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      saveCurrentView(newView);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  // Profil kiválasztása
  const handleProfilePress = (profile) => {
    setSelectedProfile(profile);
    setShowProfileModal(true);
  };

  // Szűrők alkalmazása
  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  // Render függvények különböző nézetekhez
  const renderMapView = () => (
    <LiveMapView
      nearbyProfiles={filteredProfiles}
      onProfilePress={handleProfilePress}
      currentUserLocation={{
        latitude: 47.4979,
        longitude: 19.0402
      }}
      matchedProfiles={route?.params?.matchedProfiles || new Set()}
      likedProfiles={route?.params?.likedProfiles || new Set()}
      showProfileImages={true}
    />
  );

  const renderListView = () => (
    <FlatList
      data={filteredProfiles}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => handleProfilePress(item)}
        >
          <View style={styles.listItemContent}>
            <View style={styles.listItemAvatar}>
              <Text style={styles.listItemInitial}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.listItemInfo}>
              <Text style={styles.listItemName}>{item.name}, {item.age}</Text>
              <Text style={styles.listItemDistance}>{item.distance.toFixed(1)} km távolságra</Text>
              <Text style={styles.listItemBio} numberOfLines={1}>
                {item.bio}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="search" size={64} color="#333" />
          <Text style={styles.emptyStateTitle}>Nincs találat</Text>
          <Text style={styles.emptyStateText}>
            Próbáld módosítani a szűrőket vagy a keresési feltételeket
          </Text>
        </View>
      }
    />
  );

  const renderCardsView = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.cardsContainer}
    >
      {filteredProfiles.map((profile) => (
        <TouchableOpacity
          key={profile.id}
          style={styles.cardItem}
          onPress={() => handleProfilePress(profile)}
        >
          <View style={styles.cardImageContainer}>
            <Text style={styles.cardInitial}>{profile.name.charAt(0)}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{profile.name}, {profile.age}</Text>
            <Text style={styles.cardDistance}>{profile.distance.toFixed(1)} km</Text>
          </View>
        </TouchableOpacity>
      ))}
      {filteredProfiles.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={64} color="#333" />
          <Text style={styles.emptyStateTitle}>Nincs találat</Text>
          <Text style={styles.emptyStateText}>
            Próbáld módosítani a szűrőket vagy a keresési feltételeket
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case VIEW_TYPES.LIST:
        return renderListView();
      case VIEW_TYPES.CARDS:
        return renderCardsView();
      default:
        return renderMapView();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#666" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Felfedezés</Text>
          <Text style={styles.headerSubtitle}>{filteredProfiles.length} profil</Text>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={24} color="#00D4FF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Keresés név vagy érdeklődés alapján..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={saveSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => saveSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* View Switcher */}
      <View style={styles.viewSwitcher}>
        <TouchableOpacity
          style={[styles.viewButton, currentView === VIEW_TYPES.MAP && styles.viewButtonActive]}
          onPress={() => switchView(VIEW_TYPES.MAP)}
        >
          <Ionicons name="map" size={20} color={currentView === VIEW_TYPES.MAP ? "#00D4FF" : "#666"} />
          <Text style={[styles.viewButtonText, currentView === VIEW_TYPES.MAP && styles.viewButtonTextActive]}>
            Térkép
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewButton, currentView === VIEW_TYPES.LIST && styles.viewButtonActive]}
          onPress={() => switchView(VIEW_TYPES.LIST)}
        >
          <Ionicons name="list" size={20} color={currentView === VIEW_TYPES.LIST ? "#00D4FF" : "#666"} />
          <Text style={[styles.viewButtonText, currentView === VIEW_TYPES.LIST && styles.viewButtonTextActive]}>
            Lista
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewButton, currentView === VIEW_TYPES.CARDS && styles.viewButtonActive]}
          onPress={() => switchView(VIEW_TYPES.CARDS)}
        >
          <MaterialIcons name="view-carousel" size={20} color={currentView === VIEW_TYPES.CARDS ? "#00D4FF" : "#666"} />
          <Text style={[styles.viewButtonText, currentView === VIEW_TYPES.CARDS && styles.viewButtonTextActive]}>
            Kártyák
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        {renderCurrentView()}
      </Animated.View>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedProfile && (
              <ProfilePreviewCard
                profile={selectedProfile}
                onClose={() => setShowProfileModal(false)}
                onLike={() => {
                  Alert.alert('Like', `${selectedProfile.name} kedvelve!`);
                  setShowProfileModal(false);
                }}
                onMessage={() => {
                  Alert.alert('Üzenet', `Csevegés indítása ${selectedProfile.name}-val!`);
                  setShowProfileModal(false);
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filtersModal}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Szűrők</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filtersContent}>
              {/* Distance Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Maximális távolság: {filters.maxDistance} km</Text>
                <View style={styles.sliderContainer}>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => saveFilters({...filters, maxDistance: Math.max(1, filters.maxDistance - 5)})}
                  >
                    <Ionicons name="remove" size={20} color="#00D4FF" />
                  </TouchableOpacity>

                  <View style={styles.sliderTrack}>
                    <View
                      style={[styles.sliderFill, { width: `${(filters.maxDistance / 100) * 100}%` }]}
                    />
                    <View style={[styles.sliderThumb, { left: `${(filters.maxDistance / 100) * 100}%` }]} />
                  </View>

                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => saveFilters({...filters, maxDistance: Math.min(100, filters.maxDistance + 5)})}
                  >
                    <Ionicons name="add" size={20} color="#00D4FF" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.sliderRange}>1km - 100km</Text>
              </View>

              {/* Age Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Kor: {filters.minAge}-{filters.maxAge} év</Text>
                <View style={styles.sliderContainer}>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => saveFilters({...filters, minAge: Math.max(18, filters.minAge - 1)})}
                  >
                    <Ionicons name="remove" size={20} color="#00D4FF" />
                  </TouchableOpacity>

                  <Text style={styles.ageRange}>{filters.minAge} - {filters.maxAge}</Text>

                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => saveFilters({...filters, maxAge: Math.min(65, filters.maxAge + 1)})}
                  >
                    <Ionicons name="add" size={20} color="#00D4FF" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.sliderRange}>18-65 év</Text>
              </View>

              {/* Gender Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Nem</Text>
                <View style={styles.genderButtons}>
                  <TouchableOpacity
                    style={[styles.genderButton, filters.gender === 'all' && styles.genderButtonActive]}
                    onPress={() => saveFilters({...filters, gender: 'all'})}
                  >
                    <Text style={[styles.genderButtonText, filters.gender === 'all' && styles.genderButtonTextActive]}>
                      Mind
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderButton, filters.gender === 'female' && styles.genderButtonActive]}
                    onPress={() => saveFilters({...filters, gender: 'female'})}
                  >
                    <Text style={[styles.genderButtonText, filters.gender === 'female' && styles.genderButtonTextActive]}>
                      Nők
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderButton, filters.gender === 'male' && styles.genderButtonActive]}
                    onPress={() => saveFilters({...filters, gender: 'male'})}
                  >
                    <Text style={[styles.genderButtonText, filters.gender === 'male' && styles.genderButtonTextActive]}>
                      Férfiak
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.filtersFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => saveFilters({ maxDistance: 50, minAge: 18, maxAge: 65, gender: 'all' })}
              >
                <Text style={styles.resetButtonText}>Visszaállítás</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Alkalmazás</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#00D4FF',
    marginTop: 2,
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search styles
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },

  // View switcher styles
  viewSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
  },
  viewButtonActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
  },
  viewButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  viewButtonTextActive: {
    color: '#00D4FF',
  },

  // Content container
  contentContainer: {
    flex: 1,
  },

  // Map container
  mapContainer: {
    flex: 1,
  },

  // List view styles
  listItem: {
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  listItemAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00D4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listItemInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  listItemInfo: {
    flex: 1,
  },
  listItemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listItemDistance: {
    color: '#00D4FF',
    fontSize: 14,
    marginTop: 2,
  },
  listItemBio: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
  },

  // Cards view styles
  cardsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cardItem: {
    width: 140,
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  cardImageContainer: {
    width: 140,
    height: 120,
    backgroundColor: '#00D4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInitial: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '700',
  },
  cardInfo: {
    padding: 12,
  },
  cardName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cardDistance: {
    color: '#00D4FF',
    fontSize: 12,
    marginTop: 4,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
    minHeight: height * 0.4,
  },

  // Filters modal
  filtersModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    margin: 20,
    maxHeight: height * 0.8,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  filtersTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  filtersContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  sliderButton: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00D4FF',
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginHorizontal: 12,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#00D4FF',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -3,
    width: 12,
    height: 12,
    backgroundColor: '#00D4FF',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  sliderRange: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  ageRange: {
    flex: 1,
    color: '#00D4FF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#00D4FF',
    borderColor: '#00D4FF',
  },
  genderButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: '#000',
  },
  filtersFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#00D4FF',
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MapScreen;
