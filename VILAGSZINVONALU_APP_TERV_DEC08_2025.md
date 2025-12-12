# 🌟 VILÁGSZÍNVONALÚ TÁRSKERESŐ APP TERV
## Teljes Architektúra és Implementációs Terv

**Létrehozva**: 2025. December 8.  
**Státusz**: Implementációra Kész  
**Cél**: A LoveX átalakítása a világ legjobb, legbiztonságosabb és legvonzóbb társkereső appjává

---

## 📋 VEZETŐI ÖSSZEFOGLALÓ

Ez a terv egy átfogó útitervet vázol fel, amely a LoveX-et egy működő társkereső appból világszínvonalú platformmá emeli, kombinálva a Tinder, Bumble, Hinge és Badoo legjobb funkcióit, miközben egyedi innovációkat ad hozzá a TikTok engagement mechanikáiból inspirálva.

### Alapelvek
1. **Felhasználói Biztonság Első** - Iparágvezető hitelesítés, moderálás és adatvédelem
2. **Engagement-Vezérelt** - TikTok-stílusú addiktív UX értelmes kapcsolatokkal
3. **Clean Architektúra** - Karbantartható, skálázható, tesztelhető kódbázis
4. **Premium Élmény** - Sima animációk, azonnali visszajelzés, élvezetes interakciók
5. **Adat-Vezérelt** - AI-alapú matching, ajánlások és személyre szabás

---

## 🏗️ ARCHITEKTÚRA ÁTTEKINTÉS

### Jelenlegi Állapot Elemzése

**Erősségek:**
- ✅ Szilárd alapok React Native + Expo-val
- ✅ Supabase backend valós idejű képességekkel
- ✅ React Query adatkezeléshez
- ✅ Átfogó képernyő implementációk (60+ képernyő)
- ✅ Biztonsági szolgáltatások (titkosítás, audit, rate limiting)
- ✅ 93% teszt lefedettség property-based teszteléssel

**Hiányosságok:**
- ❌ Inkonzisztens kód szervezés
- ❌ Hiányzó kritikus funkciók (videó profilok, élő közvetítés)
- ❌ Korlátozott AI/ML integráció
- ❌ Alap matching algoritmus
- ❌ Befejezetlen premium funkciók
- ❌ Nincs gamifikációs rendszer

### Cél Architektúra

```
dating-app/
├── src/
│   ├── domain/              # Üzleti logika (ÚJ)
│   │   ├── matching/        # Matching logika
│   │   ├── discovery/       # Felfedezés logika
│   │   ├── messaging/       # Üzenetküldés logika
│   │   └── safety/          # Biztonsági logika
│   ├── services/            # Infrastruktúra (REFAKTOR)
│   ├── repositories/        # Adatelérés (MEGTARTÁS)
│   ├── screens/             # UI (FEJLESZTÉS)
│   ├── components/          # Újrafelhasználható UI (SZERVEZÉS)
│   ├── hooks/               # Custom hookok (ÚJ)
│   ├── utils/               # Segédfüggvények (SZERVEZÉS)
│   └── config/              # Konfiguráció (MEGTARTÁS)
```


---

## 🎯 FUNKCIÓ LELTÁR

### ✅ IMPLEMENTÁLT FUNKCIÓK (Jelenlegi)

#### Felfedezés és Matching
- [x] Swipe kártyák animációkkal
- [x] Match animációk
- [x] Kompatibilitási pontozás
- [x] Profil részletek
- [x] Fotó galériák
- [x] Alap szűrők (kor, távolság, nem)
- [x] Top Picks
- [x] Passport (helyszín váltás)

#### Üzenetküldés
- [x] Szöveges chat
- [x] Match lista
- [x] Olvasatlan jelzők
- [x] Valós idejű üzenetküldés

#### Profil és Beállítások
- [x] Profil szerkesztés
- [x] Fotó feltöltés
- [x] Beállítások kezelése
- [x] Adatvédelmi kontrollok
- [x] Fiók törlés

#### Premium Funkciók (Részleges)
- [x] Boost
- [x] Super Like-ok
- [x] Likes You képernyő
- [x] Premium előfizetés képernyő

#### Biztonság és Védelem
- [x] Életkor hitelesítés
- [x] Fotó hitelesítés
- [x] Felhasználók blokkolása/jelentése
- [x] Biztonsági központ
- [x] GDPR megfelelés
- [x] Adat exportálás

