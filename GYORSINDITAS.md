# 🚀 Gyorsindítási Útmutató

## Lépések az alkalmazás elindításához:

### 1️⃣ Nyisd meg a projekt mappát terminálban

```bash
cd C:\Users\heves\Desktop\dating-app
```

### 2️⃣ Telepítsd a függőségeket

```bash
npm install
```

⏱️ Ez kb. 2-3 percet vesz igénybe az első alkalommal.

### 3️⃣ Indítsd el az alkalmazást

```bash
npm start
```

Vagy:

```bash
npx expo start
```

### 4️⃣ Futtasd a telefonodon

1. **Töltsd le az Expo Go app-ot:**
   - 📱 iOS: App Store-ból
   - 🤖 Android: Google Play-ről

2. **Szkenneld be a QR kódot:**
   - A terminálban megjelenő QR kódot szkenneld be az Expo Go app-pal

### 5️⃣ Élvezd! 🎉

- **Swipe balra** ❌ - Nem tetszik
- **Swipe jobbra** ✅ - Tetszik  
- **Csillag gomb** ⭐ - Super Like
- **Matchek fül** 💕 - Matcheid megtekintése
- **Profil fül** 👤 - Saját profilod szerkesztése

---

## ⚠️ Hibaelhárítás

### Ha nem indul el az alkalmazás:

1. **Töröld a cache-t:**
   ```bash
   npx expo start -c
   ```

2. **Ellenőrizd, hogy Node.js telepítve van:**
   ```bash
   node --version
   ```
   (Minimum 14-es verzió szükséges)

3. **Telepítsd újra a függőségeket:**
   ```bash
   rm -rf node_modules
   npm install
   ```

### Ha a telefonon nem jelenik meg:

- Győződj meg róla, hogy a telefon és a számítógép **ugyanazon a WiFi hálózaton** van
- Próbáld újraindítani az Expo Go app-ot
- Szkenneld be újra a QR kódot

---

## 📱 Alternatív futtatás

### Android emulátorban:
```bash
npm run android
```

### iOS szimulátorban (csak Mac):
```bash
npm run ios
```

### Böngészőben:
```bash
npm run web
```

---

## 💡 Tippek

- A **R** billentyűvel újratöltheted az app-ot
- A **D** billentyűvel megnyithatod a Developer menüt
- Az app automatikusan újratöltődik kódváltoztatáskor

---

## 🎨 Testreszabás

A kód teljes mértékben szerkeszthető:

- **Színek**: Keress rá `#FF3B75` (a fő rózsaszín szín)
- **Profilok**: `src/data/profiles.js` fájlban
- **Képernyők**: `src/screens/` mappában
- **Komponensek**: `src/components/` mappában

---

**Jó szórakozást! 💘**

