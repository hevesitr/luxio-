/**
 * PreferencesContext - Felhasználói beállítások kezelése
 * 
 * Funkciók:
 * - Discovery szűrők (kor, távolság, nem)
 * - Értesítési beállítások
 * - Adatvédelmi beállítások
 * - Téma váltás (világos/sötét)
 * - Nyelv választás
 * - Beállítások perzisztencia (AsyncStorage)
 * - Szerver szinkronizálás szűrőkhöz
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabaseClient';
import Logger from '../services/Logger';

const PreferencesContext = createContext();

// Storage kulcsok
const STORAGE_KEYS = {
  DISCOVERY_FILTERS: '@preferences_discovery_filters',
  NOTIFICATIONS: '@preferences_notifications',
  PRIVACY: '@preferences_privacy',
  THEME: '@preferences_theme',
  LANGUAGE: '@preferences_language',
};

// Alapértelmezett értékek
const DEFAULT_FILTERS = {
  ageMin: 18,
  ageMax: 99,
  distanceMax: 50, // km
  genderPreference: 'everyone', // 'male', 'female', 'everyone'
  relationshipGoal: null, // 'casual', 'serious', 'friends', null
  showOnlyVerified: false,
};

const DEFAULT_NOTIFICATIONS = {
  newMatches: true,
  newMessages: true,
  likes: true,
  superLikes: true,
  promotions: false,
};

const DEFAULT_PRIVACY = {
  showOnlineStatus: true,
  showDistance: true,
  showAge: true,
  allowMessageRequests: true,
};

export const PreferencesProvider = ({ children }) => {
  // Discovery szűrők
  const [discoveryFilters, setDiscoveryFilters] = useState(DEFAULT_FILTERS);
  
  // Értesítési beállítások
  const [notificationSettings, setNotificationSettings] = useState(DEFAULT_NOTIFICATIONS);
  
  // Adatvédelmi beállítások
  const [privacySettings, setPrivacySettings] = useState(DEFAULT_PRIVACY);
  
  // Téma
  const [theme, setTheme] = useState('light'); // 'light' vagy 'dark'
  
  // Nyelv
  const [language, setLanguage] = useState('hu'); // 'hu' vagy 'en'
  
  // Betöltési állapot
  const [isLoading, setIsLoading] = useState(true);

  // Beállítások betöltése AsyncStorage-ból
  useEffect(() => {
    loadPreferences();
  }, []);

  /**
   * Összes beállítás betöltése
   */
  const loadPreferences = async () => {
    try {
      setIsLoading(true);

      // Discovery szűrők betöltése
      const filtersJson = await AsyncStorage.getItem(STORAGE_KEYS.DISCOVERY_FILTERS);
      if (filtersJson) {
        setDiscoveryFilters(JSON.parse(filtersJson));
      }

      // Értesítési beállítások betöltése
      const notificationsJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (notificationsJson) {
        setNotificationSettings(JSON.parse(notificationsJson));
      }

      // Adatvédelmi beállítások betöltése
      const privacyJson = await AsyncStorage.getItem(STORAGE_KEYS.PRIVACY);
      if (privacyJson) {
        setPrivacySettings(JSON.parse(privacyJson));
      }

      // Téma betöltése
      const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme) {
        setTheme(savedTheme);
      }

      // Nyelv betöltése
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }

      Logger.info('PreferencesContext: Preferences loaded');
    } catch (error) {
      Logger.error('PreferencesContext: Error loading preferences', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Discovery szűrők frissítése
   */
  const updateDiscoveryFilters = async (newFilters) => {
    try {
      const updatedFilters = { ...discoveryFilters, ...newFilters };
      setDiscoveryFilters(updatedFilters);

      // Mentés AsyncStorage-ba
      await AsyncStorage.setItem(
        STORAGE_KEYS.DISCOVERY_FILTERS,
        JSON.stringify(updatedFilters)
      );

      Logger.info('PreferencesContext: Discovery filters updated', { filters: updatedFilters });

      return { success: true };
    } catch (error) {
      Logger.error('PreferencesContext: Error updating discovery filters', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  /**
   * Discovery szűrők szinkronizálása szerverrel
   */
  const syncFiltersToServer = async (userId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: discoveryFilters,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      Logger.info('PreferencesContext: Filters synced to server', { userId });
      return { success: true };
    } catch (error) {
      Logger.error('PreferencesContext: Error syncing filters', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  /**
   * Értesítési beállítások frissítése
   */
  const updateNotificationSettings = async (newSettings) => {
    try {
      const updatedSettings = { ...notificationSettings, ...newSettings };
      setNotificationSettings(updatedSettings);

      // Mentés AsyncStorage-ba
      await AsyncStorage.setItem(
        STORAGE_KEYS.NOTIFICATIONS,
        JSON.stringify(updatedSettings)
      );

      Logger.info('PreferencesContext: Notification settings updated', { settings: updatedSettings });

      return { success: true };
    } catch (error) {
      Logger.error('PreferencesContext: Error updating notification settings', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  /**
   * Adatvédelmi beállítások frissítése
   */
  const updatePrivacySettings = async (newSettings) => {
    try {
      const updatedSettings = { ...privacySettings, ...newSettings };
      setPrivacySettings(updatedSettings);

      // Mentés AsyncStorage-ba
      await AsyncStorage.setItem(
        STORAGE_KEYS.PRIVACY,
        JSON.stringify(updatedSettings)
      );

      Logger.info('PreferencesContext: Privacy settings updated', { settings: updatedSettings });

      return { success: true };
    } catch (error) {
      Logger.error('PreferencesContext: Error updating privacy settings', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  /**
   * Téma váltás
   */
  const toggleTheme = async () => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);

      // Mentés AsyncStorage-ba
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, newTheme);

      Logger.info('PreferencesContext: Theme toggled', { theme: newTheme });

      return { success: true, theme: newTheme };
    } catch (error) {
      Logger.error('PreferencesContext: Error toggling theme', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  /**
   * Nyelv váltás
   */
  const changeLanguage = async (newLanguage) => {
    try {
      setLanguage(newLanguage);

      // Mentés AsyncStorage-ba
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, newLanguage);

      Logger.info('PreferencesContext: Language changed', { language: newLanguage });

      return { success: true, language: newLanguage };
    } catch (error) {
      Logger.error('PreferencesContext: Error changing language', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  /**
   * Összes beállítás visszaállítása alapértelmezettre
   */
  const resetAllPreferences = async () => {
    try {
      setDiscoveryFilters(DEFAULT_FILTERS);
      setNotificationSettings(DEFAULT_NOTIFICATIONS);
      setPrivacySettings(DEFAULT_PRIVACY);
      setTheme('light');
      setLanguage('hu');

      // Törlés AsyncStorage-ból
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.DISCOVERY_FILTERS,
        STORAGE_KEYS.NOTIFICATIONS,
        STORAGE_KEYS.PRIVACY,
        STORAGE_KEYS.THEME,
        STORAGE_KEYS.LANGUAGE,
      ]);

      Logger.info('PreferencesContext: All preferences reset');

      return { success: true };
    } catch (error) {
      Logger.error('PreferencesContext: Error resetting preferences', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  /**
   * Discovery szűrők lekérése (helper)
   */
  const getDiscoveryFilters = () => {
    return discoveryFilters;
  };

  const value = {
    // Discovery szűrők
    discoveryFilters,
    updateDiscoveryFilters,
    syncFiltersToServer,
    getDiscoveryFilters,

    // Értesítési beállítások
    notificationSettings,
    updateNotificationSettings,

    // Adatvédelmi beállítások
    privacySettings,
    updatePrivacySettings,

    // Téma
    theme,
    toggleTheme,

    // Nyelv
    language,
    changeLanguage,

    // Utility
    resetAllPreferences,
    isLoading,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

// Custom hook a context használatához
export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export default PreferencesContext;
