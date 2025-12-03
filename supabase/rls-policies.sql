-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Dating App Security Implementation
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE passes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid()::text = id);

-- Users can view profiles they haven't passed on
CREATE POLICY "Users can view potential matches"
ON profiles FOR SELECT
USING (
  auth.uid()::text != id
  AND NOT EXISTS (
    SELECT 1 FROM passes
    WHERE passes.user_id = auth.uid()::text
    AND passes.passed_user_id = profiles.id
  )
);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid()::text = id);

-- ============================================
-- MATCHES TABLE POLICIES
-- ============================================

-- Users can view their own matches
CREATE POLICY "Users can view own matches"
ON matches FOR SELECT
USING (
  auth.uid()::text = user_id
  OR auth.uid()::text = matched_user_id
);

-- Users can create matches (when mutual like exists)
CREATE POLICY "Users can create matches"
ON matches FOR INSERT
WITH CHECK (
  auth.uid()::text = user_id
  AND EXISTS (
    SELECT 1 FROM likes
    WHERE likes.user_id = matches.matched_user_id
    AND likes.liked_user_id = matches.user_id
  )
);

-- Users can update their own matches (for unmatch)
CREATE POLICY "Users can update own matches"
ON matches FOR UPDATE
USING (
  auth.uid()::text = user_id
  OR auth.uid()::text = matched_user_id
)
WITH CHECK (
  auth.uid()::text = user_id
  OR auth.uid()::text = matched_user_id
);

-- ============================================
-- MESSAGES TABLE POLICIES
-- ============================================

-- Users can view messages in their matches
CREATE POLICY "Users can view messages in their matches"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (
      matches.user_id = auth.uid()::text
      OR matches.matched_user_id = auth.uid()::text
    )
    AND matches.status = 'active'
  )
);

-- Users can send messages in their active matches
CREATE POLICY "Users can send messages in their matches"
ON messages FOR INSERT
WITH CHECK (
  auth.uid()::text = sender_id
  AND EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (
      matches.user_id = auth.uid()::text
      OR matches.matched_user_id = auth.uid()::text
    )
    AND matches.status = 'active'
  )
);

-- Users can update their own messages (for read receipts)
CREATE POLICY "Users can update messages in their matches"
ON messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (
      matches.user_id = auth.uid()::text
      OR matches.matched_user_id = auth.uid()::text
    )
  )
);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
USING (auth.uid()::text = sender_id);

-- ============================================
-- LIKES TABLE POLICIES
-- ============================================

-- Users can view likes they received
CREATE POLICY "Users can view received likes"
ON likes FOR SELECT
USING (auth.uid()::text = liked_user_id);

-- Premium users can view all their received likes
CREATE POLICY "Premium users can view all received likes"
ON likes FOR SELECT
USING (
  auth.uid()::text = liked_user_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()::text
    AND profiles.is_premium = true
  )
);

-- Users can create likes
CREATE POLICY "Users can create likes"
ON likes FOR INSERT
WITH CHECK (
  auth.uid()::text = user_id
  AND user_id != liked_user_id
);

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes"
ON likes FOR DELETE
USING (auth.uid()::text = user_id);

-- ============================================
-- PASSES TABLE POLICIES
-- ============================================

-- Users can view their own passes
CREATE POLICY "Users can view own passes"
ON passes FOR SELECT
USING (auth.uid()::text = user_id);

-- Users can create passes
CREATE POLICY "Users can create passes"
ON passes FOR INSERT
WITH CHECK (
  auth.uid()::text = user_id
  AND user_id != passed_user_id
);

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Profile photos bucket
CREATE POLICY "Users can upload own profile photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view all profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can update own profile photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own profile photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Voice messages bucket
CREATE POLICY "Users can upload voice messages in their matches"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-messages'
  AND EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id::text = (storage.foldername(name))[1]
    AND (
      matches.user_id = auth.uid()::text
      OR matches.matched_user_id = auth.uid()::text
    )
    AND matches.status = 'active'
  )
);

CREATE POLICY "Users can view voice messages in their matches"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'voice-messages'
  AND EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id::text = (storage.foldername(name))[1]
    AND (
      matches.user_id = auth.uid()::text
      OR matches.matched_user_id = auth.uid()::text
    )
  )
);

-- Video messages bucket
CREATE POLICY "Users can upload video messages in their matches"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'video-messages'
  AND EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id::text = (storage.foldername(name))[1]
    AND (
      matches.user_id = auth.uid()::text
      OR matches.matched_user_id = auth.uid()::text
    )
    AND matches.status = 'active'
  )
);

CREATE POLICY "Users can view video messages in their matches"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'video-messages'
  AND EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id::text = (storage.foldername(name))[1]
    AND (
      matches.user_id = auth.uid()::text
      OR matches.matched_user_id = auth.uid()::text
    )
  )
);

-- ============================================
-- FUNCTIONS FOR SECURITY
-- ============================================

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(user_id_param text, target_user_id_param text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = user_id_param AND blocked_id = target_user_id_param)
    OR (blocker_id = target_user_id_param AND blocked_id = user_id_param)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has premium
CREATE OR REPLACE FUNCTION is_premium_user(user_id_param text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id_param
    AND is_premium = true
    AND (premium_expires_at IS NULL OR premium_expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_matched_user_id ON matches(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_liked_user_id ON likes(liked_user_id);
CREATE INDEX IF NOT EXISTS idx_passes_user_id ON passes(user_id);
CREATE INDEX IF NOT EXISTS idx_passes_passed_user_id ON passes(passed_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_matches_user_status ON matches(user_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_match_created ON messages(match_id, created_at);
CREATE INDEX IF NOT EXISTS idx_likes_user_liked ON likes(user_id, liked_user_id);
