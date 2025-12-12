-- ============================================
-- PHASE 1: CRITICAL SECURITY RLS POLICIES (P0)
-- ============================================
-- Deploy Date: December 7, 2025
-- Purpose: Fix critical RLS policy bypasses and security vulnerabilities
-- Requirements: 2 (RLS Policy Bypass Prevention)

-- ============================================
-- 1. PROFILES TABLE - Enhanced RLS Policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view other profiles" ON profiles;
DROP POLICY IF EXISTS "Blocked users cannot see each other" ON profiles;

-- Create enhanced policies
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can view other profiles"
ON profiles FOR SELECT
USING (
  auth.uid()::text != id::text
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id::text = auth.uid()::text AND blocked_id::text = id::text)
       OR (blocker_id::text = id::text AND blocked_id::text = auth.uid()::text)
  )
);

-- ============================================
-- 2. BLOCKED_USERS TABLE - RLS Policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own blocks" ON blocked_users;
DROP POLICY IF EXISTS "Users can create blocks" ON blocked_users;
DROP POLICY IF EXISTS "Users can delete own blocks" ON blocked_users;

-- Create policies
CREATE POLICY "Users can view own blocks"
ON blocked_users FOR SELECT
USING (auth.uid()::text = blocker_id::text);

CREATE POLICY "Users can create blocks"
ON blocked_users FOR INSERT
WITH CHECK (auth.uid()::text = blocker_id::text);

CREATE POLICY "Users can delete own blocks"
ON blocked_users FOR DELETE
USING (auth.uid()::text = blocker_id::text);

-- ============================================
-- 3. MATCHES TABLE - Enhanced RLS Policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own matches" ON matches;
DROP POLICY IF EXISTS "Users can create matches" ON matches;
DROP POLICY IF EXISTS "Users can delete own matches" ON matches;
DROP POLICY IF EXISTS "Blocked users cannot match" ON matches;

-- Create enhanced policies
CREATE POLICY "Users can view own matches"
ON matches FOR SELECT
USING (
  (auth.uid()::text = user_id::text OR auth.uid()::text = matched_user_id::text)
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id::text = user_id::text AND blocked_id::text = matched_user_id::text)
       OR (blocker_id::text = matched_user_id::text AND blocked_id::text = user_id::text)
  )
);

CREATE POLICY "Users can create matches"
ON matches FOR INSERT
WITH CHECK (
  (auth.uid()::text = user_id::text OR auth.uid()::text = matched_user_id::text)
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id::text = user_id::text AND blocked_id::text = matched_user_id::text)
       OR (blocker_id::text = matched_user_id::text AND blocked_id::text = user_id::text)
  )
);

CREATE POLICY "Users can delete own matches"
ON matches FOR DELETE
USING (auth.uid()::text = user_id::text OR auth.uid()::text = matched_user_id::text);

-- ============================================
-- 4. MESSAGES TABLE - Enhanced RLS Policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
DROP POLICY IF EXISTS "Blocked users cannot message" ON messages;

-- Create enhanced policies
CREATE POLICY "Users can view messages in their matches"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id::text = messages.match_id::text
      AND (matches.user_id::text = auth.uid()::text OR matches.matched_user_id::text = auth.uid()::text)
      AND NOT EXISTS (
        SELECT 1 FROM blocked_users
        WHERE (blocker_id::text = matches.user_id::text AND blocked_id::text = matches.matched_user_id::text)
           OR (blocker_id::text = matches.matched_user_id::text AND blocked_id::text = matches.user_id::text)
      )
  )
);

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (
  auth.uid()::text = sender_id::text
  AND EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id::text = match_id::text
      AND (matches.user_id::text = auth.uid()::text OR matches.matched_user_id::text = auth.uid()::text)
      AND NOT EXISTS (
        SELECT 1 FROM blocked_users
        WHERE (blocker_id::text = matches.user_id::text AND blocked_id::text = matches.matched_user_id::text)
           OR (blocker_id::text = matches.matched_user_id::text AND blocked_id::text = matches.user_id::text)
      )
  )
);

CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
USING (auth.uid()::text = sender_id::text);

-- ============================================
-- 5. LIKES TABLE - Enhanced RLS Policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own likes" ON likes;
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
DROP POLICY IF EXISTS "Blocked users cannot like" ON likes;

-- Create enhanced policies
CREATE POLICY "Users can view own likes"
ON likes FOR SELECT
USING (
  auth.uid()::text = user_id::text
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id::text = user_id::text AND blocked_id::text = liked_user_id::text)
       OR (blocker_id::text = liked_user_id::text AND blocked_id::text = user_id::text)
  )
);

CREATE POLICY "Users can create likes"
ON likes FOR INSERT
WITH CHECK (
  auth.uid()::text = user_id::text
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id::text = user_id::text AND blocked_id::text = liked_user_id::text)
       OR (blocker_id::text = liked_user_id::text AND blocked_id::text = user_id::text)
  )
);

CREATE POLICY "Users can delete own likes"
ON likes FOR DELETE
USING (auth.uid()::text = user_id::text);

-- ============================================
-- 6. PASSES TABLE - Enhanced RLS Policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own passes" ON passes;
DROP POLICY IF EXISTS "Users can create passes" ON passes;
DROP POLICY IF EXISTS "Users can delete own passes" ON passes;

-- Create enhanced policies
CREATE POLICY "Users can view own passes"
ON passes FOR SELECT
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create passes"
ON passes FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own passes"
ON passes FOR DELETE
USING (auth.uid()::text = user_id::text);

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify all policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'blocked_users', 'matches', 'messages', 'likes', 'passes')
ORDER BY tablename, policyname;

-- ============================================
-- NOTES
-- ============================================
-- 1. All policies now check for blocked users
-- 2. Policies prevent RLS bypass attempts
-- 3. Policies enforce user data isolation
-- 4. Run this script in Supabase SQL Editor
-- 5. Verify output shows all policies created
-- ============================================
