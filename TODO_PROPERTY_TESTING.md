# Property Testing TODO Lista

## 🔴 Javítandó Tesztek

### DiscoveryFeed.properties.test.js
A következő tesztek hibáznak, mert a generatorok nem megfelelően vannak definiálva:

- [ ] **Property 21: Seen profile exclusion** - `profileListGenerator` nem Arbitrary típus
- [ ] **Property 22: Age filter correctness** - `profileListGenerator` nem Arbitrary típus  
- [ ] **Property 23: Distance filter correctness** - `profileListGenerator` nem Arbitrary típus
- [ ] **Property 24: Gender filter correctness** - `profileListGenerator` nem Arbitrary típus

**Probléma:** A `profileListGenerator` valószínűleg nem fc.array() formátumban van definiálva.

**Megoldás:** Ellenőrizni kell a generator definícióját és biztosítani, hogy fc.array(profileGenerator) formátumú legyen.

---

### LocationService.properties.test.js
A következő tesztek hibáznak, mert a generatorok nem Arbitrary típusok:

- [ ] **Property 16: Distance non-negativity** - `locationPairGenerator` nem Arbitrary típus
- [ ] **Property 17: Distance identity** - `sameLocationGenerator` nem Arbitrary típus
- [ ] **Property 18: Haversine accuracy** - `knownDistanceGenerator` nem Arbitrary típus
- [ ] **Property 19: Distance sorting order** - `locationListGenerator` nem Arbitrary típus

**Probléma:** Ezek a generatorok valószínűleg függvények, nem pedig fc.Arbitrary objektumok.

**Megoldás:** 
1. `locationPairGenerator` - már létezik a locationGenerators.js-ben, de lehet hogy rosszul van használva
2. `sameLocationGenerator` - létre kell hozni: `fc.record({ latitude, longitude }).map(loc => [loc, loc])`
3. `knownDistanceGenerator` - létre kell hozni ismert távolságú helyszínekkel
4. `locationListGenerator` - létre kell hozni: `fc.array(locationGenerator, { minLength: 5, maxLength: 20 })`

---

## ✅ Működő Tesztek (10 db)

### MatchService.properties.test.js ✅
- ✅ Property 1: Like count increment
- ✅ Property 2: Mutual like creates match
- ✅ Property 3: Pass exclusion
- ✅ Property 5: Daily swipe limit enforcement

### MessageService.properties.test.js ✅
- ✅ Property 6: Message persistence round-trip
- ✅ Property 7: Message chronological ordering
- ✅ Property 8: Message deletion consistency

### ProfileService.properties.test.js ✅
- ✅ Property 11: Profile update round-trip
- ✅ Property 13: Interest set uniqueness
- ✅ Property 15: Age calculation correctness

---

## 📋 Következő Lépések

1. **Javítani a hibás generatorokat** a DiscoveryFeed és LocationService tesztekben
2. **Folytatni a property tesztek írását** a többi service-hez:
   - Compatibility Algorithm Properties (5 property)
   - Premium Features Properties (5 property)
   - Safety Features Properties (5 property)
   - Data Integrity Properties (3 property)

3. **Opcionális tesztek** (később):
   - 3.4 Swipe history ordering
   - 4.4 Unmatch cascade
   - 4.5 Pagination non-overlap
   - 5.2 Image compression
   - 5.4 Invalid profile rejection
   - stb.

---

## 📊 Statisztika

- **Összes property teszt:** 42 tervezett
- **Implementált és működő:** 10 ✅
- **Implementált de hibás:** 8 🔴
- **Még nem implementált:** 24 ⏳
- **Opcionális (skip):** ~15 ⏭️

**Haladás:** 18/42 (43%) - ha a hibásakat is számoljuk
**Működő:** 10/42 (24%)

---

## 🛠️ Generátor Hiányosságok

Létre kell hozni:
- `profileListGenerator` - fc.array(profileGenerator)
- `sameLocationGenerator` - ugyanaz a location kétszer
- `knownDistanceGenerator` - ismert távolságú helyszínpárok
- `locationListGenerator` - fc.array(locationGenerator)

---

**Utolsó frissítés:** 2025-12-04
