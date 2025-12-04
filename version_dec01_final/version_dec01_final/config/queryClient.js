import { QueryClient } from '@tanstack/react-query';
import Logger from '../services/Logger';

/**
 * React Query Client Configuration
 * 
 * Centralized caching and data fetching configuration
 * - 5 minute stale time for most queries
 * - 10 minute cache time
 * - Automatic retry on failure
 * - Background refetch on window focus
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Cache time: how long inactive data stays in cache
      cacheTime: 10 * 60 * 1000, // 10 minutes
      
      // Retry failed requests
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus
      refetchOnWindowFocus: true,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      
      // Error handling
      onError: (error) => {
        Logger.error('Query error', error);
      },
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      
      // Error handling
      onError: (error) => {
        Logger.error('Mutation error', error);
      },
    },
  },
});

/**
 * Query Keys
 * 
 * Centralized query key definitions for type safety and consistency
 */
export const queryKeys = {
  // Profiles
  profiles: {
    all: ['profiles'],
    discovery: (userId, filters) => ['profiles', 'discovery', userId, filters],
    detail: (profileId) => ['profiles', 'detail', profileId],
    matches: (userId) => ['profiles', 'matches', userId],
  },
  
  // Messages
  messages: {
    all: ['messages'],
    conversation: (matchId) => ['messages', 'conversation', matchId],
    unread: (userId) => ['messages', 'unread', userId],
  },
  
  // User
  user: {
    profile: (userId) => ['user', 'profile', userId],
    preferences: (userId) => ['user', 'preferences', userId],
    premium: (userId) => ['user', 'premium', userId],
  },
  
  // Stories
  stories: {
    all: ['stories'],
    user: (userId) => ['stories', 'user', userId],
  },
};

export default queryClient;
