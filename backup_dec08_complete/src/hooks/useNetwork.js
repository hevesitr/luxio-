/**
 * useNetwork - Network connectivity hook
 * Követelmény: Offline mode implementation
 *
 * NOTE: Simplified implementation using browser APIs for web compatibility
 * For native apps, consider using expo-network or @react-native-community/netinfo
 */
import { useState, useEffect, useCallback } from 'react';
import Logger from '../services/Logger';

const useNetwork = () => {
  const [networkState, setNetworkState] = useState({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    details: null,
  });

  const [isOnline, setIsOnline] = useState(true);

  const updateNetworkState = useCallback(() => {
    // Simple network detection using navigator.onLine
    const nowOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const wasOnline = isOnline;

    setNetworkState({
      isConnected: nowOnline,
      isInternetReachable: nowOnline,
      type: 'unknown',
      details: null,
    });

    setIsOnline(nowOnline);

    // Log változás
    if (wasOnline !== nowOnline) {
      Logger.info('Network connectivity changed', {
        wasOnline,
        nowOnline,
      });
    }
  }, [isOnline]);

  useEffect(() => {
    // Kezdeti állapot lekérése
    updateNetworkState();

    // Listen for online/offline events if available
    if (typeof window !== 'undefined') {
      window.addEventListener('online', updateNetworkState);
      window.addEventListener('offline', updateNetworkState);

      return () => {
        window.removeEventListener('online', updateNetworkState);
        window.removeEventListener('offline', updateNetworkState);
      };
    }
  }, [updateNetworkState]);

  const retryConnection = useCallback(async () => {
    try {
      updateNetworkState();
      Logger.info('Network refresh attempted');
      return networkState;
    } catch (error) {
      Logger.error('Network refresh failed', error);
      throw error;
    }
  }, [updateNetworkState, networkState]);

  return {
    ...networkState,
    isOnline,
    isOffline: !isOnline,
    retryConnection,
  };
};

export default useNetwork;
