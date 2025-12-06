# 🎯 DETAILED ACTION ITEMS - LÉPÉSRŐL LÉPÉSRE JAVÍTÁSI ÚTMUTATÓ

## P0.1: Offline Queue Implementáció

### Lépés 1: Offline Queue Schema Létrehozása
```javascript
// src/database/offlineQueue.js
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({
  name: 'lovex_offline.db',
  location: 'default'
});

export const initOfflineQueue = async () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS offline_queue (
          id TEXT PRIMARY KEY,
          action TEXT NOT NULL,
          user_id TEXT NOT NULL,
          target_user_id TEXT,
          payload JSON,
          timestamp INTEGER NOT NULL,
          synced BOOLEAN DEFAULT 0,
          retry_count INTEGER DEFAULT 0,
          created_at INTEGER DEFAULT CURRENT_TIMESTAMP
        );
      `, [], () => resolve(), (_, error) => reject(error));
    });
  });
};
```

### Lépés 2: Queue Manager Service
```javascript
// src/services/OfflineQueueManager.js
class OfflineQueueManager {
  async addToQueue(action, userId, targetUserId, payload) {
    const id = `${userId}_${action}_${Date.now()}`;
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO offline_queue (id, action, user_id, target_user_id, payload, timestamp)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, action, userId, targetUserId, JSON.stringify(payload), Date.now()],
          () => resolve(id),
          (_, error) => reject(error)
        );
      });
    });
  }
  
  async getUnsyncedItems() {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM offline_queue WHERE synced = 0 ORDER BY timestamp ASC`,
          [],
          (_, result) => resolve(result.rows.raw()),
          (_, error) => reject(error)
        );
      });
    });
  }
  
  async markAsSynced(id) {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE offline_queue SET synced = 1 WHERE id = ?`,
          [id],
          () => resolve(),
          (_, error) => reject(error)
        );
      });
    });
  }
}
```

### Lépés 3: Sync Logic Implementáció
```javascript
// src/services/OfflineSyncService.js
class OfflineSyncService {
  async syncQueue() {
    const items = await OfflineQueueManager.getUnsyncedItems();
    
    for (const item of items) {
      try {
        // Idempotency check
        const existing = await this.checkIfExists(item);
        if (existing) {
          await OfflineQueueManager.markAsSynced(item.id);
          continue;
        }
        
        // Execute action
        const result = await this.executeAction(item);
        
        if (result.success) {
          await OfflineQueueManager.markAsSynced(item.id);
        } else {
          await this.incrementRetryCount(item.id);
        }
      } catch (error) {
        Logger.error('Sync error', error);
        await this.incrementRetryCount(item.id);
      }
    }
  }
  
  async executeAction(item) {
    switch (item.action) {
      case 'like':
        return await this.syncLike(item);
      case 'pass':
        return await this.syncPass(item);
      case 'message':
        return await this.syncMessage(item);
      default:
        return { success: false };
    }
  }
  
