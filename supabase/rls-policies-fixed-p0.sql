-- ============================================================================
-- P0 CRITICAL: RLS POLICY FIXES - Security Bypass Prevention
-- ============================================================================

-- Helper functions for security checks
CREATE OR REPLACE FUNCTION is_user_banned(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND is_banned = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_user_blocked(blocker_id UUID, blocked_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = blocker_id AND blocked_id = blocked_id)
    OR (blocker_id = blocked_id AND blocked_id = blocker_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_active_match(user_id UUID, other_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM matches
    WHERE (user_id_1 = user_id AND user_id_2 = other_user_id)
    OR (user_id_1 = other_user_id AND user_id_2 = user_id)
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PROFILES - Fixed RLS Policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view potential matches" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- SELECT: View own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- SELECT: View potential matches (with security checks)
CREATE POLICY "Users can view potential matches"
ON profiles FOR SELECT
USING (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  -- Cannot view own profile
  AND auth.uid() != id
  -- Viewing user must not be banned
  AND NOT is_user_banned(auth.uid())
  -- Viewed user must not be banned
  AND NOT is_user_banned(id)
  -- No mutual block
  AND NOT is_user_blocked(auth.uid(), id)
  -- User hasn't passed on this profile
  AND NOT EXISTS (
    SELECT 1 FROM passes
    WHERE passes.user_id = auth.uid()
    AND passes.passed_user_id = profiles.id
  )
);

-- INSERT: Create own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- UPDATE: Update own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- DELETE: Delete own profile
CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
USING (auth.uid() = id);

-- ============================================================================
-- MATCHES - Fixed RLS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own matches" ON matches;
DROP POLICY IF EXISTS "Users can insert matches" ON matches;
DROP POLICY IF EXISTS "Users can update own matches" ON matches;

-- SELECT: View own matches
CREATE POLICY "Users can view own matches"
ON matches FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
  AND status = 'active'
);

-- INSERT: Create match (only via RPC)
CREATE POLICY "Matches can only be created via RPC"
ON matches FOR INSERT
WITH CHECK (false); -- Use RPC instead

-- UPDATE: Update own match
CREATE POLICY "Users can update own matches"
ON matches FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
);

-- ============================================================================
-- MESSAGES - Fixed RLS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;

-- SELECT: View messages only if part of match
CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (auth.uid() = sender_id OR auth.uid() = recipient_id)
  AND EXISTS (
    SELECT 1 FROM matches
    WHERE id = messages.match_id
    AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND status = 'active'
  )
);

-- INSERT: Send message only if part of match
CREATE POLICY "Users can insert messages"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM matches
    WHERE id = match_id
    AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND status = 'active'
  )
);

-- UPDATE: Update own messages (only content, not sender)
CREATE POLICY "Users can update own messages"
ON messages FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND auth.uid() = sender_id
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = sender_id
  AND sender_id = OLD.sender_id -- Cannot change sender
);

-- ============================================================================
-- LIKES - Fixed RLS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own likes" ON likes;
DROP POLICY IF EXISTS "Users can insert likes" ON likes;

-- SELECT: View own likes
CREATE POLICY "Users can view own likes"
ON likes FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Create like (with duplicate prevention)
CREATE POLICY "Users can insert likes"
ON likes FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
  AND user_id != liked_user_id
  AND NOT is_user_banned(user_id)
  AND NOT is_user_banned(liked_user_id)
  AND NOT is_user_blocked(user_id, liked_user_id)
  -- Prevent duplicate likes
  AND NOT EXISTS (
    SELECT 1 FROM likes l
    WHERE l.user_id = user_id
    AND l.liked_user_id = liked_user_id
  )
);

-- ============================================================================
-- PASSES - Fixed RLS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own passes" ON passes;
DROP POLICY IF EXISTS "Users can insert passes" ON passes;

-- SELECT: View own passes
CREATE POLICY "Users can view own passes"
ON passes FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Create pass (with duplicate prevention)
CREATE POLICY "Users can insert passes"
ON passes FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
  AND user_id != passed_user_id
  AND NOT is_user_banned(user_id)
  AND NOT is_user_banned(passed_user_id)
  AND NOT is_user_blocked(user_id, passed_user_id)
  -- Prevent duplicate passes
  AND NOT EXISTS (
    SELECT 1 FROM passes p
    WHERE p.user_id = user_id
    AND p.passed_user_id = passed_user_id
  )
);

-- ============================================================================
-- BLOCKS - Fixed RLS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own blocks" ON blocks;
DROP POLICY IF EXISTS "Users can insert blocks" ON blocks;
DROP POLICY IF EXISTS "Users can delete own blocks" ON blocks;

-- SELECT: View own blocks
CREATE POLICY "Users can view own blocks"
ON blocks FOR SELECT
USING (auth.uid() = blocker_id);

-- INSERT: Create block
CREATE POLICY "Users can insert blocks"
ON blocks FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = blocker_id
  AND blocker_id != blocked_id
  -- Prevent duplicate blocks
  AND NOT EXISTS (
    SELECT 1 FROM blocks b
    WHERE b.blocker_id = blocker_id
    AND b.blocked_id = blocked_id
  )
);

-- DELETE: Remove block
CREATE POLICY "Users can delete own blocks"
ON blocks FOR DELETE
USING (auth.uid() = blocker_id);

-- ============================================================================
-- STORAGE - Fixed RLS Policies
-- ============================================================================

-- Avatars bucket
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND NOT is_user_banned(auth.uid()::uuid)
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Photos bucket
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'photos'
  AND NOT is_user_banned(auth.uid()::uuid)
);

CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- AUDIT LOGGING
-- ============================================================================

-- Create audit log table if not exists
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit log policies
CREATE POLICY "Users can view own audit logs"
ON audit_logs FOR SELECT
USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all policies are in place
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
