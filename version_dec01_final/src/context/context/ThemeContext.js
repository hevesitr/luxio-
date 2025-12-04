import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@app_theme';
const ACCENT_STORAGE_KEY = '@app_accent';

const lightTheme = {
  mode: 'light',
  colors: {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    card: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#E0E0E0',
    primary: '#FF3B75',
    primaryLight: '#FF6B9D',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    info: '#2196F3',
    purple: '#9C27B0',
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
};

const darkTheme = {
  mode: 'dark',
  colors: {
    background: '#0a0a0a',
    surface: '#1a1a1a',
    card: '#1f1f1f',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textTertiary: 'rgba(255, 255, 255, 0.5)',
    border: 'rgba(255, 255, 255, 0.1)',
    primary: '#FF3B75',
    primaryLight: '#FF6B9D',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    info: '#2196F3',
    purple: '#9C27B0',
    overlay: 'rgba(0, 0, 0, 0.8)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

const classicPalette = {
  primary: '#FF3B75',
  primaryLight: '#FF6B9D',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',
};

const luxioPalette = {
  primary: '#7F5AF0',
  primaryLight: '#9D8CFF',
  success: '#2CE5C0',
  warning: '#FFB347',
  error: '#FF5C8D',
  info: '#4CD5FF',
};

const ThemeContext = createContext({
  theme: darkTheme,
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
  accentMode: 'classic',
  toggleAccent: () => {},
  setAccentMode: () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [isDark, setIsDark] = useState(true);
  const [accentMode, setAccentModeState] = useState('classic'); // 'classic', 'luxio'

  useEffect(() => {
    loadTheme();
    loadAccent();
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      setIsDark(systemColorScheme === 'dark');
    } else {
      setIsDark(themeMode === 'dark');
    }
  }, [themeMode, systemColorScheme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const loadAccent = async () => {
    try {
      const savedAccent = await AsyncStorage.getItem(ACCENT_STORAGE_KEY);
      if (savedAccent) {
        setAccentModeState(savedAccent);
      }
    } catch (error) {
      console.error('Error loading accent theme:', error);
    }
  };

  const saveTheme = async (mode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeMode(mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const saveAccent = async (mode) => {
    try {
      await AsyncStorage.setItem(ACCENT_STORAGE_KEY, mode);
      setAccentModeState(mode);
    } catch (error) {
      console.error('Error saving accent theme:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    saveTheme(newMode);
  };

  const setTheme = (mode) => {
    saveTheme(mode);
  };

  const toggleAccent = () => {
    const newAccent = accentMode === 'classic' ? 'luxio' : 'classic';
    saveAccent(newAccent);
  };

  const setAccentMode = (mode) => {
    saveAccent(mode);
  };

  const palette = accentMode === 'luxio' ? luxioPalette : classicPalette;
  const baseTheme = isDark ? darkTheme : lightTheme;

  const theme = useMemo(() => ({
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...palette,
    },
  }), [baseTheme, palette]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        themeMode,
        toggleTheme,
        setTheme,
        accentMode,
        toggleAccent,
        setAccentMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeContext;

