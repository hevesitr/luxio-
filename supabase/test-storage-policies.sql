-- ============================================
-- TESZT Storage Policies
-- ============================================
-- FIGYELEM: Ezek a policies CSAK TESZTELÉSRE valók!
-- Éles környezetben NE használd ezeket!
-- 
-- Ezek a policies engedélyezik az ANON kulccsal való
-- feltöltést, ami NEM biztonságos éles környezetben.
-- ============================================

-- AVATARS - Teszt INSERT policy
CREATE POLICY "Test anon upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
);

-- PHOTOS - Teszt INSERT policy
CREATE POLICY "Test anon upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos'
);

-- VIDEOS - Teszt INSERT policy
CREATE POLICY "Test anon upload videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos'
);

-- VOICE-MESSAGES - Teszt INSERT policy
CREATE POLICY "Test anon upload voice-messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-messages'
);

-- VIDEO-MESSAGES - Teszt INSERT policy
CREATE POLICY "Test anon upload video-messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'video-messages'
);

-- ============================================
-- TESZT DELETE policies (cleanup-hoz)
-- ============================================

-- AVATARS - Teszt DELETE policy
CREATE POLICY "Test anon delete avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
);

-- PHOTOS - Teszt DELETE policy
CREATE POLICY "Test anon delete photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos'
);

-- VIDEOS - Teszt DELETE policy
CREATE POLICY "Test anon delete videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos'
);

-- VOICE-MESSAGES - Teszt DELETE policy
CREATE POLICY "Test anon delete voice-messages"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice-messages'
);

-- VIDEO-MESSAGES - Teszt DELETE policy
CREATE POLICY "Test anon delete video-messages"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'video-messages'
);

-- ============================================
-- MEGJEGYZÉS
-- ============================================
-- Miután a tesztelés kész, töröld ezeket a policies-t:
-- 
-- DROP POLICY "Test anon upload avatars" ON storage.objects;
-- DROP POLICY "Test anon upload photos" ON storage.objects;
-- DROP POLICY "Test anon upload videos" ON storage.objects;
-- DROP POLICY "Test anon upload voice-messages" ON storage.objects;
-- DROP POLICY "Test anon upload video-messages" ON storage.objects;
-- DROP POLICY "Test anon delete avatars" ON storage.objects;
-- DROP POLICY "Test anon delete photos" ON storage.objects;
-- DROP POLICY "Test anon delete videos" ON storage.objects;
-- DROP POLICY "Test anon delete voice-messages" ON storage.objects;
-- DROP POLICY "Test anon delete video-messages" ON storage.objects;
