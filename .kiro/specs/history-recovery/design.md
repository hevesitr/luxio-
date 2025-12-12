# History Recovery Design Document
## Dating App - Complete Feature Recovery Architecture

**Date:** December 7, 2025  
**Status:** 🔴 CRITICAL - RECOVERY DESIGN  
**Scope:** Restore 50+ missing features from Nov 24 - Dec 7 history

---

## Overview

This document describes the architecture for recovering all missing implementations from your chat history. The recovery is organized into three phases:

1. **Phase 1 (P0):** Critical Security Fixes (4-5 hours)
2. **Phase 2 (P1):** High Priority Features (8-10 hours)
3. **Phase 3:** Core Features & Tests (10-12 hours)

---

## Architecture

### Layer 1: Security Foundation (P0)
```
┌─────────────────────────────────────────┐
│  Offline Queue Service                  │
│  - Queue management                     │
│  - Sync on reconnect                    │
│  - Duplicate detection                  │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  RLS Policy Enforcement                 │
│  - User data isolation                  │
│  - Blocked user prevention              │
│  - Admin access control                 │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Session Management                     │
│  - Device fingerprinting                │
│  - Session fixation prevention          │
│  - Timeout handling                     │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Payment Security                       │
│  - Idempotency keys                     │
│  - Duplicate charge prevention          │
│  - Transaction atomicity                │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Data Protection                        │
│  - PII redaction in logs                │
│  - Message atomicity                    │
│  - Premium validation                   │
│  - Push token lifecycle                 │
│  - GDPR compliance                      │
└─────────────────────────────────────────┘
```

### Layer 2: Reliability Features (P1)
```
┌─────────────────────────────────────────┐
│  Network Resilience                     │
│  - Reconnection logic                   │
│  - Offline mode indicator               │
│  - Sync status tracking                 │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Error Handling                         │
│  - Standardized errors                  │
│  - Error recovery                       │
│  - User-friendly messages               │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Session Management                     │
│  - Timeout warnings                     │
│  - Session extension                    │
│  - Graceful logout                      │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Rate Limiting & Validation             │
│  - Request throttling                   │
│  - Input validation                     │
│  - Premium tier limits                  │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Data Security                          │
│  - Encryption at rest                   │
│  - Audit logging                        │
│  - Security headers                     │
│  - Certificate pinning                  │
│  - Dependency scanning                  │
└─────────────────────────────────────────┘
```

### Layer 3: Core Features
```
┌─────────────────────────────────────────┐
│  Premium Features                       │
│  - Subscription management              │
│  - Feature unlocking                    │
│  - Expiration handling                  │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Notifications                          │
│  - Push notifications                   │
│  - In-app notifications                 │
│  - Real-time updates                    │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Legal Compliance                       │
│  - Terms of service                     │
│  - Privacy policy                       │
│  - Consent recording                    │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Testing & Quality                      │
│  - Property-based tests                 │
│  - Service completions                  │
│  - SQL policies                         │
└─────────────────────────────────────────┘
```

---

## Components & Interfaces

### Phase 1: Security Services

#### 1. OfflineQueueService
```javascript
interface OfflineQueueService {
  // Queue management
  enqueue(action: string, data: object, userId: string): Promise<void>
  dequeue(userId: string): Promise<QueuedAction[]>
  clearQueue(userId: string): Promise<void>
  
  // Sync management
  syncQueue(userId: string): Promise<SyncResult>
  onSyncStart(callback: Function): void
  onSyncComplete(callback: Function): void
  onSyncError(callback: Function): void
  
  // Duplicate detection
  isDuplicate(action: string, data: object): Promise<boolean>
  markProcessed(action: string, data: object): Promise<void>
}
```

#### 2. SessionService (Enhanced)
```javascript
interface SessionService {
  // Device fingerprinting
  generateFingerprint(): Promise<string>
  validateFingerprint(fingerprint: string): Promise<boolean>
  
  // Session management
  createSession(userId: string, fingerprint: string): Promise<Session>
  validateSession(sessionId: string): Promise<boolean>
  invalidateSession(sessionId: string): Promise<void>
  invalidateAllSessions(userId: string): Promise<void>
  
  // Timeout handling
  getSessionTimeout(): number
  extendSession(sessionId: string): Promise<void>
  onSessionExpiring(callback: Function): void
}
```

