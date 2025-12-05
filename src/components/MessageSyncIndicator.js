/**
 * MessageSyncIndicator - Üzenetek szinkronizálásának állapotának megjelenítése
 * Követelmény: 4.4 Implement missed message sync
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MessageService from '../services/MessageService';
import Logger from '../services/Logger';

const MessageSyncIndicator = ({ matchId, style }) => {
  const [syncState, setSyncState] = useState('idle'); // idle, syncing, completed, error
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncedMessages, setSyncedMessages] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Listener hozzáadása sync eseményekhez
    const unsubscribe = MessageService.addSyncListener((event, data) => {
      if (matchId && data.matchId !== matchId) return; // Csak a releváns match esetén

      switch (event) {
        case 'syncStarted':
          setSyncState('syncing');
          setSyncProgress(0);
          setSyncedMessages(0);
          showIndicator();
          break;

        case 'syncProgress':
          setSyncProgress(data.progress || 0);
          setSyncedMessages(data.syncedCount || 0);
          break;

        case 'syncCompleted':
          setSyncState('completed');
          setSyncedMessages(data.totalSynced || 0);
          // 2 másodperc után elrejtés
          setTimeout(() => {
            hideIndicator();
            setTimeout(() => setSyncState('idle'), 300); // Fade out után reset
          }, 2000);
          break;

        case 'syncError':
          setSyncState('error');
          setTimeout(() => {
            hideIndicator();
            setTimeout(() => setSyncState('idle'), 300);
          }, 3000);
          break;
      }
    });

    return unsubscribe;
  }, [matchId]);

  const showIndicator = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideIndicator = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const getStatusInfo = () => {
    switch (syncState) {
      case 'syncing':
        return {
          icon: 'sync',
          color: '#2196F3',
          text: `Szinkronizálás... ${syncedMessages} üzenet`,
          spinning: true,
        };
      case 'completed':
        return {
          icon: 'checkmark-circle',
          color: '#4CAF50',
          text: `${syncedMessages} üzenet szinkronizálva`,
          spinning: false,
        };
      case 'error':
        return {
          icon: 'close-circle',
          color: '#F44336',
          text: 'Szinkronizálási hiba',
          spinning: false,
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();
  if (!statusInfo) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          }],
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={statusInfo.icon}
          size={16}
          color={statusInfo.color}
          style={statusInfo.spinning ? styles.spinning : undefined}
        />
        <Text style={[styles.text, { color: statusInfo.color }]}>
          {statusInfo.text}
        </Text>

        {syncState === 'syncing' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${syncProgress}%` },
                ]}
              />
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
  spinning: {
    // React Native Animated spinning lenne ideális, de egyenlőre statikus
  },
  progressContainer: {
    marginLeft: 8,
    flex: 1,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#E0E0E0',
    borderRadius: 1.5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 1.5,
  },
});

export default MessageSyncIndicator;
