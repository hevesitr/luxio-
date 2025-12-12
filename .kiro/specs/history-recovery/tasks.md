# History Recovery Implementation Tasks
## Dating App - Complete Feature Recovery Task List

**Date:** December 7, 2025  
**Status:** 🔴 CRITICAL - READY FOR IMPLEMENTATION  
**Total Tasks:** 50+  
**Estimated Time:** 22-27 hours

---

## PHASE 1: CRITICAL SECURITY FIXES (P0) - 4-5 hours

### 1. Offline Queue Service Integration
- [ ] 1.1 Copy OfflineQueueService.js to src/services/
  - **File:** `src/services/OfflineQueueService.js`
  - **Requirements:** 1 (Offline Queue)
  - **Property:** Property 1 (Offline Queue Atomicity)

- [ ] 1.2 Integrate OfflineQueueService into MatchService
  - **File:** `src/services/MatchService.js`
  - **Changes:** Add offline queue fallback for swipes
  - **Requirements:** 1

- [ ] 1.3 Integrate OfflineQueueService into MessageService
  - **File:** `src/services/MessageService.js`
  - **Changes:** Add offline queue fallback for messages
  - **Requirements:** 1

- [ ] 1.4 Add sync trigger on network reconnection
  - **File:** `src/context/NetworkContext.js`
  - **Changes:** Call offlineQueueService.syncQueue() on reconnect
  - **Requirements:** 1

- [ ]* 1.5 Write property test for offline queue atomicity
  - **Property:** Property 1 - Offline Queue Atomicity
  - **Validates:** Requirements 1
  - **File:** `src/services/__tests__/OfflineQueue.property.test.js`

### 2. RLS Policy Deployment
- [ ] 2.1 Deploy RLS policies to Supabase
  - **File:** `supabase/rls-policies-fixed-p0.sql`
  - **Requirements:** 2
  - **Action:** Run SQL in Supabase SQL Editor

- [ ] 2.2 Deploy blocked users policy
  - **File:** `supabase/rls-policies-fixed-p0.sql` (blocked_users section)
  - **Requirements:** 2
  - **Action:** Run SQL in Supabase SQL Editor

- [ ] 2.3 Verify RLS policies are enforced
  - **File:** `scripts/verify-rls-policies.js`
  - **Requirements:** 2
  - **Action:** Run verification script

- [ ]* 2.4 Write property test for RLS enforcement
  - **Property:** Property 2 - Session Fixation Prevention
  - **Validates:** Requirements 2
  - **File:** `src/services/__tests__/RLS.property.test.js`

### 3. Session Fixation Prevention
- [ ] 3.1 Copy AuthService.FIXED.js to AuthService.js
  - **File:** `src/services/AuthService.js`
  - **Requirements:** 3
  - **Changes:** Device fingerprinting implementation

- [ ] 3.2 Integrate device fingerprinting into login
  - **File:** `src/services/AuthService.js`
  - **Changes:** Generate fingerprint on login
  - **Requirements:** 3

- [ ] 3.3 Validate fingerprint on session use
  - **File:** `src/services/AuthService.js`
  - **Changes:** Check fingerprint matches on each request
  - **Requirements:** 3

- [ ] 3.4 Invalidate session on fingerprint mismatch
  - **File:** `src/services/AuthService.js`
  - **Changes:** Logout user if fingerprint doesn't match
  - **Requirements:** 3

- [ ]* 3.5 Write property test for session fixation prevention
  - **Property:** Property 2 - Session Fixation Prevention
  - **Validates:** Requirements 3
  - **File:** `src/services/__tests__/SessionFixation.property.test.js`

### 4. Payment Idempotency
- [ ] 4.1 Copy PaymentService.FIXED.js to PaymentService.js
  - **File:** `src/services/PaymentService.js`
  - **Requirements:** 4
  - **Changes:** Idempotency key implementation

- [ ] 4.2 Add idempotency_key column to database
  - **File:** `supabase/schema_extended.sql`
  - **SQL:** ALTER TABLE payments ADD COLUMN idempotency_key TEXT UNIQUE
  - **Requirements:** 4

- [ ] 4.3 Generate idempotency key on payment creation
  - **File:** `src/services/PaymentService.js`
  - **Changes:** Generate UUID for each payment
  - **Requirements:** 4