#### 3. PaymentService (Enhanced)
```javascript
interface PaymentService {
  // Idempotency
  generateIdempotencyKey(): string
  processPaymentWithIdempotency(
    userId: string,
    amount: number,
    idempotencyKey: string
  ): Promise<PaymentResult>
  
  // Subscription management
  createSubscription(userId: string, planId: string): Promise<Subscription>
  cancelSubscription(subscriptionId: string): Promise<void>
  getSubscriptionStatus(userId: string): Promise<SubscriptionStatus>
}
```

#### 4. LoggerService (Enhanced)
```javascript
interface LoggerService {
  // PII redaction
  redactPII(data: object): object
  redactEmail(email: string): string
  redactPassword(password: string): string
  redactToken(token: string): string
  
  // Logging
  log(level: string, message: string, context: object): void
  error(message: string, error: Error, context: object): void
  warn(message: string, context: object): void
  
  // Export
  exportLogs(startDate: Date, endDate: Date): Promise<string>
}
```

#### 5. MessageService (Enhanced)
```javascript
interface MessageService {
  // Atomic operations
  sendMessageAtomic(
    matchId: string,
    senderId: string,
    content: string
  ): Promise<Message>
  
  // Message management
  getMessage(messageId: string): Promise<Message>
  deleteMessage(messageId: string): Promise<void>
  markAsRead(messageId: string): Promise<void>
}
```

#### 6. PushNotificationService (Enhanced)
```javascript
interface PushNotificationService {
  // Token management
  registerToken(userId: string, token: string): Promise<void>
  validateToken(token: string): Promise<boolean>
  refreshToken(token: string): Promise<string>
  deactivateToken(token: string): Promise<void>
  
  // Notification sending
  sendNotification(userId: string, notification: Notification): Promise<void>
  sendBatch(userIds: string[], notification: Notification): Promise<void>
}
```

#### 7. GDPRService
```javascript
interface GDPRService {
  // Data export
  exportUserData(userId: string): Promise<ExportData>
  generateExportZip(userId: string): Promise<Buffer>
  
  // Account deletion
  deleteUserAccount(userId: string): Promise<void>
  deleteUserData(userId: string): Promise<void>
  
  // Audit
  logGDPRRequest(userId: string, type: string): Promise<void>
}
```

### Phase 2: Reliability Services

#### 8. NetworkService (Enhanced)
```javascript
interface NetworkService {
  // Connection management
  isOnline(): boolean
  onOnline(callback: Function): void
  onOffline(callback: Function): void
  
  // Reconnection
  reconnect(): Promise<void>
  getReconnectionStatus(): ReconnectionStatus
  
  // Offline mode
  setOfflineMode(enabled: boolean): void
  isOfflineMode(): boolean
}
```

#### 9. ErrorHandlingService (Enhanced)
```javascript
interface ErrorHandlingService {
  // Error standardization
  standardizeError(error: Error): ServiceError
  wrapError(error: Error, context: object): ServiceError
  
  // Error recovery
  canRecover(error: ServiceError): boolean
  recover(error: ServiceError): Promise<void>
  
  // User messaging
  getUserMessage(error: ServiceError): string
}
```

#### 10. RateLimitService
```javascript
interface RateLimitService {
  // Rate limiting
  checkLimit(userId: string, endpoint: string): Promise<boolean>
  incrementCounter(userId: string, endpoint: string): Promise<void>
  resetCounter(userId: string, endpoint: string): Promise<void>
  
  // Premium tiers
  getPremiumLimit(userId: string, endpoint: string): number
  getStandardLimit(userId: string, endpoint: string): number
}
```

#### 11. ValidationService
```javascript
interface ValidationService {
  // Input validation
  validateEmail(email: string): boolean
  validatePassword(password: string): boolean
  validatePhoneNumber(phone: string): boolean
  validateBio(bio: string): boolean
  
  // Custom validation
  validate(data: object, schema: object): ValidationResult
  validateAsync(data: object, schema: object): Promise<ValidationResult>
}
```

