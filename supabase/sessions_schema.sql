-- Session tracking schema for LoveX Dating App
-- Task 5.3: Session invalidation on password change

-- Enable Row Level Security
ALTER TABLE IF EXISTS auth.users ENABLE ROW LEVEL SECURITY;

-- Create sessions table for tracking user sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL, -- Unique device identifier
    device_name TEXT, -- Human readable device name (optional)
    ip_address INET, -- IP address for security tracking
    user_agent TEXT, -- Browser/client info
    session_token TEXT UNIQUE NOT NULL, -- Unique session identifier
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    is_active BOOLEAN DEFAULT TRUE,
    invalidated_at TIMESTAMP WITH TIME ZONE,
    invalidated_reason TEXT
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at) WHERE is_active = true;

-- Row Level Security policies for user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only update their own sessions
CREATE POLICY "Users can update own sessions" ON public.user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Only authenticated users can insert sessions
CREATE POLICY "Authenticated users can insert sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can manage all sessions (for admin operations)
CREATE POLICY "Service role can manage sessions" ON public.user_sessions
    FOR ALL USING (
        CASE
            WHEN auth.jwt() ->> 'role' = 'service_role' THEN true
            ELSE false
        END
    );

-- Function to create a new session
CREATE OR REPLACE FUNCTION create_user_session(
    p_user_id UUID,
    p_device_id TEXT,
    p_device_name TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_session_token TEXT;
    v_session_id UUID;
BEGIN
    -- Generate unique session token
    v_session_token := encode(gen_random_bytes(32), 'hex');

    -- Insert new session
    INSERT INTO public.user_sessions (
        user_id,
        device_id,
        device_name,
        ip_address,
        user_agent,
        session_token
    ) VALUES (
        p_user_id,
        p_device_id,
        p_device_name,
        p_ip_address,
        p_user_agent,
        v_session_token
    ) RETURNING id INTO v_session_id;

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to invalidate all sessions for a user (except current)
CREATE OR REPLACE FUNCTION invalidate_user_sessions(
    p_user_id UUID,
    p_current_session_token TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT 'Password changed'
)
RETURNS INTEGER AS $$
DECLARE
    v_affected_count INTEGER;
BEGIN
    -- Update sessions to mark them as inactive
    UPDATE public.user_sessions
    SET
        is_active = FALSE,
        invalidated_at = NOW(),
        invalidated_reason = p_reason
    WHERE
        user_id = p_user_id
        AND is_active = TRUE
        AND (p_current_session_token IS NULL OR session_token != p_current_session_token);

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;

    -- Log the invalidation
    INSERT INTO public.audit_log (
        user_id,
        action,
        details,
        created_at
    ) VALUES (
        p_user_id,
        'SESSIONS_INVALIDATED',
        json_build_object(
            'reason', p_reason,
            'sessions_invalidated', v_affected_count,
            'current_session_preserved', p_current_session_token IS NOT NULL
        ),
        NOW()
    );

    RETURN v_affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_sessions
    WHERE expires_at < NOW() OR (NOT is_active AND invalidated_at < NOW() - INTERVAL '30 days');

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    -- Log cleanup
    INSERT INTO public.audit_log (
        action,
        details,
        created_at
    ) VALUES (
        'EXPIRED_SESSIONS_CLEANUP',
        json_build_object('sessions_deleted', v_deleted_count),
        NOW()
    );

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate session
CREATE OR REPLACE FUNCTION validate_user_session(
    p_session_token TEXT
)
RETURNS TABLE (
    session_id UUID,
    user_id UUID,
    is_valid BOOLEAN,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Update last activity
    UPDATE public.user_sessions
    SET last_activity = NOW()
    WHERE session_token = p_session_token AND is_active = TRUE;

    -- Return session info
    RETURN QUERY
    SELECT
        us.id,
        us.user_id,
        (us.is_active AND us.expires_at > NOW()) as is_valid,
        us.expires_at
    FROM public.user_sessions us
    WHERE us.session_token = p_session_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log table if it doesn't exist (for logging session events)
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_user_action ON public.audit_log(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- RLS for audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own audit logs
CREATE POLICY "Users can view own audit logs" ON public.audit_log
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage audit logs
CREATE POLICY "Service role can manage audit logs" ON public.audit_log
    FOR ALL USING (
        CASE
            WHEN auth.jwt() ->> 'role' = 'service_role' THEN true
            ELSE false
        END
    );

-- Scheduled cleanup function (can be called by cron or manual trigger)
-- This will run cleanup every 24 hours
CREATE OR REPLACE FUNCTION scheduled_session_cleanup()
RETURNS void AS $$
BEGIN
    PERFORM cleanup_expired_sessions();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_sessions TO authenticated;
GRANT ALL ON public.audit_log TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.user_sessions IS 'Tracks user sessions across devices for security and session management';
COMMENT ON COLUMN public.user_sessions.device_id IS 'Unique identifier for the device/browser';
COMMENT ON COLUMN public.user_sessions.session_token IS 'Cryptographically secure random token for session validation';
COMMENT ON COLUMN public.user_sessions.invalidated_reason IS 'Reason for session invalidation (e.g., password change)';

COMMENT ON FUNCTION create_user_session(UUID, TEXT, TEXT, INET, TEXT) IS 'Creates a new user session with device tracking';
COMMENT ON FUNCTION invalidate_user_sessions(UUID, TEXT, TEXT) IS 'Invalidates all user sessions except current one';
COMMENT ON FUNCTION validate_user_session(TEXT) IS 'Validates session token and updates activity';
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Removes expired and old invalidated sessions';
