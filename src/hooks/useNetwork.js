/**
 * useNetwork - Network connectivity hook
 * Követelmény: Offline mode implementation
 */
import { useState, useEffect, useCallback } from 'react';
import { NetInfo } from '@react-native-community/netinfo';
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
    // Kezdeti állapot lekérése
    NetInfo.fetch().then(state => {
      updateNetworkState(state);
    });

    // Listener hozzáadása
    const unsubscribe = NetInfo.addEventListener(updateNetworkState);

    return () => {
      unsubscribe();
    };
  }, []);

  const updateNetworkState = useCallback((state) => {
    const wasOnline = isOnline;
    const nowOnline = state.isConnected && state.isInternetReachable;

    setNetworkState({
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      details: state.details,
    });

    setIsOnline(nowOnline);

    // Log változás
    if (wasOnline !== nowOnline) {
      Logger.info('Network connectivity changed', {
        wasOnline,
        nowOnline,
        type: state.type,
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      });
    }
  }, [isOnline]);

  const retryConnection = useCallback(async () => {
    try {
      const state = await NetInfo.refresh();
      Logger.info('Network refresh attempted', { newState: state });
      return state;
    } catch (error) {
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
