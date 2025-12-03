-- Video Storage Setup for Supabase
-- This file contains the storage policies for the videos bucket

-- Note: The 'videos' bucket must be created manually in Supabase Dashboard
-- Settings: Private bucket, no public access

-- Storage policies for videos bucket
-- Allow authenticated users to upload their own videos
CREATE POLICY "Users can upload their own videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own videos
CREATE POLICY "Users can read their own videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own videos
CREATE POLICY "Users can delete their own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view approved videos from other users
CREATE POLICY "Users can view approved videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos' AND
  EXISTS (
    SELECT 1 FROM videos
    WHERE videos.storage_path = name
    AND videos.moderation_status = 'approved'
  )
);
