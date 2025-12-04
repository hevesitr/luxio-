-- Moderation Schema
-- Safety and moderation features

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('harassment', 'inappropriate_content', 'spam', 'fake_profile', 'underage', 'other')),
  description TEXT,
  evidence TEXT[], -- Array of URLs to evidence
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  action_taken TEXT CHECK (action_taken IN ('dismissed', 'warned', 'suspended', 'banned')),
  moderator_id UUID REFERENCES auth.users(id),
  moderator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,

  -- Prevent self-reporting
  CONSTRAINT no_self_report CHECK (reporter_id != reported_user_id)
);

-- User blocks table
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent self-blocking
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_user_id),
  -- Unique constraint to prevent duplicate blocks
  UNIQUE(blocker_id, blocked_user_id)
);

-- User suspensions table
CREATE TABLE IF NOT EXISTS user_suspensions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suspension_end TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT NOT NULL,
  moderator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flagged content table
CREATE TABLE IF NOT EXISTS flagged_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('message', 'profile', 'photo')),
  content_id UUID NOT NULL, -- References the content (message.id, profile.id, etc.)
  flag_reason TEXT NOT NULL CHECK (flag_reason IN ('profanity', 'explicit', 'hate_speech', 'spam', 'harassment')),
  flagged_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'removed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Swipe history table (for rewind functionality)
CREATE TABLE IF NOT EXISTS swipe_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass', 'super_like')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent self-swiping
  CONSTRAINT no_self_swipe CHECK (user_id != target_user_id)
);

-- Super likes table
CREATE TABLE IF NOT EXISTS super_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent self-super-like
  CONSTRAINT no_self_super_like CHECK (sender_id != receiver_id)
);

-- User super like counts table
CREATE TABLE IF NOT EXISTS user_super_likes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies

-- Reports: Users can only see their own reports, moderators can see all
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Moderators can view and update all reports (assuming a moderator role)
CREATE POLICY "Moderators can manage reports" ON reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'moderator'
    )
  );

-- User blocks: Users can only manage their own blocks
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own blocks" ON user_blocks
  FOR ALL USING (auth.uid() = blocker_id);

-- User suspensions: Only moderators can manage
ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can manage suspensions" ON user_suspensions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'moderator'
    )
  );

-- Flagged content: Users can flag, moderators can manage
ALTER TABLE flagged_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can flag content" ON flagged_content
  FOR INSERT WITH CHECK (auth.uid() = flagged_by);

CREATE POLICY "Users can view their own flags" ON flagged_content
  FOR SELECT USING (auth.uid() = flagged_by);

CREATE POLICY "Moderators can manage flagged content" ON flagged_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'moderator'
    )
  );

-- Swipe history: Users can only see their own swipes
ALTER TABLE swipe_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own swipe history" ON swipe_history
  FOR ALL USING (auth.uid() = user_id);

-- Super likes: Users can only manage their own sent super likes
ALTER TABLE super_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own super likes" ON super_likes
  FOR ALL USING (auth.uid() = sender_id);

-- User super likes: Users can only see their own counts
ALTER TABLE user_super_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own super like counts" ON user_super_likes
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_user_id);

CREATE INDEX IF NOT EXISTS idx_user_suspensions_user ON user_suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_suspensions_end ON user_suspensions(suspension_end);

CREATE INDEX IF NOT EXISTS idx_swipe_history_user ON swipe_history(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_history_created ON swipe_history(created_at);

CREATE INDEX IF NOT EXISTS idx_super_likes_sender ON super_likes(sender_id);
CREATE INDEX IF NOT EXISTS idx_super_likes_receiver ON super_likes(receiver_id);
CREATE INDEX IF NOT EXISTS idx_super_likes_created ON super_likes(created_at);

-- Function to automatically suspend users with 3+ reports in 24 hours
CREATE OR REPLACE FUNCTION check_automatic_suspension()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  -- Count reports in last 24 hours
  SELECT COUNT(*) INTO report_count
  FROM reports
  WHERE reported_user_id = NEW.reported_user_id
    AND created_at >= NOW() - INTERVAL '24 hours'
    AND status = 'pending';

  -- If 3 or more reports, create suspension
  IF report_count >= 3 THEN
    INSERT INTO user_suspensions (user_id, suspension_end, reason)
    VALUES (
      NEW.reported_user_id,
      NOW() + INTERVAL '7 days',
      format('Automatic suspension: %s reports in 24 hours', report_count)
    );

    -- Update user profile
    UPDATE profiles
    SET is_suspended = true,
        suspension_reason = format('Automatic suspension: %s reports in 24 hours', report_count),
        suspension_end = NOW() + INTERVAL '7 days'
    WHERE id = NEW.reported_user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic suspension
DROP TRIGGER IF EXISTS trigger_automatic_suspension ON reports;
CREATE TRIGGER trigger_automatic_suspension
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION check_automatic_suspension();

-- Function to reset daily super likes
CREATE OR REPLACE FUNCTION reset_daily_super_likes()
RETURNS void AS $$
DECLARE
  subscription_record RECORD;
  super_like_count INTEGER;
BEGIN
  -- Reset super likes based on subscription tier
  FOR subscription_record IN
    SELECT user_id, tier FROM subscriptions WHERE status = 'active'
  LOOP
    -- Set count based on tier
    CASE subscription_record.tier
      WHEN 'free' THEN super_like_count := 1;
      WHEN 'plus' THEN super_like_count := 5;
      WHEN 'gold' THEN super_like_count := 10;
      WHEN 'platinum' THEN super_like_count := 25;
      ELSE super_like_count := 1;
    END CASE;

    -- Upsert the count
    INSERT INTO user_super_likes (user_id, count, updated_at)
    VALUES (subscription_record.user_id, super_like_count, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
      count = EXCLUDED.count,
      updated_at = EXCLUDED.updated_at;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
