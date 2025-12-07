-- ============================================================================
-- P1 FIX: Message Delivery Race Condition Prevention
-- Atomic message + receipt creation
-- ============================================================================

CREATE OR REPLACE FUNCTION send_message_atomic(
  p_match_id UUID,
  p_sender_id UUID,
  p_content TEXT,
  p_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS TABLE (
  message_id UUID,
  receipt_id UUID,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_message_id UUID;
  v_receipt_id UUID;
  v_recipient_id UUID;
  v_match_status TEXT;
BEGIN
  -- Validate match exists and is active
  SELECT status, 
    CASE 
      WHEN user_id_1 = p_sender_id THEN user_id_2
      WHEN user_id_2 = p_sender_id THEN user_id_1
      ELSE NULL
    END INTO v_match_status, v_recipient_id
  FROM matches
  WHERE id = p_match_id;

  IF v_match_status IS NULL THEN
    RAISE EXCEPTION 'Match not found or sender not part of match';
  END IF;

  IF v_match_status != 'active' THEN
    RAISE EXCEPTION 'Match is not active';
  END IF;

  IF v_recipient_id IS NULL THEN
    RAISE EXCEPTION 'Could not determine recipient';
  END IF;

  -- Check if sender is blocked
  IF EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = v_recipient_id AND blocked_id = p_sender_id)
  ) THEN
    RAISE EXCEPTION 'You are blocked by this user';
  END IF;

  -- Insert message (atomic)
  INSERT INTO messages (
    match_id,
    sender_id,
    recipient_id,
    content,
    created_at,
    status
  ) VALUES (
    p_match_id,
    p_sender_id,
    v_recipient_id,
    p_content,
    p_timestamp,
    'sent'
  )
  RETURNING id INTO v_message_id;

  -- Insert receipt (atomic - same transaction)
  INSERT INTO message_receipts (
    message_id,
    recipient_id,
    status,
    delivered_at
  ) VALUES (
    v_message_id,
    v_recipient_id,
    'delivered',
    p_timestamp
  )
  RETURNING id INTO v_receipt_id;

  -- Update match last_message_at
  UPDATE matches
  SET last_message_at = p_timestamp
  WHERE id = p_match_id;

  -- Return result
  RETURN QUERY
  SELECT
    v_message_id,
    v_receipt_id,
    'sent'::TEXT,
    p_timestamp;

EXCEPTION WHEN OTHERS THEN
  -- Log error and re-raise
  RAISE EXCEPTION 'Failed to send message: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Mark message as read (atomic)
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_message_as_read(
  p_message_id UUID,
  p_reader_id UUID
)
RETURNS TABLE (
  message_id UUID,
  receipt_id UUID,
  status TEXT,
  read_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_receipt_id UUID;
  v_read_at TIMESTAMP WITH TIME ZONE;
BEGIN
  v_read_at := now();

  -- Update receipt status
  UPDATE message_receipts
  SET status = 'read',
      read_at = v_read_at
  WHERE message_id = p_message_id
  AND recipient_id = p_reader_id
  RETURNING id INTO v_receipt_id;

  IF v_receipt_id IS NULL THEN
    RAISE EXCEPTION 'Receipt not found or user is not recipient';
  END IF;

  -- Return result
  RETURN QUERY
  SELECT
    p_message_id,
    v_receipt_id,
    'read'::TEXT,
    v_read_at;

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to mark message as read: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Delete message (soft delete with audit)
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_message(
  p_message_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT 'user_requested'
)
RETURNS TABLE (
  message_id UUID,
  deleted_at TIMESTAMP WITH TIME ZONE,
  status TEXT
) AS $$
DECLARE
  v_deleted_at TIMESTAMP WITH TIME ZONE;
BEGIN
  v_deleted_at := now();

  -- Verify user is sender
  IF NOT EXISTS (
    SELECT 1 FROM messages
    WHERE id = p_message_id
    AND sender_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not the sender of this message';
  END IF;

  -- Soft delete message
  UPDATE messages
  SET deleted_at = v_deleted_at,
      status = 'deleted',
      content = '[DELETED]'
  WHERE id = p_message_id;

  -- Log deletion
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    new_values
  ) VALUES (
    p_user_id,
    'delete',
    'message',
    p_message_id,
    jsonb_build_object('reason', p_reason)
  );

  -- Return result
  RETURN QUERY
  SELECT
    p_message_id,
    v_deleted_at,
    'deleted'::TEXT;

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to delete message: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Get messages with pagination (cursor-based)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_messages_paginated(
  p_match_id UUID,
  p_user_id UUID,
  p_limit INT DEFAULT 20,
  p_cursor TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  match_id UUID,
  sender_id UUID,
  recipient_id UUID,
  content TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  receipt_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.match_id,
    m.sender_id,
    m.recipient_id,
    m.content,
    m.status,
    m.created_at,
    mr.read_at,
    mr.status
  FROM messages m
  LEFT JOIN message_receipts mr ON m.id = mr.message_id
  WHERE m.match_id = p_match_id
  AND (m.sender_id = p_user_id OR m.recipient_id = p_user_id)
  AND m.deleted_at IS NULL
  AND (p_cursor IS NULL OR m.created_at < p_cursor)
  ORDER BY m.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Verify message delivery (for debugging)
-- ============================================================================

CREATE OR REPLACE FUNCTION verify_message_delivery(
  p_message_id UUID
)
RETURNS TABLE (
  message_id UUID,
  sender_id UUID,
  recipient_id UUID,
  message_status TEXT,
  receipt_status TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  is_consistent BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.sender_id,
    m.recipient_id,
    m.status,
    mr.status,
    mr.delivered_at,
    mr.read_at,
    (m.id IS NOT NULL AND mr.id IS NOT NULL)::BOOLEAN
  FROM messages m
  LEFT JOIN message_receipts mr ON m.id = mr.message_id
  WHERE m.id = p_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_receipts_message_id ON message_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_receipts_recipient_id ON message_receipts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_receipts_status ON message_receipts(status);

-- ============================================================================
-- Verify functions exist
-- ============================================================================

SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'send_message_atomic',
  'mark_message_as_read',
  'delete_message',
  'get_messages_paginated',
  'verify_message_delivery'
)
ORDER BY routine_name;