- [ ] 4.4 Check for duplicate payments before processing
  - **File:** `src/services/PaymentService.js`
  - **Changes:** Query by idempotency_key before creating
  - **Requirements:** 4

- [ ]* 4.5 Write property test for payment idempotency
  - **Property:** Property 3 - Payment Idempotency
  - **Validates:** Requirements 4
  - **File:** `src/services/__tests__/PaymentIdempotency.property.test.js`

### 5. PII Logging Prevention
- [ ] 5.1 Copy Logger.FIXED.js to Logger.js
  - **File:** `src/services/Logger.js`
  - **Requirements:** 5
  - **Changes:** PII redaction implementation

- [ ] 5.2 Implement email redaction
  - **File:** `src/services/Logger.js`
  - **Changes:** Replace email with [REDACTED]
  - **Requirements:** 5

- [ ] 5.3 Implement password redaction
  - **File:** `src/services/Logger.js`
  - **Changes:** Replace password with [REDACTED]
  - **Requirements:** 5

- [ ] 5.4 Implement token redaction
  - **File:** `src/services/Logger.js`
  - **Changes:** Replace tokens with [REDACTED]
  - **Requirements:** 5

- [ ] 5.5 Implement phone number redaction
  - **File:** `src/services/Logger.js`
  - **Changes:** Replace phone with [REDACTED]
  - **Requirements:** 5

- [ ]* 5.6 Write property test for PII redaction
  - **Property:** Property 4 - PII Redaction
  - **Validates:** Requirements 5
  - **File:** `src/services/__tests__/PIIRedaction.property.test.js`

### 6. Message Atomicity
- [ ] 6.1 Deploy message atomicity SQL function
  - **File:** `supabase/send-message-atomic.sql`
  - **Requirements:** 6
  - **Action:** Run SQL in Supabase SQL Editor

- [ ] 6.2 Update MessageService to use atomic function
  - **File:** `src/services/MessageService.js`
  - **Changes:** Call send_message_atomic RPC
  - **Requirements:** 6

- [ ] 6.3 Handle atomic transaction failures
  - **File:** `src/services/MessageService.js`
  - **Changes:** Rollback on failure
  - **Requirements:** 6

- [ ]* 6.4 Write property test for message atomicity
  - **Property:** Property 5 - Message Atomicity
  - **Validates:** Requirements 6
  - **File:** `src/services/__tests__/MessageAtomicity.property.test.js`

### 7. Premium Feature Validation
- [ ] 7.1 Deploy premium validation SQL functions
  - **File:** `supabase/premium-feature-validation.sql`
  - **Requirements:** 7
  - **Action:** Run SQL in Supabase SQL Editor

- [ ] 7.2 Update MatchService to validate premium
  - **File:** `src/services/MatchService.js`
  - **Changes:** Call check_daily_swipe_limit RPC
  - **Requirements:** 7

- [ ] 7.3 Reject swipes for non-premium users
  - **File:** `src/services/MatchService.js`
  - **Changes:** Throw error if limit exceeded
  - **Requirements:** 7

- [ ]* 7.4 Write property test for premium validation
  - **Property:** Property 6 - Premium Validation
  - **Validates:** Requirements 7
  - **File:** `src/services/__tests__/PremiumValidation.property.test.js`

### 8. Push Token Lifecycle Management
- [ ] 8.1 Copy PushNotificationService.FIXED.js
  - **File:** `src/services/PushNotificationService.js`
  - **Requirements:** 8
  - **Changes:** Token lifecycle implementation

- [ ] 8.2 Create push_tokens table in database
  - **File:** `supabase/schema_extended.sql`
  - **SQL:** CREATE TABLE push_tokens (...)
  - **Requirements:** 8

- [ ] 8.3 Implement token registration
  - **File:** `src/services/PushNotificationService.js`
  - **Changes:** Store token with expiration
  - **Requirements:** 8

- [ ] 8.4 Implement token validation
  - **File:** `src/services/PushNotificationService.js`
  - **Changes:** Check token validity before sending
  - **Requirements:** 8

- [ ] 8.5 Implement token refresh
  - **File:** `src/services/PushNotificationService.js`
  - **Changes:** Extend expiration on validation
  - **Requirements:** 8

- [ ] 8.6 Integrate into App.js
  - **File:** `App.js`
  - **Changes:** Call registerForPushNotifications on startup
  - **Requirements:** 8

