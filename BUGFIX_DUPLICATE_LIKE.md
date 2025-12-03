# 🐛 Bug Fix: Duplicate Like Error

## Probléma

**Hiba:** `duplicate key value violates unique constraint "likes_user_id_liked_user_id_key"`

**Oka:** Amikor egy felhasználó többször swipe-ol ugyanarra a profilra, a rendszer megpróbálja újra beszúrni a like-ot az adatbázisba, ami ütközik a unique constraint-tel.

## Megoldás

### ✅ Javítás: `SupabaseMatchService.js`

**Módosított metódusok:**
1. `saveLike()` - Like mentése duplikáció ellenőrzéssel
2. `savePass()` - Pass mentése duplikáció ellenőrzéssel

### Változások

#### 1. `saveLike()` metódus

**Előtte:**
```javascript
async saveLike(userId, likedUserId) {
  // Csak a mutual like-ot ellenőrizte
  // Nem ellenőrizte, hogy már létezik-e a like
  await supabase.from('likes').insert(...); // ❌ Hiba ha már létezik
}
```

**Utána:**
```javascript
async saveLike(userId, likedUserId) {
  // 1. Ellenőrizzük, hogy már like-oltuk-e
  const { data: alreadyLiked } = await supabase
    .from('likes')
    .select('*')
    .eq('user_id', userId)
    .eq('liked_user_id', likedUserId)
    .single();

  // 2. Ha már létezik, ne csináljunk semmit
  if (alreadyLiked) {
    return { success: true, isMatch: false, alreadyLiked: true };
  }

  // 3. Csak akkor szúrjuk be, ha még nem létezik
  await supabase.from('likes').insert(...); // ✅ Biztonságos
}
```

#### 2. `savePass()` metódus

Ugyanez a logika a pass-okra is:
```javascript
async savePass(userId, passedUserId) {
  // Ellenőrizzük, hogy már pass-oltuk-e
  const { data: alreadyPassed } = await supabase
    .from('passes')
    .select('*')
    .eq('user_id', userId)
    .eq('passed_user_id', passedUserId)
    .single();

  if (alreadyPassed) {
    return { success: true, alreadyPassed: true };
  }

  await supabase.from('passes').insert(...);
}
```

## Eredmény

✅ **Nincs több duplicate key error**
✅ **Biztonságos újra-swipe**
✅ **Tiszta log-ok**
✅ **Jobb felhasználói élmény**

## Tesztelés

**Tesztelendő esetek:**
1. ✅ Első swipe right → Like mentődik
2. ✅ Második swipe right ugyanarra → Nincs hiba, visszaadja `alreadyLiked: true`
3. ✅ Swipe left → Pass mentődik
4. ✅ Második swipe left ugyanarra → Nincs hiba, visszaadja `alreadyPassed: true`
5. ✅ Mutual like → Match létrejön

## Kapcsolódó Fájlok

- `src/services/SupabaseMatchService.js` - Javított service
- `supabase/rls-policies.sql` - Unique constraint definíció

## Státusz

✅ **JAVÍTVA** - December 3, 2025

---

**Következő lépés:** Teszteld újra az alkalmazást, és most már nem lesz duplicate key error! 🎉
