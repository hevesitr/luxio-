-- Simple blocked_users table creation
-- Run this in Supabase SQL Editor to fix the "Could not find table" error

-- Create blocked_users table
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

    -- Constraints
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_id),
    CONSTRAINT unique_active_block UNIQUE (blocker_id, blocked_id) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON public.blocked_users(blocked_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_active ON public.blocked_users(blocker_id, blocked_id, is_active);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view blocks involving themselves" ON public.blocked_users
    FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Users can only block others" ON public.blocked_users
    FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can update their own blocks" ON public.blocked_users
    FOR UPDATE USING (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks" ON public.blocked_users
    FOR DELETE USING (auth.uid() = blocker_id);

-- Grant permissions
GRANT ALL ON public.blocked_users TO authenticated;
