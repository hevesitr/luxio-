# ✅ Tesztelési Útmutató

## Gyors Tesztelési Lista

### 🚀 Telepítés Teszt

- [ ] Node.js telepítve van (verzió ellenőrzés: `node --version`)
- [ ] npm működik (`npm --version`)
- [ ] Projekt mappa létezik
- [ ] `TELEPITES.bat` lefut hiba nélkül
- [ ] Összes függőség települt

---

## 📱 Alkalmazás Indítás Teszt

### Expo Indítás
- [ ] `npm start` vagy `INDITAS.bat` lefut
- [ ] QR kód megjelenik a terminálban
- [ ] Expo DevTools megnyílik a böngészőben
- [ ] Nincs error üzenet

### Telefon Csatlakozás
- [ ] Expo Go app telepítve
- [ ] Telefon és PC ugyanazon WiFi-n van
- [ ] QR kód beolvasása sikeres
- [ ] App letöltődik a telefonra

---

## 🎯 Funkcionális Tesztek

### 1. Felfedezés Képernyő

#### Swipe Gesztus
- [ ] Balra húzás működik
- [ ] Jobbra húzás működik
- [ ] Kártya forog swipe közben
- [ ] "NOPE" stamp megjelenik balra swipe-nál
- [ ] "LIKE" stamp megjelenik jobbra swipe-nál
- [ ] Kártya visszaugrik, ha nem éri el a küszöböt
- [ ] Következő profil betöltődik sikeres swipe után

#### Gombok
- [ ] X gomb (dislike) működik
- [ ] Szív gomb (like) működik
- [ ] Csillag gomb (super like) működik
- [ ] Gombok disabled állapotban, ha nincs profil

#### Match Alert
- [ ] Jobbra swipe után néha match alert jelenik meg
- [ ] Alert tartalmazza a nevet
- [ ] "Super!" gombra záródik az alert
- [ ] Match hozzáadódik a match listához

#### Profil Információk
- [ ] Név látható
- [ ] Kor látható
- [ ] Távolság km-ben látható
- [ ] Bio szöveg látható
- [ ] Érdeklődési körök láthatók (max 3)
- [ ] Profilkép betöltődik

#### Nincs Több Profil
- [ ] 10 profil után "Nincs több profil" alert
- [ ] "Újrakezdés" gomb újraindítja a listát

---

### 2. Matchek Képernyő

#### Üres Állapot
- [ ] Ha nincs match: üres állapot látható
- [ ] Szív ikon megjelenik
- [ ] "Még nincs matched" szöveg látható
- [ ] Motiváló szöveg látható

#### Match Lista
- [ ] Match-ek megjelennek a listában
- [ ] Minden match tartalmaz:
  - [ ] Profilképet
  - [ ] Nevet
  - [ ] Kort
  - [ ] Előnézeti üzenetet
  - [ ] Szív badge-et

#### Interakciók
- [ ] Match-re kattintva chat nyílik
- [ ] Lista scrollozható
- [ ] Smooth animációk

---

### 3. Chat Képernyő

#### Megjelenés
- [ ] Modal animációval jelenik meg
- [ ] Fejléc helyes információkkal:
  - [ ] Vissza gomb
  - [ ] Profilkép
  - [ ] Név
  - [ ] "Online" státusz (zöld)

#### Üzenetek
- [ ] Kezdő üzenet látható ("Szia! Örülök...")
- [ ] Saját üzenetek jobbra, rózsaszín buborékban
- [ ] Partner üzenetek balra, szürke buborékban
- [ ] Időbélyegek láthatók
- [ ] Partner profilképe látható az üzeneteinél

#### Üzenet Küldés
- [ ] Szövegmező működik
- [ ] Több soros szöveg támogatott
- [ ] Küldés gomb inaktív üres input esetén
- [ ] Küldés gomb aktív, ha van szöveg
- [ ] Enter/küldés gombra elkül az üzenet
- [ ] Input mező törlődik küldés után
- [ ] Üzenet megjelenik a listában

#### Automatikus Válasz
- [ ] 1-3 mp múlva érkezik válasz
- [ ] Válasz megjelenik a listában
- [ ] Különböző válaszok érkeznek

#### Navigáció
- [ ] Vissza gomb bezárja a chat-et
- [ ] Visszakerülünk a match listához

---

