# 📋 TODO - Következő Session

**Létrehozva:** 2025. December 3.  
**Státusz:** Várakozik végrehajtásra

---

## ⚠️ MANUÁLIS LÉPÉSEK - Hátralevő Feladatok

Minden automatizálható feladat **ELKÉSZÜLT** ✅  
A következő lépések **MANUÁLIS** beavatkozást igényelnek.

---

## 1️⃣ Supabase Manual Setup

### A) Storage Buckets Létrehozása

**Hol:** Supabase Dashboard → Storage → New Bucket

Hozd létre ezeket a bucket-eket **public** hozzáféréssel:

```
✅ Checklist:
[ ] avatars (public)
[ ] photos (public)
[ ] videos (public)
[ ] voice-messages (public)
[ ] video-messages (public)
```

**Részletes útmutató:** `MANUAL_SUPABASE_SETUP.md` (1. lépés)

---

### B) Realtime Engedélyezés

**Hol:** Supabase Dashboard → Database → Replication

Engedélyezd a realtime-ot ezekre a táblákra:

```
✅ Checklist:
[ ] messages table (KÖTELEZŐ)
[ ] matches table (opcionális)
```

**Részletes útmutató:** `MANUAL_SUPABASE_SETUP.md` (2. lépés)

---

### C) RLS Policies Futtatása

**Hol:** Supabase Dashboard → SQL Editor

Futtasd le ezt a fájlt:

```
✅ Checklist:
[ ] supabase/rls-policies.sql (teljes fájl)
```

**Részletes útmutató:** `MANUAL_SUPABASE_SETUP.md` (3. lépés)

---

## 2️⃣ Komponensek Integrálása

### HomeScreen Refaktorálás

**Fájl:** `src/screens/HomeScreen.js`

**Mit kell csinálni:**
1. Importáld a discovery komponenseket
2. Cseréld le a régi JSX-et az új komponensekre
3. Teszteld, hogy minden működik

```
✅ Checklist:
[ ] FilterBar integráció
[ ] ActionButtons integráció
[ ] StoryBar integráció
[ ] AISearchModal integráció
[ ] SugarDatingModal integráció
[ ] EmptyState integráció
[ ] Tesztelés
```

**Részletes útmutató:** `HOMESCREEN_REFACTORING_GUIDE.md`

---

## 3️⃣ Hooks Használata (Opcionális)

### React Query Hooks Integrálása

**Fájlok:** Különböző screen-ek

**Mit kell csinálni:**
1. Cseréld le a useState/useEffect kombinációkat
2. Használd a custom hooks-okat
3. Élvezd az automatikus cache-t!

```
✅ Checklist:
[ ] useDiscoveryProfiles használata HomeScreen-ben
[ ] useMessages használata ChatScreen-ben
[ ] useLazyProfiles használata (opcionális)
```

**Részletes útmutató:** `PERFORMANCE_OPTIMIZATION_GUIDE.md`

---

## 4️⃣ Tesztelés

### Funkcionális Tesztek

```bash
# Unit tesztek
npm test

# E2E tesztek
npm run test:e2e

# Coverage
npm run test:coverage
```

```
✅ Checklist:
[ ] Discovery komponensek működnek
[ ] Performance hooks működnek
[ ] Onboarding flow működik
[ ] React Query cache működik
[ ] Supabase kapcsolat működik
[ ] Realtime messaging működik
```

---

## 5️⃣ Deployment (Opcionális)

### Production Build

```bash
# Build
npm run build

# Deploy
npm run deploy
```

```
✅ Checklist:
[ ] Build sikeres
[ ] Nincs warning
[ ] Bundle size optimális
[ ] Deploy sikeres
```

---

## 📚 Dokumentáció Referencia

### Főbb Útmutatók

1. **MANUAL_SUPABASE_SETUP.md**
   - Storage buckets setup
   - Realtime setup
   - RLS policies

2. **HOMESCREEN_REFACTORING_GUIDE.md**
   - Discovery komponensek
   - Integráció lépései
   - Props dokumentáció

3. **PERFORMANCE_OPTIMIZATION_GUIDE.md**
   - Lazy loading
   - React Query cache
   - Custom hooks használata

4. **IMPLEMENTATION_COMPLETE_DEC03_FINAL.md**
   - Teljes összefoglaló
   - Metrikák
   - Következő lépések

---

## 🎯 Prioritási Sorrend

### Kötelező (Azonnal)
1. ✅ **React Query Setup** - KÉSZ!
2. ⚠️ **Supabase Manual Setup** - HÁTRA
   - Storage buckets
   - Realtime
   - RLS policies

### Fontos (Hamarosan)
3. ⏳ **Komponensek Integrálása**
   - HomeScreen refaktorálás
   - Discovery komponensek

### Opcionális (Később)
4. ⏳ **Hooks Használata**
   - React Query hooks
   - Performance optimization

5. ⏳ **Tesztelés**
   - Unit tests
   - E2E tests

6. ⏳ **Deployment**
   - Production build
   - Deploy

---

## 💡 Gyors Parancsok

```bash
# App indítás
npm start

# Tesztek futtatása
npm test

# Build
npm run build

# Supabase kapcsolat ellenőrzése
node verify-supabase-setup.js
```

---

## 📊 Jelenlegi Státusz

| Kategória | Státusz | Megjegyzés |
|-----------|---------|------------|
| Komponensek | ✅ 100% | Létrehozva, integrálásra vár |
| Performance Hooks | ✅ 100% | Létrehozva, használatra vár |
| Onboarding | ✅ 100% | Kész |
| React Query | ✅ 100% | Telepítve és beállítva |
| Supabase Setup | ⚠️ 0% | Manuális lépések hátra |
| Integráció | ⏳ 0% | Várakozik |
| Tesztelés | ⏳ 0% | Várakozik |

---

## 🚀 Következő Session Kezdése

Amikor folytatod a munkát, mondd ezt:

```
"Folytassuk a TODO_NEXT_SESSION_DEC03.md fájl alapján.
Kezdjük a Supabase Manual Setup-pal."
```

Vagy:

```
"Folytassuk a komponensek integrálását a 
HOMESCREEN_REFACTORING_GUIDE.md alapján."
```

---

## ✅ Amit Ma Csináltunk

**Létrehozott fájlok:** 15  
**Kód sorok:** ~1,850  
**Dokumentáció:** 3 útmutató

### Komponensek (7)
- FilterBar, ActionButtons, StoryBar
- AISearchModal, SugarDatingModal, EmptyState
- index.js

### Hooks (3)
- useLazyProfiles
- useDiscoveryProfiles
- useMessages

### Config (1)
- queryClient.js

### Screens (1)
- OnboardingScreen.js

### Setup (1)
- React Query telepítve és beállítva App.js-ben

---

**Minden automatizálható feladat KÉSZ!** ✅  
**A manuális lépések dokumentálva és várakoznak!** 📋

---

**Létrehozva:** 2025. December 3.  
**Következő Session:** Supabase Manual Setup vagy Komponens Integráció  
**Becsült idő:** 1-2 óra
