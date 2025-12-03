-- ============================================
-- REALTIME ENGEDÉLYEZÉSE
-- ============================================
-- Ez a script engedélyezi a realtime-ot a messages táblára
-- Futtasd a Supabase Dashboard → SQL Editor-ban

-- 1. Ellenőrizd, hogy létezik-e a supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- 2. Add hozzá a messages táblát a realtime publication-höz
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 3. Ellenőrzés: Listázd a realtime-ban lévő táblákat
SELECT 
  schemaname,
  tablename
FROM 
  pg_publication_tables
WHERE 
  pubname = 'supabase_realtime';

-- Ha a messages tábla megjelenik a listában, akkor sikeres! ✅

-- ============================================
-- OPCIONÁLIS: Realtime kikapcsolása (ha szükséges)
-- ============================================
-- Ha ki szeretnéd kapcsolni a realtime-ot:
-- ALTER PUBLICATION supabase_realtime DROP TABLE public.messages;
