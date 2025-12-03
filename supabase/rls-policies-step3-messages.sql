-- ============================================
-- STEP 3: MESSAGES TABLE RLS POLICIES
-- Run this AFTER step 2 (matches) works
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can update messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
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

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
