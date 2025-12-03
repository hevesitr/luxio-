-- ============================================
-- Foreign Key Constraints Eltávolítása
-- ============================================
-- FIGYELEM: Ez csak fejlesztési/tesztelési célokra!
-- Éles környezetben NE használd!
-- ============================================

-- LIKES tábla
ALTER TABLE public.likes 
DROP CONSTRAINT IF EXISTS likes_user_id_fkey,
DROP CONSTRAINT IF EXISTS likes_liked_user_id_fkey;

-- MATCHES tábla
ALTER TABLE public.matches 
DROP CONSTRAINT IF EXISTS matches_user_id_fkey,
DROP CONSTRAINT IF EXISTS matches_matched_user_id_fkey;

-- PASSES tábla
ALTER TABLE public.passes 
DROP CONSTRAINT IF EXISTS passes_user_id_fkey,
DROP CONSTRAINT IF EXISTS passes_passed_user_id_fkey;

-- MESSAGES tábla
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- Ellenőrzés
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name
FROM pg_constraint
WHERE contype = 'f' 
AND conrelid::regclass::text IN ('likes', 'matches', 'passes', 'messages');
