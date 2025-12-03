-- ============================================
-- Storage Policies Javítás
-- ============================================
-- Törli és újra létrehozza az összes storage policy-t
-- ============================================

-- STEP 1: Töröljük az összes létező storage policy-t
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- STEP 2: Hozzuk létre az ÖSSZES storage policy-t TEXT típussal

-- ============================================
-- AVATARS BUCKET POLICIES
-- ============================================

CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- PHOTOS BUCKET POLICIES
-- ============================================

CREATE POLICY "Public read access for photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- VIDEOS BUCKET POLICIES
-- ============================================

CREATE POLICY "Public read access for videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- VOICE-MESSAGES BUCKET POLICIES
-- ============================================

CREATE POLICY "Users can read voice messages in matches"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'voice-messages' AND
  auth.role() = 'authenticated' AND
  (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM matches
      WHERE id::text = (storage.foldername(name))[1]
      AND (user_id = auth.uid()::text OR matched_user_id = auth.uid()::text)
      AND status = 'active'
    )
  )
);

CREATE POLICY "Users can upload voice messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-messages' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM matches
    WHERE id::text = (storage.foldername(name))[1]
    AND (user_id = auth.uid()::text OR matched_user_id = auth.uid()::text)
    AND status = 'active'
  )
);

CREATE POLICY "Users can delete own voice messages"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice-messages' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM messages
    WHERE content = name
    AND sender_id = auth.uid()::text
    AND type = 'voice'
  )
);

-- ============================================
-- VIDEO-MESSAGES BUCKET POLICIES
-- ============================================

CREATE POLICY "Users can read video messages in matches"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'video-messages' AND
  auth.role() = 'authenticated' AND
  (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM matches
      WHERE id::text = (storage.foldername(name))[1]
      AND (user_id = auth.uid()::text OR matched_user_id = auth.uid()::text)
      AND status = 'active'
    )
  )
);

CREATE POLICY "Users can upload video messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'video-messages' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM matches
    WHERE id::text = (storage.foldername(name))[1]
    AND (user_id = auth.uid()::text OR matched_user_id = auth.uid()::text)
    AND status = 'active'
  )
);

CREATE POLICY "Users can delete own video messages"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'video-messages' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM messages
    WHERE content = name
    AND sender_id = auth.uid()::text
    AND type = 'video'
  )
);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;
