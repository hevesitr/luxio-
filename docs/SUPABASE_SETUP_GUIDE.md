# 🚀 Supabase Setup Útmutató - Lépésről Lépésre

**Időigény:** ~15 perc  
**Nehézség:** Könnyű  
**Előfeltétel:** Supabase fiók

---

## 📋 Tartalomjegyzék

1. [SQL Séma Futtatása](#1-sql-séma-futtatása)
2. [Storage Bucket-ek Létrehozása](#2-storage-bucket-ek-létrehozása)
3. [Realtime Engedélyezése](#3-realtime-engedélyezése)
4. [Ellenőrzés](#4-ellenőrzés)
5. [Hibaelhárítás](#5-hibaelhárítás)

---

## 1. SQL Séma Futtatása

### 1.1 Nyisd meg a Supabase Dashboard-ot

1. Menj a böngészőben: **https://supabase.com**
2. Jelentkezz be a fiókodba
3. Válaszd ki a projektedet: **xgvubkbfhleeagdvkhds**

### 1.2 SQL Editor Megnyitása

1. Bal oldali menüben kattints: **SQL Editor**
2. Kattints a zöld **New query** gombra

### 1.3 SQL Kód Beillesztése

1. Nyisd meg a projekt mappájában: `supabase/schema_extended.sql`
2. Másold ki a **teljes tartalmat** (Ctrl+A, Ctrl+C)
3. Illeszd be a Supabase SQL Editor-ba (Ctrl+V)

### 1.4 SQL Futtatása

1. Kattints a **Run** gombra (vagy nyomd meg: Ctrl+Enter)
2. Várj, amíg lefut (~5-10 másodperc)
3. Ellenőrizd az eredményt:
   - ✅ **Zöld pipa** = Sikeres
   - ❌ **Piros X** = Hiba (lásd: Hibaelhárítás)

### 1.5 Táblák Ellenőrzése

1. Bal oldali menüben kattints: **Table Editor**
2. Ellenőrizd, hogy létrejöttek-e ezek a táblák:
   - ✅ `profiles`
   - ✅ `matches`
   - ✅ `likes`
   - ✅ `passes`
   - ✅ `messages`

---

## 2. Storage Bucket-ek Létrehozása

### 2.1 Storage Menü Megnyitása

1. Bal oldali menüben kattints: **Storage**
2. Kattints a **Create a new bucket** gombra

### 2.2 Bucket-ek Létrehozása (5 db)

Hozd létre **egyesével** az alábbi bucket-eket:

#### Bucket 1: avatars
1. **Name:** `avatars`
2. **Public bucket:** ✅ BE (kapcsold be!)
3. Kattints: **Create bucket**

#### Bucket 2: photos
1. **Name:** `photos`
2. **Public bucket:** ✅ BE
3. Kattints: **Create bucket**

#### Bucket 3: videos
1. **Name:** `videos`
2. **Public bucket:** ✅ BE
3. Kattints: **Create bucket**

#### Bucket 4: voice-messages
1. **Name:** `voice-messages`
2. **Public bucket:** ✅ BE
3. Kattints: **Create bucket**

#### Bucket 5: video-messages
1. **Name:** `video-messages`
2. **Public bucket:** ✅ BE
3. Kattints: **Create bucket**

### 2.3 Ellenőrzés

A Storage oldalon látnod kell mind az 5 bucket-et:
- ✅ avatars (public)
- ✅ photos (public)
- ✅ videos (public)
- ✅ voice-messages (public)
- ✅ video-messages (public)

---

## 3. Realtime Engedélyezése

### 3.1 Database Replication Megnyitása

1. Bal oldali menüben kattints: **Database**
2. Felül válaszd ki a **Replication** tab-ot

### 3.2 Messages Tábla Realtime Engedélyezése

1. Keresd meg a listában: **messages**
2. Kapcsold BE a mellette lévő kapcsolót (toggle)
3. Várj, amíg zöldre vált (~2-3 másodperc)

### 3.3 Ellenőrzés

A **messages** tábla mellett látható kapcsoló:
- ✅ **Zöld** = Realtime engedélyezve
- ❌ **Szürke** = Nincs engedélyezve

---

## 4. Ellenőrzés

### 4.1 Gyors Ellenőrző Lista

Menj végig ezen a listán:

- [ ] **SQL Séma**: 5 tábla létrejött (profiles, matches, likes, passes, messages)
- [ ] **Storage**: 5 bucket létrejött (avatars, photos, videos, voice-messages, video-messages)
- [ ] **Realtime**: messages tábla realtime engedélyezve
- [ ] **Környezeti változók**: .env fájl tartalmazza a SUPABASE_URL és SUPABASE_ANON_KEY-t

### 4.2 Tesztelés az Alkalmazásban

Most már tesztelheted az appot:

```bash
# Indítsd újra az appot
npm run reset
```

Próbáld ki:
1. **Profil frissítés**: Menj a Profil tab-ra → Szerkesztés → Mentés
2. **Swipe right**: Felfedezés tab → Swipe right egy profilon
3. **Üzenet küldés**: Matchek tab → Nyiss meg egy chat-et → Küldj üzenetet

---

## 5. Hibaelhárítás

### Probléma 1: SQL Hiba - "relation already exists"

**Ok:** A táblák már léteznek.

**Megoldás:**
1. Töröld a meglévő táblákat:
   ```sql
   DROP TABLE IF EXISTS messages CASCADE;
   DROP TABLE IF EXISTS passes CASCADE;
   DROP TABLE IF EXISTS likes CASCADE;
   DROP TABLE IF EXISTS matches CASCADE;
   -- NE töröld a profiles táblát, ha már van benne adat!
   ```
2. Futtasd újra a schema_extended.sql-t

### Probléma 2: "Public bucket" opció nem látható

**Ok:** Régebbi Supabase verzió.

**Megoldás:**
1. Hozd létre a bucket-et először
2. Kattints rá a listában
3. Menj a **Settings** tab-ra
4. Kapcsold BE a **Public bucket** opciót

### Probléma 3: Realtime nem működik

**Ok:** A realtime nem engedélyezett vagy a kapcsolat megszakadt.

**Megoldás:**
1. Ellenőrizd, hogy a messages tábla realtime kapcsolója BE van-e
2. Indítsd újra az appot
3. Ellenőrizd a konzolban, hogy nincs-e hiba

### Probléma 4: "Not authenticated" hiba

**Ok:** Nincs bejelentkezve a felhasználó.

**Megoldás:**
1. Ellenőrizd, hogy a Supabase Auth be van-e állítva
2. Jelentkezz be az appban
3. Ellenőrizd a .env fájlban a SUPABASE_ANON_KEY-t

### Probléma 5: Fotó feltöltés nem működik

**Ok:** A bucket nem publikus vagy nincs létrehozva.

**Megoldás:**
1. Ellenőrizd, hogy az `avatars` és `photos` bucket-ek léteznek
2. Ellenőrizd, hogy **Public bucket** BE van kapcsolva
3. Próbáld újra a feltöltést

---

## 📊 Státusz Ellenőrzés

Használd ezt a checklist-et:

```
✅ Supabase projekt létezik
✅ SQL séma futott
✅ 5 tábla létrejött
✅ 5 storage bucket létrejött
✅ Realtime engedélyezve a messages táblán
✅ .env fájl tartalmazza a credentials-t
✅ App újraindítva
✅ Profil frissítés működik
✅ Swipe right működik
✅ Üzenet küldés működik
```

---

## 🎉 Kész!

Ha minden ✅, akkor a Supabase integráció **teljesen működik**!

Most már:
- 💾 Minden adat a felhőben tárolódik
- 🔄 Real-time üzenetek működnek
- 📱 Több eszközről is elérhető az adat
- 🔒 Biztonságos RLS policy-k védik az adatokat

---

## 📞 Segítség

Ha elakadtál:
1. Nézd meg a **SUPABASE_INTEGRATION_COMPLETE.md** fájlt
2. Ellenőrizd a konzol hibákat
3. Nézd meg a Supabase Dashboard → Logs menüt

**Készítette:** Kiro AI  
**Verzió:** 1.0.0  
**Dátum:** 2025-12-03
