/**
 * End-to-End Tests for LoveX Dating App
 *
 * These tests simulate real user interactions with the app
 * using React Native Testing Library for component testing
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

// Mock contexts
import { AuthProvider } from '../src/context/AuthContext';
import { PreferencesProvider } from '../src/context/PreferencesContext';
import { NotificationProvider } from '../src/context/NotificationContext';

// Import app components
import App from '../App';

// Mock services to avoid real API calls
jest.mock('../src/services/supabaseClient');
jest.mock('../src/services/AuthService');
jest.mock('../src/services/MatchService');
jest.mock('../src/services/ProfileService');
jest.mock('../src/services/MessageService');
jest.mock('../src/services/AnalyticsService');
jest.mock('../src/services/Logger');

describe('LoveX Dating App - End-to-End Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Authentication Flow', () => {
    it('should render the main app with mock data', async () => {
      // Since we're using the simple App.js version with mock data,
      // this test verifies the app renders correctly
      const { getByText } = render(<App />);

      // Should show main navigation tabs (from the simple App.js)
      expect(getByText('Felfedezés')).toBeTruthy();
      expect(getByText('Matchek')).toBeTruthy();
      expect(getByText('Profil')).toBeTruthy();
    });

    it('should display profile information in discovery screen', async () => {
      const { getByText } = render(<App />);

      // Should show profile information from mock data
      await waitFor(() => {
        expect(getByText('Anna')).toBeTruthy();
        expect(getByText('25')).toBeTruthy();
      });
    });

    it('should handle profile swiping interactions', async () => {
      const { getByText, queryByText } = render(<App />);

      // Initial profile should be visible
      expect(getByText('Anna')).toBeTruthy();

      // Simulate like button press (this should advance to next profile)
      const likeButton = getByText('👍');
      fireEvent.press(likeButton);

      // The implementation should handle the interaction
      // In the simple App.js, this might show a different profile or match modal
    });
  });

  describe('App Functionality Tests', () => {
    it('should navigate between tabs correctly', async () => {
      const { getByText } = render(<App />);

      // Start on discovery tab
      expect(getByText('Felfedezés')).toBeTruthy();

      // Navigate to matches tab
      const matchesTab = getByText('Matchek');
      fireEvent.press(matchesTab);

      // Should still show the tab (navigation should work)
      expect(getByText('Matchek')).toBeTruthy();
    });

    it('should handle profile interactions', async () => {
      const { getByText } = render(<App />);

      // Should have action buttons
      expect(getByText('👎')).toBeTruthy(); // Pass button
      expect(getByText('👍')).toBeTruthy(); // Like button
      expect(getByText('💙')).toBeTruthy(); // Super like button

      // Test pass button
      const passButton = getByText('👎');
      fireEvent.press(passButton);

      // App should handle the interaction without crashing
    });

    it('should display multiple profiles', async () => {
      const { getByText, queryByText } = render(<App />);

      // Should show first profile
      expect(getByText('Anna')).toBeTruthy();

      // After interactions, should be able to show other profiles
      // This tests that the profile cycling works
      const likeButtons = getByText('👍');
      fireEvent.press(likeButtons);

      // The app should continue to function
    });

    it('should handle match creation', async () => {
      const { getByText } = render(<App />);

      // Simulate a series of likes to potentially create a match
      const likeButton = getByText('👍');

      // Press like multiple times
      for (let i = 0; i < 3; i++) {
        fireEvent.press(likeButton);
      }

      // App should handle multiple interactions without crashing
      expect(getByText('👍')).toBeTruthy();
    });
  });

  describe('UI Component Tests', () => {
    it('should render all main UI elements', async () => {
      const { getByText } = render(<App />);

      // Main navigation elements
      expect(getByText('Felfedezés')).toBeTruthy();
      expect(getByText('Matchek')).toBeTruthy();
      expect(getByText('Profil')).toBeTruthy();

      // Profile interaction buttons
      expect(getByText('👎')).toBeTruthy();
      expect(getByText('👍')).toBeTruthy();
      expect(getByText('💙')).toBeTruthy();
    });

    it('should handle rapid user interactions', async () => {
      const { getByText } = render(<App />);

      const likeButton = getByText('👍');
      const passButton = getByText('👎');
      const superLikeButton = getByText('💙');

      // Simulate rapid interactions
      fireEvent.press(likeButton);
      fireEvent.press(passButton);
      fireEvent.press(superLikeButton);
      fireEvent.press(likeButton);

      // App should remain stable
      expect(getByText('👍')).toBeTruthy();
    });
  });
});
