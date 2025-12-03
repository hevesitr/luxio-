-- ============================================
-- ID Mezők Típusának Megváltoztatása UUID-ről TEXT-re
-- ============================================
-- UNIVERZÁLIS MEGOLDÁS
-- Megjegyzés: auth.users és profiles.id marad UUID, mert rendszer táblák
-- ============================================

-- STEP 1: Töröljük AZ ÖSSZES policy-t az ÖSSZES táblán
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies)
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
        RAISE NOTICE 'Dropped policy: % on %.%', r.policyname, r.schemaname, r.tablename;
    END LOOP;
END $$;

-- STEP 2: Kikapcsoljuk az RLS-t
ALTER TABLE IF EXISTS public.likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.passes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.private_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- STEP 3: Töröljük a foreign key constraint-eket
-- LIKES
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_liked_user_id_fkey;

-- MATCHES
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_user_id_fkey;
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_matched_user_id_fkey;

-- PASSES
ALTER TABLE public.passes DROP CONSTRAINT IF EXISTS passes_user_id_fkey;
ALTER TABLE public.passes DROP CONSTRAINT IF EXISTS passes_passed_user_id_fkey;

-- MESSAGES
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- PRIVATE_MESSAGES (ha létezik)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'private_messages') THEN
        ALTER TABLE public.private_messages DROP CONSTRAINT IF EXISTS private_messages_sender_id_fkey;
        ALTER TABLE public.private_messages DROP CONSTRAINT IF EXISTS private_messages_receiver_id_fkey;
    END IF;
END $$;

-- STEP 4: Változtassuk meg az oszlop típusokat
-- LIKES tábla
ALTER TABLE public.likes 
ALTER COLUMN user_id TYPE TEXT,
ALTER COLUMN liked_user_id TYPE TEXT;

-- MATCHES tábla
ALTER TABLE public.matches 
ALTER COLUMN user_id TYPE TEXT,
ALTER COLUMN matched_user_id TYPE TEXT;

-- PASSES tábla
ALTER TABLE public.passes 
ALTER COLUMN user_id TYPE TEXT,
ALTER COLUMN passed_user_id TYPE TEXT;

-- MESSAGES tábla
ALTER TABLE public.messages 
ALTER COLUMN sender_id TYPE TEXT;

-- PRIVATE_MESSAGES tábla (ha létezik)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'private_messages') THEN
        ALTER TABLE public.private_messages ALTER COLUMN sender_id TYPE TEXT;
        ALTER TABLE public.private_messages ALTER COLUMN receiver_id TYPE TEXT;
    END IF;
END $$;

-- MEGJEGYZÉS: profiles.id marad UUID, mert az auth.users(id)-ra hivatkozik

-- STEP 5: Visszakapcsoljuk az RLS-t
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 6: Hozzuk vissza az alapvető RLS policy-kat TEXT típussal
-- LIKES policies
CREATE POLICY "Users can view own likes" ON public.likes
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own likes" ON public.likes
  FOR DELETE USING (auth.uid()::text = user_id);

-- MATCHES policies
CREATE POLICY "Users can view own matches" ON public.matches
  FOR SELECT USING (auth.uid()::text = user_id OR auth.uid()::text = matched_user_id);

CREATE POLICY "Users can create matches" ON public.matches
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own matches" ON public.matches
  FOR UPDATE USING (auth.uid()::text = user_id);

-- PASSES policies
CREATE POLICY "Users can view own passes" ON public.passes
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create passes" ON public.passes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- MESSAGES policies
CREATE POLICY "Users can view messages in matches" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id::text = messages.match_id::text
      AND (matches.user_id = auth.uid()::text OR matches.matched_user_id = auth.uid()::text)
    )
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid()::text = sender_id
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id::text = match_id::text
      AND (matches.user_id = auth.uid()::text OR matches.matched_user_id = auth.uid()::text)
      AND matches.status = 'active'
    )
  );

CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (auth.uid()::text = sender_id);

CREATE POLICY "Users can delete own messages" ON public.messages
  FOR DELETE USING (auth.uid()::text = sender_id);

-- PRIVATE_MESSAGES policies (ha létezik)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'private_messages') THEN
        EXECUTE 'CREATE POLICY "Users can view own private messages" ON public.private_messages
          FOR SELECT USING (auth.uid()::text = sender_id OR auth.uid()::text = receiver_id)';
        
        EXECUTE 'CREATE POLICY "Users can send private messages to matches" ON public.private_messages
          FOR INSERT WITH CHECK (
            auth.uid()::text = sender_id
            AND EXISTS (
              SELECT 1 FROM public.matches
              WHERE (matches.user_id = auth.uid()::text AND matches.matched_user_id = receiver_id)
                 OR (matches.matched_user_id = auth.uid()::text AND matches.user_id = receiver_id)
              AND matches.status = ''active''
            )
          )';
    END IF;
END $$;

-- PROFILES policies (profiles.id marad UUID)
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users manage own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- STEP 7: Hozzuk vissza a storage policy-kat TEXT típussal
-- Voice messages
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

-- Video messages
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

-- STEP 8: Ellenőrzés
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND (column_name LIKE '%_id' OR column_name = 'id')
ORDER BY table_name, column_name;

-- Ellenőrizzük a policy-kat
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY tablename, policyname;
