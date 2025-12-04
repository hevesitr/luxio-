# Profil Betöltési Hiba Javítás - Dec 04, 2025

## Probléma

A HomeScreen-en "AnnaNaN" jelenik meg a profilok helyett, ami azt jelenti, hogy a profil `age` mezője `undefined` vagy `NaN`.

## Diagnózis

A logokból:
```
LOG  HomeScreen: History loaded from storage: 17
LOG  HomeScreen: Setting currentIndex to: 18
LOG  === HOMESCREEN LOAD DISCOVERY FEED ===
LOG  Initial profiles count: 53
LOG  First profile: {"id": 1, "name": "Anna", "age": 24, ...}
LOG  currentIndex: 18
LOG  Filtered profiles count: 53
WARN  currentIndex (18) is beyond filtered profiles (53). Resetting to 0.
```

### Root Cause

A probléma a **React state update timing** miatt történt:

1. **History betöltés** (`useEffect #1`): `setCurrentIndex(18)` - de ez aszinkron!
2. **Discovery feed betöltés** (`useEffect #2`): Azonnal fut, amikor `currentIndex` még lehet 0
3. A `currentIndex` reset logika a `loadDiscoveryFeed`-ben volt, ami csak **egyszer** fut le (üres dependency array)
4. Amikor a `currentIndex` később frissül 18-ra, már nem fut le újra a check

Eredmény: A `currentIndex` 18 marad, de a `profiles` array csak 53 elemű, és a 18. index egy régi, cached profil lehet rossz adatokkal.

## Javítás

### 1. HomeScreen.js - currentIndex Reset Logika Szétválasztása

**Probléma:** A `currentIndex` reset a `loadDiscoveryFeed` useEffect-ben történt, ami csak egyszer fut le (üres dependency array).

**Megoldás:** Külön useEffect a `currentIndex` reset-hez, ami figyeli a `profiles` és `currentIndex` változásait.

```javascript
// BEFORE - Egy useEffect mindent csinál
useEffect(() => {
  const loadDiscoveryFeed = async () => {
    // ...
    setProfiles(filtered);
    
    // Reset logika itt - de csak egyszer fut!
    if (currentIndex >= filtered.length) {
      setCurrentIndex(0);
    }
  };
  loadDiscoveryFeed();
}, []); // Csak egyszer fut!

// AFTER - Szétválasztva
useEffect(() => {
  const loadDiscoveryFeed = async () => {
    // ... csak profilok betöltése
    setProfiles(filtered);
  };
  loadDiscoveryFeed();
}, []); // Csak egyszer fut

// Külön useEffect a reset-hez
useEffect(() => {
  if (profiles.length > 0 && currentIndex >= profiles.length) {
    console.warn(`currentIndex (${currentIndex}) is beyond profiles (${profiles.length}). Resetting to 0.`);
    setCurrentIndex(0);
  }
}, [profiles, currentIndex]); // Figyeli mindkettőt! Mindig fut amikor változnak
```

### Miért működik ez?

1. A `loadDiscoveryFeed` betölti a profilokat -> `setProfiles(filtered)`
2. A `profiles` state frissül -> trigger-eli a második useEffect-et
3. A második useEffect ellenőrzi: `currentIndex >= profiles.length`?
4. Ha igen, reset-eli: `setCurrentIndex(0)`
5. A `currentIndex` frissül -> újra trigger-eli a második useEffect-et
6. Most már `currentIndex = 0 < profiles.length`, szóval nem reset-el újra

## Tesztelés

1. Indítsd újra az appot: `npx expo start --clear`
2. Nyisd meg a Felfedezés tabot
3. Ellenőrizd, hogy Anna (24) jelenik meg, nem "AnnaNaN"
4. Swipe-olj végig néhány profilon
5. Zárd be és nyisd meg újra az appot
6. Ellenőrizd, hogy a helyes profil jelenik meg (nem "AnnaNaN")

## Státusz

✅ Javítás implementálva
⏳ Tesztelés folyamatban

## Kapcsolódó Fájlok

- `src/screens/HomeScreen.js` - currentIndex reset logika
- `src/components/SwipeCard.js` - profil megjelenítés (már ellenőrzi az age-t)

## Megjegyzések

Ez a bug egy klasszikus **race condition** volt React state updates között. A megoldás a **separation of concerns** - minden useEffect egy dolgot csinál, és explicit dependency array-ekkel biztosítjuk, hogy a megfelelő időben fusson le.