- [ ]* 8.7 Write property test for push token lifecycle
  - **Property:** Property 7 - Push Token Lifecycle
  - **Validates:** Requirements 8
  - **File:** `src/services/__tests__/PushTokenLifecycle.property.test.js`

### 9. GDPR Data Export
- [ ] 9.1 Copy gdpr-complete.js to backend
  - **File:** `backend/src/routes/gdpr.js`
  - **Requirements:** 9
  - **Changes:** GDPR export implementation

- [ ] 9.2 Register GDPR routes in Express
  - **File:** `backend/src/server.js`
  - **Changes:** app.use('/api/gdpr', gdprRoutes)
  - **Requirements:** 9

- [ ] 9.3 Implement data export endpoint
  - **File:** `backend/src/routes/gdpr.js`
  - **Changes:** GET /api/gdpr/export
  - **Requirements:** 9

- [ ] 9.4 Implement ZIP export endpoint
  - **File:** `backend/src/routes/gdpr.js`
  - **Changes:** GET /api/gdpr/export/zip
  - **Requirements:** 9

- [ ] 9.5 Implement account deletion endpoint
  - **File:** `backend/src/routes/gdpr.js`
  - **Changes:** DELETE /api/gdpr/delete-account
  - **Requirements:** 9

- [ ] 9.6 Create audit log for GDPR requests
  - **File:** `backend/src/routes/gdpr.js`
  - **Changes:** Log all GDPR requests
  - **Requirements:** 9

- [ ]* 9.7 Write property test for GDPR completeness
  - **Property:** Property 8 - GDPR Data Completeness
  - **Validates:** Requirements 9
  - **File:** `src/services/__tests__/GDPRCompleteness.property.test.js`

### Checkpoint 1: Ensure all P0 tests pass
- [ ] Run all P0 property tests
- [ ] Verify all P0 features work
- [ ] Check database migrations
- [ ] Verify RLS policies enforced

---

## PHASE 2: HIGH PRIORITY FEATURES (P1) - 8-10 hours

### 10. Realtime Reconnection Logic
- [ ] 10.1 Enhance NetworkService with reconnection
  - **File:** `src/context/NetworkContext.js`
  - **Requirements:** 10
  - **Changes:** Add reconnection logic

- [ ] 10.2 Implement exponential backoff
  - **File:** `src/context/NetworkContext.js`
  - **Changes:** Retry with increasing delays
  - **Requirements:** 10

- [ ] 10.3 Fetch missed messages on reconnect
  - **File:** `src/services/MessageService.js`
  - **Changes:** Query messages since last sync
  - **Requirements:** 10

- [ ] 10.4 Sync offline queue on reconnect
  - **File:** `src/services/OfflineQueueService.js`
  - **Changes:** Already implemented in Phase 1
  - **Requirements:** 10

- [ ]* 10.5 Write property test for reconnection
  - **Property:** Property 9 - Reconnection Consistency
  - **Validates:** Requirements 10
  - **File:** `src/services/__tests__/Reconnection.property.test.js`

### 11. Offline Mode Indicator
- [ ] 11.1 Create OfflineModeIndicator component
  - **File:** `src/components/OfflineModeIndicator.js`
  - **Requirements:** 12
  - **Changes:** UI component for offline status

- [ ] 11.2 Show indicator when offline
  - **File:** `src/components/OfflineModeIndicator.js`
  - **Changes:** Display "Offline Mode"
  - **Requirements:** 12

- [ ] 11.3 Show syncing status
  - **File:** `src/components/OfflineModeIndicator.js`
  - **Changes:** Display "Syncing..."
  - **Requirements:** 12

- [ ] 11.4 Show synced status
  - **File:** `src/components/OfflineModeIndicator.js`
  - **Changes:** Display "Synced"
  - **Requirements:** 12

- [ ] 11.5 Integrate into App.js
  - **File:** `App.js`
  - **Changes:** Add OfflineModeIndicator to root
  - **Requirements:** 12

- [ ]* 11.6 Write property test for offline indicator
  - **Property:** Property 11 - Offline Mode Indication
  - **Validates:** Requirements 12
  - **File:** `src/services/__tests__/OfflineIndicator.property.test.js`

### 12. Session Timeout Handling
- [ ] 12.1 Add session timeout warning
  - **File:** `src/services/AuthService.js`
  - **Requirements:** 13
  - **Changes:** Warn user 5 minutes before timeout

