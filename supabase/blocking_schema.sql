-- Enhanced Blocking System Schema
-- Task 8: Enhanced Blocking System

-- Create blocked_users table for user blocking functionality
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    block_type TEXT NOT NULL DEFAULT 'user_block' CHECK (block_type IN ('user_block', 'mutual_block')),
    reason TEXT DEFAULT 'other' CHECK (reason IN ('harassment', 'inappropriate_content', 'spam', 'fake_profile', 'other')),
    details TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure a user cannot block themselves
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_id),

    -- Ensure unique active blocks between users (prevent duplicate blocks)
    CONSTRAINT unique_active_block UNIQUE (blocker_id, blocked_id) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON public.blocked_users(blocked_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_active ON public.blocked_users(blocker_id, blocked_id, is_active);
CREATE INDEX IF NOT EXISTS idx_blocked_users_created_at ON public.blocked_users(created_at DESC);

-- Row Level Security policies
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can view blocks where they are involved (either blocker or blocked)
CREATE POLICY "Users can view blocks involving themselves" ON public.blocked_users
    FOR SELECT USING (
        auth.uid() = blocker_id OR auth.uid() = blocked_id
    );

-- Users can only insert blocks where they are the blocker
CREATE POLICY "Users can only block others" ON public.blocked_users
    FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- Users can only update their own blocks
CREATE POLICY "Users can update their own blocks" ON public.blocked_users
    FOR UPDATE USING (auth.uid() = blocker_id);

-- Users can only delete their own blocks
CREATE POLICY "Users can delete their own blocks" ON public.blocked_users
    FOR DELETE USING (auth.uid() = blocker_id);

-- Service role can manage all blocks (for admin operations)
CREATE POLICY "Service role can manage all blocks" ON public.blocked_users
    FOR ALL USING (
        CASE
            WHEN auth.jwt() ->> 'role' = 'service_role' THEN true
            ELSE false
        END
    );

-- Create function to get mutual block status
CREATE OR REPLACE FUNCTION get_mutual_block_status(user_id_1 UUID, user_id_2 UUID)
RETURNS TABLE (
    is_blocked BOOLEAN,
    blocker_id UUID,
    blocked_id UUID,
    block_direction TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE WHEN bu.id IS NOT NULL THEN TRUE ELSE FALSE END as is_blocked,
        bu.blocker_id,
        bu.blocked_id,
        CASE
            WHEN bu.blocker_id = user_id_1 THEN 'outgoing'
            WHEN bu.blocker_id = user_id_2 THEN 'incoming'
            ELSE 'none'
        END as block_direction
    FROM (
        SELECT * FROM public.blocked_users
        WHERE
            (blocker_id = user_id_1 AND blocked_id = user_id_2) OR
            (blocker_id = user_id_2 AND blocked_id = user_id_1)
            AND is_active = TRUE
        LIMIT 1
    ) bu;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if users can interact
CREATE OR REPLACE FUNCTION can_users_interact(user_id_1 UUID, user_id_2 UUID)
RETURNS BOOLEAN AS $$
DECLARE
    block_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.blocked_users
        WHERE
            ((blocker_id = user_id_1 AND blocked_id = user_id_2) OR
             (blocker_id = user_id_2 AND blocked_id = user_id_1))
            AND is_active = TRUE
    ) INTO block_exists;

    RETURN NOT block_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for bulk block cleanup (inactive blocks older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_blocks()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.blocked_users
    WHERE is_active = FALSE AND updated_at < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Log cleanup
    INSERT INTO public.audit_log (
        action,
        details,
        created_at
    ) VALUES (
        'BLOCKS_CLEANUP',
        json_build_object('blocks_deleted', deleted_count),
        NOW()
    );

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blocked_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_blocked_users_updated_at
    BEFORE UPDATE ON public.blocked_users
    FOR EACH ROW
    EXECUTE FUNCTION update_blocked_users_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.blocked_users TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.blocked_users IS 'Stores user blocking relationships for enhanced privacy and safety';
COMMENT ON COLUMN public.blocked_users.blocker_id IS 'User who initiated the block';
COMMENT ON COLUMN public.blocked_users.blocked_id IS 'User who was blocked';
COMMENT ON COLUMN public.blocked_users.block_type IS 'Type of block (user_block, mutual_block)';
COMMENT ON COLUMN public.blocked_users.reason IS 'Reason for blocking (harassment, spam, etc.)';
COMMENT ON COLUMN public.blocked_users.is_active IS 'Whether the block is currently active';

COMMENT ON FUNCTION get_mutual_block_status(UUID, UUID) IS 'Returns mutual blocking status between two users';
COMMENT ON FUNCTION can_users_interact(UUID, UUID) IS 'Checks if two users can interact (not blocked)';
COMMENT ON FUNCTION cleanup_old_blocks() IS 'Removes inactive blocks older than 30 days';
