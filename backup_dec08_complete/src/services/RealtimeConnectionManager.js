/**
 * RealtimeConnectionManager - Real-time kapcsolat kezelés és újrakapcsolódás
 * Követelmény: 4.3 Enhance realtime reconnection logic
 */
import { supabase } from './supabaseClient';
import Logger from './Logger';

class RealtimeConnectionManager {
  constructor() {
    this.connectionState = 'disconnected'; // disconnected, connecting, connected, error
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.baseReconnectDelay = 1000; // 1 másodperc
    this.maxReconnectDelay = 30000; // 30 másodperc
    this.reconnectTimer = null;
    this.listeners = [];
    this.isDestroyed = false;

    // Connection quality metrics
    this.connectionMetrics = {
      lastConnected: null,
      lastDisconnected: null,
      totalReconnects: 0,
      averageReconnectTime: 0,
      connectionUptime: 0,
    };
  }

  /**
   * Manager inicializálása
   */
  async initialize() {
    if (this.isDestroyed) return;

    Logger.info('RealtimeConnectionManager: Initializing...');

    // Supabase realtime connection monitoring
    this.setupConnectionMonitoring();

    // Kezdeti kapcsolat teszt
    await this.testConnection();

    Logger.success('RealtimeConnectionManager: Initialized');
  }

