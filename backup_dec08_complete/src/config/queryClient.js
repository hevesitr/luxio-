import { QueryClient } from '@tanstack/react-query';
import Logger from '../services/Logger';

/**
 * ✅ KRITIKUS JAVÍTÁSOK: React Query Client Configuration
 *
 * Real-time dating app optimalizálva:
 * - 30 másodperc stale time (nem 5 perc!)
 * - 24 óra cache time offline support-hoz
 * - Okosabb retry logika (nem próbálkozik 4xx hibáknál)
 * - Real-time frissítések minden interakciónál
 * - Offline-first megközelítés
 */
// ✅ KRITIKUS JAVÍTÁS: Real-time app optimalizálás
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ JAVÍTOTT: Real-time apphoz rövidebb stale time
      staleTime: 30 * 1000, // 30 seconds (nem 5 perc!)

      // ✅ JAVÍTOTT: Offline support-tal
      cacheTime: 24 * 60 * 60 * 1000, // 24 hours for offline support
      
      // ✅ JAVÍTOTT: Okosabb retry logika
      retry: (failureCount, error) => {
        // Ne próbálkozz 4xx hibáknál (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // ✅ JAVÍTOTT: Real-time app beállítások
      refetchOnWindowFocus: 'always', // Mindig frissít focus-ra
      refetchOnReconnect: 'always', // Mindig frissít reconnectkor
      refetchOnMount: true, // Frissít mountkor (real-time data)

      // ✅ ÚJ: Network mode - offline support
      networkMode: 'always', // Mindig próbál fetch-elni
      
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