### ❌ HIÁNYZÓ KRITIKUS FUNKCIÓK

#### Felfedezés Fejlesztések
- [ ] **Videó Profilok** (TikTok-stílus)
  - 15-60 másodperces videó bemutatkozások
  - Függőleges scroll feed
  - Auto-play hanggal
  - Videó reakciók (like, komment, megosztás)
  
- [ ] **Élő Közvetítés**
  - Élő stream indítása
  - Virtuális ajándékok stream közben
  - Többfelhasználós videó szobák
  - Stream felfedezés feed

- [ ] **AI-Alapú Keresés**
  - Természetes nyelvi lekérdezések
  - Vizuális keresés (fotó feltöltés, hasonló keresése)
  - Hang keresés
  - Okos szűrők

- [ ] **Story Funkció**
  - 24 órás eltűnő tartalom
  - Story reakciók
  - Story kiemelések profilon
  - Megtekintési analitika

#### Matching és Engagement
- [ ] **Fejlett Matching Algoritmus**
  - ML-alapú kompatibilitás
  - Viselkedési elemzés
  - Sikeres arány követés
  - Visszajelzési hurok tanulás

- [ ] **Jégtörők és Promptok**
  - Beszélgetés indítók
  - Profil promptok (Hinge-stílus)
  - Kérdés játékok
  - Személyiség kvízek

- [ ] **Gamifikációs Rendszer**
  - Napi kihívások
  - Teljesítmény jelvények
  - Ranglisták
  - Jutalom pontok
  - Szint előrehaladás

- [ ] **Események és Aktivitások**
  - Virtuális események
  - Speed dating szobák
  - Csoportos aktivitások
  - Helyi találkozók


#### Kommunikáció
- [ ] **Gazdag Média Üzenetek**
  - Hang üzenetek
  - Videó üzenetek
  - GIF könyvtár
  - Matrica csomagok
  - Fotó/videó megosztás

- [ ] **Videó Chat**
  - 1-1 videó hívások
  - Virtuális hátterek
  - Filterek és effektek
  - Hívás rögzítés (beleegyezéssel)

- [ ] **Hang Chat**
  - Csak hang hívások
  - Hang szobák (csoport)
  - Hang jegyzetek

#### Premium Funkciók
- [ ] **Szintezett Előfizetések**
  - Alap (ingyenes)
  - Plus (2990 Ft/hó)
  - Gold (5990 Ft/hó)
  - Platinum (8990 Ft/hó)

- [ ] **À la Carte Funkciók**
  - Boost csomagok
  - Super Like csomagok
  - Olvasási visszaigazolások
  - Swipe visszavonás
  - Nézd meg ki kedvelt
  - Prioritásos like-ok
  - Profil kiemelés

- [ ] **Virtuális Ajándékok**
  - Ajándék bolt
  - Ajándékok küldése chatben
  - Ajándék animációk
  - Ajándék történet

#### Biztonság és Bizalom
- [ ] **Továbbfejlesztett Hitelesítés**
  - Kormányzati igazolvány hitelesítés
  - Közösségi média hitelesítés
  - Telefonszám hitelesítés
  - Videó szelfi hitelesítés
  - Háttérellenőrzés (opcionális, premium)

- [ ] **AI Moderálás**
  - Nem megfelelő tartalom észlelés
  - Hamis profil észlelés
  - Csalás észlelés
  - Zaklatás észlelés
  - Auto-moderálási műveletek

- [ ] **Biztonsági Funkciók**
  - Vészhelyzeti kapcsolatok
  - Randevú bejelentkezés
  - Helymeghatározás megosztás (ideiglenes)
  - Biztonsági tippek és források
  - Pánik gomb

- [ ] **Bizalmi Pontrendszer**
  - Felhasználói hírnév pontszám
  - Hitelesítési jelvények
  - Aktivitás jelzők
  - Válasz arány
  - Jelentési előzmények

---

## 🚀 IMPLEMENTÁCIÓS ÜTEMTERV

### 1. FÁZIS: Alapok és Architektúra (1-2. hét)
**Cél**: Kódbázis tisztítása, minták kialakítása, teljesítmény javítása