### 4. Profil Képernyő

#### Profilinformációk
- [ ] Főkép látható
- [ ] Név és kor látható
- [ ] "Profil szerkesztése" gomb látható
- [ ] Bio szöveg látható
- [ ] Érdeklődési körök láthatók (tag-ek)

#### Fotó Galéria
- [ ] 3 fotó látható
- [ ] "+" gomb új fotó hozzáadásához
- [ ] Fotók rács elrendezésben

#### Beállítások Menü
- [ ] 4 opció látható:
  - [ ] Beállítások (rózsaszín)
  - [ ] Biztonság (zöld)
  - [ ] Előfizetés (sárga)
  - [ ] Súgó (kék)
- [ ] Minden opciónak van ikonja
- [ ] Chevron látható jobb oldalon

#### Egyéb
- [ ] Kijelentkezés gomb látható
- [ ] Verziószám látható lent

---

## 🎨 UI/UX Tesztek

### Vizuális Megjelenés
- [ ] Színek konzisztensek (rózsaszín brand szín)
- [ ] Betűméretek jól olvashatók
- [ ] Gombok elég nagyok (könnyű megnyomni)
- [ ] Képek élesek
- [ ] Árnyékok finomak

### Animációk
- [ ] Smooth (60 FPS)
- [ ] Nincs lag
- [ ] Spring animációk természetesek
- [ ] Fade effektek működnek

### Navigáció
- [ ] Tab bar alul látható
- [ ] 3 tab ikon látható
- [ ] Aktív tab rózsaszín
- [ ] Inaktív tabok szürkék
- [ ] Tab váltás instant

### Responsive
- [ ] Különböző képernyőméreteken működik
- [ ] Tájolás változtatása (ha engedélyezett)
- [ ] Biztonságos területek figyelembe vannak véve

---

## ⚡ Teljesítmény Tesztek

### Sebesség
- [ ] App indítása < 3 mp
- [ ] Swipe animáció smooth
- [ ] Navigáció között nincs lag
- [ ] Képek gyorsan betöltődnek
- [ ] Chat üzenetek instant megjelennek

### Memória
- [ ] Nincs memory leak
- [ ] App nem crashel hosszú használat után
- [ ] Scrollozás smooth nagy listáknál

---

## 🐛 Hiba Tesztek

### Edge Case-ek
- [ ] Mi történik, ha nincs internet? (képek)
- [ ] Mi történik, ha elfogynak a profilok?
- [ ] Mi történik, ha nincs match?
- [ ] Mi történik, ha üres üzenetet próbálunk küldeni?

### Hibaüzenetek
- [ ] Értelmes hibaüzenetek
- [ ] Alert-ek jól formázottak
- [ ] Gombok letiltódnak szükség esetén

---

## 📊 Teszt Eredmények Rögzítése

### Teszt Információk
- **Dátum**: _______________
- **Tesztelő**: _______________
- **Eszköz**: _______________
- **OS verzió**: _______________
- **App verzió**: 1.0.0

### Összesített Eredmény
- **Összes teszt**: ______ / ______
- **Sikeres**: ______
- **Sikertelen**: ______
- **Átmenet**: ✅ / ❌

### Talált Hibák

1. **Hiba leírása**: _______________
   - **Súlyosság**: Alacsony / Közepes / Magas
   - **Ismételhető**: Igen / Nem
   - **Lépések**: _______________

2. **Hiba leírása**: _______________
   - **Súlyosság**: Alacsony / Közepes / Magas
   - **Ismételhető**: Igen / Nem
   - **Lépések**: _______________

---

## 🎯 Elfogadási Kritériumok

Az alkalmazás használatra kész, ha:

✅ Összes fő funkció működik  
✅ Nincs kritikus bug  
✅ UI/UX megfelelő  
✅ Teljesítmény elfogadható (smooth animációk)  
✅ Minden képernyő elérhető  
✅ Navigáció működik  

---

## 🔧 Hibaelhárítási Gyors Segítség

### App nem indul
```bash
# Cache törlés
npx expo start -c
```

### Függőség hiba
```bash
# Újratelepítés
rm -rf node_modules
npm install
```

### Telefon nem csatlakozik
- Ellenőrizd a WiFi kapcsolatot
- Restart Expo Go app
- Restart dev server

---

**Sikeres tesztelést!** 🎉

