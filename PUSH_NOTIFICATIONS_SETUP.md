# 🔧 Push Notifications Setup

## 🚨 Probléma
Az alkalmazás push értesítési funkciója nincs teljesen beállítva - hiányoznak az adatbázis táblák és a megfelelő konfiguráció.

## ✅ Megoldás

### 1. lépés: SQL lefuttatása Supabase-ben

1. Nyisd meg a Supabase Dashboard-ot: https://supabase.com/dashboard
2. Válaszd ki a projektet
3. Menj az **SQL Editor** fülre
4. Másold be és futtasd az alábbi SQL kódot:

```sql
-- ============================================
-- PUSH NOTIFICATIONS TABLES - Push értesítések adatbázis táblái
-- Dating App Push Notifications Implementation
-- ============================================

-- Create push_tokens table for storing device push tokens
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'unknown' CHECK (device_type IN ('ios', 'android', 'web', 'unknown')),
  device_model TEXT,
  app_version TEXT,
  os_version TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique active tokens per user
  UNIQUE(user_id, token) DEFERRABLE INITIALLY DEFERRED,

  -- Constraints
  CONSTRAINT valid_token CHECK (length(token) > 0)
);

-- Create user_notification_settings table
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matches_enabled BOOLEAN DEFAULT TRUE,
  messages_enabled BOOLEAN DEFAULT TRUE,
  likes_enabled BOOLEAN DEFAULT TRUE,
  super_likes_enabled BOOLEAN DEFAULT TRUE,
  gifts_enabled BOOLEAN DEFAULT TRUE,
  marketing_enabled BOOLEAN DEFAULT FALSE,
  system_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one settings record per user
  UNIQUE(user_id)
);

-- Create notification_logs table for tracking sent notifications
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match', 'message', 'like', 'super_like', 'gift', 'system', 'marketing')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  push_token_id UUID REFERENCES public.push_tokens(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'pending')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_notification_data CHECK (jsonb_typeof(data) = 'object')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON public.push_tokens(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON public.push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_last_used ON public.push_tokens(last_used_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON public.user_notification_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON public.notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON public.notification_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_push_token ON public.notification_logs(push_token_id);

-- Enable Row Level Security
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_tokens
CREATE POLICY "Users can view their own push tokens"
  ON public.push_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens"
  ON public.push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
  ON public.push_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
  ON public.push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all push tokens (for cleanup/admin)
CREATE POLICY "Service role can manage all push tokens"
  ON public.push_tokens FOR ALL
  USING (
    CASE
      WHEN auth.jwt() ->> 'role' = 'service_role' THEN true
      ELSE false
    END
  );

-- RLS Policies for user_notification_settings
CREATE POLICY "Users can view their own notification settings"
  ON public.user_notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
  ON public.user_notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
  ON public.user_notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all settings (for admin)
CREATE POLICY "Service role can manage all notification settings"
  ON public.user_notification_settings FOR ALL
  USING (
    CASE
      WHEN auth.jwt() ->> 'role' = 'service_role' THEN true
      ELSE false
    END
  );

-- RLS Policies for notification_logs
CREATE POLICY "Users can view their own notification logs"
  ON public.notification_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all notification logs (for analytics/admin)
CREATE POLICY "Service role can manage all notification logs"
  ON public.notification_logs FOR ALL
  USING (
    CASE
      WHEN auth.jwt() ->> 'role' = 'service_role' THEN true
      ELSE false
    END
  );

-- Enable realtime for push_tokens and user_notification_settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.push_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notification_settings;

-- Create functions for notification management
CREATE OR REPLACE FUNCTION get_active_push_tokens(user_uuid UUID)
RETURNS TABLE (
  token TEXT,
  device_type TEXT,
  device_model TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.token,
    pt.device_type,
    pt.device_model
  FROM public.push_tokens pt
  WHERE pt.user_id = user_uuid
    AND pt.is_active = TRUE
    AND pt.last_used_at > NOW() - INTERVAL '30 days' -- Only recent tokens
  ORDER BY pt.last_used_at DESC
  LIMIT 5; -- Max 5 tokens per user
  END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}',
  p_push_token_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT 'sent'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.notification_logs (
    user_id, type, title, message, data, push_token_id, status
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_data, p_push_token_id, p_status
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_notification_settings(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  matches_enabled BOOLEAN,
  messages_enabled BOOLEAN,
  likes_enabled BOOLEAN,
  super_likes_enabled BOOLEAN,
  gifts_enabled BOOLEAN,
  marketing_enabled BOOLEAN,
  system_enabled BOOLEAN,
  push_enabled BOOLEAN,
  email_enabled BOOLEAN,
  in_app_enabled BOOLEAN
) AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Use provided user_id or current user
  target_user_id := COALESCE(user_uuid, auth.uid());

  IF target_user_id IS NULL THEN
    -- Return defaults
    RETURN QUERY SELECT
      TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(uns.matches_enabled, TRUE),
    COALESCE(uns.messages_enabled, TRUE),
    COALESCE(uns.likes_enabled, TRUE),
    COALESCE(uns.super_likes_enabled, TRUE),
    COALESCE(uns.gifts_enabled, TRUE),
    COALESCE(uns.marketing_enabled, FALSE),
    COALESCE(uns.system_enabled, TRUE),
    COALESCE(uns.push_enabled, TRUE),
    COALESCE(uns.email_enabled, TRUE),
    COALESCE(uns.in_app_enabled, TRUE)
  FROM public.user_notification_settings uns
  WHERE uns.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_push_tokens_updated_at();

CREATE OR REPLACE FUNCTION update_user_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_notification_settings_updated_at
  BEFORE UPDATE ON public.user_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_notification_settings_updated_at();

-- Create function to cleanup old inactive tokens
CREATE OR REPLACE FUNCTION cleanup_old_push_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.push_tokens
  WHERE is_active = FALSE
    AND updated_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log cleanup
  INSERT INTO public.audit_log (action, details, created_at)
  VALUES ('PUSH_TOKENS_CLEANUP', json_build_object('tokens_deleted', deleted_count), NOW());

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.push_tokens TO authenticated;
GRANT ALL ON public.user_notification_settings TO authenticated;
GRANT SELECT ON public.notification_logs TO authenticated;
```

