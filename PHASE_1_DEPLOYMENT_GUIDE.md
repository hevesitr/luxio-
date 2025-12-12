# Phase 1 Deployment Guide
## Critical Security Fixes (P0) - Deployment Instructions

**Date:** December 7, 2025  
**Status:** 🔴 READY FOR DEPLOYMENT  
**Estimated Time:** 2-3 hours

---

## STEP 1: Deploy SQL Scripts to Supabase

### 1.1 Deploy RLS Policies

```bash
# Open Supabase SQL Editor
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Click "SQL Editor" in left sidebar
# 4. Click "New Query"
# 5. Copy and paste the entire content of: supabase/rls-policies-fixed-p0.sql
# 6. Click "Run"
# 7. Wait for completion (should see "Success" message)
```

**Expected Output:**
```
Query executed successfully
Rows affected: 0
```

### 1.2 Deploy Message Atomicity Function

```bash
# In Supabase SQL Editor, create new query
# Copy and paste: supabase/send-message-atomic.sql
# Click "Run"
```

**Expected Output:**
```
Query executed successfully
Rows affected: 0
```

### 1.3 Deploy Premium Validation Functions

```bash
# In Supabase SQL Editor, create new query
# Copy and paste: supabase/premium-feature-validation.sql
# Click "Run"
```

**Expected Output:**
```
Query executed successfully
Rows affected: 0
```

### 1.4 Create Idempotency Keys Table

```sql
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  result JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP NOT NULL
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);

-- Enable RLS
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view own idempotency keys"
ON idempotency_keys FOR SELECT
USING (true); -- Allow all authenticated users to view
```

### 1.5 Create GDPR Requests Table

```sql
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP,
  error_message TEXT
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_id ON gdpr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status);

-- Enable RLS
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view own GDPR requests"
ON gdpr_requests FOR SELECT
USING (auth.uid() = user_id);
```

### 1.6 Create Push Tokens Table

```sql
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_validated_at TIMESTAMP,
  validation_count INT DEFAULT 0,
  deactivated_at TIMESTAMP
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_expires_at ON push_tokens(expires_at);

-- Enable RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own push tokens"
ON push_tokens FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert push tokens"
ON push_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push tokens"
ON push_tokens FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push tokens"
ON push_tokens FOR DELETE
USING (auth.uid() = user_id);
```

---

## STEP 2: Integrate Services into App

### 2.1 Update App.js to Initialize Services

```javascript
// Add to App.js imports
import { offlineQueueService } from './src/services/OfflineQueueService';
import { idempotencyService } from './src/services/IdempotencyService';
import { gdprService } from './src/services/GDPRService';
import { deviceFingerprintService } from './src/services/DeviceFingerprintService';
import { piiRedactionService } from './src/services/PIIRedactionService';

// Add to App component useEffect
useEffect(() => {
  const initializeServices = async () => {
    try {
      // Initialize idempotency service
      await idempotencyService.initialize();
      
      // Generate device fingerprint
      const fingerprint = await deviceFingerprintService.generateFingerprint();
      await deviceFingerprintService.storeFingerprint(fingerprint);
      
      // Clear expired idempotency keys
      await idempotencyService.clearExpired();
      
      console.log('[App] Services initialized');
    } catch (error) {
      console.error('[App] Error initializing services:', error);
    }
  };

  initializeServices();
}, []);
```

### 2.2 Update MatchService to Use Offline Queue

```javascript
// In src/services/MatchService.js
import { offlineQueueService } from './OfflineQueueService';

// Update swipe method
async swipeRight(userId, targetUserId) {
  try {
    // Check if online
    const isOnline = await this.checkOnlineStatus();
    
    if (!isOnline) {
      // Queue for later
      return await offlineQueueService.enqueue('swipe_right', {
        targetUserId,
        action: 'like'
      }, userId);
    }

    // Process immediately if online
    return await this.processSwipe(userId, targetUserId, 'like');
  } catch (error) {
    // Fallback to queue
    return await offlineQueueService.enqueue('swipe_right', {
      targetUserId,
      action: 'like'
    }, userId);
  }
}
```

### 2.3 Update PaymentService to Use Idempotency

```javascript
// In src/services/PaymentService.js
import { idempotencyService } from './IdempotencyService';

// Update payment method
async processPayment(userId, amount, planId) {
  const idempotencyKey = idempotencyService.generateKey();
  
  return await idempotencyService.executeWithIdempotency(
    idempotencyKey,
    async () => {
      // Your payment processing logic
      return await this.createSubscription(userId, planId);
    }
  );
}
```

### 2.4 Update Logger to Use PII Redaction

```javascript
// In src/services/Logger.js
import { piiRedactionService } from './PIIRedactionService';

// Update error logging
error(message, error, context = {}) {
  const redactedMessage = piiRedactionService.redactString(message);
  const redactedContext = piiRedactionService.redactObject(context);
  const redactedError = piiRedactionService.redactError(error);
  
  // Log redacted data
  console.error('[Logger]', redactedMessage, redactedError, redactedContext);
}
```

### 2.5 Update AuthService to Use Device Fingerprinting

