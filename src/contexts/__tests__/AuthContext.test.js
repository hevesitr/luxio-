/**
 * AuthContext Test Suite
 * Tests authentication state management
 */
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import AuthService from '../../services/AuthService';

// Mock AuthService
jest.mock('../../services/AuthService');
jest.mock('../../services/AnalyticsService');
jest.mock('../../services/Logger');

const TestComponent = () => {
  const auth = useAuth();
  return null;
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('provides authentication context', () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockSession = { user: mockUser };

    AuthService.getCurrentUser.mockResolvedValue({
      success: true,
      user: mockUser
    });
    AuthService.session = mockSession;
    AuthService.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Context should be provided without throwing errors
    expect(AuthService.getCurrentUser).toHaveBeenCalled();
  });

  test('throws error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );

    consoleSpy.mockRestore();
  });
});
