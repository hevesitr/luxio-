# ⚠️ FONTOS TODO - Supabase Auth Integráció

## 🔴 NE FELEJTSD EL!

Amikor integrálod a Supabase Auth-ot az alkalmazásba, **kötelezően** el kell végezned ezeket a lépéseket:

---

## 1️⃣ Töröld a Teszt Policies-t

A jelenlegi teszt policies **NEM biztonságosak** éles környezetben!

### SQL Script a törléshez:

```sql
-- Futtasd le ezt a Supabase Dashboard → SQL Editor-ban

DROP POLICY IF EXISTS "Test anon upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Test anon upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Test anon upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Test anon upload voice-messages" ON storage.objects;
DROP POLICY IF EXISTS "Test anon upload video-messages" ON storage.objects;
DROP POLICY IF EXISTS "Test anon delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Test anon delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Test anon delete videos" ON storage.objects;
DROP POLICY IF EXISTS "Test anon delete voice-messages" ON storage.objects;
DROP POLICY IF EXISTS "Test anon delete video-messages" ON storage.objects;
```

---

## 2️⃣ Ellenőrizd az Eredeti Policies-t

Az eredeti `storage-policies.sql` fájlban lévő policies már be vannak állítva.
Ezek **biztonságosak**, mert csak authenticated user-ek tölthetnek fel:

```sql
-- Példa az eredeti policy-ra:
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'  -- ← Ez a fontos!
);
```

---

## 3️⃣ Integráld a Supabase Auth-ot

### LoginScreen és RegisterScreen

Frissítsd ezeket a screen-eket, hogy használják a Supabase Auth-ot:

```javascript
// LoginScreen.js
import { supabase } from '../services/supabaseClient';

const handleLogin = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    Alert.alert('Hiba', error.message);
  } else {
    // Sikeres bejelentkezés
    // Navigálj a főoldalra
  }
};
```

```javascript
// RegisterScreen.js
import { supabase } from '../services/supabaseClient';

const handleRegister = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) {
    Alert.alert('Hiba', error.message);
  } else {
    // Sikeres regisztráció
    // Profil létrehozása ProfileService-szel
    await ProfileService.updateProfile(data.user.id, {
      email: email,
      // ... egyéb profil adatok
    });
  }
};
```

---

## 4️⃣ Frissítsd a Service-eket

### ProfileService

Használd az `auth.uid()`-t a `currentUser.id` helyett:

```javascript
// Előtte:
const userId = currentUser.id;

// Utána:
const { data: { user } } = await supabase.auth.getUser();
const userId = user.id;
```

### SupabaseMatchService

Ugyanez:

```javascript
// handleSwipeRight-ban:
const { data: { user } } = await supabase.auth.getUser();
const result = await SupabaseMatchService.saveLike(user.id, profile.id);
```

---

## 5️⃣ Teszteld az Új Policies-t

Miután integrálted az Auth-ot:

1. **Jelentkezz be** az alkalmazásban
2. **Próbálj meg feltölteni** egy profilképet
3. **Ellenőrizd**, hogy működik-e

Ha nem működik, ellenőrizd:
- Az Auth session aktív-e
- A policies helyesen vannak-e beállítva
- A `auth.uid()` megfelelően működik-e

---

## 6️⃣ Töröld ezt a TODO fájlt

Ha minden kész, töröld ezt a fájlt:

```bash
rm TODO_AUTH_INTEGRATION.md
```

---

## 📅 Mikor kell ezt megcsinálni?

**AZONNAL**, amikor elkezded integrálni a Supabase Auth-ot!

**NE FELEJTSD EL!** A teszt policies biztonsági rést jelentenek éles környezetben!

---

## 🆘 Segítség

Ha kérdésed van, nézd meg ezeket a dokumentumokat:
- `SCREEN_INTEGRATION_STATUS.md` - Auth screen-ek állapota
- `supabase/storage-policies.sql` - Eredeti biztonságos policies
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

---

**Készítve:** 2024. december 3.  
**Prioritás:** 🔴 KRITIKUS  
**Állapot:** ⏳ VÁRAKOZIK AUTH INTEGRÁCIÓRA