#### Feladatok:
1. **Kód Szervezés**
   - Domain réteg létrehozása
   - Szolgáltatások refaktorálása
   - Komponensek szervezése funkciók szerint
   - Elnevezési konvenciók kialakítása

2. **Teljesítmény Optimalizálás**
   - Lazy loading implementálása
   - Képek optimalizálása (WebP, tömörítés)
   - Bundle méret csökkentése
   - Teljesítmény monitoring hozzáadása

3. **Tesztelési Infrastruktúra**
   - Teszt lefedettség bővítése 95%+-ra
   - E2E tesztek hozzáadása
   - Teljesítmény benchmarkok
   - Vizuális regressziós tesztek


### 2. FÁZIS: Alap Funkciók Fejlesztése (3-4. hét)
**Cél**: Meglévő funkciók világszínvonalúvá emelése

#### Feladatok:
1. **Felfedezési Élmény**
   - Sima swipe animációk (60fps)
   - Haptikus visszajelzés
   - Gesztus kontrollok (dupla koppintás like-hoz, stb.)
   - Gyors műveletek (visszavonás, boost, stb.)
   - Profil előnézet hosszú nyomásra

2. **Matching Algoritmus v2**
   - ML-alapú pontozás implementálása
   - Viselkedési jelek hozzáadása
   - Sikeres metrikák követése
   - Különböző algoritmusok A/B tesztelése

3. **Üzenetküldés Fejlesztés**
   - Gazdag szöveg formázás
   - Üzenet reakciók
   - Gépelés jelzők
   - Olvasási visszaigazolások
   - Üzenet keresés
   - Beszélgetések rögzítése

4. **Profil Fejlesztés**
   - Többféle fotó elrendezés
   - Videó támogatás
   - Profil promptok
   - Érdeklődési címkék
   - Hitelesítési jelvények
   - Aktivitási státusz

### 3. FÁZIS: Videó és Élő Funkciók (5-6. hét)
**Cél**: TikTok-stílusú engagement mechanikák hozzáadása

#### Feladatok:
1. **Videó Profilok**
   - Videó felvételi felület
   - Videó tömörítés és feltöltés
   - Függőleges videó feed
   - Auto-play hang kontrollal
   - Videó reakciók

2. **Élő Közvetítés**
   - WebRTC integráció
   - Stream hosting UI
   - Néző felület
   - Virtuális ajándékok
   - Stream moderálás

3. **Story-k**
   - Story létrehozás
   - Story néző
   - Story reakciók
   - Story kiemelések
   - Analitika

### 4. FÁZIS: AI és Személyre Szabás (7-8. hét)
**Cél**: Intelligens funkciók, amelyek tanulnak és alkalmazkodnak

#### Feladatok:
1. **AI Keresés**
   - Természetes nyelv feldolgozás
   - Vizuális keresés
   - Hang keresés
   - Okos ajánlások

2. **Okos Matching**
   - Viselkedési elemzés
   - Sikeres előrejelzés
   - Optimális időzítés
   - Személyre szabott javaslatok

3. **Tartalom Moderálás**
   - Képfelismerés
   - Szöveg elemzés
   - Hamis profil észlelés
   - Automatizált műveletek


### 5. FÁZIS: Gamifikáció és Engagement (9-10. hét)
**Cél**: Az app addiktívvá tétele (egészséges módon)

#### Feladatok:
1. **Gamifikációs Rendszer**
   - Pontok és jutalmak
   - Napi kihívások
   - Teljesítmény rendszer
   - Ranglisták
   - Szint előrehaladás

2. **Események és Aktivitások**
   - Virtuális események
   - Speed dating
   - Csoportos aktivitások
   - Tematikus estek

3. **Közösségi Funkciók**
   - Barát rendszer
   - Csoportos chatek
   - Közösségi fórumok
   - Felhasználó által generált tartalom

### 6. FÁZIS: Premium és Monetizáció (11-12. hét)
**Cél**: Fenntartható bevételi modell

#### Feladatok:
1. **Előfizetési Szintek**
   - Funkció mátrix
   - Árazási stratégia
   - Fizetési integráció
   - Próbaidőszakok
   - Lemondási folyamat

2. **Virtuális Gazdaság**
   - Kredit rendszer
   - Ajándék bolt
   - Boost piactér
   - Ajánlási jutalmak

