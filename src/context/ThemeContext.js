import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Global fallback theme for runtime not ready scenarios
export const FALLBACK_THEME = {
  colors: {
    background: '#0F0F23',
    surface: '#1A1A2E',
    card: '#334155',
    text: '#00D4FF',
    textSecondary: '#06B6D4',
    textTertiary: '#00FF88',
    border: '#475569',
    primary: '#00D4FF',
    primaryLight: '#4ADE80',
    primaryDark: '#06B6D4',
    secondary: '#8B5CF6',
    accent: '#00FF88',
    success: '#00FF88',
    warning: '#FF6B35',
    error: '#FF0080',
    info: '#06B6D4',
    purple: '#8B5CF6',
    overlay: 'rgba(15, 15, 35, 0.8)',
    shadow: 'rgba(0, 212, 255, 0.3)',
    gradient: ['#00D4FF', '#8B5CF6'],
  },
  sizes: {
    small: 12,
    medium: 16,
    large: 20,
    xlarge: 24
  }
};

const THEME_STORAGE_KEY = '@app_theme';
const ACCENT_STORAGE_KEY = '@app_accent';

const lightTheme = {
  mode: 'light',
  colors: {
    background: '#0F0F23', // Deep Space
    surface: '#1A1A2E', // Dark Charcoal
    card: '#16213E', // Navy Blue
    text: '#00D4FF', // Electric Blue
    textSecondary: '#06B6D4', // Bright Cyan
    textTertiary: '#00FF88', // Cyber Green
    border: '#0F3460', // Dark Blue
    primary: '#00D4FF', // Electric Blue
    primaryLight: '#4ADE80',
    primaryDark: '#06B6D4',
    secondary: '#8B5CF6', // Neon Purple
    accent: '#00FF88', // Cyber Green
    success: '#00FF88', // Cyber Green
    warning: '#FF6B35', // Orange Glow
    error: '#FF0080', // Magenta
    info: '#06B6D4', // Bright Cyan
    purple: '#8B5CF6',
    overlay: 'rgba(15, 15, 35, 0.8)',
    shadow: 'rgba(0, 212, 255, 0.3)',
    gradient: ['#00D4FF', '#8B5CF6'], // Futurisztikus gradient
  },
};

const darkTheme = {
  mode: 'dark',
  colors: {
    background: '#0A0A1E', // Ultra Dark Space
    surface: '#0F0F23', // Deep Space
    card: '#1A1A2E', // Dark Charcoal
    text: '#00D4FF', // Electric Blue
    textSecondary: '#06B6D4', // Bright Cyan
    textTertiary: '#00FF88', // Cyber Green
    border: '#0F3460', // Dark Blue
    primary: '#00D4FF', // Electric Blue
    primaryLight: '#4ADE80',
    primaryDark: '#06B6D4',
    secondary: '#8B5CF6', // Neon Purple
    accent: '#00FF88', // Cyber Green
    success: '#00FF88', // Cyber Green
    warning: '#FF6B35', // Orange Glow
    error: '#FF0080', // Magenta
    info: '#06B6D4', // Bright Cyan
    purple: '#8B5CF6',
    overlay: 'rgba(10, 10, 30, 0.9)',
    shadow: 'rgba(0, 212, 255, 0.4)',
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
  const [themeMode, setThemeMode] = useState('dark'); // 'light', 'dark', 'system'
  const [isDark, setIsDark] = useState(true);

  // Set global theme fallback immediately
  useEffect(() => {
    if (typeof global !== 'undefined') {
      global.theme = FALLBACK_THEME;
      global.themeContext = { theme: FALLBACK_THEME };
    }
  }, []);
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
    // Fallback theme for runtime not ready scenarios
    console.log('ThemeContext not available, using fallback theme');
    return {
      theme: FALLBACK_THEME,
      isDark: true,
      themeMode: 'dark',
      toggleTheme: () => {},
      setTheme: () => {},
      accentMode: 'classic',
      toggleAccent: () => {},
      setAccentMode: () => {},
    };
  }
  return context;
};

export default ThemeContext;

