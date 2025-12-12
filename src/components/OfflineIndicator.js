/**
 * OfflineIndicator - Offline/online állapot és szinkronizálási státusz megjelenítése
 * Követelmény: Offline mode implementation
 * 
 * NOTE: Simplified implementation without external dependencies
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OfflineQueueService from '../services/OfflineQueueService';
import Logger from '../services/Logger';

const OfflineIndicator = ({ style }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [pendingOperations, setPendingOperations] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, completed, error

  useEffect(() => {
    // Network állapot ellenőrzése NetInfo-val (React Native kompatibilis)
    const checkNetworkStatus = async () => {
      try {
        // React Native-ben nincs navigator.onLine, mindig online-nak tekintjük
        setIsConnected(true);
      } catch (error) {
        Logger.error('Failed to check network status', error);
      }
    };

    // Kezdeti ellenőrzés
    checkNetworkStatus();

    // Offline queue állapotának figyelése
    const checkQueueStatus = async () => {
      try {
        const queueLength = await getPendingOperationsCount();
        setPendingOperations(queueLength);
      } catch (error) {
        Logger.error('Failed to get queue status', error);
      }
    };

    checkQueueStatus();

    // Cleanup
    return () => {
      // No cleanup needed
    };
  }, []);

  const getPendingOperationsCount = async () => {
    // Placeholder - valódi implementációban lekérdezzük az offline queue-t
    return 0;
  };

  const startSync = async () => {
    if (pendingOperations === 0 || syncStatus === 'syncing') return;

    setSyncStatus('syncing');
    Logger.info('Starting offline sync', { pendingOperations });

    try {
      // Offline queue feldolgozása
      await OfflineQueueService.processPendingOperations();

      setSyncStatus('completed');
      setPendingOperations(0);

      // Sikeres szinkronizálás után visszaállítjuk az állapotot
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);

    } catch (error) {
      Logger.error('Offline sync failed', error);
      setSyncStatus('error');

      Alert.alert(
        'Szinkronizálási hiba',
        'Nem sikerült szinkronizálni az offline műveleteket. Kérjük, próbálja újra később.',
        [{ text: 'Rendben' }]
      );

      setTimeout(() => {
        setSyncStatus('idle');
      }, 5000);
    }
  };

  const handlePress = () => {
    if (!isConnected) {
      Alert.alert(
        'Nincs internetkapcsolat',
        'Kérjük, ellenőrizze internetkapcsolatát és próbálja újra.',
        [{ text: 'Rendben' }]
      );
    } else if (pendingOperations > 0) {
      Alert.alert(
        'Offline műveletek szinkronizálása',
        `${pendingOperations} offline művelet vár feldolgozásra. Szeretné most szinkronizálni?`,
        [
          { text: 'Később', style: 'cancel' },
          { text: 'Szinkronizálás', onPress: startSync }
        ]
      );
    } else {
      setShowDetails(!showDetails);
    }
  };

  const getStatusIcon = () => {
    if (!isConnected) {
      return { name: 'cloud-offline', color: '#F44336' };
    }

    if (syncStatus === 'syncing') {
      return { name: 'sync', color: '#FF9800' };
    }

    if (pendingOperations > 0) {
      return { name: 'cloud-upload', color: '#FF9800' };
    }

    return { name: 'cloud-done', color: '#4CAF50' };
  };

  const getStatusText = () => {
    if (!isConnected) {
      return 'Offline';
    }

    if (syncStatus === 'syncing') {
      return 'Szinkronizálás...';
    }

    if (pendingOperations > 0) {
      return `${pendingOperations} várakozik`;
    }

    return 'Online';
  };

  const icon = getStatusIcon();

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.indicator}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Ionicons
          name={syncStatus === 'syncing' ? 'sync' : icon.name}
          size={16}
          color={icon.color}
          style={syncStatus === 'syncing' ? styles.spinning : undefined}
        />
        <Text style={[styles.statusText, { color: icon.color }]}>
          {getStatusText()}
        </Text>

        {pendingOperations > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingOperations}</Text>
          </View>
        )}
      </TouchableOpacity>

      {showDetails && isConnected && (
        <View style={styles.details}>
          <Text style={styles.detailText}>
            Kapcsolat: {isConnected ? 'Online' : 'Offline'}
          </Text>
          <Text style={styles.detailText}>
            Függőben lévő műveletek: {pendingOperations}
          </Text>
          <Text style={styles.detailText}>
            Szinkronizálási állapot: {syncStatus}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  badge: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  spinning: {
    // CSS animation kellene, de React Native-ben használhatunk Animated-t
    // Egyenlőre statikus ikon
  },
  details: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 200,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});

export default OfflineIndicator;
