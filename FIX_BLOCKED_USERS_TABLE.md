# 🔧 Blocked Users Table Fix

## 🚨 Probléma
Az alkalmazás a következő hibát dobja:
```
ERROR  ❌ [ERROR] Failed to get block status {"context": {}, "error": "Could not find the table 'public.blocked_users' in the schema cache"}
```

Ez azt jelenti, hogy a `blocked_users` tábla nincs még létrehozva a Supabase adatbázisban.

## ✅ Megoldás

### 1. lépés: SQL lefuttatása Supabase-ben

1. Nyisd meg a Supabase Dashboard-ot: https://supabase.com/dashboard
2. Válaszd ki a projektet
3. Menj az **SQL Editor** fülre
4. Másold be és futtasd az alábbi SQL kódot:

```sql
-- Simple blocked_users table creation
-- Run this in Supabase SQL Editor to fix the "Could not find table" error

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    block_type TEXT NOT NULL DEFAULT 'user_block' CHECK (block_type IN ('user_block', 'mutual_block')),
    reason TEXT DEFAULT 'other' CHECK (reason IN ('harassment', 'inappropriate_content', 'spam', 'fake_profile', 'other')),
    details TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_id),
    CONSTRAINT unique_active_block UNIQUE (blocker_id, blocked_id) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON public.blocked_users(blocked_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_active ON public.blocked_users(blocker_id, blocked_id, is_active);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view blocks involving themselves" ON public.blocked_users
    FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Users can only block others" ON public.blocked_users
    FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can update their own blocks" ON public.blocked_users
    FOR UPDATE USING (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks" ON public.blocked_users
    FOR DELETE USING (auth.uid() = blocker_id);

-- Grant permissions
GRANT ALL ON public.blocked_users TO authenticated;
```

### 2. lépés: Alkalmazás újraindítása

A SQL lefuttatása után:

1. Állítsd le az Expo szervert (Ctrl+C)
2. Indítsd újra: `npx expo start --clear --web`

### 3. lépés: Ellenőrzés

Az alkalmazás újraindítása után a hibaüzeneteknek el kell tűnniük a konzolból.

## 📋 Alternatív megoldás

Ha nem akarod manuálisan futtatni az SQL-t, használhatod a kész migration fájlt:

```bash
# A migration fájl már létre lett hozva:
# supabase/migrations/20251206230000_create_blocked_users_table.sql

# Ha Supabase CLI-t használsz:
supabase db push
```

## 🎯 Miért szükséges ez?

A `blocked_users` tábla kritikus része az alkalmazásnak, mert:
- Biztosítja a felhasználók közötti blokkolási funkciót
- Megakadályozza a blokkolt felhasználók közötti interakciót
- GDPR compliance-t biztosít
- Biztonsági funkciókat implementál

A tábla nélkül az alkalmazás működik, de a blokkolási funkciók nem lesznek elérhetők.
