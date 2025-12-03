# 🔧 Supabase Storage Hibaelhárítás

## ❌ Hiba: "Failed to load resource" vagy "Image load error"

Ha a kép feltöltése sikeres, de a kép nem jelenik meg, akkor valószínűleg a Storage beállításokkal van probléma.

### 1. Ellenőrizd, hogy a bucket PUBLIC-e

1. Menj a Supabase Dashboard-ra
2. Kattints a **"Storage"** menüpontra
3. Kattints a **"photos"** bucket nevére
4. Ellenőrizd a **"Public bucket"** beállítást:
   - ✅ **BE kell legyen kapcsolva!**
   - Ha nincs bekapcsolva, kattints a **"Edit bucket"** gombra
   - Kapcsold be a **"Public bucket"** opciót
   - Mentsd el

### 2. Ellenőrizd a Policy-kat

1. A bucket oldalán kattints a **"Policies"** fülre
2. Ellenőrizd, hogy van-e **"Public Access"** policy a **SELECT** művelethez
3. Ha nincs, hozd létre:

```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'photos' );
```

### 3. Ellenőrizd, hogy a fájl létezik-e

1. A bucket oldalán kattints a **"Files"** fülre
2. Keress rá a feltöltött fájlra (pl. `792777d6-456d-4d84-8fe0-51b96ea052b9/photo_3_...`)
3. Ha nem látod a fájlt, akkor a feltöltés nem volt sikeres
4. Ha látod a fájlt, kattints rá és másold ki a **"Public URL"**-t
5. Nyisd meg ezt az URL-t egy böngészőben
6. Ha a böngészőben sem töltődik be, akkor a bucket nincs public módon beállítva

### 4. Teszteld a URL-t

1. Másold ki a feltöltött kép URL-jét a konzolból
2. Nyisd meg egy böngészőben (pl. Chrome)
3. Ha a böngészőben sem töltődik be, akkor:
   - A bucket nincs public módon beállítva
   - Vagy a policy-k nem megfelelőek

### 5. Gyors javítás

Ha minden rendben van, de még mindig nem működik:

1. **Töröld a bucket-et** (ha nincs benne fontos adat)
2. **Hozd létre újra** public módon
3. **Állítsd be a policy-kat** újra
4. **Próbáld meg újra a feltöltést**

## ✅ Ellenőrző lista

- [ ] A bucket **public** módon van beállítva
- [ ] Van **"Public Access"** policy a SELECT művelethez
- [ ] A fájl létezik a Storage-ban
- [ ] A fájl URL-je elérhető böngészőben
- [ ] A policy-k helyesen vannak beállítva minden művelethez (SELECT, INSERT, DELETE)

## 📞 További segítség

Ha még mindig nem működik:
1. Nézd meg a Supabase Dashboard → Storage → photos bucket → Files menüben, hogy a fájl létezik-e
2. Ellenőrizd a konzol logokat az alkalmazásban
3. Próbáld meg a fájl URL-jét közvetlenül egy böngészőben megnyitni

