-- ============================================
-- Storage Policies Setup
-- ============================================
-- Ez a script létrehozza az összes szükséges RLS policy-t
-- a storage bucket-ekhez.
--
-- Használat:
-- 1. Nyisd meg a Supabase Dashboard → SQL Editor-t
-- 2. Másold be ezt a scriptet
-- 3. Futtasd le
-- ============================================

-- ============================================
-- AVATARS BUCKET POLICIES
-- ============================================

-- Public read access (mindenki láthatja a profilképeket)
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated users can upload (bejelentkezett felhasználók feltölthetnek)
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Users can update own files (felhasználók frissíthetik saját fájljaikat)
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

-- Users can delete own files (felhasználók törölhetik saját fájljaikat)
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- PHOTOS BUCKET POLICIES
-- ============================================

-- Public read access
CREATE POLICY "Public read access for photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos' AND
  auth.role() = 'authenticated'
);

-- Users can update own files
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

-- Users can delete own files
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- VIDEOS BUCKET POLICIES
-- ============================================

-- Public read access
CREATE POLICY "Public read access for videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' AND
  auth.role() = 'authenticated'
);

-- Users can update own files
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

-- Users can delete own files
CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- VOICE-MESSAGES BUCKET POLICIES (PRIVATE)
-- ============================================

-- Users can read messages in their matches
CREATE POLICY "Users can read voice messages in their matches"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'voice-messages' AND
  auth.role() = 'authenticated' AND
  (
    -- A felhasználó saját üzenetei
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Vagy olyan match-ben van, ahol ő is résztvevő
    EXISTS (
      SELECT 1 FROM matches
      WHERE id::text = (storage.foldername(name))[1]
      AND (user_id = auth.uid() OR matched_user_id = auth.uid())
      AND status = 'active'
    )
  )
);

-- Users can upload voice messages to their matches
CREATE POLICY "Users can upload voice messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-messages' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM matches
    WHERE id::text = (storage.foldername(name))[1]
    AND (user_id = auth.uid() OR matched_user_id = auth.uid())
    AND status = 'active'
  )
);

-- Users can delete own voice messages
CREATE POLICY "Users can delete own voice messages"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice-messages' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM messages
    WHERE content = name
    AND sender_id = auth.uid()
    AND type = 'voice'
  )
);

-- ============================================
-- VIDEO-MESSAGES BUCKET POLICIES (PRIVATE)
-- ============================================

-- Users can read video messages in their matches
CREATE POLICY "Users can read video messages in their matches"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'video-messages' AND
  auth.role() = 'authenticated' AND
  (
    -- A felhasználó saját üzenetei
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Vagy olyan match-ben van, ahol ő is résztvevő
    EXISTS (
      SELECT 1 FROM matches
      WHERE id::text = (storage.foldername(name))[1]
      AND (user_id = auth.uid() OR matched_user_id = auth.uid())
      AND status = 'active'
    )
  )
);

-- Users can upload video messages to their matches
CREATE POLICY "Users can upload video messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'video-messages' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM matches
    WHERE id::text = (storage.foldername(name))[1]
    AND (user_id = auth.uid() OR matched_user_id = auth.uid())
    AND status = 'active'
  )
);

-- Users can delete own video messages
CREATE POLICY "Users can delete own video messages"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'video-messages' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM messages
    WHERE content = name
    AND sender_id = auth.uid()
    AND type = 'video'
  )
);

-- ============================================
-- VERIFICATION
-- ============================================

-- Ellenőrizd, hogy minden policy létrejött:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;
