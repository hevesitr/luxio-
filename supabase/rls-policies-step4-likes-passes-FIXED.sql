-- ============================================
-- STEP 4: LIKES & PASSES TABLE RLS POLICIES (FIXED)
-- Works with both TEXT and UUID types
-- ============================================

-- Drop existing policies - LIKES
DROP POLICY IF EXISTS "Users can view their own likes" ON likes;
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can view received likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;

-- Drop existing policies - PASSES
DROP POLICY IF EXISTS "Users can view their own passes" ON passes;
DROP POLICY IF EXISTS "Users can create passes" ON passes;
DROP POLICY IF EXISTS "Users can view own passes" ON passes;

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE passes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- LIKES POLICIES (with explicit casting)
-- ============================================

CREATE POLICY "Users can view received likes"
ON likes FOR SELECT
USING (
  auth.uid()::text = liked_user_id::text 
  OR auth.uid()::text = user_id::text
);

CREATE POLICY "Users can create likes"
ON likes FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own likes"
ON likes FOR DELETE
USING (auth.uid()::text = user_id::text);

-- ============================================
-- PASSES POLICIES (with explicit casting)
-- ============================================

CREATE POLICY "Users can view own passes"
ON passes FOR SELECT
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create passes"
ON passes FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_liked_user_id ON likes(liked_user_id);
CREATE INDEX IF NOT EXISTS idx_passes_user_id ON passes(user_id);
CREATE INDEX IF NOT EXISTS idx_passes_passed_user_id ON passes(passed_user_id);
