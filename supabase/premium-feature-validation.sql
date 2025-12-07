-- ============================================================================
-- P1 FIX: Premium Feature Limit Validation (Server-Side)
-- Prevents client-side bypass
-- ============================================================================

-- ============================================================================
-- Check daily swipe limit (server-side validation)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_daily_swipe_limit(
  p_user_id UUID
)
RETURNS TABLE (
  can_swipe BOOLEAN,
  swipes_today INT,
  daily_limit INT,
  resets_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_swipes_today INT;
  v_daily_limit INT;
  v_premium_tier TEXT;
  v_resets_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get user's premium tier
  SELECT premium_tier INTO v_premium_tier
  FROM profiles
  WHERE id = p_user_id;

  IF v_premium_tier IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Get daily limit based on tier
  SELECT daily_swipes INTO v_daily_limit
  FROM premium_features
  WHERE tier = v_premium_tier;

  IF v_daily_limit IS NULL THEN
    v_daily_limit := 100; -- Default free tier limit
  END IF;

  -- Count swipes today
  SELECT COUNT(*)::INT INTO v_swipes_today
  FROM swipes
  WHERE user_id = p_user_id
  AND DATE(created_at) = CURRENT_DATE;

  -- Calculate reset time (next midnight UTC)
  v_resets_at := (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE AT TIME ZONE 'UTC';

  -- Return result
  RETURN QUERY
  SELECT
    (v_swipes_today < v_daily_limit)::BOOLEAN,
    v_swipes_today,
    v_daily_limit,
    v_resets_at;

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to check swipe limit: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Validate swipe before processing (atomic)
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_and_process_swipe(
  p_user_id UUID,
  p_target_user_id UUID,
  p_action TEXT -- 'like', 'pass', 'super_like'
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  swipe_id UUID,
  swipes_remaining INT
) AS $$
DECLARE
  v_can_swipe BOOLEAN;
  v_swipes_today INT;
  v_daily_limit INT;
  v_swipe_id UUID;
  v_swipes_remaining INT;
  v_is_premium BOOLEAN;
  v_super_like_cost INT;
  v_user_credits INT;
BEGIN
  -- Check daily swipe limit
  SELECT can_swipe, swipes_today, daily_limit
  INTO v_can_swipe, v_swipes_today, v_daily_limit
  FROM check_daily_swipe_limit(p_user_id);

  IF NOT v_can_swipe THEN
    RETURN QUERY
    SELECT
      FALSE,
      'Daily swipe limit reached. Limit resets at midnight UTC.',
      NULL::UUID,
      0;
    RETURN;
  END IF;

  -- Check for duplicate swipe
  IF EXISTS (
    SELECT 1 FROM swipes
    WHERE user_id = p_user_id
    AND target_user_id = p_target_user_id
    AND action = p_action
    AND DATE(created_at) = CURRENT_DATE
  ) THEN
    RETURN QUERY
    SELECT
      FALSE,
      'You have already ' || p_action || 'ed this profile today.',
      NULL::UUID,
      v_daily_limit - v_swipes_today - 1;
    RETURN;
  END IF;

  -- Check if target user is banned or blocked
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_target_user_id
    AND is_banned = TRUE
  ) THEN
    RETURN QUERY
    SELECT
      FALSE,
      'This profile is no longer available.',
      NULL::UUID,
      v_daily_limit - v_swipes_today - 1;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = p_user_id AND blocked_id = p_target_user_id)
    OR (blocker_id = p_target_user_id AND blocked_id = p_user_id)
  ) THEN
    RETURN QUERY
    SELECT
      FALSE,
      'You cannot swipe on this profile.',
      NULL::UUID,
      v_daily_limit - v_swipes_today - 1;
    RETURN;
  END IF;

  -- Handle super like (requires credits)
  IF p_action = 'super_like' THEN
    SELECT premium_tier INTO v_is_premium
    FROM profiles
    WHERE id = p_user_id;

    v_super_like_cost := 1; -- 1 credit per super like

    SELECT credits INTO v_user_credits
    FROM user_credits
    WHERE user_id = p_user_id;

    IF COALESCE(v_user_credits, 0) < v_super_like_cost THEN
      RETURN QUERY
      SELECT
        FALSE,
        'Insufficient credits for super like. Cost: ' || v_super_like_cost || ' credit(s).',
        NULL::UUID,
        v_daily_limit - v_swipes_today - 1;
      RETURN;
    END IF;

    -- Deduct credits
    UPDATE user_credits
    SET credits = credits - v_super_like_cost
    WHERE user_id = p_user_id;
  END IF;

  -- Create swipe record
  INSERT INTO swipes (
    user_id,
    target_user_id,
    action,
    created_at
  ) VALUES (
    p_user_id,
    p_target_user_id,
    p_action,
    now()
  )
  RETURNING id INTO v_swipe_id;

  -- Calculate remaining swipes
  v_swipes_remaining := v_daily_limit - v_swipes_today - 1;

  -- Return success
  RETURN QUERY
  SELECT
    TRUE,
    'Swipe processed successfully.',
    v_swipe_id,
    v_swipes_remaining;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY
  SELECT
    FALSE,
    'Error processing swipe: ' || SQLERRM,
    NULL::UUID,
    0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Check premium feature access (server-side)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_premium_feature_access(
  p_user_id UUID,
  p_feature TEXT
)
RETURNS TABLE (
  has_access BOOLEAN,
  reason TEXT,
  subscription_expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_premium_tier TEXT;
  v_subscription_status TEXT;
  v_subscription_expires_at TIMESTAMP WITH TIME ZONE;
  v_feature_available BOOLEAN;
BEGIN
  -- Get user's premium tier and subscription
  SELECT
    premium_tier,
    subscription_status,
    subscription_expires_at
  INTO
    v_premium_tier,
    v_subscription_status,
    v_subscription_expires_at
  FROM profiles
  WHERE id = p_user_id;

  IF v_premium_tier IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check if subscription is active
  IF v_subscription_status != 'active' OR v_subscription_expires_at < now() THEN
    RETURN QUERY
    SELECT
      FALSE,
      'Premium subscription is not active.',
      v_subscription_expires_at;
    RETURN;
  END IF;

  -- Check if feature is available for this tier
  SELECT EXISTS (
    SELECT 1 FROM premium_features
    WHERE tier = v_premium_tier
    AND features @> jsonb_build_array(p_feature)
  ) INTO v_feature_available;

  IF NOT v_feature_available THEN
    RETURN QUERY
    SELECT
      FALSE,
      'This feature is not available for your subscription tier.',
      v_subscription_expires_at;
    RETURN;
  END IF;

  -- Feature is available
  RETURN QUERY
  SELECT
    TRUE,
    'Feature access granted.',
    v_subscription_expires_at;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY
  SELECT
    FALSE,
    'Error checking feature access: ' || SQLERRM,
    NULL::TIMESTAMP WITH TIME ZONE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Get user premium status
-- ============================================================================

CREATE OR REPLACE FUNCTION get_premium_status(
  p_user_id UUID
)
RETURNS TABLE (
  is_premium BOOLEAN,
  tier TEXT,
  subscription_status TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  credits INT,
  daily_swipes_remaining INT,
  features JSONB
) AS $$
DECLARE
  v_daily_limit INT;
  v_swipes_today INT;
BEGIN
  RETURN QUERY
  SELECT
    (p.premium_tier != 'free')::BOOLEAN,
    p.premium_tier,
    p.subscription_status,
    p.subscription_expires_at,
    COALESCE(uc.credits, 0)::INT,
    (pf.daily_swipes - COUNT(s.id))::INT,
    pf.features
  FROM profiles p
  LEFT JOIN user_credits uc ON p.id = uc.user_id
  LEFT JOIN premium_features pf ON p.premium_tier = pf.tier
  LEFT JOIN swipes s ON p.id = s.user_id AND DATE(s.created_at) = CURRENT_DATE
  WHERE p.id = p_user_id
  GROUP BY p.id, p.premium_tier, p.subscription_status, p.subscription_expires_at,
           uc.credits, pf.daily_swipes, pf.features;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_swipes_user_id ON swipes(user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_target_user_id ON swipes(target_user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_created_at ON swipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_swipes_user_date ON swipes(user_id, DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_premium_tier ON profiles(premium_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

-- ============================================================================
-- Verify functions
-- ============================================================================

SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'check_daily_swipe_limit',
  'validate_and_process_swipe',
  'check_premium_feature_access',
  'get_premium_status'
)
ORDER BY routine_name;