#### 12. EncryptionService
```javascript
interface EncryptionService {
  // Encryption
  encrypt(data: string, key: string): string
  decrypt(encrypted: string, key: string): string
  
  // Key management
  generateKey(): string
  rotateKey(oldKey: string, newKey: string): Promise<void>
}
```

#### 13. AuditService
```javascript
interface AuditService {
  // Audit logging
  logAction(userId: string, action: string, details: object): Promise<void>
  logDataModification(userId: string, table: string, changes: object): Promise<void>
  logSecurityEvent(userId: string, event: string, details: object): Promise<void>
  
  // Audit retrieval
  getAuditLog(userId: string, startDate: Date, endDate: Date): Promise<AuditLog[]>
}
```

---

## Data Models

### OfflineQueue
```javascript
{
  id: UUID,
  userId: UUID,
  action: string,
  data: object,
  status: 'pending' | 'syncing' | 'synced' | 'failed',
  createdAt: timestamp,
  syncedAt: timestamp,
  error: string
}
```

### Session
```javascript
{
  id: UUID,
  userId: UUID,
  deviceFingerprint: string,
  createdAt: timestamp,
  expiresAt: timestamp,
  lastActivityAt: timestamp,
  isValid: boolean
}
```

### PushToken
```javascript
{
  id: UUID,
  userId: UUID,
  token: string,
  createdAt: timestamp,
  expiresAt: timestamp,
  isActive: boolean,
  lastValidatedAt: timestamp,
  validationCount: integer,
  deactivatedAt: timestamp
}
```

### AuditLog
```javascript
{
  id: UUID,
  userId: UUID,
  action: string,
  details: object,
  timestamp: timestamp,
  ipAddress: string,
  userAgent: string
}
```

---

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Offline Queue Atomicity
**For any** queued action, when sync completes successfully, the action must be processed exactly once in the database.

**Validates:** Requirement 1 (Offline Queue)

### Property 2: Session Fixation Prevention
**For any** session, if the device fingerprint changes, the session must be invalidated immediately.

**Validates:** Requirement 3 (Session Fixation)

### Property 3: Payment Idempotency
**For any** payment with the same idempotency key, only one charge must be processed regardless of retry count.

**Validates:** Requirement 4 (Payment Idempotency)

### Property 4: PII Redaction
**For any** logged error containing PII, all sensitive fields must be redacted before storage.

**Validates:** Requirement 5 (PII Logging)

### Property 5: Message Atomicity
**For any** message sent, both the message and receipt must be created together or not at all.

**Validates:** Requirement 6 (Message Atomicity)

### Property 6: Premium Validation
**For any** premium-only action, if user is not premium, the action must be rejected server-side.

**Validates:** Requirement 7 (Premium Validation)

### Property 7: Push Token Lifecycle
**For any** push token, if it expires, it must be marked inactive and not used for sending.

**Validates:** Requirement 8 (Push Token Management)

### Property 8: GDPR Data Completeness
**For any** user data export, all user-related data must be included in the export.

**Validates:** Requirement 9 (GDPR Export)

### Property 9: Reconnection Consistency
**For any** network reconnection, all queued actions must be synced before accepting new actions.

**Validates:** Requirement 10 (Reconnection Logic)

### Property 10: Error Standardization
**For any** error thrown, it must have code, message, category, severity, and timestamp fields.

**Validates:** Requirement 11 (Error Handling)

### Property 11: Offline Mode Indication
**For any** offline state, the UI must display an offline indicator within 1 second.

**Validates:** Requirement 12 (Offline Indicator)

### Property 12: Session Timeout Warning
**For any** session about to expire, user must be warned at least 5 minutes before expiration.

**Validates:** Requirement 13 (Session Timeout)

### Property 13: Rate Limit Enforcement
**For any** user exceeding rate limit, subsequent requests must be rejected until limit resets.

**Validates:** Requirement 14 (Rate Limiting)

### Property 14: Input Validation Consistency
**For any** user input, client-side and server-side validation must use identical rules.

**Validates:** Requirement 15 (Input Validation)

### Property 15: Error Recovery Success
**For any** recoverable error, retry must succeed within 3 attempts with exponential backoff.

