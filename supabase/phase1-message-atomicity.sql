-- ============================================
-- PHASE 1: MESSAGE ATOMICITY FUNCTION
-- ============================================
-- Deploy Date: December 7, 2025
-- Purpose: Ensure messages and receipts are created atomically
-- Requirements: 6 (Message Atomicity)
-- Property: Property 5 - Message Atomicity

-- ============================================
-- 1. CREATE ATOMIC MESSAGE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION send_message_atomic(
  p_match_id UUID,
  p_sender_id UUID,
  p_content TEXT,
  p_message_type TEXT DEFAULT 'text'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id UUID;
  v_receipt_id UUID;
  v_receiver_id UUID;
  v_result JSON;
BEGIN
  -- Start transaction (implicit in function)
  
  -- Validate match exists and user is part of it
  SELECT 
    CASE 
      WHEN user_id = p_sender_id THEN matched_user_id
      WHEN matched_user_id = p_sender_id THEN user_id
      ELSE NULL
    END INTO v_receiver_id
  FROM matches
  WHERE id = p_match_id
    AND (user_id = p_sender_id OR matched_user_id = p_sender_id);
  
  IF v_receiver_id IS NULL THEN
    RAISE EXCEPTION 'Invalid match or sender not part of match';
  END IF;
  
  -- Check for blocked users
  IF EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = p_sender_id AND blocked_id = v_receiver_id)
       OR (blocker_id = v_receiver_id AND blocked_id = p_sender_id)
  ) THEN
    RAISE EXCEPTION 'Cannot send message to blocked user';
  END IF;
  
  -- Insert message
  INSERT INTO messages (
    match_id,
    sender_id,
    content,
    message_type,
    created_at
  ) VALUES (
    p_match_id,
    p_sender_id,
    p_content,
    p_message_type,
    NOW()
  )
  RETURNING id INTO v_message_id;
  
  -- Insert receipt atomically
  INSERT INTO message_receipts (
    message_id,
    user_id,
    status,
    created_at
  ) VALUES (
    v_message_id,
    v_receiver_id,
    'sent',
    NOW()
  )
  RETURNING id INTO v_receipt_id;
  
  -- Return result
  v_result := json_build_object(
    'message_id', v_message_id,
    'receipt_id', v_receipt_id,
    'receiver_id', v_receiver_id,
    'success', true
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Message send failed: %', SQLERRM;
END;
$$;

-- ============================================
-- 2. CREATE MESSAGE_RECEIPTS TABLE IF NOT EXISTS
-- ============================================

CREATE TABLE IF NOT EXISTS message_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  UNIQUE(message_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_receipts_message_id ON message_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_receipts_user_id ON message_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_message_receipts_status ON message_receipts(status);

-- Enable RLS
ALTER TABLE message_receipts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own receipts" ON message_receipts;
CREATE POLICY "Users can view own receipts"
ON message_receipts FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own receipts" ON message_receipts;
CREATE POLICY "Users can update own receipts"
ON message_receipts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. GRANT EXECUTE PERMISSION
-- ============================================

GRANT EXECUTE ON FUNCTION send_message_atomic TO authenticated;

-- ============================================
-- 4. TEST THE FUNCTION (Optional - comment out for production)
-- ============================================

-- Example test (replace with actual UUIDs):
-- SELECT send_message_atomic(
--   'match-uuid-here'::UUID,
--   'sender-uuid-here'::UUID,
--   'Test message',
--   'text'
-- );

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify function exists
SELECT proname, proargnames, prosrc
FROM pg_proc
WHERE proname = 'send_message_atomic';

-- Verify table exists
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'message_receipts'
ORDER BY ordinal_position;

-- ============================================
-- NOTES
-- ============================================
-- 1. Function ensures atomic message + receipt creation
-- 2. Validates match and sender before insertion
-- 3. Checks for blocked users
-- 4. Automatic rollback on any error
-- 5. Returns JSON with message_id and receipt_id
-- 6. Use this function instead of direct INSERT
-- ============================================
