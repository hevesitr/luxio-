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

## 5. Storage (opcionális)

Ha szeretnél profilképeket/videókat tárolni:

1. **Storage → Create bucket** (pl. `avatars`), hagyd “public” módon.
2. A jövőben a React Native klienst a bucket URL-jével frissítheted (nem része ennek a commitnak).

## 6. Ellenőrzés

1. Futtasd lokálisan az appot (`npm start`), majd regisztrálj egy új felhasználót. A Supabase Auth → Users lapon megjelenik.
2. Email/jelszó párossal jelentkezz be. A `profiles` táblában automatikusan létrejön a hozzá tartozó sor.
3. A GitHub Pages-en hostolt privacy/terms linkeket add meg a Play Console mezőiben.

Ezzel az alkalmazás valódi, felhőalapú adatbázist és regisztrációs folyamatot kap – teljesen ingyenes szintig. Ha később további táblákra (matchek, üzenetek) van szükség, bővítsd a `supabase` könyvtár SQL-jét.


