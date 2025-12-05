/**
 * NotificationContext Test Suite
 * Tests notification state management
 */
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { NotificationProvider, useNotifications } from '../NotificationContext';

// Mock dependencies
jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: { id: '123' },
    isAuthenticated: true
  })
}));
jest.mock('../../services/MessageService');
jest.mock('../../services/supabaseClient', () => ({
  supabase: {
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn()
      }))
    }))
  }
}));
jest.mock('../../services/Logger');

const TestComponent = () => {
  const notifications = useNotifications();
  return null;
};

describe('NotificationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('provides notification context', async () => {
    await act(async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );
    });

    // Context should be provided without throwing errors
  });

  test('throws error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useNotifications must be used within a NotificationProvider'
    );

    consoleSpy.mockRestore();
  });

  test('initializes with zero unread count', async () => {
    let contextValue;
    const TestConsumer = () => {
      contextValue = useNotifications();
      return null;
    };

    await act(async () => {
      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );
    });

    expect(contextValue.unreadCount).toBe(0);
    expect(contextValue.notifications).toEqual([]);
  });
});