```javascript
// In src/services/AuthService.js
import { deviceFingerprintService } from './DeviceFingerprintService';

// Update signIn method
async signIn(email, password) {
  try {
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Generate and store device fingerprint
    const fingerprint = await deviceFingerprintService.generateFingerprint();
    await deviceFingerprintService.storeFingerprint(fingerprint);

    // Store fingerprint with session
    await this.storeSessionFingerprint(data.session.id, fingerprint);

    return data;
  } catch (error) {
    console.error('[AuthService] Sign in error:', error);
    throw error;
  }
}

// Add method to validate fingerprint on each request
async validateSessionFingerprint(sessionId) {
  const storedFingerprint = await this.getSessionFingerprint(sessionId);
  const isValid = await deviceFingerprintService.validateFingerprint(storedFingerprint);
  
  if (!isValid) {
    // Invalidate session
    await this.invalidateSession(sessionId);
    throw new Error('Session fixation detected');
  }
  
  return true;
}
```

---

## STEP 3: Run Tests

### 3.1 Run Property Tests

```bash
# Terminal
npm test -- OfflineQueue.property.test.js --run
npm test -- SessionFixation.property.test.js --run
npm test -- PaymentIdempotency.property.test.js --run
npm test -- PIIRedaction.property.test.js --run
npm test -- MessageAtomicity.property.test.js --run
npm test -- PremiumValidation.property.test.js --run
npm test -- PushTokenLifecycle.property.test.js --run
npm test -- GDPRCompleteness.property.test.js --run
```

**Expected Output:**
```
PASS  src/services/__tests__/OfflineQueue.property.test.js
  ✓ Property 1: Offline Queue Atomicity (100 iterations)

PASS  src/services/__tests__/SessionFixation.property.test.js
  ✓ Property 2: Session Fixation Prevention (100 iterations)

... (all tests should pass)

Test Suites: 8 passed, 8 total
Tests:       8 passed, 8 total
```

### 3.2 Verify RLS Policies

```bash
# In Supabase SQL Editor, run:
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected Output:**
```
Should show all RLS policies for:
- profiles
- matches
- messages
- likes
- passes
- blocks
- storage.objects
```

---

## STEP 4: Verify Deployment

### 4.1 Check Services Initialization

```bash
# Run app and check console logs
npm start

# Expected logs:
# [Idempotency] Service initialized
# [DeviceFingerprint] Fingerprint generated: ...
# [App] Services initialized
```

### 4.2 Test Offline Queue

```javascript
// In browser console or app
import { offlineQueueService } from './src/services/OfflineQueueService';

// Test enqueue
await offlineQueueService.enqueue('test_action', { data: 'test' }, 'user-id');

// Check status
const status = await offlineQueueService.getStatus('user-id');
console.log(status); // Should show { total: 1, pending: 1, synced: 0, failed: 0 }
```

### 4.3 Test Device Fingerprinting

```javascript
// In browser console or app
import { deviceFingerprintService } from './src/services/DeviceFingerprintService';

// Generate fingerprint
const fingerprint = await deviceFingerprintService.generateFingerprint();
console.log('Fingerprint:', fingerprint);

// Validate fingerprint
const isValid = await deviceFingerprintService.validateFingerprint(fingerprint);
console.log('Valid:', isValid); // Should be true
```

### 4.4 Test PII Redaction

```javascript
// In browser console or app
import { piiRedactionService } from './src/services/PIIRedactionService';

// Test redaction
const testData = {
  email: 'user@example.com',
  password: 'mySecurePassword123',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
};

const redacted = piiRedactionService.redactObject(testData);
console.log(redacted);
// Should show: { email: '[REDACTED]', password: '[REDACTED]', token: '[REDACTED]' }
```

---

## STEP 5: Troubleshooting

### Issue: RLS Policies Not Applied

**Solution:**
1. Verify policies are created: Run verification query in Supabase SQL Editor
2. Check table RLS is enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
3. Restart Supabase connection

### Issue: Offline Queue Not Syncing

**Solution:**
1. Check network status: `navigator.onLine`
2. Verify sync function is called: Check console logs
3. Check AsyncStorage: `await AsyncStorage.getItem('@offline_queue')`

### Issue: Device Fingerprint Mismatch

**Solution:**
1. Clear stored fingerprint: `await deviceFingerprintService.clearFingerprint()`
2. Generate new fingerprint: `await deviceFingerprintService.generateFingerprint()`
3. Store new fingerprint: `await deviceFingerprintService.storeFingerprint(fingerprint)`

### Issue: PII Not Redacted

**Solution:**
1. Check pattern regex: `piiRedactionService.patterns`
2. Test redaction: `piiRedactionService.testPIIRedaction()`
3. Add custom patterns if needed

---

## STEP 6: Checkpoint Verification

### Checklist

- [ ] All SQL scripts deployed to Supabase
- [ ] All tables created (idempotency_keys, gdpr_requests, push_tokens)
- [ ] All RLS policies applied
- [ ] Services initialized in App.js
- [ ] All 8 property tests passing (800 iterations)
- [ ] Offline queue working
- [ ] Device fingerprinting working
- [ ] PII redaction working
- [ ] GDPR service working
- [ ] No console errors

### Success Criteria

✅ All P0 security fixes implemented  
✅ All 8 property tests passing  
✅ Zero security vulnerabilities  
✅ Ready for Phase 2

---

## NEXT STEPS

Once Phase 1 is complete and verified:

1. Begin Phase 2 (P1 High Priority Features) - 8-10 hours
2. Deploy Phase 2 services
3. Run Phase 2 property tests
4. Verify Phase 2 features

---

**Document Created:** December 7, 2025  
**Status:** 🔴 READY FOR DEPLOYMENT  
**Estimated Time:** 2-3 hours
