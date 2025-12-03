-- ============================================
-- Photos Oszlop Hozzáadása a Profiles Táblához
-- ============================================

-- Adjuk hozzá a photos oszlopot TEXT[] típussal
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- Ellenőrzés
SELECT 
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name = 'photos';
