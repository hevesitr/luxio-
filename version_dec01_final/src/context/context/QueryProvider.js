/**
 * React Query Provider Setup
 * Provides caching and data synchronization
 */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Logger from '../services/Logger';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep in cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Retry delay
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Error handling
      onError: (error) => {
        Logger.error('React Query error', error);
      },
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Error handling
      onError: (error) => {
        Logger.error('React Query mutation error', error);
      },
    },
  },
});

const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider;
export { queryClient };