- [ ] 12.2 Create SessionTimeoutWarning component
  - **File:** `src/components/SessionTimeoutWarning.js`
  - **Changes:** Modal for timeout warning
  - **Requirements:** 13

- [ ] 12.3 Allow session extension
  - **File:** `src/services/AuthService.js`
  - **Changes:** Extend session on user action
  - **Requirements:** 13

- [ ] 12.4 Logout on timeout
  - **File:** `src/services/AuthService.js`
  - **Changes:** Auto-logout when timeout expires
  - **Requirements:** 13

- [ ]* 12.5 Write property test for session timeout
  - **Property:** Property 12 - Session Timeout Warning
  - **Validates:** Requirements 13
  - **File:** `src/services/__tests__/SessionTimeout.property.test.js`

### 13. Rate Limiting
- [ ] 13.1 Create RateLimitService
  - **File:** `src/services/RateLimitService.js`
  - **Requirements:** 14
  - **Changes:** Rate limiting implementation

- [ ] 13.2 Implement request throttling
  - **File:** `src/services/RateLimitService.js`
  - **Changes:** Track requests per endpoint
  - **Requirements:** 14

- [ ] 13.3 Implement premium tier limits
  - **File:** `src/services/RateLimitService.js`
  - **Changes:** Higher limits for premium users
  - **Requirements:** 14

- [ ] 13.4 Integrate into API calls
  - **File:** `src/services/BaseService.js`
  - **Changes:** Check rate limit before request
  - **Requirements:** 14

- [ ]* 13.5 Write property test for rate limiting
  - **Property:** Property 13 - Rate Limit Enforcement
  - **Validates:** Requirements 14
  - **File:** `src/services/__tests__/RateLimiting.property.test.js`

### 14. Input Validation
- [ ] 14.1 Create ValidationService
  - **File:** `src/services/ValidationService.js`
  - **Requirements:** 15
  - **Changes:** Input validation implementation

- [ ] 14.2 Implement email validation
  - **File:** `src/services/ValidationService.js`
  - **Changes:** Validate email format
  - **Requirements:** 15

- [ ] 14.3 Implement password validation
  - **File:** `src/services/ValidationService.js`
  - **Changes:** Validate password strength
  - **Requirements:** 15

- [ ] 14.4 Implement bio validation
  - **File:** `src/services/ValidationService.js`
  - **Changes:** Validate bio length and content
  - **Requirements:** 15

- [ ] 14.5 Integrate into forms
  - **File:** `src/screens/RegisterScreen.js`, `src/screens/ProfileScreen.js`
  - **Changes:** Validate on input change
  - **Requirements:** 15

- [ ]* 14.6 Write property test for input validation
  - **Property:** Property 14 - Input Validation Consistency
  - **Validates:** Requirements 15
  - **File:** `src/services/__tests__/InputValidation.property.test.js`

### 15. Error Recovery
- [ ] 15.1 Enhance ErrorHandlingService
  - **File:** `src/services/ErrorHandlingService.js`
  - **Requirements:** 16
  - **Changes:** Error recovery implementation

- [ ] 15.2 Implement retry logic
  - **File:** `src/services/ErrorHandlingService.js`
  - **Changes:** Retry with exponential backoff
  - **Requirements:** 16

- [ ] 15.3 Implement error recovery strategies
  - **File:** `src/services/ErrorHandlingService.js`
  - **Changes:** Different strategies per error type
  - **Requirements:** 16

- [ ] 15.4 Show recovery options to user
  - **File:** `src/components/ErrorRecoveryDialog.js`
  - **Changes:** UI for error recovery
  - **Requirements:** 16

- [ ]* 15.5 Write property test for error recovery
  - **Property:** Property 15 - Error Recovery Success
  - **Validates:** Requirements 16
  - **File:** `src/services/__tests__/ErrorRecovery.property.test.js`

### 16. Data Encryption
- [ ] 16.1 Create EncryptionService
  - **File:** `src/services/EncryptionService.js`
  - **Requirements:** 17
  - **Changes:** Encryption implementation

- [ ] 16.2 Implement encryption for sensitive data
  - **File:** `src/services/EncryptionService.js`
  - **Changes:** Encrypt passwords, tokens
  - **Requirements:** 17

