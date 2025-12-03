# Manuális Beállítások - Supabase Dashboard

## ⚠️ FONTOS: Ezeket a lépéseket manuálisan kell elvégezni a Supabase Dashboard-on!

Az alábbi beállításokat nem lehet automatizálni, mert admin jogosultságokat igényelnek. Kérlek, kövesd ezeket a lépéseket a Supabase Dashboard-on keresztül.

---

## 📦 1. Storage Bucket-ek Létrehozása

### Lépések:

1. Nyisd meg: https://app.supabase.com/project/xgvubkbfhleeagdvkhds/storage/buckets
2. Kattints a **"New bucket"** gombra
3. Hozd létre az alábbi bucket-eket:

| Bucket Név | Public | File Size Limit | MIME Types |
|------------|--------|-----------------|------------|
| `avatars` | ✅ Yes | 10 MB | image/jpeg, image/png, image/webp |
| `photos` | ✅ Yes | 10 MB | image/jpeg, image/png, image/webp |
| `videos` | ✅ Yes | 50 MB | video/mp4, video/quicktime |
| `voice-messages` | ❌ No | 5 MB | audio/mpeg, audio/mp4, audio/x-m4a |
| `video-messages` | ❌ No | 50 MB | video/mp4, video/quicktime |

### Részletes útmutató:

Lásd: `STORAGE_SETUP_GUIDE.md`

---

## 🔒 2. Storage Policies Beállítása

### Lépések:

1. Nyisd meg: https://app.supabase.com/project/xgvubkbfhleeagdvkhds/sql/new
2. Másold be a `supabase/storage-policies.sql` fájl tartalmát
3. Kattints a **"Run"** gombra

Ez létrehozza az összes szükséges RLS policy-t a storage bucket-ekhez.

---

## 🔴 3. Realtime Engedélyezése a Messages Táblához

### Lépések:

1. Nyisd meg: https://app.supabase.com/project/xgvubkbfhleeagdvkhds/database/replication
2. Keresd meg a **`messages`** táblát
3. Kapcsold be a **"Realtime"** kapcsolót
4. Kattints a **"Save"** gombra

### Vagy SQL-lel:

```sql
-- Realtime engedélyezése a messages táblához
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

---

## ✅ 4. Ellenőrzés

Miután elvégezted az összes lépést, futtasd le ezt a parancsot:

```bash
node scripts/test-supabase-connection.js
```

### Várt eredmény:

```
✅ Sikeres tesztek: 12
❌ Sikertelen tesztek: 0
📈 Sikerességi arány: 100%
```

---

## 📋 Checklist

- [ ] **Storage Bucket-ek létrehozva**
  - [ ] avatars
  - [ ] photos
  - [ ] videos
  - [ ] voice-messages
  - [ ] video-messages

- [ ] **Storage Policies beállítva**
  - [ ] storage-policies.sql futtatva

- [ ] **Realtime engedélyezve**
  - [ ] messages tábla realtime bekapcsolva

- [ ] **Tesztek futtatva**
  - [ ] test-supabase-connection.js sikeres

---

## 🆘 Hibaelhárítás

### "Bucket already exists" hiba

Ez normális, ha már létrehoztad a bucket-et. Folytasd a következő lépéssel.

### "Insufficient privileges" hiba

Az ANON kulccsal nem lehet admin műveleteket végezni. Használd a Supabase Dashboard-ot.

### "RLS policy violation" hiba

Ellenőrizd, hogy futtattad-e a `storage-policies.sql` scriptet.

### Realtime nem működik

1. Ellenőrizd, hogy engedélyezted-e a Realtime-ot a messages táblához
2. Ellenőrizd, hogy a `enable-realtime.sql` script futott-e
3. Próbáld újraindítani az alkalmazást

---

## 📞 Segítség

Ha bármilyen problémába ütközöl, nézd meg ezeket a dokumentumokat:

- `STORAGE_SETUP_GUIDE.md` - Részletes storage beállítási útmutató
- `REALTIME_SETUP.md` - Realtime beállítási útmutató
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)

---

## 🎯 Következő Lépések

Miután elvégezted ezeket a manuális beállításokat:

1. ✅ Futtasd le a teszteket
2. ✅ Indítsd el az alkalmazást
3. ✅ Teszteld a profil fotó feltöltést
4. ✅ Teszteld az üzenetküldést
5. ✅ Teszteld a real-time üzeneteket

**Sikeres beállítás után az alkalmazás teljesen működőképes lesz! 🚀**
