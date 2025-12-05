/**
 * NotificationContext Tests
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { NotificationProvider, useNotifications } from '../NotificationContext';

// Mock Supabase
jest.mock('../../services/supabaseClient', () => ({
  supabase: {
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(),
      })),
      unsubscribe: jest.fn(),
    })),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
      delete: jest.fn(() => ({
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

// Mock AuthContext
jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

describe('NotificationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide default values', () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: NotificationProvider,
    });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('should add notification', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: NotificationProvider,
    });

    const newNotification = {
      id: '1',
      type: 'message',
      title: 'New message',
      message: 'You have a new message',
      read: false,
      createdAt: new Date().toISOString(),
    };

    await act(async () => {
      await result.current.addNotification(newNotification);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toEqual(newNotification);
    expect(result.current.unreadCount).toBe(1);
  });

  it('should mark notification as read', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: NotificationProvider,
    });

    const notification = {
      id: '1',
      type: 'message',
      title: 'New message',
      message: 'You have a new message',
      read: false,
      createdAt: new Date().toISOString(),
    };

    await act(async () => {
      await result.current.addNotification(notification);
      await result.current.markAsRead('1');
    });

    expect(result.current.notifications[0].read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('should mark all notifications as read', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: NotificationProvider,
    });

    const notifications = [
      {
        id: '1',
        type: 'message',
        title: 'Message 1',
        message: 'Message 1',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'match',
        title: 'New match',
        message: 'You have a new match',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];

    await act(async () => {
      await result.current.addNotification(notifications[0]);
      await result.current.addNotification(notifications[1]);
      await result.current.markAllAsRead();
    });

    expect(result.current.notifications[0].read).toBe(true);
    expect(result.current.notifications[1].read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('should clear all notifications', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: NotificationProvider,
    });

    const notification = {
      id: '1',
      type: 'message',
      title: 'New message',
      message: 'You have a new message',
      read: false,
      createdAt: new Date().toISOString(),
    };

    await act(async () => {
      await result.current.addNotification(notification);
      await result.current.clearNotifications();
    });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('should limit notifications to 50', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: NotificationProvider,
    });

    const notifications = Array.from({ length: 60 }, (_, i) => ({
      id: `${i + 1}`,
      type: 'message',
      title: `Message ${i + 1}`,
      message: `Message ${i + 1}`,
      read: false,
      createdAt: new Date().toISOString(),
    }));

    await act(async () => {
      for (const notification of notifications) {
        await result.current.addNotification(notification);
      }
    });

    expect(result.current.notifications).toHaveLength(50);
    expect(result.current.unreadCount).toBe(50);
  });
});
