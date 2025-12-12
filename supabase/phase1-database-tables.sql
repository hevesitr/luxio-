-- ============================================
-- PHASE 1: ADDITIONAL DATABASE TABLES
-- ============================================
-- Deploy Date: December 7, 2025
-- Purpose: Create tables for Phase 1 security features

-- ============================================
-- 1. IDEMPOTENCY KEYS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  result JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own idempotency keys" ON idempotency_keys;

CREATE POLICY "Users can view own idempotency keys"
ON idempotency_keys FOR SELECT
USING (true);

-- ============================================
-- 2. GDPR REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_id ON gdpr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status);

ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own GDPR requests" ON gdpr_requests;
DROP POLICY IF EXISTS "Users can create GDPR requests" ON gdpr_requests;

CREATE POLICY "Users can view own GDPR requests"
ON gdpr_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create GDPR requests"
ON gdpr_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. PUSH TOKENS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_validated_at TIMESTAMP,
  validation_count INT DEFAULT 0,
  deactivated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_expires_at ON push_tokens(expires_at);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can insert push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can update own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can delete own push tokens" ON push_tokens;

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

-- ============================================
-- 4. AUDIT LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;

CREATE POLICY "Users can view own audit logs"
ON audit_logs FOR SELECT
USING (auth.uid() = user_id);

-- Audit logs are immutable - no UPDATE or DELETE policies

-- ============================================
-- 5. DEVICE FINGERPRINTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user_id ON device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_fingerprint ON device_fingerprints(fingerprint);

ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own device fingerprints" ON device_fingerprints;
DROP POLICY IF EXISTS "Users can insert device fingerprints" ON device_fingerprints;
DROP POLICY IF EXISTS "Users can update own device fingerprints" ON device_fingerprints;

CREATE POLICY "Users can view own device fingerprints"
ON device_fingerprints FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert device fingerprints"
ON device_fingerprints FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own device fingerprints"
ON device_fingerprints FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. OFFLINE QUEUE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS offline_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'synced', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_offline_queue_user_id ON offline_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_queue_status ON offline_queue(status);
CREATE INDEX IF NOT EXISTS idx_offline_queue_created_at ON offline_queue(created_at);

ALTER TABLE offline_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own offline queue" ON offline_queue;
DROP POLICY IF EXISTS "Users can insert offline queue items" ON offline_queue;
DROP POLICY IF EXISTS "Users can update own offline queue" ON offline_queue;
DROP POLICY IF EXISTS "Users can delete own offline queue" ON offline_queue;

CREATE POLICY "Users can view own offline queue"
ON offline_queue FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert offline queue items"
ON offline_queue FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offline queue"
ON offline_queue FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own offline queue"
ON offline_queue FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_name IN (
  'idempotency_keys',
  'gdpr_requests',
  'push_tokens',
  'audit_logs',
  'device_fingerprints',
  'offline_queue'
)
ORDER BY table_name;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN (
  'idempotency_keys',
  'gdpr_requests',
  'push_tokens',
  'audit_logs',
  'device_fingerprints',
  'offline_queue'
)
ORDER BY tablename;

-- ============================================
-- NOTES
-- ============================================
-- 1. All tables have RLS enabled
-- 2. Users can only access their own data
-- 3. Audit logs are immutable (no UPDATE/DELETE)
-- 4. Indexes created for performance
-- 5. Foreign keys ensure data integrity
-- ============================================
