-- ============================================
-- 🔒 SECURITY-FIXED ROW LEVEL SECURITY (RLS) POLICIES
-- Dating App Security Implementation - KRITIKUS JAVÍTÁSOK
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES TABLE POLICIES - SZIGORÚBBAK
-- ============================================

-- ✅ JAVÍTOTT: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- ✅ JAVÍTOTT: Users can view potential matches (csak aktív profilokat)
CREATE POLICY "Users can view potential matches"
ON profiles FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND auth.uid() != id
  AND is_visible = true
  AND NOT EXISTS (
    SELECT 1 FROM passes
    WHERE passes.user_id = auth.uid()
    AND passes.passed_user_id = profiles.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = auth.uid() AND blocked_id = profiles.id)
       OR (blocker_id = profiles.id AND blocked_id = auth.uid())
  )
);

-- ❌ RÉGI (NEM BIZTONSÁGOS): Túl engedékeny UPDATE
-- CREATE POLICY "Users can update own profile"
-- ON profiles FOR UPDATE
-- USING (auth.uid() = id)
-- WITH CHECK (auth.uid() = id);

-- ✅ JAVÍTOTT: Szigorúbb UPDATE politika rate limiting-gel
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (
  auth.uid() = id
  AND id = (SELECT id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  auth.uid() = id
  AND id = (SELECT id FROM profiles WHERE id = auth.uid())
  AND updated_at > NOW() - INTERVAL '1 second' -- Rate limit: max 1 update/sec
);

-- ✅ JAVÍTOTT: INSERT csak saját profilra
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (
  auth.uid() = id
  AND id IS NOT NULL
  AND LENGTH(TRIM(COALESCE(first_name, ''))) > 0
  AND age >= 18
);

-- ============================================
-- MATCHES TABLE POLICIES
-- ============================================

-- ✅ JAVÍTOTT: Users can view their own matches
CREATE POLICY "Users can view own matches"
ON matches FOR SELECT
USING (
  auth.uid() = user_id
  OR auth.uid() = matched_user_id
);

-- ✅ JAVÍTOTT: Users can create matches (csak like/pass után)
CREATE POLICY "Users can create matches"
ON matches FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND matched_user_id IS NOT NULL
  AND matched_user_id != auth.uid()
);

-- ============================================
-- MESSAGES TABLE POLICIES - JAVÍTOTT
-- ============================================

-- ✅ KRITIKUS JAVÍTÁS: Users can view messages in conversations (BLOCKED USERS EXCLUDED)
CREATE POLICY "Users can view messages in conversations"
ON messages FOR SELECT
USING (
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = auth.uid() AND blocked_id = CASE WHEN auth.uid() = sender_id THEN receiver_id ELSE sender_id END)
       OR (blocker_id = CASE WHEN auth.uid() = sender_id THEN receiver_id ELSE sender_id END AND blocked_id = auth.uid())
  )
);

-- ✅ JAVÍTOTT: Users can send messages to matches only
CREATE POLICY "Users can send messages to matches"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND receiver_id IS NOT NULL
  AND receiver_id != auth.uid()
  AND EXISTS (
    SELECT 1 FROM matches
    WHERE ((user_id = auth.uid() AND matched_user_id = receiver_id)
        OR (user_id = receiver_id AND matched_user_id = auth.uid()))
    AND created_at > NOW() - INTERVAL '30 days' -- Csak aktív match-ek
  )
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = auth.uid() AND blocked_id = receiver_id)
       OR (blocker_id = receiver_id AND blocked_id = auth.uid())
  )
);

-- ✅ JAVÍTOTT: Users can update their own messages (csak content, max 5 perc)
CREATE POLICY "Users can update own messages"
ON messages FOR UPDATE
USING (
  auth.uid() = sender_id
  AND created_at > NOW() - INTERVAL '5 minutes' -- Csak 5 percen belül
)
WITH CHECK (
  auth.uid() = sender_id
  AND created_at > NOW() - INTERVAL '5 minutes'
  AND updated_at > NOW() - INTERVAL '1 second' -- Rate limit
);

-- ✅ JAVÍTOTT: Users can delete their own messages (csak saját, max 1 óra)
CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
USING (
  auth.uid() = sender_id
  AND created_at > NOW() - INTERVAL '1 hour' -- Csak 1 órán belül törölhető
);

-- ============================================
-- LIKES TABLE POLICIES
-- ============================================

-- ✅ JAVÍTOTT: Users can view likes they received
CREATE POLICY "Users can view received likes"
ON likes FOR SELECT
USING (auth.uid() = liked_user_id);

-- ✅ JAVÍTOTT: Users can create likes (nem like-olt profilokra)
CREATE POLICY "Users can create likes"
ON likes FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND liked_user_id IS NOT NULL
  AND liked_user_id != auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM likes
    WHERE user_id = auth.uid() AND liked_user_id = likes.liked_user_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM passes
    WHERE user_id = auth.uid() AND passed_user_id = liked_user_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = auth.uid() AND blocked_id = liked_user_id)
       OR (blocker_id = liked_user_id AND blocked_id = auth.uid())
  )
);

