-- ============================================
-- PHASE 1: PREMIUM FEATURE VALIDATION
-- ============================================
-- Deploy Date: December 7, 2025
-- Purpose: Server-side premium feature validation
-- Requirements: 7 (Premium Feature Validation)
-- Property: Property 6 - Premium Validation

-- ============================================
-- 1. CREATE PREMIUM SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'premium', 'premium_plus')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_id ON premium_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status ON premium_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_expires_at ON premium_subscriptions(expires_at);

-- Enable RLS
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own subscription" ON premium_subscriptions;
CREATE POLICY "Users can view own subscription"
ON premium_subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- ============================================
-- 2. CREATE DAILY SWIPE LIMITS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS daily_swipe_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  swipe_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_swipe_limits_user_id ON daily_swipe_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_swipe_limits_date ON daily_swipe_limits(date);

-- Enable RLS
ALTER TABLE daily_swipe_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own swipe limits" ON daily_swipe_limits;
CREATE POLICY "Users can view own swipe limits"
ON daily_swipe_limits FOR SELECT
USING (auth.uid() = user_id);

-- ============================================
-- 3. CHECK PREMIUM STATUS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION check_premium_status(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_premium BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM premium_subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND expires_at > NOW()
  ) INTO v_is_premium;
  
  RETURN COALESCE(v_is_premium, FALSE);
END;
$$;

-- ============================================
-- 4. CHECK DAILY SWIPE LIMIT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION check_daily_swipe_limit(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_swipe_count INTEGER;
  v_max_swipes INTEGER;
  v_can_swipe BOOLEAN;
  v_result JSON;
BEGIN
  -- Check if user is premium
  v_is_premium := check_premium_status(p_user_id);
  
  -- Set max swipes based on premium status
  IF v_is_premium THEN
    v_max_swipes := 999999; -- Unlimited for premium
  ELSE
    v_max_swipes := 100; -- 100 swipes per day for free users
  END IF;
  
  -- Get today's swipe count
  SELECT COALESCE(swipe_count, 0) INTO v_swipe_count
  FROM daily_swipe_limits
  WHERE user_id = p_user_id
    AND date = CURRENT_DATE;
  
  -- If no record exists, create one
  IF v_swipe_count IS NULL THEN
    INSERT INTO daily_swipe_limits (user_id, date, swipe_count)
    VALUES (p_user_id, CURRENT_DATE, 0)
    ON CONFLICT (user_id, date) DO NOTHING;
    v_swipe_count := 0;
  END IF;
  
  -- Check if user can swipe
  v_can_swipe := v_swipe_count < v_max_swipes;
  
  -- Build result
  v_result := json_build_object(
    'can_swipe', v_can_swipe,
    'swipe_count', v_swipe_count,
    'max_swipes', v_max_swipes,
    'is_premium', v_is_premium,
    'remaining_swipes', GREATEST(0, v_max_swipes - v_swipe_count)
  );
  
  RETURN v_result;
END;
$$;

-- ============================================
-- 5. INCREMENT SWIPE COUNT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION increment_swipe_count(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit_check JSON;
  v_can_swipe BOOLEAN;
  v_new_count INTEGER;
BEGIN
  -- Check if user can swipe
  v_limit_check := check_daily_swipe_limit(p_user_id);
  v_can_swipe := (v_limit_check->>'can_swipe')::BOOLEAN;
  
  IF NOT v_can_swipe THEN
    RAISE EXCEPTION 'Daily swipe limit reached. Upgrade to premium for unlimited swipes.';
  END IF;
  
  -- Increment swipe count
  INSERT INTO daily_swipe_limits (user_id, date, swipe_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    swipe_count = daily_swipe_limits.swipe_count + 1,
    updated_at = NOW()
  RETURNING swipe_count INTO v_new_count;
  
  -- Return updated limit check
  RETURN check_daily_swipe_limit(p_user_id);
END;
$$;

-- ============================================
-- 6. VALIDATE PREMIUM FEATURE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION validate_premium_feature(
  p_user_id UUID,
  p_feature_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_premium_features TEXT[] := ARRAY[
    'unlimited_swipes',
    'rewind',
    'super_like',
    'boost',
    'passport',
    'see_who_likes_you',
    'top_picks',
    'advanced_filters',
    'read_receipts',
    'unlimited_likes'
  ];
BEGIN
  -- Check if feature requires premium
  IF p_feature_name = ANY(v_premium_features) THEN
    v_is_premium := check_premium_status(p_user_id);
    RETURN v_is_premium;
  END IF;
  
  -- Feature doesn't require premium
  RETURN TRUE;
END;
$$;

-- ============================================
-- 7. GRANT EXECUTE PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION check_premium_status TO authenticated;
GRANT EXECUTE ON FUNCTION check_daily_swipe_limit TO authenticated;
GRANT EXECUTE ON FUNCTION increment_swipe_count TO authenticated;
GRANT EXECUTE ON FUNCTION validate_premium_feature TO authenticated;

-- ============================================
-- 8. CREATE TRIGGER TO UPDATE TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_premium_subscriptions_updated_at ON premium_subscriptions;
CREATE TRIGGER update_premium_subscriptions_updated_at
BEFORE UPDATE ON premium_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_swipe_limits_updated_at ON daily_swipe_limits;
CREATE TRIGGER update_daily_swipe_limits_updated_at
BEFORE UPDATE ON daily_swipe_limits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify functions exist
SELECT proname, proargnames
FROM pg_proc
WHERE proname IN (
  'check_premium_status',
  'check_daily_swipe_limit',
  'increment_swipe_count',
  'validate_premium_feature'
);

-- Verify tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('premium_subscriptions', 'daily_swipe_limits');

-- ============================================
-- NOTES
-- ============================================
-- 1. All premium validation is server-side
-- 2. Free users: 100 swipes per day
-- 3. Premium users: Unlimited swipes
-- 4. Call increment_swipe_count() before each swipe
-- 5. Call validate_premium_feature() before premium features
-- 6. Automatic daily reset at midnight
-- ============================================
