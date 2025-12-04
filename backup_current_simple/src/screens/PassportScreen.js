import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PremiumService from '../services/PremiumService';

const CITIES = [
  { id: 1, name: 'Budapest', country: 'Magyarország', coords: { lat: 47.4979, lon: 19.0402 } },
  { id: 2, name: 'London', country: 'Egyesült Királyság', coords: { lat: 51.5074, lon: -0.1278 } },
  { id: 3, name: 'Paris', country: 'Franciaország', coords: { lat: 48.8566, lon: 2.3522 } },
  { id: 4, name: 'Berlin', country: 'Németország', coords: { lat: 52.5200, lon: 13.4050 } },
  { id: 5, name: 'New York', country: 'USA', coords: { lat: 40.7128, lon: -74.0060 } },
  { id: 6, name: 'Tokyo', country: 'Japán', coords: { lat: 35.6762, lon: 139.6503 } },
  { id: 7, name: 'Sydney', country: 'Ausztrália', coords: { lat: -33.8688, lon: 151.2093 } },
  { id: 8, name: 'Barcelona', country: 'Spanyolország', coords: { lat: 41.3851, lon: 2.1734 } },
  { id: 9, name: 'Amsterdam', country: 'Hollandia', coords: { lat: 52.3676, lon: 4.9041 } },
  { id: 10, name: 'Dubai', country: 'UAE', coords: { lat: 25.2048, lon: 55.2708 } },
];

const PassportScreen = ({ navigation }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [filteredCities, setFilteredCities] = useState(CITIES);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = CITIES.filter(
        city =>
          city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          city.country.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities(CITIES);
    }
  }, [searchQuery]);

  const checkAccess = async () => {
    const canUsePassport = await PremiumService.hasFeature('passport');
    setHasAccess(canUsePassport);
  };

  const handleCitySelect = (city) => {
    if (!hasAccess) {
      Alert.alert(
        '🌍 Prémium Funkció',
        'Frissíts Plus, Gold vagy Platinum előfizetésre hogy használhasd a Passport-ot!',
        [
          { text: 'Mégsem', style: 'cancel' },
          { text: 'Prémium', onPress: () => navigation.navigate('Premium') },
        ]
      );
      return;
    }

    setSelectedCity(city);
    Alert.alert(
      '🌍 Passport Aktiválva',
      `Most ${city.name}, ${city.country} területén swipelhetsz!`,
      [
        {
          text: 'OK',
          onPress: () => {
            // In real app, this would update user's location for matching
            navigation.goBack();
          },
        },
      ]
    );
  };

  const renderCityItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.cityItem,
        selectedCity?.id === item.id && styles.selectedCity,
      ]}
      onPress={() => handleCitySelect(item)}
      activeOpacity={0.7}
    >
      <Ionicons
        name="location"
        size={32}
        color={selectedCity?.id === item.id ? '#FF3B75' : '#666'}
      />
      <View style={styles.cityInfo}>
        <Text style={styles.cityName}>{item.name}</Text>
        <Text style={styles.countryName}>{item.country}</Text>
      </View>
      <Ionicons
        name={selectedCity?.id === item.id ? 'checkmark-circle' : 'chevron-forward'}
        size={24}
        color={selectedCity?.id === item.id ? '#FF3B75' : '#ccc'}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Passport</Text>
        <View style={{ width: 28 }} />
      </View>

      {!hasAccess && (
        <View style={styles.upgradePrompt}>
          <Ionicons name="lock-closed" size={40} color="#FF3B75" />
          <Text style={styles.upgradeTitle}>Passport Prémium Funkció</Text>
          <Text style={styles.upgradeSubtitle}>
            Swipelj bárhol a világon! Tervezz előre utazásokat és találkozz helyi emberekkel.
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('Premium')}
          >
            <Text style={styles.upgradeButtonText}>Frissítés Prémiumra</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Keress városokat..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoBar}>
        <Ionicons name="information-circle" size={20} color="#FF3B75" />
        <Text style={styles.infoText}>
          {hasAccess
            ? 'Válassz várost és kezdj el swipelni ott!'
            : 'Frissíts prémiumra hogy használhasd ezt a funkciót'}
        </Text>
      </View>

      <FlatList
        data={filteredCities}
        renderItem={renderCityItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Nincs találat</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  upgradePrompt: {
    margin: 20,
    padding: 30,
    backgroundColor: '#FFF5F7',
    borderRadius: 15,
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: '#FF3B75',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    paddingHorizontal: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF5F7',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 10,
    gap: 15,
  },
  selectedCity: {
    backgroundColor: '#FFF5F7',
    borderWidth: 2,
    borderColor: '#FF3B75',
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  countryName: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
});

export default PassportScreen;