- [ ] 16.3 Implement key management
  - **File:** `src/services/EncryptionService.js`
  - **Changes:** Generate and rotate keys
  - **Requirements:** 17

- [ ] 16.4 Integrate into storage
  - **File:** `src/services/StorageService.js`
  - **Changes:** Encrypt before storing
  - **Requirements:** 17

- [ ]* 16.5 Write property test for encryption
  - **Property:** Property 16 - Encryption Consistency
  - **Validates:** Requirements 17
  - **File:** `src/services/__tests__/Encryption.property.test.js`

### 17. Audit Logging
- [ ] 17.1 Create AuditService
  - **File:** `src/services/AuditService.js`
  - **Requirements:** 18
  - **Changes:** Audit logging implementation

- [ ] 17.2 Create audit_logs table
  - **File:** `supabase/schema_extended.sql`
  - **SQL:** CREATE TABLE audit_logs (...)
  - **Requirements:** 18

- [ ] 17.3 Log user actions
  - **File:** `src/services/AuditService.js`
  - **Changes:** Log login, logout, data changes
  - **Requirements:** 18

- [ ] 17.4 Log security events
  - **File:** `src/services/AuditService.js`
  - **Changes:** Log suspicious activities
  - **Requirements:** 18

- [ ] 17.5 Integrate into services
  - **File:** `src/services/AuthService.js`, `src/services/ProfileService.js`
  - **Changes:** Call auditService.logAction()
  - **Requirements:** 18

- [ ]* 17.6 Write property test for audit logging
  - **Property:** Property 17 - Audit Log Immutability
  - **Validates:** Requirements 18
  - **File:** `src/services/__tests__/AuditLogging.property.test.js`

### 18. Security Headers
- [ ] 18.1 Add security headers to backend
  - **File:** `backend/src/server.js`
  - **Requirements:** 19
  - **Changes:** Add helmet middleware

- [ ] 18.2 Set Content-Security-Policy
  - **File:** `backend/src/server.js`
  - **Changes:** CSP header
  - **Requirements:** 19

- [ ] 18.3 Set X-Frame-Options
  - **File:** `backend/src/server.js`
  - **Changes:** X-Frame-Options header
  - **Requirements:** 19

- [ ] 18.4 Set X-Content-Type-Options
  - **File:** `backend/src/server.js`
  - **Changes:** X-Content-Type-Options header
  - **Requirements:** 19

- [ ] 18.5 Set Strict-Transport-Security
  - **File:** `backend/src/server.js`
  - **Changes:** HSTS header
  - **Requirements:** 19

- [ ]* 18.6 Write property test for security headers
  - **Property:** Property 18 - Security Header Presence
  - **Validates:** Requirements 19
  - **File:** `src/services/__tests__/SecurityHeaders.property.test.js`

### 19. Certificate Pinning
- [ ] 19.1 Implement certificate pinning
  - **File:** `src/services/APIService.js`
  - **Requirements:** 20
  - **Changes:** Pin SSL certificates

- [ ] 19.2 Validate certificate on connection
  - **File:** `src/services/APIService.js`
  - **Changes:** Check certificate matches
  - **Requirements:** 20

- [ ] 19.3 Reject connection on mismatch
  - **File:** `src/services/APIService.js`
  - **Changes:** Throw error if certificate doesn't match
  - **Requirements:** 20

- [ ]* 19.4 Write property test for certificate pinning
  - **Property:** Property 19 - Certificate Pinning Enforcement
  - **Validates:** Requirements 20
  - **File:** `src/services/__tests__/CertificatePinning.property.test.js`

### 20. Dependency Scanning
- [ ] 20.1 Add dependency scanning to CI/CD
  - **File:** `.github/workflows/security.yml`
  - **Requirements:** 21
  - **Changes:** Add npm audit step

- [ ] 20.2 Fail build on vulnerabilities
  - **File:** `.github/workflows/security.yml`
  - **Changes:** Exit with error if vulnerabilities found
  - **Requirements:** 21

- [ ] 20.3 Generate vulnerability report
  - **File:** `.github/workflows/security.yml`
  - **Changes:** Generate and upload report
  - **Requirements:** 21

- [ ]* 20.4 Write property test for dependency scanning
  - **Property:** Property 20 - Dependency Vulnerability Detection
  - **Validates:** Requirements 21
  - **File:** `src/services/__tests__/DependencyScanning.property.test.js`

