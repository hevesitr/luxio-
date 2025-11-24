# 🔍 Hiba Diagnosztika - Gyors Útmutató

## ⚠️ TELEFONON HIBA VAN?

### Lépések a hiba azonosításához:

#### 1️⃣ EXPO GO KONZOL NÉZÉSE

A telefonodon:
- **Rázd meg a telefont** (vagy Cmd+D / Ctrl+D)
- Megnyílik a **Developer Menu**
- Válaszd: **"Show Performance Monitor"** vagy **"Remote JS Debugging"**
- Nézd meg van-e **piros hibaüzenet**

#### 2️⃣ PC-N A TERMINÁL ELLENŐRZÉSE

A számítógépen:
- Nézd meg a **terminált ahol az Expo fut**
- Van-e **piros ERROR üzenet**?
- Másold ki a hibaüzenetet

#### 3️⃣ APP TELJESEN ÚJRATÖLTÉSE

Telefonon:
1. **Zárd be teljesen** az Expo Go app-ot
2. **Nyisd meg újra**
3. **Szkenneld be ÚJRA** a QR kódot
4. **Várj 20 másodpercet**

#### 4️⃣ CACHE TÖRLÉS

PC-n:
```bash
cd C:\Users\heves\Desktop\dating-app
npx expo start -c
```

## 🐛 GYAKORI HIBÁK ÉS MEGOLDÁSOK

### ❌ "Unable to resolve module"
```
Megoldás:
npm install
npx expo start -c
```

### ❌ "Invariant Violation"
```
Megoldás:
- Gesture Handler probléma
- App.js-ben GestureHandlerRootView kell
```

### ❌ "Cannot read property 'X' of undefined"
```
Megoldás:
- Valami undefined
- Ellenőrizd az adatokat (profiles.js)
```

### ❌ Fehér/üres képernyő
```
Megoldás:
1. Rázd meg a telefont → Developer Menu
2. "Reload"
3. Ha még mindig üres, nézd a terminált
```

### ❌ Képek nem töltődnek be
```
Megoldás:
- Internet kapcsolat?
- Unsplash elérhető?
- Próbálj más WiFi-t
```

### ❌ Swipe nem működik
```
Megoldás:
- Reanimated 4 kompatibilitás
- GestureHandlerRootView wrapper kell
- Újratöltés
```

## 📱 TELEFONON LÁTHATÓ HIBÁK TÍPUSAI

### 🔴 Piros képernyő (Red Screen of Death)
- **Mit jelent**: JavaScript hiba
- **Mit csinálj**: Olvasd el a hibaüzenetet, írd le nekem

### ⚠️ Sárga figyelmeztetés
- **Mit jelent**: Nem blokkoló figyelmeztetés
- **Mit csinálj**: Általában figyelmen kívül hagyható

### ⚪ Fehér/üres képernyő
- **Mit jelent**: Render hiba vagy loading
- **Mit csinálj**: Várj 30 mp, vagy reload (rázd meg telefont)

## 🔄 TELJES ÚJRAINDÍTÁS

Ha semmi sem működik:

1. **PC-n:**
```bash
# Állítsd le az Expo szervert
Ctrl+C

# Töröld a cache-t
Remove-Item -Recurse -Force .expo

# Indítsd újra
npx expo start -c
```

2. **Telefonon:**
- Zárd be az Expo Go app-ot teljesen
- Indítsd újra a telefont (opcionális)
- Nyisd meg az Expo Go-t
- Szkenneld be újra a QR kódot

## 📸 SCREENSHOT KÉSZÍTÉSE

Ha látod a hibát:
1. **Készíts screenshotot** a telefonon
2. **Nézd meg a terminált** PC-n
3. **Másold ki a hibaüzenetet**
4. **Írd le nekem pontosan**

## 💡 MIT ÍRJ NEKEM?

Amikor jelented a hibát, írd le:

✅ **Pontos hibaüzenet** (ha van)
✅ **Mikor történik** (induláskor? swipe-nál? stb.)
✅ **Mit csináltál** amikor a hiba jött
✅ **Látsz-e valamit** a képernyőn?
✅ **Mi van a terminálban** (PC-n)?

## 🎯 GYAKORI KÉRDÉSEK

**Q: Betöltött az app de nem látom a profilokat**
A: Nézd meg van-e internet, az Unsplash képek külső forrásból jönnek

**Q: A swipe nem működik**
A: Próbáld ujjal húzni a kártyát, nem csak tap

**Q: Minden fehér/üres**
A: Várj 20-30 másodpercet, lehet hogy még töltődik

**Q: "Unable to resolve..." hiba**
A: `npm install` majd `npx expo start -c`

**Q: App összeomlik swipe-nál**
A: Reanimated probléma, ellenőrizd GestureHandlerRootView

## ✅ ELLENŐRZŐ LISTA

Mielőtt hibát jelentesz, próbáld ezeket:

- [ ] Expo Go app újraindítva
- [ ] QR kód újra beolvasva
- [ ] Vártam 20 másodpercet
- [ ] Expo szerver újraindítva (PC)
- [ ] Cache törölve (npx expo start -c)
- [ ] Internet kapcsolat OK
- [ ] Telefon és PC ugyanazon WiFi-n
- [ ] Terminálban nincs ERROR

## 🆘 HA TOVÁBBRA IS HIBA VAN

Írd meg nekem:
```
HIBA:
[ide írd a pontos hibaüzenetet vagy leírást]

MIKOR:
[mikor történik? induláskor? swipe-nál? stb.]

TERMINÁL:
[másold ki a terminálból az ERROR sort]

KÉPERNYŐ:
[mit látsz a telefonon?]
```

---

**Segítek gyorsan megoldani, csak kell a pontos információ!** 🚀