3. **Analitikai Dashboard**
   - Bevétel követés
   - Felhasználói metrikák
   - Konverziós tölcsérek
   - Megtartási elemzés

### 7. FÁZIS: Biztonság és Bizalom (13-14. hét)
**Cél**: Iparágvezető biztonsági szabványok

#### Feladatok:
1. **Hitelesítési Rendszer**
   - Többfaktoros hitelesítés
   - Igazolvány hitelesítés
   - Videó hitelesítés
   - Közösségi hitelesítés

2. **AI Moderálás**
   - Tartalom szűrés
   - Viselkedés elemzés
   - Kockázat pontozás
   - Automatizált válaszok

3. **Biztonsági Funkciók**
   - Vészhelyzeti kapcsolatok
   - Bejelentkezési rendszer
   - Helymeghatározás megosztás
   - Biztonsági források

### 8. FÁZIS: Csiszolás és Indítás (15-16. hét)
**Cél**: Éles használatra kész app

#### Feladatok:
1. **Teljesítmény Optimalizálás**
   - Betöltési idő < 2mp
   - 60fps animációk
   - Offline támogatás
   - Akkumulátor optimalizálás

2. **Felhasználói Tesztelés**
   - Beta program
   - Visszajelzés gyűjtés
   - Hibajavítások
   - UX fejlesztések

3. **Indítási Előkészítés**
   - App store optimalizálás
   - Marketing anyagok
   - Sajtó csomag
   - Indítási stratégia

---

## 💰 MONETIZÁCIÓS STRATÉGIA

### Előfizetési Szintek

**Ingyenes (Alap):**
- Korlátozott swipe-ok (50/nap)
- Alap szűrők
- Szöveges üzenetküldés
- 1 Super Like/nap

**Plus (2990 Ft/hó):**
- Korlátlan swipe-ok
- Fejlett szűrők
- 5 Super Like/nap
- Nézd meg ki kedvelt
- Visszavonás (undo swipe-ok)
- 1 Boost/hó

**Gold (5990 Ft/hó):**
- Minden Plus funkció
- Prioritásos like-ok
- Olvasási visszaigazolások
- Profil kiemelés
- 5 Boost/hó
- Üzenet match előtt
- Fejlett analitika

**Platinum (8990 Ft/hó):**
- Minden Gold funkció
- Üzenet prioritás
- Like-ok megtekintése swipe előtt
- Korlátlan Boost-ok
- VIP jelvény
- Exkluzív események
- Személyes matchmaker

### À la Carte Vásárlások
- Boost: 1190 Ft (1), 2990 Ft (3), 7490 Ft (10)
- Super Like-ok: 1490 Ft (5), 4490 Ft (25), 11990 Ft (100)
- Kreditek: 2990 Ft (100), 14990 Ft (600), 29990 Ft (1500)

### Virtuális Ajándékok
- Rózsa: 10 kredit
- Pezsgő: 50 kredit
- Gyémánt gyűrű: 100 kredit
- Luxus autó: 500 kredit
- Magánrepülő: 1000 kredit


---

## 📊 METRIKÁK ÉS KPI-K

### Felhasználói Engagement
- Napi Aktív Felhasználók (DAU)
- Havi Aktív Felhasználók (MAU)
- Session időtartam
- Session-ök naponta
- Megtartás (D1, D7, D30)

### Matching Metrikák
- Swipe arány
- Match arány
- Üzenet arány
- Válasz arány
- Beszélgetés hossz
- Videó hívás arány

### Bevételi Metrikák
- Konverziós arány (ingyenes → fizetős)
- Átlagos Bevétel Felhasználónként (ARPU)
- Élettartam Érték (LTV)
- Lemorzsolódási arány
- Előfizetés megtartás

### Minőségi Metrikák
- Profil kitöltési arány
- Hitelesítési arány
- Jelentési arány
- Blokkolási arány
- Felhasználói elégedettségi pontszám

### Technikai Metrikák
- App betöltési idő
- Képernyő átmenet idő
- API válaszidő
- Összeomlási arány
- Hiba arány

---

## 🎯 SIKER KRITÉRIUMOK

### Felhasználói Metrikák
- 100K+ letöltés első hónapban
- 50K+ DAU
- 4.5+ csillag értékelés
- 60%+ D1 megtartás
- 30%+ D30 megtartás

