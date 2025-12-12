/**
 * Enhanced Network Context with Reconnection Logic
 * 
 * Property: Property 9 - Reconnection Consistency
 * Validates: Requirements 10 (Realtime Reconnection Logic)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { offlineQueueService } from '../services/OfflineQueueService';
import { supabase } from '../services/supabaseClient';

const NetworkContext = createContext();

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};

export const NetworkProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);
  const [lastReconnectionTime, setLastReconnectionTime] = useState(null);

  const MAX_RECONNECTION_ATTEMPTS = 5;
  const BASE_DELAY = 1000; // 1 second

  /**
   * Calculate exponential backoff delay
   */
  const getBackoffDelay = (attempt) => {
    return Math.min(BASE_DELAY * Math.pow(2, attempt), 30000); // Max 30 seconds
  };

  /**
   * Reconnect to services
   */
  const reconnect = useCallback(async () => {
    if (isReconnecting) {
      console.log('[Network] Reconnection already in progress');
      return;
    }

    setIsReconnecting(true);
    console.log('[Network] Starting reconnection...');

    try {
      // Test network connectivity
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        throw new Error('No network connection');
      }

      // Reconnect to Supabase realtime
      const { error: realtimeError } = await supabase.realtime.connect();
      if (realtimeError) {
        console.error('[Network] Realtime reconnection error:', realtimeError);
      } else {
        console.log('[Network] Realtime reconnected successfully');
      }

      // Sync offline queue
      const userId = (await supabase.auth.getUser())?.data?.user?.id;
      if (userId) {
        console.log('[Network] Syncing offline queue...');
        await offlineQueueService.syncQueue(userId, async (action) => {
          // Process queued action
          console.log('[Network] Processing queued action:', action.action);
          // Action processing will be handled by the respective services
        });
      }

      // Reset reconnection attempts on success
      setReconnectionAttempts(0);
      setLastReconnectionTime(new Date());
      console.log('[Network] Reconnection successful');
    } catch (error) {
      console.error('[Network] Reconnection failed:', error);

      // Retry with exponential backoff
      if (reconnectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
        const delay = getBackoffDelay(reconnectionAttempts);
        console.log(`[Network] Retrying in ${delay}ms (attempt ${reconnectionAttempts + 1}/${MAX_RECONNECTION_ATTEMPTS})`);

        setTimeout(() => {
          setReconnectionAttempts(prev => prev + 1);
          setIsReconnecting(false);
          reconnect();
        }, delay);
      } else {
        console.error('[Network] Max reconnection attempts reached');
        setIsReconnecting(false);
      }
    } finally {
      if (reconnectionAttempts >= MAX_RECONNECTION_ATTEMPTS) {
        setIsReconnecting(false);
      }
    }
  }, [isReconnecting, reconnectionAttempts]);

  /**
   * Handle network state change
   */
  const handleNetworkChange = useCallback((state) => {
    const wasOnline = isOnline;
    const nowOnline = state.isConnected && state.isInternetReachable !== false;

    setIsOnline(nowOnline);

    if (!wasOnline && nowOnline) {
      // Network restored
      console.log('[Network] Network restored, initiating reconnection');
      setReconnectionAttempts(0);
      reconnect();
    } else if (wasOnline && !nowOnline) {
      // Network lost
      console.log('[Network] Network lost');
    }
  }, [isOnline, reconnect]);

  /**
   * Initialize network monitoring
   */
  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    // Get initial network state
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
    });

    return () => {
      unsubscribe();
    };
  }, [handleNetworkChange]);

  /**
   * Manual reconnection trigger
   */
  const triggerReconnection = useCallback(() => {
    setReconnectionAttempts(0);
    reconnect();
  }, [reconnect]);

  const value = {
    isOnline,
    isReconnecting,
    reconnectionAttempts,
    lastReconnectionTime,
    reconnect: triggerReconnection,
    getReconnectionStatus: () => ({
      isReconnecting,
      attempts: reconnectionAttempts,
      maxAttempts: MAX_RECONNECTION_ATTEMPTS,
      lastReconnectionTime,
    }),
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export default NetworkContext;
