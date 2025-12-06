/**
 * useNetwork - Network connectivity hook
 * Követelmény: Offline mode implementation
 * 
 * NOTE: Simplified implementation without external dependencies
 * For production, consider using expo-network or @react-native-community/netinfo
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

  useEffect(() => {
    // Simple online/offline detection using browser/React Native events
    const handleOnline = () => {
      setNetworkState(prev => ({
        ...prev,
        isConnected: true,
        isInternetReachable: true,
      }));
      setIsOnline(true);
      Logger.info('Network connectivity: ONLINE');
    };

    const handleOffline = () => {
      setNetworkState(prev => ({
        ...prev,
        isConnected: false,
        isInternetReachable: false,
      }));
      setIsOnline(false);
      Logger.info('Network connectivity: OFFLINE');
    };

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const retryConnection = useCallback(async () => {
    try {
      // Simple connectivity check by attempting a fetch
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        mode: 'no-cors',
      });
      
      const newState = {
        isConnected: true,
        isInternetReachable: true,
        type: 'unknown',
      };
      
      setNetworkState(newState);
      setIsOnline(true);
      
      Logger.info('Network refresh attempted', { newState });
      return newState;
    } catch (error) {
      const newState = {
        isConnected: false,
        isInternetReachable: false,
        type: 'unknown',
      };
      
      setNetworkState(newState);
      setIsOnline(false);
      
      Logger.error('Network refresh failed', error);
      throw error;
    }
  }, []);

  return {
    ...networkState,
    isOnline,
    isOffline: !isOnline,
    retryConnection,
  };
};

export default useNetwork;
