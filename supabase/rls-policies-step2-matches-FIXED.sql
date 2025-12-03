-- ============================================
-- STEP 2: MATCHES TABLE RLS POLICIES (FIXED)
-- Works with both TEXT and UUID types
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own matches" ON matches;
DROP POLICY IF EXISTS "Users can create matches" ON matches;
DROP POLICY IF EXISTS "Users can update their own matches" ON matches;
DROP POLICY IF EXISTS "Users can view own matches" ON matches;
DROP POLICY IF EXISTS "Users can update own matches" ON matches;

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Matches policies (with explicit casting)
CREATE POLICY "Users can view own matches"
ON matches FOR SELECT
USING (
  auth.uid()::text = user_id::text
  OR auth.uid()::text = matched_user_id::text
);

CREATE POLICY "Users can create matches"
ON matches FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own matches"
ON matches FOR UPDATE
USING (
  auth.uid()::text = user_id::text
  OR auth.uid()::text = matched_user_id::text
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_matched_user_id ON matches(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
