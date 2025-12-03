-- ============================================
-- Profiles Policy Javítás
-- ============================================
-- Engedélyezi a felhasználóknak a saját profiljuk frissítését
-- ============================================

-- Töröljük a régi policy-kat
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;

-- Újra létrehozzuk a helyes policy-kat
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Ellenőrzés
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
