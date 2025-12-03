# 🚀 Supabase Manual Setup - Végső Útmutató

## ⚡ Gyors Áttekintés

Ez az útmutató végigvezet a Supabase manuális beállításán, amely szükséges az alkalmazás teljes működéséhez.

**Időigény:** ~15 perc  
**Előfeltétel:** Supabase projekt létrehozva

---

## 📋 LÉPÉSEK

### 1. Storage Buckets Létrehozása (5 perc)

#### Navigálás
1. Nyisd meg: https://supabase.com/dashboard
2. Válaszd ki a projektedet
3. Bal oldali menü → **Storage**

#### Buckets Létrehozása

Hozd létre az alábbi 5 bucket-et:

| Bucket Név | Public | Fájl Méret Limit | Megengedett Típusok |
|------------|--------|------------------|---------------------|
| `avatars` | ✅ Yes | 5 MB | image/jpeg, image/png |
| `photos` | ✅ Yes | 5 MB | image/jpeg, image/png |
| `videos` | ✅ Yes | 50 MB | video/mp4 |
| `voice-messages` | ✅ Yes | 10 MB | audio/mpeg, audio/wav |
| `video-messages` | ✅ Yes | 50 MB | video/mp4 |

#### Lépések Minden Bucket-hez:
1. Kattints a **"New bucket"** gombra
2. Add meg a bucket nevét (pl. `avatars`)
3. Jelöld be a **"Public bucket"** opciót
4. Kattints a **"Create bucket"** gombra
5. Ismételd meg az összes bucket-tel

#### Ellenőrzés
```bash
# Ellenőrizd, hogy mind az 5 bucket létrejött:
- avatars ✅
- photos ✅
- videos ✅
- voice-messages ✅
- video-messages ✅
```

---

### 2. Storage Policies Alkalmazása (3 perc)

#### Navigálás
1. Supabase Dashboard → **Storage**
2. Válaszd ki az első bucket-et (`avatars`)
3. Kattints a **"Policies"** fülre

#### Policies Létrehozása

**Minden bucket-hez** (avatars, photos, videos, voice-messages, video-messages):

##### Policy 1: Public Read Access
```sql
-- Policy Name: Public read access
-- Operation: SELECT
-- Policy Definition:
true
```

##### Policy 2: Authenticated Upload
```sql
-- Policy Name: Authenticated users can upload
-- Operation: INSERT
-- Policy Definition:
auth.role() = 'authenticated'
```

##### Policy 3: Owner Update
```sql
-- Policy Name: Users can update own files
-- Operation: UPDATE
-- Policy Definition:
auth.uid()::text = (storage.foldername(name))[1]
```

##### Policy 4: Owner Delete
```sql
-- Policy Name: Users can delete own files
-- Operation: DELETE
-- Policy Definition:
auth.uid()::text = (storage.foldername(name))[1]
```

#### Gyorsabb Módszer - SQL Editor
Vagy használd az SQL Editor-t és futtasd le a `supabase/storage-policies-clean.sql` fájlt:

1. Supabase Dashboard → **SQL Editor**
2. Kattints **"New query"**
3. Másold be a `supabase/storage-policies-clean.sql` tartalmát
4. Kattints **"Run"**

---

### 3. Realtime Engedélyezése (2 perc)

#### Navigálás
1. Supabase Dashboard → **Database**
2. Bal oldali menü → **Replication**

#### Táblák Engedélyezése

Engedélyezd a realtime-ot az alábbi táblákhoz:

| Tábla | Realtime | Miért Szükséges |
|-------|----------|-----------------|
| `messages` | ✅ Enable | Real-time chat |
| `matches` | ✅ Enable | Instant match notifications |
| `notifications` | ✅ Enable | Push notifications |

#### Lépések:
1. Keresd meg a táblát a listában
2. Kattints a kapcsolóra a **"Realtime"** oszlopban
3. Várj, amíg zöldre vált
4. Ismételd meg mindhárom táblával

#### Alternatív Módszer - SQL
Vagy futtasd le az SQL-t:

