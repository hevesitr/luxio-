-- ============================================
-- SIMPLIFIED RLS POLICIES (No blocks table dependency)
-- Dating App Security Implementation
-- ============================================

-- Enable RLS on all tables
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS passes ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users manage their profile" ON profiles;
DROP POLICY IF EXISTS "Users update their profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view potential matches" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view their own matches" ON matches;
DROP POLICY IF EXISTS "Users can create matches" ON matches;
DROP POLICY IF EXISTS "Users can update their own matches" ON matches;
DROP POLICY IF EXISTS "Users can view own matches" ON matches;

DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can update messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;

DROP POLICY IF EXISTS "Users can view their own likes" ON likes;
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can view received likes" ON likes;
DROP POLICY IF EXISTS "Premium users can view all received likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;

DROP POLICY IF EXISTS "Users can view their own passes" ON passes;
DROP POLICY IF EXISTS "Users can create passes" ON passes;
DROP POLICY IF EXISTS "Users can view own passes" ON passes;

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can view potential matches"
ON profiles FOR SELECT
USING (auth.uid() != id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- MATCHES TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own matches"
ON matches FOR SELECT
USING (
  auth.uid() = user_id
  OR auth.uid() = matched_user_id
);

CREATE POLICY "Users can create matches"
ON matches FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own matches"
ON matches FOR UPDATE
USING (
  auth.uid() = user_id
  OR auth.uid() = matched_user_id
);

-- ============================================
-- MESSAGES TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view messages in their matches"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (
      matches.user_id = auth.uid()
      OR matches.matched_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can send messages in their matches"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (
      matches.user_id = auth.uid()
      OR matches.matched_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update messages in their matches"
ON messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (
      matches.user_id = auth.uid()
      OR matches.matched_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
USING (auth.uid() = sender_id);

-- ============================================
-- LIKES TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view received likes"
ON likes FOR SELECT
USING (auth.uid() = liked_user_id OR auth.uid() = user_id);

CREATE POLICY "Users can create likes"
ON likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
ON likes FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- PASSES TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own passes"
ON passes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create passes"
ON passes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_matched_user_id ON matches(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_liked_user_id ON likes(liked_user_id);
CREATE INDEX IF NOT EXISTS idx_passes_user_id ON passes(user_id);