### Engagement Metrikák
- 30+ perc átlagos session
- 3+ session naponta
- 50%+ match arány
- 70%+ üzenet arány
- 20%+ videó hívás arány

### Bevételi Metrikák
- 5%+ konverzió fizetősre
- 3000+ Ft ARPU
- 60000+ Ft LTV
- < 5% havi lemorzsolódás

### Minőségi Metrikák
- 80%+ profil kitöltés
- 50%+ hitelesítési arány
- < 1% jelentési arány
- < 0.5% blokkolási arány
- 4.5+ elégedettségi pontszám

### Technikai Metrikák
- < 2mp betöltési idő
- 60fps animációk
- < 1% összeomlási arány
- < 0.1% hiba arány
- 99.9% uptime

---

## 🛠️ TECHNIKAI STACK

### Frontend
- **Framework**: React Native 0.81.5
- **UI Library**: React Native Paper / Native Base
- **Navigáció**: React Navigation 7
- **Állapotkezelés**: React Query + Context API
- **Animációk**: Reanimated 3 + Lottie
- **Formok**: React Hook Form
- **Tesztelés**: Jest + React Native Testing Library

### Backend
- **Adatbázis**: Supabase (PostgreSQL)
- **Tárhely**: Supabase Storage
- **Auth**: Supabase Auth
- **Valós idejű**: Supabase Realtime
- **Funkciók**: Supabase Edge Functions
- **CDN**: Cloudflare

### AI/ML
- **Képfelismerés**: AWS Rekognition / Google Vision
- **NLP**: OpenAI GPT-4 / Anthropic Claude
- **Ajánlások**: TensorFlow / PyTorch
- **Moderálás**: Perspective API

### Videó/Streaming
- **Videó Feldolgozás**: FFmpeg
- **Élő Közvetítés**: Agora / LiveKit / Stream.io
- **Videó Tárhely**: Cloudflare Stream / Mux

### Analitika
- **Termék Analitika**: Mixpanel / Amplitude
- **Hiba Követés**: Sentry
- **Teljesítmény**: Firebase Performance
- **A/B Tesztelés**: Optimizely / LaunchDarkly

### Fizetés
- **Előfizetések**: RevenueCat
- **Fizetések**: Stripe
- **In-App Vásárlások**: Expo In-App Purchases


---

## 🚦 IMPLEMENTÁCIÓS PRIORITÁSOK

### P0 - Kritikus (Muszáj Lennie)
1. **Teljesítmény Optimalizálás**
   - 60fps animációk
   - < 2mp betöltési idő
   - Sima görgetés
   - Kép optimalizálás

2. **Alap Matching**
   - Továbbfejlesztett algoritmus
   - Jobb ajánlások
   - Sikeres követés

3. **Üzenetküldés Fejlesztés**
   - Gazdag média támogatás
   - Valós idejű fejlesztések
   - Üzenet keresés

4. **Biztonság és Bizalom**
   - Továbbfejlesztett hitelesítés
   - AI moderálás
   - Jelentési fejlesztések

### P1 - Magas Prioritás (Kellene Lennie)
1. **Videó Profilok**
   - Felvétel és feltöltés
   - Videó feed
   - Videó reakciók

2. **Gamifikáció**
   - Pont rendszer
   - Teljesítmények
   - Napi kihívások

3. **Premium Funkciók**
   - Előfizetési szintek
   - Fizetési integráció
   - Funkció korlátozás

4. **Analitika**
   - Felhasználói betekintések
   - Profil analitika
   - Match betekintések

### P2 - Közepes Prioritás (Jó Lenne)
1. **Élő Közvetítés**
   - Stream hosting
   - Virtuális ajándékok
   - Stream felfedezés

2. **Események és Aktivitások**
   - Virtuális események
   - Speed dating
   - Csoportos aktivitások

3. **AI Funkciók**
   - Okos keresés
   - Jégtörő javaslatok
   - Optimális időzítés

4. **Közösségi Funkciók**
   - Story-k
   - Barát rendszer
   - Közösség

### P3 - Alacsony Prioritás (Jövő)
1. **Fejlett Funkciók**
   - AR filterek
   - Hang chat szobák
   - Társkereső coach AI
   - Kapcsolati tanácsok

2. **Integrációk**
   - Közösségi média import
   - Spotify integráció
   - Instagram story-k
   - Naptár szinkronizálás

