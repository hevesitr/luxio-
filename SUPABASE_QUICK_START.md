# 🚀 Supabase Integráció - Gyors Kezdés

**5 perces útmutató a Supabase integráció befejezéséhez**

---

## ✅ Mi van már kész?

- ✅ Backend service-ek (ProfileService, MatchService, MessageService)
- ✅ Screen integrációk (HomeScreen, ChatScreen, ProfileScreen, MatchesScreen)
- ✅ Database schema
- ✅ Real-time üzenetküldés
- ✅ Offline támogatás

**Automatizált rész:** 100% kész! 🎉

---

## ⚠️ Mit kell még megcsinálni?

**3 egyszerű lépés, összesen ~10 perc:**

### 1️⃣ Storage Bucket-ek Létrehozása (~5 perc)

1. Nyisd meg: https://app.supabase.com/project/xgvubkbfhleeagdvkhds/storage/buckets
2. Kattints: **"New bucket"**
3. Hozd létre ezeket:

| Név | Public | Limit |
|-----|--------|-------|
| `avatars` | ✅ Yes | 10 MB |
| `photos` | ✅ Yes | 10 MB |
| `videos` | ✅ Yes | 50 MB |
| `voice-messages` | ❌ No | 5 MB |
| `video-messages` | ❌ No | 50 MB |

### 2️⃣ Storage Policies Beállítása (~2 perc)

1. Nyisd meg: https://app.supabase.com/project/xgvubkbfhleeagdvkhds/sql/new
2. Másold be a `supabase/storage-policies.sql` fájl tartalmát
3. Kattints: **"Run"**

### 3️⃣ Realtime Engedélyezése (~1 perc)

1. Nyisd meg: https://app.supabase.com/project/xgvubkbfhleeagdvkhds/database/replication
2. Keresd meg a **`messages`** táblát
3. Kapcsold be a **"Realtime"** kapcsolót

---

## ✅ Ellenőrzés

Futtasd le ezt a parancsot:

```bash
node scripts/test-supabase-connection.js
```

**Várt eredmény:**
```
✅ Sikeres tesztek: 12
❌ Sikertelen tesztek: 0
📈 Sikerességi arány: 100%
```

---

## 🎉 Kész!

Ha minden teszt sikeres, akkor az alkalmazás teljesen működőképes!

```bash
# Indítsd el az alkalmazást
npm start
```

**Teszteld ezeket:**
- [ ] Profil szerkesztése
- [ ] Fotó feltöltés
- [ ] Swipe (like/pass)
- [ ] Match létrehozása
- [ ] Üzenet küldése
- [ ] Real-time üzenetek

---

## 📚 Részletes Dokumentáció

Ha többet szeretnél tudni:

- **Gyors áttekintés:** `FINAL_IMPLEMENTATION_SUMMARY.md`
- **Manuális lépések:** `MANUAL_SETUP_REQUIRED.md`
- **Storage útmutató:** `STORAGE_SETUP_GUIDE.md`
- **Implementáció részletei:** `IMPLEMENTATION_COMPLETE_DEC03.md`

---

## 🆘 Problémák?

### "Bucket not found" hiba
→ Hozd létre a bucket-eket (1️⃣ lépés)

### "RLS policy violation" hiba
→ Futtasd le a storage-policies.sql scriptet (2️⃣ lépés)

### Real-time nem működik
→ Kapcsold be a Realtime-ot (3️⃣ lépés)

---

**Sok sikert! 🚀**