  async syncLike(item) {
    const { data, error } = await supabase
      .from('likes')
      .insert({
        user_id: item.user_id,
        liked_user_id: item.target_user_id,
        created_at: new Date(item.timestamp).toISOString()
      });
    
    return { success: !error };
  }
}
```

### Lépés 4: Realtime Sync Trigger
```javascript
// src/hooks/useOfflineSync.js
export const useOfflineSync = () => {
  useEffect(() => {
    // Sync on app start
    OfflineSyncService.syncQueue();
    
    // Sync on network change
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        OfflineSyncService.syncQueue();
      }
    });
    
    // Periodic sync (every 30 sec)
    const interval = setInterval(() => {
      OfflineSyncService.syncQueue();
    }, 30000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);
};
```

---

## P0.2: RLS Policy Fixes

### Lépés 1: Helper Functions Létrehozása
```sql
-- supabase/rls-helpers.sql
CREATE OR REPLACE FUNCTION is_user_banned(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id_param
    AND is_banned = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_user_blocked(user_id_param UUID, target_user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = user_id_param AND blocked_id = target_user_id_param)
    OR (blocker_id = target_user_id_param AND blocked_id = user_id_param)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Lépés 2: Updated RLS Policies
```sql
-- supabase/rls-policies-fixed.sql
DROP POLICY IF EXISTS "Users can view potential matches" ON profiles;

CREATE POLICY "Users can view potential matches"
ON profiles FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND auth.uid() != id
  AND NOT is_user_banned(id)
  AND NOT is_user_banned(auth.uid())
  AND NOT is_user_blocked(auth.uid(), id)
  AND NOT EXISTS (
    SELECT 1 FROM passes
    WHERE passes.user_id = auth.uid()
    AND passes.passed_user_id = profiles.id
  )
);
```

### Lépés 3: Policy Testing
```javascript
// src/services/__tests__/RLSPolicies.test.js
describe('RLS Policies', () => {
  test('Banned users cannot view profiles', async () => {
    // Ban user
    await supabase
      .from('profiles')
      .update({ is_banned: true })
      .eq('id', bannedUserId);
    
    // Try to view profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId);
    
    expect(error).toBeDefined();
    expect(data).toBeNull();
  });
  
  test('Blocked users cannot view each other', async () => {
    // Block user
    await supabase
      .from('blocks')
      .insert({ blocker_id: userId1, blocked_id: userId2 });
    
    // User2 tries to view User1
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId1);
    
    expect(error).toBeDefined();
  });
});
```

---

## P0.3: Device Fingerprint Fix

### Lépés 1: Enhanced Fingerprint Generation
```javascript
// src/services/DeviceFingerprintService.js
import * as Device from 'expo-device';
import { Platform, Dimensions } from 'react-native';

class DeviceFingerprintService {
  async generateFingerprint() {
    const deviceInfo = {
      // Hardware info
      deviceId: await Device.getDeviceIdAsync(),
      deviceName: await Device.getDeviceNameAsync(),
      osVersion: Platform.Version,
      platform: Platform.OS,
      
      // Screen info
      screenWidth: Dimensions.get('window').width,
      screenHeight: Dimensions.get('window').height,
      screenScale: Dimensions.get('window').scale,
      
      // Locale info
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      
      // App info
      appVersion: APP_VERSION,
      buildNumber: BUILD_NUMBER,
      
      // Timestamp (full, not just date)
      timestamp: new Date().toISOString()
    };
    
    return await this.hashFingerprint(deviceInfo);
  }
  
  async hashFingerprint(deviceInfo) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(deviceInfo));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  async validateFingerprint(storedFingerprint) {
    const currentFingerprint = await this.generateFingerprint();
    
    if (currentFingerprint !== storedFingerprint) {
      Logger.warn('Fingerprint mismatch - possible device change or theft');
      return false;
    }
    
    return true;
  }
}
```

### Lépés 2: Session Validation Update
```javascript
// src/services/AuthService.js - updatePassword
async loadSession() {
  const sessionStr = await SecureStore.getItemAsync('supabase_session_v2');
  
  if (sessionStr) {
    const decodedData = JSON.parse(atob(sessionStr));
    
    // Validate fingerprint
    const isValid = await DeviceFingerprintService.validateFingerprint(
      decodedData.fingerprint
    );
    
    if (!isValid) {
      Logger.warn('Session fingerprint validation failed');
      await this.clearSession();
      
      // Notify user
      this.notifyAuthFailureListeners('deviceMismatch', {
        reason: 'Session accessed from different device',
        action: 'Please sign in again'
      });
      
      return null;
    }
    
    return decodedData.session;
  }
}
```

---

## P0.4: Payment Idempotency

### Lépés 1: Idempotency Key Schema
```sql
-- supabase/migrations/add_idempotency.sql
ALTER TABLE subscriptions ADD COLUMN idempotency_key TEXT UNIQUE;
ALTER TABLE payments ADD COLUMN idempotency_key TEXT UNIQUE;

CREATE INDEX idx_subscriptions_idempotency ON subscriptions(idempotency_key);
CREATE INDEX idx_payments_idempotency ON payments(idempotency_key);
```

### Lépés 2: Payment Service Update
```javascript
// src/services/PaymentService.js
async createSubscription(userId, planId) {
  const idempotencyKey = `${userId}_${planId}_${Date.now()}`;
  
  // Check if already exists
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .single();
  
  if (existing) {
    Logger.info('Subscription already exists', { idempotencyKey });
    return existing;
  }
  
  // Create new subscription
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_id: planId,
      idempotency_key: idempotencyKey,
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
}
```

---

## P0.5: PII Logging Fix

### Lépés 1: Enhanced PII Redaction
```javascript
// src/services/Logger.js - updatePassword
class Logger {
  constructor() {
    this.piiFields = [
      'email', 'phone', 'phone_number', 'full_name', 'first_name', 'last_name',
      'address', 'credit_card', 'ssn', 'password', 'token', 'access_token',
      'refresh_token', 'api_key', 'secret', 'auth_code'
    ];
    
    this.piiPatterns = [
      { name: 'email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
      { name: 'phone', pattern: /(\+?\d{1,3}[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\b/g, replacement: '[PHONE]' },
      { name: 'credit_card', pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, replacement: '[CARD]' },
      { name: 'uuid', pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, replacement: '[UUID]' }
    ];
  }
  
  redactPIIFromObject(obj, maxDepth = 10, currentDepth = 0) {
    if (currentDepth >= maxDepth || !obj || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.redactPIIFromObject(item, maxDepth, currentDepth + 1));
    }
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Check if key is PII field
      if (this.piiFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      
      // Check value type
      if (typeof value === 'string') {
        sanitized[key] = this.redactPIIFromString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = this.redactPIIFromObject(value, maxDepth, currentDepth + 1);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  redactPIIFromString(text) {
    if (!text || typeof text !== 'string') return text;
    
    let sanitized = text;
    
    for (const pattern of this.piiPatterns) {
      sanitized = sanitized.replace(pattern.pattern, pattern.replacement);
    }
    
    return sanitized;
  }
}
```

### Lépés 2: Logging Audit
```javascript
// src/services/__tests__/Logger.pii.test.js
describe('Logger PII Redaction', () => {
  test('Should redact email addresses', () => {
    const result = Logger.redactPIIFromString('Contact: user@example.com');
    expect(result).toBe('Contact: [EMAIL]');
  });
  
  test('Should redact nested PII', () => {
    const data = {
      user: {
        profile: {
          email: 'user@example.com',
          phone: '+36301234567'
        }
      }
    };
    
    const result = Logger.redactPIIFromObject(data);
    expect(result.user.profile.email).toBe('[REDACTED]');
    expect(result.user.profile.phone).toBe('[REDACTED]');
  });
});
```

---

## P1.1: Realtime Reconnection Logic

### Lépés 1: Circuit Breaker Pattern
```javascript
// src/services/CircuitBreaker.js
class CircuitBreaker {
  constructor(options = {}) {
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 min
    this.lastFailureTime = null;
  }
  
  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}
```

### Lépés 2: Enhanced Reconnection Logic
```javascript
// src/services/RealtimeConnectionManager.js - updatePassword
class RealtimeConnectionManager {
  constructor() {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000
    });
  }
  
  async attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.enterCircuitBreakerMode();
      return;
    }
    
    // Exponential backoff + jitter
    const baseDelay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    const jitter = Math.random() * baseDelay * 0.1;
    const delay = Math.min(baseDelay + jitter, this.maxReconnectDelay);
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.circuitBreaker.execute(() => this.testConnection());
      } catch (error) {
        Logger.error('Reconnection failed', error);
        this.reconnectAttempts++;
        this.attemptReconnection();
      }
    }, delay);
  }
  
  enterCircuitBreakerMode() {
    this.connectionState = 'circuit_breaker';
    Logger.warn('Circuit breaker activated');
    
    this.notifyListeners('circuitBreakerActivated', {
      reason: 'Too many reconnection failures',
      retryAfter: 5 * 60 * 1000
    });
    
    // Retry után 5 perc
    setTimeout(() => {
      this.reconnectAttempts = 0;
      this.attemptReconnection();
    }, 5 * 60 * 1000);
  }
}
```

---

## TESTING STRATEGY

### Unit Tests (80% coverage)
```javascript
// src/services/__tests__/OfflineQueue.test.js
describe('OfflineQueueManager', () => {
  test('Should add item to queue', async () => {
    const id = await OfflineQueueManager.addToQueue('like', userId, targetId, {});
    expect(id).toBeDefined();
  });
  
  test('Should retrieve unsynced items', async () => {
    await OfflineQueueManager.addToQueue('like', userId, targetId, {});
    const items = await OfflineQueueManager.getUnsyncedItems();
    expect(items.length).toBeGreaterThan(0);
  });
  
  test('Should mark item as synced', async () => {
    const id = await OfflineQueueManager.addToQueue('like', userId, targetId, {});
    await OfflineQueueManager.markAsSynced(id);
    const items = await OfflineQueueManager.getUnsyncedItems();
    expect(items.find(i => i.id === id)).toBeUndefined();
  });
});
```

### Integration Tests (60% coverage)
```javascript
// src/services/__tests__/OfflineSync.integration.test.js
describe('Offline Sync Integration', () => {
  test('Should sync offline queue when online', async () => {
    // Go offline
    NetInfo.setIsConnected(false);
    
    // Add to queue
    await OfflineQueueManager.addToQueue('like', userId, targetId, {});
    
    // Go online
    NetInfo.setIsConnected(true);
    
    // Wait for sync
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify synced
    const items = await OfflineQueueManager.getUnsyncedItems();
    expect(items.length).toBe(0);
  });
});
```

---

## DEPLOYMENT CHECKLIST

- [ ] Offline queue fully tested
- [ ] RLS policies verified
- [ ] Device fingerprint validated
- [ ] Payment idempotency working
- [ ] PII logging redaction verified
- [ ] Realtime reconnection tested
- [ ] Message delivery receipts atomic
- [ ] Premium limits server-side
- [ ] Push token lifecycle managed
- [ ] GDPR export complete
- [ ] Rate limiting deployed
- [ ] Monitoring configured
- [ ] Alerting configured
- [ ] Backup tested
- [ ] Disaster recovery tested

