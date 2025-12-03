# React Query Testing Guide

## ✅ Képernyők Cseréje - KÉSZ!

### Backup Készítve
- ✅ `HomeScreen.OLD.js` - Eredeti HomeScreen
- ✅ `MatchesScreen.OLD.js` - Eredeti MatchesScreen

### Optimalizált Képernyők Aktiválva
- ✅ `HomeScreen.OPTIMIZED.js` → `HomeScreen`
- ✅ `MatchesScreen.OPTIMIZED.js` → `MatchesScreen`
- ✅ App.js frissítve

## 🧪 Tesztelési Checklist

### 1. HomeScreen (Discovery Feed) Tesztelés

#### Alapvető Funkciók
- [ ] **Profil betöltés**
  - Indítsd el az appot
  - Ellenőrizd, hogy a discovery feed betöltődik
  - Nézd meg a console-t: láthatóak a React Query log-ok?

- [ ] **Swipe műveletek**
  - [ ] Swipe right (Like) - működik?
  - [ ] Swipe left (Pass) - működik?
  - [ ] Super Like gomb - működik?
  - [ ] Ellenőrizd: azonnali UI feedback van?

- [ ] **Match Modal**
  - Swipe-olj jobbra egy profilt
  - Ha match van, megjelenik a Match Modal?
  - "Send Message" gomb működik?
  - "Keep Swiping" gomb működik?

- [ ] **Cache működés**
  - Navigálj el a Home-ról
  - Térj vissza a Home-ra
  - A profilok azonnal megjelennek? (cache-ből)

- [ ] **Prefetching**
  - Swipe-olj 3-4 profilt
  - Ellenőrizd a Network tab-ot
  - Látható, hogy előre betöltődnek a következő profilok?

#### Performance
- [ ] **Smooth animációk**
  - Swipe gesture smooth?
  - Match modal animáció smooth?
  - Nincs lag?

- [ ] **Loading states**
  - Initial load: látható loading spinner?
  - Background refetch: látható kis loading indicator?

#### Error Handling
- [ ] **Nincs profil**
  - Mi történik, ha elfogynak a profilok?
  - Megjelenik az Empty State?
  - "Refresh" gomb működik?

- [ ] **Network error**
  - Kapcsold ki a netet
  - Mi történik?
  - Megjelenik error message?
  - Kapcsold vissza a netet
  - Auto-refetch működik?

### 2. MatchesScreen Tesztelés

#### Alapvető Funkciók
- [ ] **Matches lista betöltés**
  - Navigálj a Matches tab-ra
  - Betöltődnek a matchek?
  - Látható a loading state?

- [ ] **Tabbed Interface**
  - [ ] "New Matches" tab működik?
  - [ ] "Messages" tab működik?
  - [ ] Tab váltás smooth?

- [ ] **Unread badges**
  - Vannak unread üzenetek?
  - Látható a badge a tab-on?
  - Látható a badge az egyes beszélgetéseken?

- [ ] **Pull-to-refresh**
  - Húzd le a listát
  - Frissül a tartalom?
  - Látható a refresh indicator?

- [ ] **Match card interakciók**
  - Kattints egy match-re
  - Megnyílik a chat?
  - Vissza gomb működik?

#### Cache működés
- [ ] **Background refetching**
  - Maradj a Matches screen-en 30 másodpercig
  - Automatikusan frissül a lista?
  - Látható új match, ha van?

- [ ] **Cache persistence**
  - Navigálj el a Matches-ről
  - Térj vissza
  - A matchek azonnal megjelennek?

#### Empty States
- [ ] **Nincs match**
  - Ha nincs match, megjelenik az Empty State?
  - "Start Swiping" gomb működik?

- [ ] **Nincs üzenet**
  - Ha nincs üzenet, megjelenik az Empty State?
  - "View Matches" gomb működik?

### 3. ChatScreen Tesztelés (Ha van)

#### Alapvető Funkciók
- [ ] **Üzenetek betöltés**
  - Nyiss meg egy beszélgetést
  - Betöltődnek az üzenetek?
  - Látható a loading state?

- [ ] **Infinite scroll**
  - Scrollozz fel
  - Betöltődnek a régebbi üzenetek?
  - Smooth a scrolling?

- [ ] **Üzenet küldés**
  - Írj egy üzenetet
  - Küld el
  - Azonnal megjelenik? (optimistic update)
  - Ha sikeres, marad?
  - Ha hiba van, eltűnik?

- [ ] **Typing indicator**
  - Kezdj el gépelni
  - Látható a typing indicator a másik félnél?
  - Abbahagyod a gépelést
  - Eltűnik a typing indicator?