```sql
-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for matches
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

---

### 4. RLS Policies Alkalmazása (5 perc)

#### Navigálás
1. Supabase Dashboard → **SQL Editor**
2. Kattints **"New query"**

#### RLS Policies Futtatása

##### Opció A: Teljes RLS (Ajánlott)
```sql
-- Másold be és futtasd: supabase/rls-policies.sql
```

Ez létrehozza az összes RLS policy-t minden táblához.

##### Opció B: Lépésenkénti RLS (Ha problémák vannak)

**1. lépés - Profiles:**
```sql
-- Futtasd: supabase/rls-policies-step1-profiles.sql
```

**2. lépés - Matches:**
```sql
-- Futtasd: supabase/rls-policies-step2-matches-FIXED.sql
```

**3. lépés - Messages:**
```sql
-- Futtasd: supabase/rls-policies-step3-messages-FIXED.sql
```

**4. lépés - Likes & Passes:**
```sql
-- Futtasd: supabase/rls-policies-step4-likes-passes-FIXED.sql
```

#### Ellenőrzés

Futtasd le ezt az SQL-t az ellenőrzéshez:

```sql
-- Ellenőrizd, hogy RLS engedélyezve van-e
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Minden táblánál rowsecurity = true kell legyen
```

---

## ✅ ELLENŐRZŐ LISTA

### Storage
- [ ] `avatars` bucket létrehozva és public
- [ ] `photos` bucket létrehozva és public
- [ ] `videos` bucket létrehozva és public
- [ ] `voice-messages` bucket létrehozva és public
- [ ] `video-messages` bucket létrehozva és public
- [ ] Storage policies alkalmazva minden bucket-re

### Realtime
- [ ] `messages` tábla realtime engedélyezve
- [ ] `matches` tábla realtime engedélyezve
- [ ] `notifications` tábla realtime engedélyezve

### RLS Policies
- [ ] `profiles` tábla RLS engedélyezve
- [ ] `matches` tábla RLS engedélyezve
- [ ] `messages` tábla RLS engedélyezve
- [ ] `likes` tábla RLS engedélyezve
- [ ] `passes` tábla RLS engedélyezve
- [ ] `blocks` tábla RLS engedélyezve (ha létezik)
- [ ] `reports` tábla RLS engedélyezve (ha létezik)
- [ ] `notifications` tábla RLS engedélyezve

---

## 🧪 TESZTELÉS

### 1. Storage Teszt

```javascript
// Próbálj meg feltölteni egy képet
import { supabase } from './src/services/supabaseClient';

const testUpload = async () => {
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload('test/test.jpg', file);
  
  console.log('Upload result:', { data, error });
};
```

### 2. Realtime Teszt

```javascript
// Iratkozz fel az üzenetekre
const channel = supabase
  .channel('messages')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => console.log('New message:', payload)
  )
  .subscribe();
```

### 3. RLS Teszt

```javascript
// Próbálj meg lekérni egy másik user profilját
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', 'other-user-id')
  .single();

// Ha RLS működik, error-t kell kapnod vagy üres data-t
console.log('RLS test:', { data, error });
```

---

## 🐛 HIBAELHÁRÍTÁS

### "Storage bucket not found"
- Ellenőrizd, hogy a bucket neve pontosan egyezik
- Ellenőrizd, hogy a bucket public-e

### "Row level security policy violation"
- Ellenőrizd, hogy a user be van-e jelentkezve
- Ellenőrizd, hogy az RLS policies futottak-e
- Nézd meg a Supabase logs-ot

### "Realtime not working"
- Ellenőrizd, hogy a tábla realtime engedélyezve van-e
- Ellenőrizd a subscription kódot
- Nézd meg a browser console-t

### "Permission denied"
- Ellenőrizd az RLS policies-t
- Ellenőrizd a user authentication-t
- Nézd meg a Supabase Auth logs-ot

---

## 📚 TOVÁBBI INFORMÁCIÓK

### Dokumentáció
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)

### Kapcsolódó Fájlok
- `supabase/storage-policies-clean.sql` - Storage policies
- `supabase/rls-policies.sql` - Teljes RLS policies
- `supabase/enable-realtime.sql` - Realtime setup
- `MANUAL_SUPABASE_SETUP.md` - Részletes útmutató

---

## ✨ KÉSZ!

Ha minden lépést elvégeztél, az alkalmazás most már teljesen működőképes:

- ✅ Storage működik (képek, videók feltöltése)
- ✅ Realtime működik (instant üzenetek, match-ek)
- ✅ RLS működik (biztonságos adathozzáférés)

**Következő lépés:** Indítsd el az alkalmazást és teszteld!

```bash
npm start
```

---

**Készítette:** Kiro AI  
**Dátum:** 2025. December 3.  
**Verzió:** 1.0 - Final