  /**
   * Kapcsolat monitoring beállítása
   */
  setupConnectionMonitoring() {
    // Supabase connection state changes
    supabase.realtime.setAuth(supabase.auth.getSession());

    // Connection event listeners
    supabase.realtime.on('connected', () => {
      this.handleConnectionEstablished();
    });

    supabase.realtime.on('disconnected', (reason) => {
      this.handleConnectionLost(reason);
    });

    supabase.realtime.on('error', (error) => {
      this.handleConnectionError(error);
    });

    // Auth state changes affect realtime connection
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        supabase.realtime.setAuth(session);
        this.attemptReconnection();
      } else if (event === 'SIGNED_OUT') {
        this.disconnect();
      }
    });
  }

  /**
   * Kapcsolat tesztelése
   */
  async testConnection() {
    try {
      this.updateConnectionState('connecting');

      // Simple ping test
      const testChannel = supabase.channel('connection-test');
      const timeout = setTimeout(() => {
        testChannel.unsubscribe();
        this.handleConnectionError(new Error('Connection test timeout'));
      }, 5000);

      await new Promise((resolve, reject) => {
        testChannel
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              clearTimeout(timeout);
              testChannel.unsubscribe();
              resolve();
            } else if (status === 'CHANNEL_ERROR') {
              clearTimeout(timeout);
              reject(new Error('Channel subscription failed'));
            }
          });
      });

      this.handleConnectionEstablished();
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  /**
   * Sikeres kapcsolat kezelése
   */
  handleConnectionEstablished() {
    const now = Date.now();

    this.updateConnectionState('connected');
    this.reconnectAttempts = 0;

    // Metrics frissítés
    this.connectionMetrics.lastConnected = now;
    this.connectionMetrics.totalReconnects++;

    if (this.connectionMetrics.lastDisconnected) {
      const reconnectTime = now - this.connectionMetrics.lastDisconnected;
      this.updateAverageReconnectTime(reconnectTime);
    }

    Logger.success('RealtimeConnectionManager: Connection established', {
      reconnectAttempts: this.reconnectAttempts,
      metrics: this.connectionMetrics,
    });

    this.notifyListeners('connected');
  }

  /**
   * Elveszett kapcsolat kezelése
   */
  handleConnectionLost(reason) {
    const now = Date.now();

    this.updateConnectionState('disconnected');
    this.connectionMetrics.lastDisconnected = now;

    Logger.warn('RealtimeConnectionManager: Connection lost', {
      reason,
      reconnectAttempts: this.reconnectAttempts,
    });

    this.notifyListeners('disconnected', { reason });

    // Automatikus újrakapcsolódás, ha nem vagyunk megsemmisítve
    if (!this.isDestroyed) {
      this.scheduleReconnection();
    }
  }

  /**
   * Kapcsolati hiba kezelése
   */
  handleConnectionError(error) {
    this.updateConnectionState('error');

    Logger.error('RealtimeConnectionManager: Connection error', error);

    this.notifyListeners('error', { error: error.message });

    // Újrakapcsolódás ütemezése
    if (!this.isDestroyed) {
      this.scheduleReconnection();
    }
  }

  /**
   * Újrakapcsolódás ütemezése exponenciális backoff-fal
   */
  scheduleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      Logger.error('RealtimeConnectionManager: Max reconnection attempts reached');
      this.notifyListeners('maxRetriesReached');
      return;
    }

    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    this.reconnectAttempts++;

    Logger.info('RealtimeConnectionManager: Scheduling reconnection', {
      attempt: this.reconnectAttempts,
      delay: delay / 1000 + 's',
    });

    this.reconnectTimer = setTimeout(() => {
      this.attemptReconnection();
    }, delay);
  }

  /**
   * Újrakapcsolódás megkísérlése
   */
  async attemptReconnection() {
    if (this.isDestroyed) return;

    Logger.info('RealtimeConnectionManager: Attempting reconnection', {
      attempt: this.reconnectAttempts,
    });

    try {
      await this.testConnection();
    } catch (error) {
      Logger.warn('RealtimeConnectionManager: Reconnection attempt failed', error);
      // scheduleReconnection will be called by handleConnectionError
    }
  }

  /**
   * Manuális újrakapcsolódás
   */
  async reconnectNow() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.reconnectAttempts = 0;
    await this.attemptReconnection();
  }

  /**
   * Kapcsolat bontása
   */
  disconnect() {
    this.updateConnectionState('disconnected');

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Supabase realtime disconnect
    supabase.realtime.disconnect();

    Logger.info('RealtimeConnectionManager: Disconnected');
    this.notifyListeners('disconnected', { manual: true });
  }

  /**
   * Connection state frissítés
   */
  updateConnectionState(state) {
    const oldState = this.connectionState;
    this.connectionState = state;

    if (oldState !== state) {
      Logger.debug('RealtimeConnectionManager: State changed', {
        from: oldState,
        to: state,
      });

      this.notifyListeners('stateChanged', { from: oldState, to: state });
    }
  }

  /**
   * Átlagos újrakapcsolódási idő frissítés
   */
  updateAverageReconnectTime(reconnectTime) {
    const metrics = this.connectionMetrics;
    const totalReconnects = metrics.totalReconnects;

    if (totalReconnects === 1) {
      metrics.averageReconnectTime = reconnectTime;
    } else {
      metrics.averageReconnectTime =
        (metrics.averageReconnectTime * (totalReconnects - 1) + reconnectTime) / totalReconnects;
    }
  }

  /**
   * Event listener hozzáadása
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Listener-ek értesítése
   */
  notifyListeners(event, data = {}) {
    if (this.isDestroyed) return;

    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        Logger.error('RealtimeConnectionManager: Listener error', error);
      }
    });
  }

  /**
   * Connection metrics lekérése
   */
  getConnectionMetrics() {
    return {
      ...this.connectionMetrics,
      currentState: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      uptime: this.calculateUptime(),
    };
  }

  /**
   * Uptime kalkuláció
   */
  calculateUptime() {
    if (!this.connectionMetrics.lastConnected) return 0;

    const now = Date.now();
    const lastDisconnect = this.connectionMetrics.lastDisconnected || 0;

    if (this.connectionState === 'connected') {
      return now - Math.max(this.connectionMetrics.lastConnected, lastDisconnect);
    }

    return 0;
  }

  /**
   * Manager megsemmisítése
   */
  destroy() {
    this.isDestroyed = true;
    this.disconnect();
    this.listeners = [];

    Logger.info('RealtimeConnectionManager: Destroyed');
  }

  /**
   * Getter-ek
   */
  get isConnected() {
    return this.connectionState === 'connected';
  }

  get isConnecting() {
    return this.connectionState === 'connecting';
  }

  get hasError() {
    return this.connectionState === 'error';
  }
}

// Singleton instance
const realtimeConnectionManager = new RealtimeConnectionManager();
export default realtimeConnectionManager;
