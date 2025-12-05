-- Account Management System Schema
-- Task 7: Account Management System

-- Create account_deletion_requests table
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'completed')),
    scheduled_deletion_date TIMESTAMP WITH TIME ZONE NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one pending deletion per user
    CONSTRAINT unique_pending_deletion UNIQUE (user_id) DEFERRABLE INITIALLY DEFERRED
        EXCLUDE (user_id WITH =) WHERE (status = 'pending')
);

-- Create account_pause_status table
CREATE TABLE IF NOT EXISTS public.account_pause_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    is_paused BOOLEAN NOT NULL DEFAULT FALSE,
    paused_at TIMESTAMP WITH TIME ZONE,
    resume_date TIMESTAMP WITH TIME ZONE,
    resumed_at TIMESTAMP WITH TIME ZONE,
    pause_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create data_export_requests table
CREATE TABLE IF NOT EXISTS public.data_export_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
    download_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_user_id ON public.account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status ON public.account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_scheduled_date ON public.account_deletion_requests(scheduled_deletion_date);

CREATE INDEX IF NOT EXISTS idx_account_pause_status_user_id ON public.account_pause_status(user_id);
CREATE INDEX IF NOT EXISTS idx_account_pause_status_is_paused ON public.account_pause_status(is_paused);

CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON public.data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON public.data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_expires_at ON public.data_export_requests(expires_at);

-- Row Level Security policies
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_pause_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;

-- Account deletion requests - users can only see their own
CREATE POLICY "Users can view own deletion requests" ON public.account_deletion_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deletion requests" ON public.account_deletion_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending deletion requests" ON public.account_deletion_requests
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Account pause status - users can only see their own
CREATE POLICY "Users can view own pause status" ON public.account_pause_status
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own pause status" ON public.account_pause_status
    FOR ALL USING (auth.uid() = user_id);

-- Data export requests - users can only see their own
CREATE POLICY "Users can view own export requests" ON public.data_export_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own export requests" ON public.data_export_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can manage all records (for admin operations)
CREATE POLICY "Service role can manage deletion requests" ON public.account_deletion_requests
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage pause status" ON public.account_pause_status
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage export requests" ON public.data_export_requests
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create functions for account management

-- Function to check if account is scheduled for deletion
CREATE OR REPLACE FUNCTION is_account_scheduled_for_deletion(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.account_deletion_requests
        WHERE user_id = user_uuid
        AND status = 'pending'
        AND scheduled_deletion_date > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if account is paused
CREATE OR REPLACE FUNCTION is_account_paused(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.account_pause_status
        WHERE user_id = user_uuid
        AND is_paused = TRUE
        AND (resume_date IS NULL OR resume_date > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get account status summary
CREATE OR REPLACE FUNCTION get_account_status(user_uuid UUID)
RETURNS TABLE (
    is_scheduled_for_deletion BOOLEAN,
    deletion_date TIMESTAMP WITH TIME ZONE,
    is_paused BOOLEAN,
    resume_date TIMESTAMP WITH TIME ZONE,
    has_recent_export BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE WHEN adr.id IS NOT NULL THEN TRUE ELSE FALSE END as is_scheduled_for_deletion,
        adr.scheduled_deletion_date as deletion_date,
        COALESCE(aps.is_paused, FALSE) as is_paused,
        aps.resume_date as resume_date,
        CASE WHEN der.id IS NOT NULL THEN TRUE ELSE FALSE END as has_recent_export
    FROM (SELECT user_uuid as uid) u
    LEFT JOIN public.account_deletion_requests adr ON adr.user_id = u.uid AND adr.status = 'pending'
    LEFT JOIN public.account_pause_status aps ON aps.user_id = u.uid
    LEFT JOIN public.data_export_requests der ON der.user_id = u.uid AND der.status = 'completed' AND der.expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired data exports
CREATE OR REPLACE FUNCTION cleanup_expired_data_exports()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Mark expired exports
    UPDATE public.data_export_requests
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'completed' AND expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Log cleanup
    INSERT INTO public.audit_log (
        action,
        details,
        created_at
    ) VALUES (
        'DATA_EXPORTS_CLEANUP',
        json_build_object('exports_expired', deleted_count),
        NOW()
    );

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old account deletion requests
CREATE OR REPLACE FUNCTION cleanup_old_deletion_requests()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete completed requests older than 90 days
    DELETE FROM public.account_deletion_requests
    WHERE status = 'completed' AND executed_at < NOW() - INTERVAL '90 days';

    -- Delete cancelled requests older than 30 days
    DELETE FROM public.account_deletion_requests
    WHERE status = 'cancelled' AND cancelled_at < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Log cleanup
    INSERT INTO public.audit_log (
        action,
        details,
        created_at
    ) VALUES (
        'DELETION_REQUESTS_CLEANUP',
        json_build_object('requests_deleted', deleted_count),
        NOW()
    );

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_account_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_account_deletion_requests_updated_at
    BEFORE UPDATE ON public.account_deletion_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_account_tables_updated_at();

CREATE TRIGGER trigger_update_account_pause_status_updated_at
    BEFORE UPDATE ON public.account_pause_status
    FOR EACH ROW
    EXECUTE FUNCTION update_account_tables_updated_at();

CREATE TRIGGER trigger_update_data_export_requests_updated_at
    BEFORE UPDATE ON public.data_export_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_account_tables_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.account_deletion_requests TO authenticated;
GRANT ALL ON public.account_pause_status TO authenticated;
GRANT ALL ON public.data_export_requests TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.account_deletion_requests IS 'Stores user account deletion requests with 30-day grace period';
COMMENT ON TABLE public.account_pause_status IS 'Tracks account pause/reactivate status and history';
COMMENT ON TABLE public.data_export_requests IS 'Manages GDPR-compliant data export requests and downloads';

COMMENT ON COLUMN public.account_deletion_requests.scheduled_deletion_date IS 'When the account will be permanently deleted (30 days after request)';
COMMENT ON COLUMN public.account_pause_status.resume_date IS 'When the account will automatically resume (optional)';
COMMENT ON COLUMN public.data_export_requests.expires_at IS 'When the download link expires (48 hours after completion)';

COMMENT ON FUNCTION is_account_scheduled_for_deletion(UUID) IS 'Checks if a user account is scheduled for deletion';
COMMENT ON FUNCTION is_account_paused(UUID) IS 'Checks if a user account is currently paused';
COMMENT ON FUNCTION get_account_status(UUID) IS 'Returns comprehensive account status information';
COMMENT ON FUNCTION cleanup_expired_data_exports() IS 'Removes expired data export links';
COMMENT ON FUNCTION cleanup_old_deletion_requests() IS 'Removes old deletion request records';
