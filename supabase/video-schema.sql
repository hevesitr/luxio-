-- Video Profile Features Database Schema
-- Creates the videos table with moderation support

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  duration_seconds INTEGER NOT NULL,
  file_size_mb DECIMAL(5,2) NOT NULL,
  resolution TEXT NOT NULL,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_duration CHECK (duration_seconds > 0 AND duration_seconds <= 30),
  CONSTRAINT valid_size CHECK (file_size_mb > 0 AND file_size_mb <= 10)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_moderation_status ON videos(moderation_status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);

-- Enable Row Level Security
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for videos table

-- Users can view their own videos regardless of moderation status
CREATE POLICY "Users can view their own videos"
ON videos FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- Users can insert their own videos
CREATE POLICY "Users can insert their own videos"
ON videos FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- Users can delete their own videos
CREATE POLICY "Users can delete their own videos"
ON videos FOR DELETE
TO authenticated
USING (user_id = auth.uid()::text);

-- Users can view approved videos from other users
CREATE POLICY "Users can view approved videos"
ON videos FOR SELECT
TO authenticated
USING (moderation_status = 'approved');

-- Admins can view all videos (for moderation)
-- Note: This requires an admin role to be set up in Supabase
CREATE POLICY "Admins can view all videos"
ON videos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()::text
    AND profiles.is_admin = true
  )
);

-- Admins can update video moderation status
CREATE POLICY "Admins can update video moderation"
ON videos FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()::text
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()::text
    AND profiles.is_admin = true
  )
);

-- Add is_admin column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create function to automatically set approved_at timestamp
CREATE OR REPLACE FUNCTION set_video_approval_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.moderation_status = 'approved' AND OLD.moderation_status != 'approved' THEN
    NEW.approved_at = NOW();
  END IF;
  IF NEW.moderation_status = 'rejected' AND OLD.moderation_status != 'rejected' THEN
    NEW.rejected_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for approval timestamp
DROP TRIGGER IF EXISTS video_approval_timestamp ON videos;
CREATE TRIGGER video_approval_timestamp
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION set_video_approval_timestamp();

-- Grant necessary permissions
GRANT ALL ON videos TO authenticated;
GRANT ALL ON videos TO service_role;
