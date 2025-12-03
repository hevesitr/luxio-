-- Add profile_picture column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Comment for the column
COMMENT ON COLUMN public.profiles.profile_picture IS 'Stores the filename of the profile picture in the storage bucket';

-- Update existing rows with default value if needed
-- UPDATE public.profiles SET profile_picture = 'default_avatar.jpg' WHERE profile_picture IS NULL;

-- Add RLS policy if needed
-- DROP POLICY IF EXISTS "Users can view profile pictures" ON public.profiles;
-- CREATE POLICY "Users can view profile pictures" 
-- ON public.profiles
-- FOR SELECT
-- USING (true);

-- DROP POLICY IF EXISTS "Users can update their own profile picture" ON public.profiles;
-- CREATE POLICY "Users can update their own profile picture"
-- ON public.profiles
-- FOR UPDATE
-- USING (auth.uid() = id);
