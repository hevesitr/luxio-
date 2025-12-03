# Storage Bucket Beállítási Útmutató

## Áttekintés

Ez az útmutató végigvezet a Supabase Storage bucket-ek létrehozásán, amelyek szükségesek a Luxio dating app média fájljainak tárolásához.

## Szükséges Bucket-ek

| Bucket Név | Típus | Leírás | Fájl Méret Limit |
|------------|-------|--------|------------------|
| `avatars` | Public | Felhasználói profilképek | 10 MB |
| `photos` | Public | Profil fotók (galéria) | 10 MB |
| `videos` | Public | Profil videók | 50 MB |
| `voice-messages` | Private | Hang üzenetek | 5 MB |
| `video-messages` | Private | Videó üzenetek | 50 MB |

## Lépésről Lépésre Útmutató

### 1. Nyisd meg a Supabase Dashboard-ot

1. Menj a [Supabase Dashboard](https://app.supabase.com)-ra
2. Jelentkezz be a fiókodba
3. Válaszd ki a projektedet: `xgvubkbfhleeagdvkhds`

### 2. Navigálj a Storage menübe

1. A bal oldali menüben kattints a **Storage** gombra
2. Kattints a **Create a new bucket** gombra

### 3. Hozd létre az `avatars` bucket-et

1. **Name**: `avatars`
2. **Public bucket**: ✅ Bekapcsolva (mert a profilképeket nyilvánosan elérhetővé kell tenni)
3. **File size limit**: `10485760` (10 MB)
4. **Allowed MIME types**: `image/jpeg, image/png, image/webp`
5. Kattints a **Create bucket** gombra

### 4. Hozd létre a `photos` bucket-et

1. **Name**: `photos`
2. **Public bucket**: ✅ Bekapcsolva
3. **File size limit**: `10485760` (10 MB)
4. **Allowed MIME types**: `image/jpeg, image/png, image/webp`
5. Kattints a **Create bucket** gombra

### 5. Hozd létre a `videos` bucket-et

1. **Name**: `videos`
2. **Public bucket**: ✅ Bekapcsolva
3. **File size limit**: `52428800` (50 MB)
4. **Allowed MIME types**: `video/mp4, video/quicktime, video/x-msvideo`
5. Kattints a **Create bucket** gombra

### 6. Hozd létre a `voice-messages` bucket-et

1. **Name**: `voice-messages`
2. **Public bucket**: ❌ Kikapcsolva (privát üzenetek)
3. **File size limit**: `5242880` (5 MB)
4. **Allowed MIME types**: `audio/mpeg, audio/mp4, audio/x-m4a`
5. Kattints a **Create bucket** gombra

### 7. Hozd létre a `video-messages` bucket-et

1. **Name**: `video-messages`
2. **Public bucket**: ❌ Kikapcsolva (privát üzenetek)
3. **File size limit**: `52428800` (50 MB)
4. **Allowed MIME types**: `video/mp4, video/quicktime`
5. Kattints a **Create bucket** gombra

## Storage Policies Beállítása

Miután létrehoztad a bucket-eket, be kell állítanod a hozzáférési szabályokat (RLS policies).

### Public Bucket-ek (avatars, photos, videos)

Minden public bucket-hez add hozzá ezeket a policy-kat:

#### 1. SELECT Policy (Olvasás)

```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars'); -- vagy 'photos', 'videos'
```

#### 2. INSERT Policy (Feltöltés)

```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND -- vagy 'photos', 'videos'
  auth.role() = 'authenticated'
);
```

#### 3. UPDATE Policy (Frissítés)

```sql
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND -- vagy 'photos', 'videos'
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars' AND -- vagy 'photos', 'videos'
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### 4. DELETE Policy (Törlés)

```sql
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND -- vagy 'photos', 'videos'
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Private Bucket-ek (voice-messages, video-messages)

#### 1. SELECT Policy (Olvasás)

```sql
CREATE POLICY "Users can read own messages"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'voice-messages' AND -- vagy 'video-messages'
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### 2. INSERT Policy (Feltöltés)

```sql
CREATE POLICY "Users can upload own messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-messages' AND -- vagy 'video-messages'
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### 3. DELETE Policy (Törlés)

```sql
CREATE POLICY "Users can delete own messages"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice-messages' AND -- vagy 'video-messages'
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Ellenőrzés

Miután létrehoztad az összes bucket-et, futtasd le ezt a parancsot az ellenőrzéshez:

```bash
node scripts/test-supabase-connection.js
```

Ha minden rendben van, akkor ezt kell látnod:

```
4️⃣  Storage bucket-ek ellenőrzése...
✅ Bucket OK: avatars
✅ Bucket OK: photos
✅ Bucket OK: videos
✅ Bucket OK: voice-messages
✅ Bucket OK: video-messages
```

## Hibaelhárítás

### "Bucket already exists" hiba

Ha már létrehoztad a bucket-et, akkor ez normális. Folytasd a következő bucket-tel.

### "Insufficient privileges" hiba

Ez azt jelenti, hogy az ANON kulccsal nem lehet bucket-et létrehozni. Használd a Supabase Dashboard-ot a manuális létrehozáshoz.

### "RLS policy violation" hiba

Ellenőrizd, hogy beállítottad-e a megfelelő RLS policy-kat a bucket-ekhez.

## Következő Lépések

Miután létrehoztad az összes bucket-et:

1. ✅ Futtasd le a tesztet: `node scripts/test-supabase-connection.js`
2. ✅ Engedélyezd a Realtime-ot a `messages` táblához
3. ✅ Teszteld a fájl feltöltést az alkalmazásban

## Hasznos Linkek

- [Supabase Storage Dokumentáció](https://supabase.com/docs/guides/storage)
- [Storage RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [File Upload Best Practices](https://supabase.com/docs/guides/storage/uploads)
