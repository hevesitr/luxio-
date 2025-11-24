# Supabase Setup Guide

Kövesd az alábbi lépéseket, hogy költségmentes (Free tier) Supabase backendet kapjon a Luxio alkalmazás.

## 1. Projekt létrehozása

1. Lépj a [https://supabase.com/](https://supabase.com/) oldalra és jelentkezz be a GitHub-fiókoddal.
2. Hozz létre egy új projektet (Region: EU ajánlott, pl. `eu-central-1`).
3. Adj meg egy erős adatbázis-jelszót (jegyezd fel, később kellhet).

## 2. Táblák és jogosultságok

1. A Supabase Dashboard **SQL editor** menüjében futtasd a repo `supabase/schema.sql` fájlját.
2. Ez létrehozza a `profiles` táblát, engedélyezi az RLS-t és az alap policy-kat, így minden felhasználó csak a saját profilját módosíthatja.

## 3. Környezeti változók

1. Készíts másolatot az `env.example` fájlról `copy env.example .env` paranccsal (Windows) vagy `cp env.example .env`.
2. A Supabase Dashboard → **Project Settings → API** oldalon keresd meg:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` kulcs → `SUPABASE_ANON_KEY`
3. (Opcionális) `SUPABASE_REDIRECT_URL`-hez add meg azt az URL-t, ahová a jelszó-visszaállító és email-megerősítő linkek érkeznek. Alapértelmezett: `https://hevesitr.github.io/luxio-/`.
4. A `.env` fájlba írd be ezeket az értékeket, majd indítsd újra az Expo-t (`npm start`).

## 4. Auth beállítások

1. Supabase Dashboard → **Authentication → URL Configuration**
   - `Site URL`: `https://hevesitr.github.io/luxio-/` (vagy saját domain).
   - `Redirect URLs`: add hozzá a `SUPABASE_REDIRECT_URL` értékét (pl. `https://hevesitr.github.io/luxio-/auth-callback`).
2. Kapcsold be az email megerősítést, ha szeretnél double-opt-in regisztrációt.

## 5. Storage beállítása (opcionális, de ajánlott)

Ha szeretnél profilképeket/videókat tárolni Supabase Storage-ban:

### 5.1. Bucket-ek létrehozása

1. A Supabase Dashboard bal oldali menüjében kattints a **"Storage"** opcióra
2. Kattints a **"Create bucket"** gombra
3. Hozd létre a következő bucket-eket (mindegyiket külön-külön):

   **a) Avatars bucket:**
   - **Name**: `avatars`
   - **Public bucket**: ✅ **BE** (kapcsold be!)
   - **File size limit**: `5 MB` (vagy hagyd az alapértelmezettet)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`
   - Kattints a **"Create bucket"** gombra

   **b) Photos bucket:**
   - **Name**: `photos`
   - **Public bucket**: ✅ **BE** (kapcsold be!)
   - **File size limit**: `10 MB` (vagy hagyd az alapértelmezettet)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`
   - Kattints a **"Create bucket"** gombra

   **c) Videos bucket (opcionális):**
   - **Name**: `videos`
   - **Public bucket**: ✅ **BE** (kapcsold be!)
   - **File size limit**: `50 MB` (vagy hagyd az alapértelmezettet)
   - **Allowed MIME types**: `video/mp4, video/quicktime`
   - Kattints a **"Create bucket"** gombra

### 5.2. Storage Policy-k beállítása

1. Minden bucket esetében kattints a bucket nevére
2. Kattints a **"Policies"** fülre
3. Kattints a **"New Policy"** gombra
4. Válaszd a **"For full customization"** opciót
5. Másold be az alábbi SQL-t (cseréld le a `bucket_name`-t a megfelelő bucket nevére):

```sql
-- Olvasás: Mindenki láthatja a publikus fájlokat
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'bucket_name' );

-- Feltöltés: Csak bejelentkezett felhasználók tölthetnek fel
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'bucket_name' AND auth.role() = 'authenticated' );

-- Törlés: Csak a saját fájljaikat törölhetik
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING ( bucket_id = 'bucket_name' AND auth.uid()::text = (storage.foldername(name))[1] );
```

6. Cseréld le a `bucket_name`-t a megfelelő bucket nevére (`avatars`, `photos`, `videos`)
7. Kattints a **"Review"** majd a **"Save policy"** gombra
8. Ismételd meg minden bucket esetében

### 5.3. Tesztelés

1. Nyisd meg az alkalmazást
2. Menj a **Profil** fülre
3. Kattints a **"Fotó hozzáadása"** gombra
4. Válassz egy képet
5. A képnek feltöltődnie kell a Supabase Storage-ba
6. A Supabase Dashboard → **Storage** menüben ellenőrizd, hogy megjelent-e a fájl

## 6. Ellenőrzés

1. Futtasd lokálisan az appot (`npm start`), majd regisztrálj egy új felhasználót. A Supabase Auth → Users lapon megjelenik.
2. Email/jelszó párossal jelentkezz be. A `profiles` táblában automatikusan létrejön a hozzá tartozó sor.
3. A GitHub Pages-en hostolt privacy/terms linkeket add meg a Play Console mezőiben.

Ezzel az alkalmazás valódi, felhőalapú adatbázist és regisztrációs folyamatot kap – teljesen ingyenes szintig. Ha később további táblákra (matchek, üzenetek) van szükség, bővítsd a `supabase` könyvtár SQL-jét.