**Validates:** Requirement 16 (Error Recovery)

### Property 16: Encryption Consistency
**For any** encrypted data, decryption must produce the original data exactly.

**Validates:** Requirement 17 (Data Encryption)

### Property 17: Audit Log Immutability
**For any** audit log entry, it must not be modifiable after creation.

**Validates:** Requirement 18 (Audit Logging)

### Property 18: Security Header Presence
**For any** HTTP response, all required security headers must be present.

**Validates:** Requirement 19 (Security Headers)

### Property 19: Certificate Pinning Enforcement
**For any** HTTPS connection, certificate must match pinned certificate or connection fails.

**Validates:** Requirement 20 (Certificate Pinning)

### Property 20: Dependency Vulnerability Detection
**For any** dependency with known vulnerability, build must fail.

**Validates:** Requirement 21 (Dependency Scanning)

---

## Error Handling

### Error Categories
- **OFFLINE_QUEUE_ERROR** - Queue operation failed
- **SESSION_ERROR** - Session management failed
- **PAYMENT_ERROR** - Payment processing failed
- **ENCRYPTION_ERROR** - Encryption/decryption failed
- **VALIDATION_ERROR** - Input validation failed
- **RATE_LIMIT_ERROR** - Rate limit exceeded
- **NETWORK_ERROR** - Network operation failed
- **GDPR_ERROR** - GDPR operation failed

### Error Recovery Strategy
1. **Automatic Retry** - Network errors with exponential backoff
2. **Queue Fallback** - Offline queue for failed operations
3. **User Notification** - Clear error messages to user
4. **Logging** - All errors logged with context
5. **Monitoring** - Critical errors trigger alerts

---

## Testing Strategy

### Unit Tests
- Service initialization
- Error handling
- Data validation
- Encryption/decryption
- Rate limiting

### Integration Tests
- Offline queue sync
- Session management
- Payment processing
- Message atomicity
- GDPR export

### Property-Based Tests
- Offline queue atomicity (100 iterations)
- Session fixation prevention (100 iterations)
- Payment idempotency (100 iterations)
- PII redaction (100 iterations)
- Message atomicity (100 iterations)
- Premium validation (100 iterations)
- Push token lifecycle (100 iterations)
- GDPR completeness (100 iterations)
- Reconnection consistency (100 iterations)
- Error standardization (100 iterations)
- Offline mode indication (100 iterations)
- Session timeout warning (100 iterations)
- Rate limit enforcement (100 iterations)
- Input validation consistency (100 iterations)
- Error recovery success (100 iterations)
- Encryption consistency (100 iterations)
- Audit log immutability (100 iterations)
- Security header presence (100 iterations)
- Certificate pinning enforcement (100 iterations)
- Dependency vulnerability detection (100 iterations)

### E2E Tests
- Complete user flow with offline mode
- Payment processing with retry
- Session timeout and extension
- GDPR data export and deletion

---

## Implementation Phases

### Phase 1: Security Foundation (4-5 hours)
1. OfflineQueueService
2. SessionService enhancement
3. PaymentService enhancement
4. LoggerService enhancement
5. MessageService enhancement
6. PushNotificationService enhancement
7. GDPRService
8. RLS policy deployment
9. SQL schema updates

### Phase 2: Reliability (8-10 hours)
1. NetworkService enhancement
2. ErrorHandlingService enhancement
3. RateLimitService
4. ValidationService
5. EncryptionService
6. AuditService
7. Security headers
8. Certificate pinning
9. Dependency scanning

### Phase 3: Core Features (10-12 hours)
1. Premium features completion
2. Push notifications completion
3. Legal screens completion
4. Property-based tests (20 tests)
5. Service completions
6. SQL policies & schemas

---

## Deployment Strategy

### Pre-Deployment
- All tests passing
- Code review complete
- Security audit passed
- Performance benchmarks met

### Deployment
- Database migrations
- Service deployments
- Configuration updates
- Monitoring activation

### Post-Deployment
- Health checks
- Error monitoring
- Performance monitoring
- User feedback collection

---

**Document Created:** December 7, 2025  
**Status:** 🔴 CRITICAL - RECOVERY DESIGN  
**Next Step:** Create implementation tasks