### Checkpoint 2: Ensure all P1 tests pass
- [ ] Run all P1 property tests
- [ ] Verify all P1 features work
- [ ] Check error handling
- [ ] Verify security measures

---

## PHASE 3: CORE FEATURES & TESTS - 10-12 hours

### 21. Premium Features Completion
- [ ] 21.1 Complete subscription management
  - **File:** `src/services/PaymentService.js`
  - **Requirements:** 22

- [ ] 21.2 Complete feature unlocking
  - **File:** `src/services/PaymentService.js`
  - **Requirements:** 22

- [ ] 21.3 Complete expiration handling
  - **File:** `src/services/PaymentService.js`
  - **Requirements:** 22

### 22. Push Notifications Completion
- [ ] 22.1 Complete push notification sending
  - **File:** `src/services/PushNotificationService.js`
  - **Requirements:** 23

- [ ] 22.2 Complete in-app notifications
  - **File:** `src/components/InAppNotification.js`
  - **Requirements:** 23

- [ ] 22.3 Complete real-time updates
  - **File:** `src/services/MessageService.js`
  - **Requirements:** 23

### 23. Legal Screens Completion
- [ ] 23.1 Complete terms of service screen
  - **File:** `src/screens/TermsScreen.js`
  - **Requirements:** 24

- [ ] 23.2 Complete privacy policy screen
  - **File:** `src/screens/PrivacyScreen.js`
  - **Requirements:** 24

- [ ] 23.3 Complete consent recording
  - **File:** `src/services/ConsentService.js`
  - **Requirements:** 24

### 24. Service Completions
- [ ] 24.1 Complete AuthService
  - **File:** `src/services/AuthService.js`
  - **Requirements:** 29

- [ ] 24.2 Complete ProfileService
  - **File:** `src/services/ProfileService.js`
  - **Requirements:** 30

- [ ] 24.3 Complete MatchService
  - **File:** `src/services/MatchService.js`
  - **Requirements:** 31

- [ ] 24.4 Complete MessageService
  - **File:** `src/services/MessageService.js`
  - **Requirements:** 32

- [ ] 24.5 Complete StorageService
  - **File:** `src/services/StorageService.js`
  - **Requirements:** 33

- [ ] 24.6 Complete LocationService
  - **File:** `src/services/LocationService.js`
  - **Requirements:** 34

- [ ] 24.7 Complete PaymentService
  - **File:** `src/services/PaymentService.js`
  - **Requirements:** 35

- [ ] 24.8 Complete AnalyticsService
  - **File:** `src/services/AnalyticsService.js`
  - **Requirements:** 36

- [ ] 24.9 Complete ModerationService
  - **File:** `src/services/ModerationService.js`
  - **Requirements:** 37

### 25. SQL Policies & Schemas
- [ ] 25.1 Deploy complete RLS policies
  - **File:** `supabase/rls-policies.sql`
  - **Requirements:** 38

- [ ] 25.2 Deploy extended database schema
  - **File:** `supabase/schema_extended.sql`
  - **Requirements:** 39

### Checkpoint 3: Ensure all tests pass
- [ ] Run all property tests (37 total)
- [ ] Run all unit tests
- [ ] Run all integration tests
- [ ] Verify all features work

---

## FINAL VERIFICATION

### 26. Production Readiness Checklist
- [ ] All P0 security fixes implemented
- [ ] All P1 high priority features implemented
- [ ] All core features completed
- [ ] All 37 property tests passing
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Zero critical security vulnerabilities
- [ ] Performance benchmarks met
- [ ] Code review completed
- [ ] Documentation updated

### 27. Deployment
- [ ] Database migrations applied
- [ ] Services deployed
- [ ] Configuration updated
- [ ] Monitoring activated
- [ ] Health checks passing
- [ ] Error monitoring active
- [ ] Performance monitoring active

---

## Summary

**Total Tasks:** 50+  
**Estimated Time:** 22-27 hours  
**Phases:** 3  
**Property Tests:** 20 new + 8 existing = 28 total  
**Services:** 10 complete + 9 enhanced = 19 total  
**SQL Scripts:** 5 deployed  

**Status:** 🔴 READY FOR IMPLEMENTATION

---

**Document Created:** December 7, 2025  
**Next Step:** Begin Phase 1 implementation
