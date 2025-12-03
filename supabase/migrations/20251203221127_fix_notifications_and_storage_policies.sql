-- 1. Frissítsük a notifications táblát, ha szükséges
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Engedélyezzük a sor szintű biztonságot
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Indexek létrehozása a jobb teljesítmény érdekében
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at);

-- 2. Állítsuk be a tárolási házirendeket
DO $$
BEGIN
  -- Értesítések megtekintéséhez szükséges házirend
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'notifications' 
    AND policyname = 'Users can view their own notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications" 
    ON public.notifications 
    FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;

  -- Új értesítések beszúrásához szükséges házirend
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'notifications' 
    AND policyname = 'Users can insert their own notifications'
  ) THEN
    CREATE POLICY "Users can insert their own notifications" 
    ON public.notifications 
    FOR INSERT 
    WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);
  END IF;

  -- Értesítések frissítéséhez szükséges házirend
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'notifications' 
    AND policyname = 'Users can update their own notifications'
  ) THEN
    CREATE POLICY "Users can update their own notifications" 
    ON public.notifications 
    FOR UPDATE 
    USING (auth.uid() = user_id);
  END IF;

  -- 3. Tárolási házirendek az avatárokhoz
  -- Nyilvános olvasás az avatárokhoz
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public Access for avatars'
  ) THEN
    CREATE POLICY "Public Access for avatars"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'avatars');
  END IF;

  -- Feltöltési jogosultság a bejelentkezett felhasználóknak
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload avatars'
  ) THEN
    CREATE POLICY "Users can upload avatars"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND storage.folder_name(name) = auth.uid() || '/');
  END IF;

  -- Törlési jogosultság a saját fájlokhoz
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own avatars'
  ) THEN
    CREATE POLICY "Users can delete their own avatars"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'avatars' AND storage.folder_name(name) = auth.uid() || '/');
  END IF;
END
$$;

-- 4. Értesítési funkció létrehozása
CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'new_notification',
    json_build_object(
      'id', NEW.id,
      'user_id', NEW.user_id,
      'type', NEW.type
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger létrehozása az új értesítésekhez
DROP TRIGGER IF EXISTS on_notification_created ON public.notifications;
CREATE TRIGGER on_notification_created
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_notification();

-- 6. Értesítések olvasottnak jelöléséhez szükséges függvény
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(notification_ids UUID[])
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE,
      read_at = NOW(),
      updated_at = NOW()
  WHERE id = ANY(notification_ids)
    AND user_id = auth.uid()
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;