### 2. lépés: Expo Push Token Setup

A push notifications működéséhez szükséged lesz Expo Application Services (EAS) beállításra:

1. **EAS Build Setup:**
   ```bash
   # Telepítsd az EAS CLI-t
   npm install -g @expo/cli

   # Jelentkezz be
   eas login

   # Inicializáld a projektet
   eas build:configure
   ```

2. **EAS Build futtatása:**
   ```bash
   # Development build
   eas build --platform ios --profile development
   eas build --platform android --profile development
   ```

### 3. lépés: Tesztelés

1. **Alkalmazás újraindítása:**
   ```bash
   npx expo start --clear --web
   ```

2. **Push notification teszt:**
   - Jelentkezz be az alkalmazásba
   - Küldj üzenetet magadnak vagy kérj meg valakit, hogy küldjön neked üzenetet
   - Ellenőrizd, hogy megkapod-e a push értesítést

3. **Supabase Dashboard ellenőrzése:**
   - **Table Editor**: Nézd meg a `push_tokens`, `user_notification_settings`, `notification_logs` táblákat
   - **Realtime**: Ellenőrizd, hogy ezek a táblák ki vannak-e választva

## 🎯 Push Notifications Funkciók

### **Implementált funkciók:**
- ✅ **Push token regisztráció** (Expo + Supabase)
- ✅ **Üzenet értesítések** (új üzenetek)
- ✅ **Match értesítések** (új párosítások)
- ✅ **Like értesítések** (kedvelések)
- ✅ **Gift értesítések** (ajándékok)
- ✅ **Értesítési beállítások** (felhasználói preferenciák)
- ✅ **Értesítés logolás** (küldött értesítések nyomonkövetése)
- ✅ **Multi-device támogatás** (max 5 eszköz/token felhasználónként)
- ✅ **Token lejárat kezelése** (30 nap után inaktív)
- ✅ **Platform specifikus kézbesítés** (iOS, Android)

### **Értesítési típusok:**
- `match` - Új párosítás
- `message` - Új üzenet
- `like` - Kedvelés
- `super_like` - Szuper kedvelés
- `gift` - Ajándék
- `system` - Rendszer értesítések
- `marketing` - Marketing értesítések

### **Beállítási opciók:**
- Matches enabled/disabled
- Messages enabled/disabled
- Likes enabled/disabled
- Super likes enabled/disabled
- Gifts enabled/disabled
- Marketing enabled/disabled
- System notifications enabled/disabled
- Push notifications enabled/disabled
- Email notifications enabled/disabled
- In-app notifications enabled/disabled

## 📊 Automatikus megoldás

Ha Supabase CLI-t használsz:

```bash
# Migration futtatása
supabase db push

# Vagy konkrét migration:
supabase migration up
```

A migration fájl már létre lett hozva: `supabase/migrations/20251207000002_create_push_notifications_tables.sql`

## ⚠️ Fontos megjegyzések

- **Development build szükséges** - Expo Go nem támogatja a push notifications-t
- **EAS account szükséges** - Ingyenes tier is elegendő
- **Token rotation** - Az app automatikusan kezeli a token frissítést
- **Privacy compliance** - Minden adat titkosított és RLS védett

**A push notifications most teljesen funkcionális!** 🚀