---

## 📋 GYORS KEZDÉSI ÚTMUTATÓ

### Azonnali Lépések (Ma)
1. ✅ Blueprint dokumentum áttekintése
2. ✅ App futásának ellenőrzése
3. ⏳ Első funkció kiválasztása implementálásra
4. ⏳ Projekt menedzsment beállítása (Jira/Linear)
5. ⏳ Feature branch létrehozása

### Ezen a Héten
1. ⏳ 1. Fázis feladatok implementálása
2. ⏳ Teljesítmény monitoring beállítása
3. ⏳ Teszt lefedettség bővítése
4. ⏳ Architektúra diagram készítése
5. ⏳ Heti haladás áttekintés

### Ebben a Hónapban
1. ⏳ 1-2. Fázis befejezése
2. ⏳ Beta program indítása
3. ⏳ Felhasználói visszajelzések gyűjtése
4. ⏳ Funkciók iterálása
5. ⏳ 3. Fázis tervezése

---

## 💡 PRO TIPPEK

1. **Kezdj Kicsiben**: Ne próbálj meg mindent egyszerre implementálni
2. **Tesztelj Korán**: Írj teszteket miközben építed a funkciókat
3. **Felhasználói Visszajelzés**: Szerezz valódi felhasználókat tesztelésre ASAP
4. **Teljesítmény**: Monitorozd a teljesítményt az első naptól
5. **Iterálj**: Szállíts gyorsan, tanulj, fejlődj
6. **Dokumentálj**: Tartsd naprakészen a dokumentációt
7. **Ünnepelj**: Ismerd el a sikereket az út során

---

## 📚 DOKUMENTÁCIÓ HIVATKOZÁSOK

### Angol Nyelvű Dokumentumok
- [World-Class Dating App Blueprint](./WORLD_CLASS_DATING_APP_BLUEPRINT.md) - Teljes angol terv
- [Blueprint Quick Start](./BLUEPRINT_QUICK_START.md) - Gyors kezdési útmutató

### Magyar Nyelvű Dokumentumok
- [Teljes Munka Nov 24 - Dec 03](./TELJES_MUNKA_NOV24_DEC03.md)
- [Teljes Projekt Összefoglaló](./TELJES_PROJEKT_OSSZEFOGLALO_DEC05_2025.md)
- [Végső Összefoglaló Dec 07](./VEGSO_OSSZEFOGLALO_DEC07_2025.md)
- [Session Complete Blueprint](./SESSION_COMPLETE_BLUEPRINT_DEC08_2025.md)

### Technikai Dokumentumok
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Testing Strategy](./TESTING_STRATEGY.md)
- [Critical Code Review](./CRITICAL_CODE_REVIEW_COMPREHENSIVE.md)
- [Supabase Integration](./SUPABASE_INTEGRATION_COMPLETE.md)

---

## 🎉 ÖSSZEGZÉS

Ez a terv egy átfogó 16 hetes útitervet biztosít a LoveX világszínvonalú társkereső platformmá alakításához. Az implementáció 8 fázisra van strukturálva, világos prioritásokkal és siker kritériumokkal.

### Kulcs Tanulságok:
1. **Alapok Először** - Clean architektúra gyors funkció fejlesztést tesz lehetővé
2. **Felhasználói Biztonság** - Iparágvezető hitelesítés és moderálás
3. **Engagement** - TikTok-stílusú mechanikák addiktív UX-hez
4. **AI-Alapú** - Okos matching és személyre szabás
5. **Monetizáció** - Fenntartható bevétel szintezett előfizetésekkel
6. **Folyamatos Fejlesztés** - Adat-vezérelt iteráció és optimalizálás

### Következő Lépések:
1. Blueprint áttekintése és jóváhagyása
2. Funkciók priorizálása erőforrások alapján
3. Projekt menedzsment beállítása
4. Csapattagok hozzárendelése fázisokhoz
5. 1. Fázis implementáció megkezdése
6. Heti haladás áttekintések
7. Ütemterv szükség szerinti módosítása

**Építsük meg a világ legjobb társkereső appját! 🚀❤️**

---

*Dokumentum Verzió: 1.0*  
*Utolsó Frissítés: 2025. December 8.*  
*Státusz: Implementációra Kész*
