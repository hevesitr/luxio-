/**
 * PreferencesContext Tests
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { PreferencesProvider, usePreferences } from '../PreferencesContext';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock Supabase
jest.mock('../../services/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

// Mock Logger
jest.mock('../../services/Logger', () => ({
  sanitizeLogData: jest.fn((data) => data),
  debug: jest.fn(),
  error: jest.fn(),
}));

describe('PreferencesContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide default values', () => {
    const { result } = renderHook(() => usePreferences(), {
      wrapper: PreferencesProvider,
    });

    expect(result.current.discoveryFilters).toEqual({
      ageMin: 18,
      ageMax: 99,
      distanceMax: 50,
      genderPreference: 'everyone',
      relationshipGoal: null,
      showOnlyVerified: false,
    });

    expect(result.current.preferences).toEqual({
      notifications: {
        newMatches: true,
        newMessages: true,
        likes: true,
        superLikes: true,
        promotions: false,
      },
      privacy: {
        showOnlineStatus: true,
        showDistance: true,
        showAge: true,
      },
      theme: 'light',
      language: 'hu',
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should update filters', async () => {
    const { result } = renderHook(() => usePreferences(), {
      wrapper: PreferencesProvider,
    });

    await act(async () => {
      await result.current.updateDiscoveryFilters({ ageMin: 25, ageMax: 35 });
    });

    expect(result.current.discoveryFilters.ageMin).toBe(25);
    expect(result.current.discoveryFilters.ageMax).toBe(35);
  });

  it('should reset all preferences to defaults', async () => {
    const { result } = renderHook(() => usePreferences(), {
      wrapper: PreferencesProvider,
    });

    await act(async () => {
      await result.current.updateDiscoveryFilters({ ageMin: 25, ageMax: 35 });
      await result.current.resetAllPreferences();
    });

    expect(result.current.discoveryFilters.ageMin).toBe(18);
    expect(result.current.discoveryFilters.ageMax).toBe(99);
  });

  it('should update preferences', async () => {
    const { result } = renderHook(() => usePreferences(), {
      wrapper: PreferencesProvider,
    });

    await act(async () => {
      await result.current.updatePreferences({
        notifications: { newMatches: false },
        theme: 'dark',
      });
    });

    expect(result.current.preferences.notifications.newMatches).toBe(false);
    expect(result.current.preferences.theme).toBe('dark');
  });

  it('should reset preferences to defaults', async () => {
    const { result } = renderHook(() => usePreferences(), {
      wrapper: PreferencesProvider,
    });

    await act(async () => {
      await result.current.updatePreferences({ theme: 'dark' });
      await result.current.resetPreferences();
    });

    expect(result.current.preferences.theme).toBe('light');
  });
});
