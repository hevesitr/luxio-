# 🔒 RLS Policies Setup Guide

## ✅ STEP-BY-STEP TELEPÍTÉS

### ✅ Step 1: Profiles (KÉSZ!)
**Fájl:** `supabase/rls-policies-ultra-simple.sql`
**Státusz:** ✅ Sikeresen futott

**Mit csinál:**
- Profiles tábla RLS engedélyezése
- Felhasználók láthatják saját profiljukat
- Felhasználók láthatják mások profiljait
- Felhasználók frissíthetik saját profiljukat

---

### 🔄 Step 2: Matches
**Fájl:** `supabase/rls-policies-step2-matches.sql`
**Státusz:** ⏳ Következő lépés

**Mit csinál:**
- Matches tábla RLS engedélyezése
- Felhasználók láthatják saját match-eiket
- Felhasználók létrehozhatnak match-eket
- Felhasználók frissíthetik saját match-eiket

**Futtatás:**
```sql
-- Supabase Dashboard → SQL Editor
-- Másold be: supabase/rls-policies-step2-matches.sql
-- Run
```

---

### 🔄 Step 3: Messages
**Fájl:** `supabase/rls-policies-step3-messages.sql`
**Státusz:** ⏳ Várj a Step 2 után

**Mit csinál:**
- Messages tábla RLS engedélyezése
- Felhasználók láthatják üzeneteiket match-eikben
- Felhasználók küldhetnek üzeneteket
- Felhasználók törölhetik saját üzeneteiket

**Futtatás:**
```sql
-- Supabase Dashboard → SQL Editor
-- Másold be: supabase/rls-policies-step3-messages.sql
-- Run
```

---

### 🔄 Step 4: Likes & Passes
**Fájl:** `supabase/rls-policies-step4-likes-passes.sql`
**Státusz:** ⏳ Várj a Step 3 után

**Mit csinál:**
- Likes tábla RLS engedélyezése
- Passes tábla RLS engedélyezése
- Felhasználók láthatják like-jaikat
- Felhasználók láthatják pass-eiket

**Futtatás:**
```sql
-- Supabase Dashboard → SQL Editor
-- Másold be: supabase/rls-policies-step4-likes-passes.sql
-- Run
```

---

## 📊 TELEPÍTÉSI SORREND

```
1. ✅ rls-policies-ultra-simple.sql      (Profiles)
2. ⏳ rls-policies-step2-matches.sql     (Matches)
3. ⏳ rls-policies-step3-messages.sql    (Messages)
4. ⏳ rls-policies-step4-likes-passes.sql (Likes & Passes)
```

---

## 🎯 KÖVETKEZŐ LÉPÉS

**Futtasd a Step 2-t:**
```sql
-- Nyisd meg: Supabase Dashboard
-- Menj: SQL Editor
-- Másold be: supabase/rls-policies-step2-matches.sql
-- Kattints: Run
```

Ha sikeres, folytatd a Step 3-mal, majd Step 4-gyel!

---

## 🐛 HIBAELHÁRÍTÁS

### "operator does not exist: uuid = text"
- Ez azt jelenti, hogy típus eltérés van
- Az ultra-simple verzió ezt elkerüli
- A step-by-step verziók is elkerülik

### "policy already exists"
- A DROP POLICY parancsok törlik a régi policy-kat
- Ha még mindig hiba van, töröld manuálisan a Supabase Dashboard-on

### "table does not exist"
- Ellenőrizd, hogy a tábla létezik-e
- Futtasd a schema_extended.sql-t először

---

## ✅ ELLENŐRZÉS

### RLS engedélyezve van?
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'matches', 'messages', 'likes', 'passes');
```

Minden táblánál `rowsecurity = true` kell legyen!

### Policies léteznek?
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🎉 SIKERES TELEPÍTÉS UTÁN

Ha mind a 4 step sikeresen lefutott:

✅ **Profiles védve**
✅ **Matches védve**
✅ **Messages védve**
✅ **Likes & Passes védve**

**Az adatbázis most biztonságos!** 🔒

---

## 📝 MEGJEGYZÉSEK

- **Miért step-by-step?** Könnyebb hibakeresés, ha valami elromlik
- **Miért nincs storage policy?** Az külön lépés lesz később
- **Miért nincs blocks tábla?** Az még nem létezik az adatbázisban

---

**Következő lépés:** Futtasd a Step 2-t! ⏭️
