/**
 * RealtimeConnectionIndicator - Real-time kapcsolat állapotának megjelenítése
 * Követelmény: 4.3 Enhance realtime reconnection logic
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RealtimeConnectionManager from '../services/RealtimeConnectionManager';
import Logger from '../services/Logger';

const RealtimeConnectionIndicator = ({ style }) => {
  const [connectionState, setConnectionState] = useState('disconnected');
  const [showDetails, setShowDetails] = useState(false);
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    // Listener hozzáadása
    const unsubscribe = RealtimeConnectionManager.addListener((event, data) => {
      switch (event) {
        case 'stateChanged':
          setConnectionState(data.to);
          updateMetrics();
          break;
        case 'disconnected':
          setConnectionState('disconnected');
          if (!data.manual) {
            // Automatikus újrakapcsolódás folyamatban
            Logger.info('Connection lost, attempting reconnection');
          }
          break;
        case 'error':
          setConnectionState('error');
          break;
        case 'maxRetriesReached':
          Alert.alert(
            'Kapcsolati hiba',
            'Nem sikerült újrakapcsolódni a szerverhez. Kérjük, ellenőrizze internetkapcsolatát és próbálja újra.',
            [
              { text: 'Újrapróbálkozás', onPress: () => RealtimeConnectionManager.reconnectNow() },
              { text: 'Rendben' }
            ]
          );
          break;
      }
    });

    // Kezdeti állapot
    setConnectionState(RealtimeConnectionManager.connectionState);
    updateMetrics();

    return unsubscribe;
  }, []);

  const updateMetrics = () => {
    setMetrics(RealtimeConnectionManager.getConnectionMetrics());
  };

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected':
        return { name: 'wifi', color: '#4CAF50' };
      case 'connecting':
        return { name: 'refresh-circle', color: '#FF9800' };
      case 'error':
        return { name: 'warning', color: '#F44336' };
      default:
        return { name: 'cloud-offline', color: '#9E9E9E' };
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Kapcsolódva';
      case 'connecting':
        return 'Kapcsolódás...';
      case 'error':
        return 'Hiba';
      default:
        return 'Nincs kapcsolat';
    }
  };

  const handlePress = () => {
    if (connectionState === 'disconnected' || connectionState === 'error') {
      RealtimeConnectionManager.reconnectNow();
    } else {
      setShowDetails(!showDetails);
    }
  };

  const formatUptime = (ms) => {
    if (!ms) return '0s';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
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
          name={connectionState === 'connecting' ? 'refresh-circle' : icon.name}
          size={16}
          color={icon.color}
          style={connectionState === 'connecting' ? styles.spinning : undefined}
        />
        <Text style={[styles.statusText, { color: icon.color }]}>
          {getStatusText()}
        </Text>

        {(connectionState === 'disconnected' || connectionState === 'error') && (
          <Ionicons name="refresh" size={14} color="#666" style={styles.retryIcon} />
        )}
      </TouchableOpacity>

      {showDetails && connectionState === 'connected' && (
        <View style={styles.details}>
          <Text style={styles.detailText}>
            Uptime: {formatUptime(metrics.uptime)}
          </Text>
          <Text style={styles.detailText}>
            Újrakapcsolódások: {metrics.totalReconnects}
          </Text>
          {metrics.averageReconnectTime > 0 && (
            <Text style={styles.detailText}>
              Átl. újrakapcsolódás: {Math.round(metrics.averageReconnectTime / 1000)}s
            </Text>
          )}
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
  retryIcon: {
    marginLeft: 4,
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

export default RealtimeConnectionIndicator;