-- ============================================
-- PASSES TABLE POLICIES
-- ============================================

-- ✅ JAVÍTOTT: Users can view their own passes (privacy)
CREATE POLICY "Users can view own passes"
ON passes FOR SELECT
USING (auth.uid() = user_id);

-- ✅ KRITIKUS JAVÍTÁS: Users can create passes (blokkoltra nem)
CREATE POLICY "Users can create passes"
ON passes FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND passed_user_id IS NOT NULL
  AND passed_user_id != auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM passes
    WHERE user_id = auth.uid() AND passed_user_id = passes.passed_user_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = auth.uid() AND blocked_id = passed_user_id)
       OR (blocker_id = passed_user_id AND blocked_id = auth.uid())
  )
);

-- ============================================
-- BLOCKED_USERS TABLE POLICIES
-- ============================================

-- ✅ JAVÍTOTT: Users can view their own blocks
CREATE POLICY "Users can view own blocks"
ON blocked_users FOR SELECT
USING (auth.uid() = blocker_id);

-- ✅ JAVÍTOTT: Users can create blocks
CREATE POLICY "Users can create blocks"
ON blocked_users FOR INSERT
WITH CHECK (
  auth.uid() = blocker_id
  AND blocked_id IS NOT NULL
  AND blocked_id != auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE blocker_id = auth.uid() AND blocked_id = blocked_users.blocked_id
  )
);

-- ✅ JAVÍTOTT: Users can unblock (delete blocks)
CREATE POLICY "Users can unblock"
ON blocked_users FOR DELETE
USING (auth.uid() = blocker_id);

-- ============================================
-- ACCOUNT MANAGEMENT POLICIES
-- ============================================

-- ✅ JAVÍTOTT: Users can view their own deletion requests
CREATE POLICY "Users can view own deletion requests"
ON account_deletion_requests FOR SELECT
USING (auth.uid() = user_id);

-- ✅ JAVÍTOTT: Users can create deletion requests
CREATE POLICY "Users can create deletion requests"
ON account_deletion_requests FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM account_deletion_requests
    WHERE user_id = auth.uid() AND status = 'pending'
  )
);

-- ✅ JAVÍTOTT: Users can cancel their own pending requests
CREATE POLICY "Users can cancel own deletion requests"
ON account_deletion_requests FOR UPDATE
USING (
  auth.uid() = user_id
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() = user_id
  AND status IN ('cancelled')
);

-- ✅ JAVÍTOTT: Data export requests
CREATE POLICY "Users can view own export requests"
ON data_export_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create export requests"
ON data_export_requests FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (
    SELECT 1 FROM data_export_requests
    WHERE user_id = auth.uid()
    AND status IN ('processing', 'completed')
    AND created_at > NOW() - INTERVAL '24 hours'
  )
);

-- ============================================
-- RATE LIMITING FUNCTIONS
-- ============================================

-- ✅ ÚJ: Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_uuid UUID,
  action_type TEXT,
  max_actions INTEGER,
  time_window INTERVAL
)
RETURNS BOOLEAN AS $$
DECLARE
  action_count INTEGER;
BEGIN
  -- Count actions in time window
  SELECT COUNT(*) INTO action_count
  FROM audit_log
  WHERE user_id = user_uuid
    AND action = action_type
    AND created_at > NOW() - time_window;

  RETURN action_count < max_actions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUDIT LOGGING
-- ============================================

-- ✅ ÚJ: Audit table for security monitoring
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
ON audit_log FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
ON audit_log FOR SELECT
USING (auth.uid() = user_id);

-- ============================================
-- SECURITY MONITORING FUNCTIONS
-- ============================================

-- ✅ ÚJ: Log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, resource_type, resource_id, details)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ ÚJ: Check for suspicious activity
CREATE OR REPLACE FUNCTION check_suspicious_activity(user_uuid UUID)
RETURNS TABLE (
  suspicious_logins INTEGER,
  rapid_actions INTEGER,
  blocked_attempts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE action = 'LOGIN' AND details->>'suspicious' = 'true') as suspicious_logins,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as rapid_actions,
    COUNT(*) FILTER (WHERE action = 'BLOCKED_ATTEMPT') as blocked_attempts
  FROM audit_log
  WHERE user_id = user_uuid
    AND created_at > NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- ✅ ÚJ: Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_is_visible ON profiles(is_visible);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_likes_user_liked ON likes(user_id, liked_user_id);
CREATE INDEX IF NOT EXISTS idx_passes_user_passed ON passes(user_id, passed_user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_action ON audit_log(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE audit_log IS 'Security audit log for monitoring user actions';
COMMENT ON FUNCTION check_rate_limit(UUID, TEXT, INTEGER, INTERVAL) IS 'Rate limiting function for security';
COMMENT ON FUNCTION log_security_event(UUID, TEXT, TEXT, TEXT, JSONB) IS 'Log security events for monitoring';
COMMENT ON FUNCTION check_suspicious_activity(UUID) IS 'Check for suspicious user activity';
