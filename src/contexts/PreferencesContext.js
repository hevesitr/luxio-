/**
 * PreferencesContext - Felhasználói beállítások state management
 * Implements Requirement 3.4
 */
import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import SupabaseMatchService from '../services/SupabaseMatchService';
import Logger from '../services/Logger';

const PreferencesContext = createContext({});

const DEFAULT_PREFERENCES = {
  // Discovery filters
  ageMin: 18,
  ageMax: 99,
  distanceMax: 50,
  genderPreference: 'everyone',
  relationshipGoal: null,

  // App settings
  notifications: {
    matches: true,
    messages: true,
    likes: true,
    superLikes: true,
  },
  
  // Privacy settings
  showDistance: true,
  showAge: true,
  showOnline: true,
  
  // Display settings
  theme: 'light',
  language: 'hu',
};

export const PreferencesProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Preferences betöltése
  useEffect(() => {
    if (isAuthenticated && user) {
      loadPreferences();
    } else {
      setPreferences(DEFAULT_PREFERENCES);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  /**
   * Preferences betöltése
   */
  const loadPreferences = async () => {
    try {
      setLoading(true);

      // Lokális preferences betöltése
      const stored = await AsyncStorage.getItem(`preferences_${user.id}`);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        Logger.debug('Preferences loaded from storage', { userId: user.id });
      } else {
        setPreferences(DEFAULT_PREFERENCES);
      }
    } catch (error) {
      Logger.error('Load preferences failed', error);
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Preferences mentése
   */
  const savePreferences = async (newPreferences) => {
    try {
      const updated = { ...preferences, ...newPreferences };
      setPreferences(updated);

      // Lokális mentés
      await AsyncStorage.setItem(
        `preferences_${user.id}`,
        JSON.stringify(updated)
      );

      Logger.debug('Preferences saved', { userId: user.id });
      return { success: true };
    } catch (error) {
      Logger.error('Save preferences failed', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Discovery filters frissítése
   */
  const updateDiscoveryFilters = async (filters) => {
    try {
      const updated = {
        ...preferences,
        ageMin: filters.minAge ?? preferences.ageMin,
        ageMax: filters.maxAge ?? preferences.ageMax,
        distanceMax: filters.maxDistance ?? preferences.distanceMax,
        genderPreference: filters.gender ?? preferences.genderPreference,
        relationshipGoal: filters.relationshipGoal ?? preferences.relationshipGoal,
      };

      setPreferences(updated);

      // Lokális mentés
      await AsyncStorage.setItem(
        `preferences_${user.id}`,
        JSON.stringify(updated)
      );

      // Szerver mentés
      await SupabaseMatchService.saveFilters(user.id, {
        minAge: updated.ageMin,
        maxAge: updated.ageMax,
        maxDistance: updated.distanceMax,
        gender: updated.genderPreference,
      });

      Logger.success('Discovery filters updated', { userId: user.id });
      return { success: true };
    } catch (error) {
      Logger.error('Update discovery filters failed', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Notification settings frissítése
   */
  const updateNotificationSettings = async (settings) => {
    try {
      const updated = {
        ...preferences,
        notifications: {
          ...preferences.notifications,
          ...settings,
        },
      };

      return await savePreferences(updated);
    } catch (error) {
      Logger.error('Update notification settings failed', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Privacy settings frissítése
   */
  const updatePrivacySettings = async (settings) => {
    try {
      const updated = {
        ...preferences,
        showDistance: settings.showDistance ?? preferences.showDistance,
        showAge: settings.showAge ?? preferences.showAge,
        showOnline: settings.showOnline ?? preferences.showOnline,
      };

      return await savePreferences(updated);
    } catch (error) {
      Logger.error('Update privacy settings failed', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Theme váltása
   */
  const toggleTheme = async () => {
    try {
      const newTheme = preferences.theme === 'light' ? 'dark' : 'light';
      return await savePreferences({ theme: newTheme });
    } catch (error) {
      Logger.error('Toggle theme failed', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Nyelv váltása
   */
  const changeLanguage = async (language) => {
    try {
      return await savePreferences({ language });
    } catch (error) {
      Logger.error('Change language failed', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Preferences reset
   */
  const resetPreferences = async () => {
    try {
      setPreferences(DEFAULT_PREFERENCES);
      
      await AsyncStorage.removeItem(`preferences_${user.id}`);
      
      Logger.success('Preferences reset', { userId: user.id });
      return { success: true };
    } catch (error) {
      Logger.error('Reset preferences failed', error);
      return { success: false, error: error.message };
    }
  };

  // ✅ PERFORMANCE: Memoizált függvények
  const savePreferencesMemo = useCallback(savePreferences, [user?.id]);
  const updateDiscoveryFiltersMemo = useCallback(updateDiscoveryFilters, [user?.id]);
  const updateNotificationSettingsMemo = useCallback(updateNotificationSettings, [user?.id]);
  const updatePrivacySettingsMemo = useCallback(updatePrivacySettings, [user?.id]);
  const toggleThemeMemo = useCallback(toggleTheme, [user?.id]);
  const changeLanguageMemo = useCallback(changeLanguage, [user?.id]);
  const resetPreferencesMemo = useCallback(resetPreferences, [user?.id]);

  /**
   * Discovery filters lekérése
   */
  const getDiscoveryFilters = useCallback(() => {
    return {
      minAge: preferences.ageMin,
      maxAge: preferences.ageMax,
      maxDistance: preferences.distanceMax,
      gender: preferences.genderPreference,
      relationshipGoal: preferences.relationshipGoal,
    };
  }, [preferences.ageMin, preferences.ageMax, preferences.distanceMax, preferences.genderPreference, preferences.relationshipGoal]);

  // ✅ PERFORMANCE: Memoizált value object - megakadályozza unnecessary re-render-eket
  const value = useMemo(() => ({
    preferences,
    loading,
    savePreferences: savePreferencesMemo,
    updateDiscoveryFilters: updateDiscoveryFiltersMemo,
    updateNotificationSettings: updateNotificationSettingsMemo,
    updatePrivacySettings: updatePrivacySettingsMemo,
    toggleTheme: toggleThemeMemo,
    changeLanguage: changeLanguageMemo,
    resetPreferences: resetPreferencesMemo,
    getDiscoveryFilters,
  }), [
    preferences,
    loading,
    savePreferencesMemo,
    updateDiscoveryFiltersMemo,
    updateNotificationSettingsMemo,
    updatePrivacySettingsMemo,
    toggleThemeMemo,
    changeLanguageMemo,
    resetPreferencesMemo,
    getDiscoveryFilters,
  ]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

// Custom hook a PreferencesContext használatához
export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  
  return context;
};

export default PreferencesContext;
