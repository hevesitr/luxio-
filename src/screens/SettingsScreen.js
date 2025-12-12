import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SavedSearchesService from '../services/SavedSearchesService';
import BiometricService from '../services/BiometricService';
import { useTheme } from '../context/ThemeContext';

const SETTINGS_KEY = '@user_settings';

const SettingsScreen = ({ navigation }) => {
  const { theme, isDark, themeMode, setTheme, accentMode, setAccentMode } = useTheme();
  
  // Fallback theme if theme is not initialized
  const safeTheme = theme || {
    colors: {
      background: '#0a0a0a',
      surface: '#1a1a1a',
      card: '#1f1f1f',
      text: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      primary: '#FF3B75',
      border: 'rgba(255, 255, 255, 0.1)',
      disabled: '#666666',
      success: '#4CAF50',
    }
  };
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [newMatchNotif, setNewMatchNotif] = useState(true);
  const [messageNotif, setMessageNotif] = useState(true);
  const [distanceEnabled, setDistanceEnabled] = useState(true);
  const [distance, setDistance] = useState(50);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(35);
  const [relationshipGoal, setRelationshipGoal] = useState('serious');
  const [communicationStyle, setCommunicationStyle] = useState('balanced');
  const [incognitoMode, setIncognitoMode] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaveSearchDialog, setShowSaveSearchDialog] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(null);
  const [biometricType, setBiometricType] = useState('');
  const [showOnMap, setShowOnMap] = useState(true);

  // Beállítások betöltése
  useEffect(() => {
    loadSettings();
    loadSavedSearches();
    checkBiometricAvailability();
    loadBiometricSetting();
  }, []);

  const checkBiometricAvailability = async () => {
    const availability = await BiometricService.isAvailable();
    setBiometricAvailable(availability.available);
    if (availability.available && availability.types) {
      const typeName = BiometricService.getBiometricTypeName(availability.types);
      setBiometricType(typeName || 'Biometrikus hitelesítés');
    } else {
      setBiometricType('');
    }
  };

  const loadBiometricSetting = async () => {
    const enabled = await BiometricService.isEnabled();
    setBiometricEnabled(enabled);
  };

  const handleBiometricToggle = async (value) => {
    if (value) {
      // Ha bekapcsoljuk, először hitelesíteni kell
      const result = await BiometricService.authenticate(
        'A biometrikus hitelesítés engedélyezéséhez hitelesítsd magad'
      );
      if (result.success) {
        await BiometricService.setEnabled(true);
        setBiometricEnabled(true);
        Alert.alert('✅ Sikeres', `${biometricType} engedélyezve`);
      } else {
        Alert.alert('❌ Sikertelen', result.error || 'A hitelesítés megszakítva');
      }
    } else {
      await BiometricService.setEnabled(false);
      setBiometricEnabled(false);
    }
  };

  const testBiometric = async () => {
    const result = await BiometricService.authenticate('Teszt hitelesítés');
    if (result.success) {
      Alert.alert('✅ Sikeres', 'A biometrikus hitelesítés működik!');
    } else {
      Alert.alert('❌ Sikertelen', result.error || 'A hitelesítés megszakítva');
    }
  };

  const loadSettings = async () => {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        const settings = JSON.parse(data);
        setIncognitoMode(settings.incognitoMode || false);
        setDistance(settings.distance || 50);
        setAgeMin(settings.ageMin || 18);
        setAgeMax(settings.ageMax || 35);
        setShowOnMap(settings.showOnMap !== undefined ? settings.showOnMap : true);
        setRelationshipGoal(settings.relationshipGoal || 'serious');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadSavedSearches = async () => {
    const searches = await SavedSearchesService.getSavedSearches();
    setSavedSearches(searches);
  };

  const saveSettings = async () => {
    try {
      const settings = {
        incognitoMode,
        distance,
        ageMin,
        ageMax,
        relationshipGoal,
        showOnMap,
      };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      
      // Frissítsük a currentUser profilban is
      const { currentUser } = require('../data/userProfile');
      currentUser.showOnMap = showOnMap;
      
      Alert.alert('✅ Mentve', 'Beállításaid elmentve!');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Hiba', 'Nem sikerült menteni a beállításokat.');
    }
  };

  const handleSave = () => {
    saveSettings();
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) {
      Alert.alert('Hiba', 'Kérlek adj nevet a keresésnek!');
      return;
    }

    const searchParams = {
      name: searchName,
      distance,
      ageMin,
      ageMax,
      relationshipGoal,
    };

    await SavedSearchesService.saveSearch(searchParams);
    setShowSaveSearchDialog(false);
    setSearchName('');
    loadSavedSearches();
    Alert.alert('✅ Mentve', 'Keresésed elmentve!');
  };

  const handleLoadSearch = (search) => {
    setDistance(search.params.distance);
    setAgeMin(search.params.ageMin);
    setAgeMax(search.params.ageMax);
    setRelationshipGoal(search.params.relationshipGoal);
    Alert.alert('✅ Betöltve', 'Keresési beállítások betöltve!');
  };

  const handleDeleteSearch = async (searchId) => {
    Alert.alert(
      'Keresés törlése',
      'Biztosan törölni szeretnéd ezt a keresést?',
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Törlés',
          style: 'destructive',
          onPress: async () => {
            await SavedSearchesService.deleteSearch(searchId);
            loadSavedSearches();
          },
        },
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Visszaállítás',
      'Biztosan visszaállítod az alapértelmezett beállításokat?',
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Igen',
          onPress: () => {
            setNotificationsEnabled(true);
            setNewMatchNotif(true);
            setMessageNotif(true);
            setDistanceEnabled(true);
            setDistance(50);
            setAgeMin(18);
            setAgeMax(35);
            Alert.alert('✅ Visszaállítva', 'Beállítások visszaállítva!');
          },
        },
      ]
    );
  };

  const styles = createStyles(safeTheme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Beállítások</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveText}>Mentés</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Megjelenés</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name={isDark ? "moon" : "sunny"} size={24} color={theme.colors.primary} />
              <View>
                <Text style={styles.settingLabel}>Sötét mód</Text>
                <Text style={styles.settingSubtext}>
                  {themeMode === 'system' ? 'Rendszer beállítás' : isDark ? 'Sötét téma' : 'Világos téma'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
              trackColor={{ false: '#ccc', true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[styles.themeOption, themeMode === 'light' && styles.themeOptionActive]}
              onPress={() => setTheme('light')}
            >
              <Ionicons name="sunny" size={20} color={themeMode === 'light' ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={[styles.themeOptionText, themeMode === 'light' && styles.themeOptionTextActive]}>
                Világos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeOption, themeMode === 'dark' && styles.themeOptionActive]}
              onPress={() => setTheme('dark')}
            >
              <Ionicons name="moon" size={20} color={themeMode === 'dark' ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={[styles.themeOptionText, themeMode === 'dark' && styles.themeOptionTextActive]}>
                Sötét
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeOption, themeMode === 'system' && styles.themeOptionActive]}
              onPress={() => setTheme('system')}
            >
              <Ionicons name="phone-portrait" size={20} color={themeMode === 'system' ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={[styles.themeOptionText, themeMode === 'system' && styles.themeOptionTextActive]}>
                Rendszer
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.paletteContainer}>
            <Text style={styles.paletteTitle}>Luxio színpaletta</Text>
            <Text style={styles.paletteSubtitle}>
              {accentMode === 'luxio'
                ? 'Luxio (lila + mentazöld) aktív'
                : 'Klasszikus (pink + zöld) paletta aktív'}
            </Text>
            <View style={styles.paletteButtons}>
              <TouchableOpacity
                style={[
                  styles.paletteButton,
                  accentMode === 'classic' && styles.paletteButtonActive,
                ]}
                onPress={() => setAccentMode('classic')}
                activeOpacity={0.8}
              >
                <View style={styles.paletteSwatchGroup}>
                  <View style={[styles.paletteSwatch, { backgroundColor: '#FF3B75' }]} />
                  <View style={[styles.paletteSwatch, { backgroundColor: '#4CAF50' }]} />
                </View>
                <Text
                  style={[
                    styles.paletteButtonText,
                    accentMode === 'classic' && styles.paletteButtonTextActive,
                  ]}
                >
                  Klasszikus
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paletteButton,
                  accentMode === 'luxio' && styles.paletteButtonActive,
                ]}
                onPress={() => setAccentMode('luxio')}
                activeOpacity={0.8}
              >
                <View style={styles.paletteSwatchGroup}>
                  <View style={[styles.paletteSwatch, { backgroundColor: '#7F5AF0' }]} />
                  <View style={[styles.paletteSwatch, { backgroundColor: '#2CE5C0' }]} />
                </View>
                <Text
                  style={[
                    styles.paletteButtonText,
                    accentMode === 'luxio' && styles.paletteButtonTextActive,
                  ]}
                >
                  Luxio
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biztonság</Text>
          
          {biometricAvailable !== null && (
            <>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons 
                    name={biometricType && typeof biometricType === 'string' && biometricType.includes('Arc') ? 'face-recognition' : 'finger-print'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>
                      {typeof biometricType === 'string' ? biometricType : 'Biometrikus hitelesítés'}
                    </Text>
                    {biometricAvailable ? (
                      <Text style={styles.settingDescription}>
                        Az alkalmazás megnyitásához {typeof biometricType === 'string' && biometricType ? biometricType.toLowerCase() : 'biometrikus hitelesítés'} szükséges
                      </Text>
                    ) : (
                      <Text style={styles.settingDescription}>
                        Nem elérhető ezen a készüléken
                      </Text>
                    )}
                  </View>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  disabled={!biometricAvailable}
                  trackColor={{ false: '#ccc', true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              {biometricEnabled && biometricAvailable && (
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={testBiometric}
                >
                  <Ionicons name="shield-checkmark" size={20} color={theme.colors.primary} />
                  <Text style={styles.testButtonText}>Teszt hitelesítés</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Értesítések</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={24} color="#FF3B75" />
              <Text style={styles.settingLabel}>Értesítések engedélyezése</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#ccc', true: '#FF3B75' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="heart" size={24} color="#4CAF50" />
              <Text style={styles.settingLabel}>Új match értesítés</Text>
            </View>
            <Switch
              value={newMatchNotif}
              onValueChange={setNewMatchNotif}
              disabled={!notificationsEnabled}
              trackColor={{ false: '#ccc', true: '#FF3B75' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="chatbubble" size={24} color="#2196F3" />
              <Text style={styles.settingLabel}>Üzenet értesítés</Text>
            </View>
            <Switch
              value={messageNotif}
              onValueChange={setMessageNotif}
              disabled={!notificationsEnabled}
              trackColor={{ false: '#ccc', true: '#FF3B75' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Felfedezési beállítások</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="location" size={24} color="#FF9800" />
              <Text style={styles.settingLabel}>Távolság korlátozás</Text>
            </View>
            <Switch
              value={distanceEnabled}
              onValueChange={setDistanceEnabled}
              trackColor={{ false: '#ccc', true: '#FF3B75' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Maximum távolság: {distance} km</Text>
            <View style={styles.valueButtons}>
              <TouchableOpacity 
                style={styles.valueButton}
                onPress={() => setDistance(Math.max(5, distance - 5))}
                disabled={!distanceEnabled}
              >
                <Ionicons name="remove" size={20} color={distanceEnabled ? "#FF3B75" : "rgba(255, 255, 255, 0.3)"} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.valueButton}
                onPress={() => setDistance(Math.min(100, distance + 5))}
                disabled={!distanceEnabled}
              >
                <Ionicons name="add" size={20} color={distanceEnabled ? "#FF3B75" : "rgba(255, 255, 255, 0.3)"} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kor tartomány: {ageMin} - {ageMax} év</Text>
            <View style={styles.valueButtons}>
              <TouchableOpacity 
                style={styles.valueButton}
                onPress={() => {
                  if (ageMin > 18) setAgeMin(ageMin - 1);
                }}
              >
                <Ionicons name="remove" size={20} color="#FF3B75" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.valueButton}
                onPress={() => {
                  if (ageMax < 100) setAgeMax(ageMax + 1);
                }}
              >
                <Ionicons name="add" size={20} color="#FF3B75" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil preferenciák</Text>
          
          <Text style={styles.subTitle}>Mit keresel?</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={[styles.optionButton, relationshipGoal === 'serious' && styles.optionButtonActive]}
              onPress={() => setRelationshipGoal('serious')}
            >
              <Text style={styles.optionIcon}>💍</Text>
              <Text style={[styles.optionText, relationshipGoal === 'serious' && styles.optionTextActive]}>
                Komoly kapcsolat
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.optionButton, relationshipGoal === 'casual' && styles.optionButtonActive]}
              onPress={() => setRelationshipGoal('casual')}
            >
              <Text style={styles.optionIcon}>😊</Text>
              <Text style={[styles.optionText, relationshipGoal === 'casual' && styles.optionTextActive]}>
                Laza randik
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.optionButton, relationshipGoal === 'friends' && styles.optionButtonActive]}
              onPress={() => setRelationshipGoal('friends')}
            >
              <Text style={styles.optionIcon}>👥</Text>
              <Text style={[styles.optionText, relationshipGoal === 'friends' && styles.optionTextActive]}>
                Barátság
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.subTitle, { marginTop: 20 }]}>Kommunikációs stílus</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={[styles.optionButton, communicationStyle === 'frequent' && styles.optionButtonActive]}
              onPress={() => setCommunicationStyle('frequent')}
            >
              <Text style={styles.optionIcon}>💬</Text>
              <Text style={[styles.optionText, communicationStyle === 'frequent' && styles.optionTextActive]}>
                Gyakori
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.optionButton, communicationStyle === 'balanced' && styles.optionButtonActive]}
              onPress={() => setCommunicationStyle('balanced')}
            >
              <Text style={styles.optionIcon}>⚖️</Text>
              <Text style={[styles.optionText, communicationStyle === 'balanced' && styles.optionTextActive]}>
                Kiegyensúlyozott
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.optionButton, communicationStyle === 'occasional' && styles.optionButtonActive]}
              onPress={() => setCommunicationStyle('occasional')}
            >
              <Text style={styles.optionIcon}>🌙</Text>
              <Text style={[styles.optionText, communicationStyle === 'occasional' && styles.optionTextActive]}>
                Alkalomszerű
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privátság</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="eye-off" size={24} color="#9C27B0" />
              <View>
                <Text style={styles.settingLabel}>Incognito mód</Text>
                <Text style={styles.settingDescription}>
                  Profilod rejtve marad mások elől, de te láthatod őket
                </Text>
              </View>
            </View>
            <Switch
              value={incognitoMode}
              onValueChange={setIncognitoMode}
              trackColor={{ false: '#ccc', true: '#FF3B75' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="map" size={24} color="#4CAF50" />
              <View>
                <Text style={styles.settingLabel}>Megjelenés a térképen</Text>
                <Text style={styles.settingDescription}>
                  Engedélyezed, hogy a matchelt felhasználók lássanak a térképen
                </Text>
              </View>
            </View>
            <Switch
              value={showOnMap}
              onValueChange={setShowOnMap}
              trackColor={{ false: '#ccc', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mentett keresések</Text>
          
          {savedSearches.length > 0 ? (
            savedSearches.map((search) => (
              <View key={search.id} style={styles.savedSearchRow}>
                <TouchableOpacity
                  style={styles.savedSearchContent}
                  onPress={() => handleLoadSearch(search)}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons name="search" size={20} color="#2196F3" />
                    <View>
                      <Text style={styles.savedSearchName}>{search.name}</Text>
                      <Text style={styles.savedSearchParams}>
                        {search.params.ageMin}-{search.params.ageMax} év, {search.params.distance} km
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteSearch(search.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nincs mentett keresés</Text>
          )}

          <TouchableOpacity
            style={styles.saveSearchButton}
            onPress={() => setShowSaveSearchDialog(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FF3B75" />
            <Text style={styles.saveSearchText}>Keresés mentése</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adatvédelem</Text>
          
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('PrivacySettings')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#4CAF50" />
              <View>
                <Text style={styles.settingLabel}>Adatvédelmi Beállítások</Text>
                <Text style={styles.settingDescription}>
                  Cookie-k, értesítések, adatmegosztás
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Consent')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="checkbox-outline" size={24} color="#9C27B0" />
              <View>
                <Text style={styles.settingLabel}>Adatkezelési Hozzájárulás</Text>
                <Text style={styles.settingDescription}>
                  Jogszabályi hozzájárulások kezelése
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('DataExport')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="download-outline" size={24} color="#2196F3" />
              <View>
                <Text style={styles.settingLabel}>Adataim Exportálása</Text>
                <Text style={styles.settingDescription}>
                  GDPR - Right to Access
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('BlockedUsers')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="shield-outline" size={24} color="#FF6B6B" />
              <View>
                <Text style={styles.settingLabel}>Blokkolt felhasználók</Text>
                <Text style={styles.settingDescription}>
                  Blokkolás kezelése és feloldása
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkRow}
            onPress={() => navigation.navigate('DeleteAccount')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={24} color="#F44336" />
              <View>
                <Text style={styles.settingLabel}>Fiók Törlése</Text>
                <Text style={styles.settingDescription}>
                  GDPR - Right to be Forgotten
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkRow}
            onPress={() => {
              navigation.navigate('WebView', { url: 'https://hevesitr.github.io/luxio-/web/privacy-policy.html' });
            }}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="document-text" size={24} color="#9C27B0" />
              <Text style={styles.settingLabel}>Adatvédelmi Szabályzat</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkRow}
            onPress={() => {
              navigation.navigate('WebView', { url: 'https://hevesitr.github.io/luxio-/web/terms-of-service.html' });
            }}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
              <Text style={styles.settingLabel}>Felhasználási Feltételek</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkRow}
            onPress={() => {
              navigation.navigate('WebView', { url: 'https://hevesitr.github.io/luxio-/web/safety-guidelines.html' });
            }}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="warning-outline" size={24} color="#FF7043" />
              <Text style={styles.settingLabel}>Biztonsági Útmutató</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Ionicons name="refresh" size={20} color="#FF9800" />
          <Text style={styles.resetText}>Alapértelmezett beállítások</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Luxio v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Save Search Dialog */}
      {showSaveSearchDialog && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Keresés mentése</Text>
            <TextInput
              style={styles.dialogInput}
              placeholder="Keresés neve"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={searchName}
              onChangeText={setSearchName}
              autoFocus
            />
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogButtonCancel]}
                onPress={() => {
                  setShowSaveSearchDialog(false);
                  setSearchName('');
                }}
              >
                <Text style={styles.dialogButtonTextCancel}>Mégse</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogButtonSave]}
                onPress={handleSaveSearch}
              >
                <Text style={styles.dialogButtonTextSave}>Mentés</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 50,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  saveButton: {
    padding: 5,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginTop: 12,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 15,
    letterSpacing: -0.3,
  },
  settingSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginLeft: 39,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  themeOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  themeOptionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  themeOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  paletteContainer: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  paletteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  paletteSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  paletteButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  paletteButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  paletteButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  paletteButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  paletteButtonTextActive: {
    color: theme.colors.primary,
  },
  paletteSwatchGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  paletteSwatch: {
    width: 26,
    height: 10,
    borderRadius: 999,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 39,
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  valueButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  valueButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 10,
    padding: 15,
    gap: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 152, 0, 0.4)',
  },
  resetText: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
    marginTop: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionButtonActive: {
    backgroundColor: 'rgba(255, 59, 117, 0.2)',
    borderColor: '#FF3B75',
  },
  optionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  optionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#FF3B75',
  },
  settingDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  savedSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  savedSearchContent: {
    flex: 1,
  },
  savedSearchName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  savedSearchParams: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  saveSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 117, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 117, 0.3)',
  },
  saveSearchText: {
    color: '#FF3B75',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  dialogInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 15,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  dialogButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  dialogButtonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dialogButtonSave: {
    backgroundColor: '#FF3B75',
  },
  dialogButtonTextCancel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dialogButtonTextSave: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;

