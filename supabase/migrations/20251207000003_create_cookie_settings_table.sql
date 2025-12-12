-- ============================================
-- COOKIE SETTINGS TABLE - Cookie beállítások tábla
-- Dating App Cookie Compliance Implementation
-- ============================================

-- Create cookie_settings table
CREATE TABLE IF NOT EXISTS public.cookie_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  necessary_cookies BOOLEAN DEFAULT TRUE,
  analytics_consent BOOLEAN DEFAULT FALSE,
  marketing_consent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one settings record per user
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cookie_settings_user_id ON public.cookie_settings(user_id);

-- Enable Row Level Security
ALTER TABLE public.cookie_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own cookie settings" ON public.cookie_settings;
DROP POLICY IF EXISTS "Users can insert their own cookie settings" ON public.cookie_settings;
DROP POLICY IF EXISTS "Users can update their own cookie settings" ON public.cookie_settings;
DROP POLICY IF EXISTS "Service role can manage all cookie settings" ON public.cookie_settings;

-- RLS Policies
CREATE POLICY "Users can view their own cookie settings"
  ON public.cookie_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cookie settings"
  ON public.cookie_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cookie settings"
  ON public.cookie_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all cookie settings (for admin)
CREATE POLICY "Service role can manage all cookie settings"
  ON public.cookie_settings FOR ALL
  USING (
    CASE
      WHEN auth.jwt() ->> 'role' = 'service_role' THEN true
      ELSE false
    END
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_cookie_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cookie_settings_updated_at
  BEFORE UPDATE ON public.cookie_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_cookie_settings_updated_at();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.cookie_settings TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.cookie_settings IS 'User cookie consent preferences for GDPR compliance';
COMMENT ON COLUMN public.cookie_settings.necessary_cookies IS 'Consent for strictly necessary cookies (always required)';
COMMENT ON COLUMN public.cookie_settings.analytics_consent IS 'Consent for analytics and performance cookies';
COMMENT ON COLUMN public.cookie_settings.marketing_consent IS 'Consent for marketing and advertising cookies';
