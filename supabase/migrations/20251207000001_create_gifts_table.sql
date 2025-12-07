-- ============================================
-- GIFTS TABLE - Ajándékok tábla létrehozása
-- Dating App Gifts Implementation
-- ============================================

-- Create gifts table
CREATE TABLE IF NOT EXISTS public.gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gift_id INTEGER NOT NULL,
  gift_name TEXT NOT NULL,
  gift_emoji TEXT NOT NULL,
  gift_price INTEGER NOT NULL,
  gift_category TEXT NOT NULL DEFAULT 'special' CHECK (gift_category IN ('romantic', 'sweet', 'drink', 'special', 'luxury', 'fun')),
  status TEXT NOT NULL DEFAULT 'delivered' CHECK (status IN ('pending', 'delivered', 'failed')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT no_self_gift CHECK (sender_id != receiver_id),
  CONSTRAINT valid_gift_price CHECK (gift_price > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gifts_sender_id ON public.gifts(sender_id);
CREATE INDEX IF NOT EXISTS idx_gifts_receiver_id ON public.gifts(receiver_id);
CREATE INDEX IF NOT EXISTS idx_gifts_created_at ON public.gifts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gifts_gift_category ON public.gifts(gift_category);
CREATE INDEX IF NOT EXISTS idx_gifts_status ON public.gifts(status);

-- Enable Row Level Security
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view gifts they sent or received"
  ON public.gifts FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send gifts"
  ON public.gifts FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can update their own sent gifts (e.g., add message)
CREATE POLICY "Users can update their sent gifts"
  ON public.gifts FOR UPDATE
  USING (auth.uid() = sender_id);

-- Users can delete their sent gifts
CREATE POLICY "Users can delete their sent gifts"
  ON public.gifts FOR DELETE
  USING (auth.uid() = sender_id);

-- Service role can manage all gifts (for admin operations)
CREATE POLICY "Service role can manage all gifts"
  ON public.gifts FOR ALL
  USING (
    CASE
      WHEN auth.jwt() ->> 'role' = 'service_role' THEN true
      ELSE false
    END
  );

-- Enable realtime for gifts
ALTER PUBLICATION supabase_realtime ADD TABLE public.gifts;

-- Create function to get user gift statistics
CREATE OR REPLACE FUNCTION get_user_gift_stats(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  sent_count BIGINT,
  received_count BIGINT,
  total_sent_value BIGINT,
  total_received_value BIGINT,
  favorite_received_gift TEXT
) AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Use provided user_id or current user
  target_user_id := COALESCE(user_uuid, auth.uid());

  IF target_user_id IS NULL THEN
    RETURN QUERY SELECT
      0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, NULL::TEXT;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(sent.sent_count, 0),
    COALESCE(received.received_count, 0),
    COALESCE(sent.total_value, 0),
    COALESCE(received.total_value, 0),
    received.favorite_gift
  FROM
    (SELECT
       COUNT(*) as sent_count,
       SUM(gift_price) as total_value
     FROM public.gifts
     WHERE sender_id = target_user_id) sent
  CROSS JOIN
    (SELECT
       COUNT(*) as received_count,
       SUM(gift_price) as total_value,
       (SELECT gift_name
        FROM public.gifts
        WHERE receiver_id = target_user_id
        GROUP BY gift_name
        ORDER BY COUNT(*) DESC
        LIMIT 1) as favorite_gift
     FROM public.gifts
     WHERE receiver_id = target_user_id) received;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_gifts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gifts_updated_at
  BEFORE UPDATE ON public.gifts
  FOR EACH ROW
  EXECUTE FUNCTION update_gifts_updated_at();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.gifts TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.gifts IS 'User gifts sent between users in the dating app';
COMMENT ON COLUMN public.gifts.gift_id IS 'Internal gift identifier from the predefined gifts list';
COMMENT ON COLUMN public.gifts.gift_category IS 'Category of gift: romantic, sweet, drink, special, luxury, fun';
COMMENT ON COLUMN public.gifts.status IS 'Status of gift delivery: pending, delivered, failed';

COMMENT ON FUNCTION get_user_gift_stats(UUID) IS 'Get gift statistics for a user (sent/received counts and values)';
