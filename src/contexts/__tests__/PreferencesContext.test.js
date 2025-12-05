/**
 * PreferencesContext Test Suite
 * Tests user preferences state management
 */
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { PreferencesProvider, usePreferences } from '../PreferencesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: { id: '123' },
    isAuthenticated: true
  })
}));
jest.mock('../../services/SupabaseMatchService');
jest.mock('../../services/Logger');

const TestComponent = () => {
  const prefs = usePreferences();
  return null;
};

describe('PreferencesContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
  });

  test('provides preferences context', async () => {
    await act(async () => {
      render(
        <PreferencesProvider>
          <TestComponent />
        </PreferencesProvider>
      );
    });

    // Context should be provided without throwing errors
    expect(AsyncStorage.getItem).toHaveBeenCalled();
  });

  test('throws error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'usePreferences must be used within a PreferencesProvider'
    );

    consoleSpy.mockRestore();
  });

  test('loads default preferences', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);

    let contextValue;
    const TestConsumer = () => {
      contextValue = usePreferences();
      return null;
    };

    await act(async () => {
      render(
        <PreferencesProvider>
          <TestConsumer />
        </PreferencesProvider>
      );
    });

    expect(contextValue.preferences.ageMin).toBe(18);
    expect(contextValue.preferences.distanceMax).toBe(50);
  });
});
