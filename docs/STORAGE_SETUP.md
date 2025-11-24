# 📦 Supabase Storage Beállítási Útmutató

Ez az útmutató részletesen bemutatja, hogyan állítsd be a Supabase Storage-ot a Luxio alkalmazáshoz.

## 🎯 Mi a Storage?

A Supabase Storage lehetővé teszi, hogy fájlokat (képeket, videókat) tárolj a felhőben. A Luxio alkalmazás ezt használja:
- **Profilképek** (avatars) tárolásához
- **Profil fotók** tárolásához
- **Videók** tárolásához (jövőbeli funkció)

## 📋 Előfeltételek

- ✅ Supabase projekt létrehozva
- ✅ Bejelentkezve vagy a Supabase Dashboard-ba
- ✅ Az alkalmazásban már működik a regisztráció/bejelentkezés

---

## 🚀 Lépésről Lépésre Beállítás

### 1. LÉPÉS: Storage Menü Megnyitása

1. Menj a Supabase Dashboard-ra
2. A bal oldali menüben kattints a **"Storage"** opcióra
3. Itt látod az összes bucket-et (ha vannak)

---

### 2. LÉPÉS: Avatars Bucket Létrehozása

1. Kattints a **"Create bucket"** gombra
2. Töltsd ki az űrlapot:
   - **Name**: `avatars` (pontosan így, kisbetűvel!)
   - **Public bucket**: ✅ **Kapcsold BE** (ez fontos!)
   - **File size limit**: `5 MB` (vagy hagyd az alapértelmezettet)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp` (vagy hagyd üresen)
3. Kattints a **"Create bucket"** gombra
4. Várj, amíg létrejön

---

### 3. LÉPÉS: Photos Bucket Létrehozása

1. Kattints ismét a **"Create bucket"** gombra
2. Töltsd ki az űrlapot:
   - **Name**: `photos` (pontosan így, kisbetűvel!)
   - **Public bucket**: ✅ **Kapcsold BE** (ez fontos!)
   - **File size limit**: `10 MB` (vagy hagyd az alapértelmezettet)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp` (vagy hagyd üresen)
3. Kattints a **"Create bucket"** gombra
4. Várj, amíg létrejön

---

### 4. LÉPÉS: Videos Bucket Létrehozása (Opcionális)

1. Kattints ismét a **"Create bucket"** gombra
2. Töltsd ki az űrlapot:
   - **Name**: `videos` (pontosan így, kisbetűvel!)
   - **Public bucket**: ✅ **Kapcsold BE** (ez fontos!)
   - **File size limit**: `50 MB` (vagy hagyd az alapértelmezettet)
   - **Allowed MIME types**: `video/mp4, video/quicktime` (vagy hagyd üresen)
3. Kattints a **"Create bucket"** gombra
4. Várj, amíg létrejön

---

### 5. LÉPÉS: Storage Policy-k Beállítása

A policy-k biztosítják, hogy:
- Mindenki láthatja a publikus fájlokat
- Csak bejelentkezett felhasználók tölthetnek fel
- Csak a saját fájljaikat törölhetik

#### Avatars Bucket Policy-k

1. Kattints az **"avatars"** bucket nevére
2. Kattints a **"Policies"** fülre
3. Kattints a **"New Policy"** gombra
4. Válaszd a **"For full customization"** opciót
5. Másold be az alábbi SQL-t:

```sql
-- Olvasás: Mindenki láthatja a publikus fájlokat
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Feltöltés: Csak bejelentkezett felhasználók tölthetnek fel
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Törlés: Csak a saját fájljaikat törölhetik
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );
```

6. Kattints a **"Review"** majd a **"Save policy"** gombra

#### Photos Bucket Policy-k

1. Menj vissza a Storage főoldalra
2. Kattints a **"photos"** bucket nevére
3. Kattints a **"Policies"** fülre
4. Kattints a **"New Policy"** gombra
5. Válaszd a **"For full customization"** opciót
6. Másold be az alábbi SQL-t (cseréld le `avatars`-t `photos`-ra):

```sql
-- Olvasás: Mindenki láthatja a publikus fájlokat
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'photos' );

-- Feltöltés: Csak bejelentkezett felhasználók tölthetnek fel
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'photos' AND auth.role() = 'authenticated' );

-- Törlés: Csak a saját fájljaikat törölhetik
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING ( bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1] );
```

7. Kattints a **"Review"** majd a **"Save policy"** gombra

#### Videos Bucket Policy-k (ha létrehoztad)

1. Menj vissza a Storage főoldalra
2. Kattints a **"videos"** bucket nevére
3. Kattints a **"Policies"** fülre
4. Kattints a **"New Policy"** gombra
5. Válaszd a **"For full customization"** opciót
6. Másold be az alábbi SQL-t (cseréld le `avatars`-t `videos`-ra):

```sql
-- Olvasás: Mindenki láthatja a publikus fájlokat
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'videos' );

-- Feltöltés: Csak bejelentkezett felhasználók tölthetnek fel
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'videos' AND auth.role() = 'authenticated' );

-- Törlés: Csak a saját fájljaikat törölhetik
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING ( bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1] );
```

7. Kattints a **"Review"** majd a **"Save policy"** gombra

---

## ✅ Tesztelés

### 1. Alkalmazásban tesztelés

1. Nyisd meg az alkalmazást a telefonodon
2. Jelentkezz be (ha még nem vagy bejelentkezve)
3. Menj a **Profil** fülre
4. Kattints a **"Fotó hozzáadása"** gombra (vagy a "+" ikonra a fotók mellett)
5. Válassz egy képet a galériából
6. Várj, amíg a feltöltés befejeződik
7. Ha sikeres, megjelenik egy "✅ Siker" üzenet

### 2. Supabase Dashboard ellenőrzése

1. Menj vissza a Supabase Dashboard-ra
2. Kattints a **"Storage"** menüpontra
3. Kattints a **"photos"** bucket nevére
4. Itt látnod kellene a feltöltött képet
5. A fájl neve valami ilyesmi: `[user-id]/[timestamp]_[random].jpg`

---

## ❓ Problémamegoldás

### Hiba: "Bucket not found"
- Ellenőrizd, hogy pontosan `avatars`, `photos`, `videos` néven hoztad-e létre a bucket-eket (kisbetűvel!)
- Győződj meg róla, hogy a bucket-ek **public**-ok

### Hiba: "Permission denied"
- Ellenőrizd, hogy beállítottad-e a policy-kat minden bucket esetében
- Győződj meg róla, hogy be vagy jelentkezve az alkalmazásban

### Hiba: "File too large"
- Növeld meg a bucket **File size limit** értékét
- Vagy válassz egy kisebb képet

### Kép nem töltődik fel
- Ellenőrizd az internetkapcsolatot
- Nézd meg a konzol logokat (ha van hozzáférésed)
- Próbáld újra a feltöltést

---

## 🎉 Kész!

Ha minden lépés sikeres volt, most már:
- ✅ Profilképek és fotók tárolódnak a Supabase Storage-ban
- ✅ A képek publikus URL-en keresztül elérhetők
- ✅ Minden felhasználó csak a saját fájljait módosíthatja

---

## 📚 További Információk

- [Supabase Storage dokumentáció](https://supabase.com/docs/guides/storage)
- [Storage Policy-k](https://supabase.com/docs/guides/storage/security/access-control)

