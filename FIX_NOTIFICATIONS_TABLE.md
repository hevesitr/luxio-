# 🔧 Notifications Table Fix

## 🚨 Probléma
Az alkalmazás számára szükséges a notifications tábla a valós idejű értesítések kezeléséhez, de ez még nincs létrehozva a Supabase adatbázisban.

## ✅ Megoldás

### 1. lépés: SQL lefuttatása Supabase-ben

1. Nyisd meg a Supabase Dashboard-ot: https://supabase.com/dashboard
2. Válaszd ki a projektet
3. Menj az **SQL Editor** fülre
4. Másold be és futtasd az alábbi SQL kódot:

```sql
-- ============================================
-- NOTIFICATIONS TABLE - Értesítések tábla létrehozása
-- Dating App Notifications Implementation
-- ============================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_notification_type CHECK (type IN ('match', 'message', 'like', 'super_like', 'gift', 'system', 'premium'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all notifications (for system notifications)
CREATE POLICY "Service role can manage all notifications"
  ON public.notifications FOR ALL
  USING (
    CASE
      WHEN auth.jwt() ->> 'role' = 'service_role' THEN true
      ELSE false
    END
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE, read_at = NOW(), updated_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Use provided user_id or current user
  target_user_id := COALESCE(user_uuid, auth.uid());

  IF target_user_id IS NULL THEN
    RETURN 0;
  END IF;

  RETURN (
    SELECT COUNT(*)
    FROM public.notifications
    WHERE user_id = target_user_id AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
```

### 2. lépés: Ellenőrzés

Az SQL lefuttatása után ellenőrizd a Supabase Dashboard-on:
1. **Table Editor** fülön látni kell a `notifications` táblát
2. **Realtime** fülön a `notifications` tábla ki kell legyen jelölve

### 3. lépés: Alkalmazás újraindítása

```bash
# Állítsd le az Expo szervert (Ctrl+C)
# Indítsd újra:
npx expo start --clear --web
```

## 🎯 Miért szükséges ez?

A `notifications` tábla kritikus része az alkalmazásnak, mert:
- Valós idejű értesítések kezelése (match, üzenet, like, stb.)
- Offline értesítések queue-ja
- Push notification infrastruktúra alapja
- Felhasználói élmény javítása

## 📋 Automatikus megoldás

Ha Supabase CLI-t használsz:

```bash
# Migration futtatása
supabase db push

# Vagy konkrét migration:
supabase migration up
```

A migration fájl már létre lett hozva: `supabase/migrations/20251207000000_create_notifications_table.sql`