- [ ] **Auto-mark as read**
  - Nyiss meg egy beszélgetést unread üzenetekkel
  - Automatikusan olvasottnak jelölődnek?

#### Performance
- [ ] **Background refetching**
  - Maradj a chat-ben
  - 5 másodpercenként frissül?
  - Új üzenetek automatikusan megjelennek?

### 4. React Query Specifikus Tesztek

#### Cache Működés
- [ ] **Query keys**
  - Nyisd meg a React Query DevTools-t (ha telepítve)
  - Láthatóak a query keys?
  - Hierarchikus struktúra?

- [ ] **Cache invalidation**
  - Swipe-olj egy profilt
  - Ellenőrizd: invalidálódik a discovery cache?
  - Ellenőrizd: invalidálódik a matches cache?

- [ ] **Stale time**
  - Betöltesz egy profilt
  - Navigálsz el
  - 2 percen belül visszatérsz
  - Nem történik új API hívás? (stale time)

#### Optimistic Updates
- [ ] **Üzenet küldés**
  - Küldj egy üzenetet
  - Azonnal megjelenik?
  - Kapcsold ki a netet
  - Küldj egy üzenetet
  - Megjelenik, majd eltűnik? (rollback)

- [ ] **Swipe művelet**
  - Swipe-olj egy profilt
  - Azonnal eltűnik?
  - Ha match van, azonnal megjelenik a modal?

#### Background Refetching
- [ ] **Matches refetch**
  - Nyisd meg a Matches tab-ot
  - Várj 30 másodpercet
  - Automatikusan frissül?

- [ ] **Messages refetch**
  - Nyisd meg egy chat-et
  - Várj 5 másodpercet
  - Automatikusan frissül?

#### Prefetching
- [ ] **Discovery prefetch**
  - Swipe-olj 3 profilt
  - Ellenőrizd a Network tab-ot
  - Látható, hogy előre betöltődnek a következő profilok?

### 5. Error Handling Tesztek

#### Network Errors
- [ ] **Offline mode**
  - Kapcsold ki a netet
  - Próbálj swipe-olni
  - Megjelenik error message?
  - Kapcsold vissza a netet
  - Auto-retry működik?

- [ ] **Slow network**
  - Lassítsd le a netet (Chrome DevTools)
  - Betöltődnek a profilok?
  - Látható loading state?

#### API Errors
- [ ] **401 Unauthorized**
  - Töröld a session-t
  - Mi történik?
  - Átirányít a login-ra?

- [ ] **500 Server Error**
  - Mi történik?
  - Megjelenik error message?
  - Retry működik?

### 6. Performance Tesztek

#### Memory
- [ ] **Memory leaks**
  - Navigálj a tab-ok között 10x
  - Ellenőrizd a memory usage-t
  - Növekszik folyamatosan?

#### Rendering
- [ ] **Re-renders**
  - Nyisd meg a React DevTools Profiler-t
  - Swipe-olj egy profilt
  - Hány komponens renderelődik újra?
  - Csak a szükségesek?

#### Network
- [ ] **API calls**
  - Nyisd meg a Network tab-ot
  - Navigálj a Home-ra
  - Hány API hívás történik?
  - Van duplikáció?

## 📊 Tesztelési Eredmények

### Sikeres Tesztek
- [ ] HomeScreen alapvető funkciók
- [ ] MatchesScreen alapvető funkciók
- [ ] Cache működés
- [ ] Optimistic updates
- [ ] Background refetching
- [ ] Prefetching
- [ ] Error handling
- [ ] Performance

### Talált Hibák
_Írd ide a talált hibákat:_

1. 
2. 
3. 

### Javítandó
_Írd ide, mit kell javítani:_

1. 
2. 
3. 

## 🚀 Következő Lépések

### Ha minden teszt sikeres:
1. ✅ Töröld a .OLD.js fájlokat
2. ✅ Commit a változtatásokat
3. ✅ Folytasd a Realtime integrációval

### Ha vannak hibák:
1. ⚠️ Dokumentáld a hibákat
2. ⚠️ Javítsd a hibákat
3. ⚠️ Futtasd újra a teszteket

## 📝 Tesztelési Parancsok

### App indítása
```bash
npm start
```

### React Query DevTools telepítése (opcionális)
```bash
npm install @tanstack/react-query-devtools --save-dev
```

### Network monitoring
- Chrome DevTools → Network tab
- Filter: XHR
- Nézd meg az API hívásokat

### Performance monitoring
- React DevTools → Profiler
- Record a session
- Elemezd a re-renders-t

## ✅ Teszt Státusz

**Dátum**: December 4, 2025
**Tesztelő**: _____
**Státusz**: ⏳ Folyamatban

---

**Megjegyzések**:
_Írd ide a megjegyzéseidet:_
