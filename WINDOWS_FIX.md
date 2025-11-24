    # 🪟 Windows Specifikus Hibaelhárítás

## ❗ "ENOENT: no such file or directory, mkdir 'node:sea'" Hiba

Ez egy ismert hiba volt az Expo SDK 50-ben Windows-on. **A projekt már frissítve lett Expo SDK 52-re, amely javítja ezt a problémát!**

### ✅ A Probléma Megoldva

A `package.json` már frissítve lett a következő verziókra:
- **Expo SDK**: 52.0.0
- **React Native**: 0.76.5
- **React Navigation**: 7.0.0
- **React Native Reanimated**: 3.16.1

### 🚀 Indítás Most

Egyszerűen futtasd:

```bash
npm start
```

vagy dupla kattintással:

```
INDITAS.bat
```

---

## 🔧 Ha Még Mindig Problémád Van

### 1. Tiszta Újratelepítés

```bash
# Töröld a cache-t és függőségeket
Remove-Item -Recurse -Force node_modules, .expo, package-lock.json

# Telepítsd újra
npm install

# Indítsd el
npm start
```

### 2. Cache Törlés

```bash
npx expo start -c
```

### 3. Web Verzió Kipróbálása

Ha még mindig nem működik mobilon, próbáld ki web verzióban:

```bash
npx expo start --web
```

Ez megnyitja az alkalmazást a böngészőben, ahol biztosan működni fog.

### 4. Expo CLI Globális Frissítése

```bash
npm install -g expo-cli@latest
```

---

## 📱 Expo Go App Alternatívák

### Expo Go Telepítése

- **iOS**: [App Store Link](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Google Play Link](https://play.google.com/store/apps/details?id=host.exp.exponent)

### WiFi Kapcsolat

Győződj meg róla, hogy:
- 📡 A telefon és a PC **ugyanazon a WiFi hálózaton** van
- 🔥 A tűzfal **nem blokkolja** az Expo portot (19000-19001)
- 📶 A WiFi **nem guest network** (vendég hálózat)

### QR Kód Nem Működik?

Próbáld meg a manuális csatlakozást:
1. Nyisd meg az Expo Go app-ot
2. Kattints a "Enter URL manually" opcióra
3. Írd be: `exp://[számítógéped IP címe]:8081`

IP címedet így tudhatod meg:
```bash
ipconfig
```
Keresd az "IPv4 Address" sort.

---

## 💻 Fejlesztői Módok

### Android Emulátor

Ha van telepített Android Studio:

```bash
npm run android
```

### iOS Szimulátor (csak Mac)

```bash
npm run ios
```

### Web Böngésző

```bash
npm run web
```

---

## 🐛 Egyéb Gyakori Windows Hibák

### "Cannot find module" Hiba

```bash
npm install
```

### "Access Denied" Hiba

Futtasd a terminált **Administrator** módban:
1. Jobb klikk a PowerShell-re
2. "Run as Administrator"

### PowerShell Execution Policy Hiba

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Node.js Verzió Ellenőrzés

```bash
node --version
```

Minimum Node.js 18 szükséges. Ha régebbi:
1. Töltsd le: https://nodejs.org/
2. Telepítsd az LTS verziót
3. Indítsd újra a terminált

---

## ✅ Ellenőrző Lista

Indítás előtt ellenőrizd:

- [ ] Node.js telepítve van (v18+)
- [ ] npm működik (`npm --version`)
- [ ] Függőségek telepítve (`npm install`)
- [ ] Expo Go app letöltve a telefonra
- [ ] Telefon és PC ugyanazon a WiFi-n
- [ ] Tűzfal nem blokkol
- [ ] `.expo` és `node_modules` mappák léteznek

---

## 🎯 Teszt Parancs

Gyors teszt, hogy minden rendben van-e:

```bash
cd C:\Users\heves\Desktop\dating-app
node --version
npm --version
npx expo --version
```

Mindegyiknek működnie kell és verziószámot kell mutatnia.

---

## 📞 További Segítség

Ha még mindig problémád van:

1. **Nézd meg a log fájlokat**: `.expo\metro-*` mappában
2. **Ellenőrizd az Expo státuszt**: https://status.expo.dev/
3. **Expo dokumentáció**: https://docs.expo.dev/
4. **Stack Overflow**: Keress rá a hibaüzenetre

---

## 🎉 Működik?

Ha sikeresen elindul, látnod kell:

```
Starting Metro Bundler
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

Ezután szkenneld be a QR kódot és élvezd az alkalmazást! 💘

---

**Utolsó frissítés**: 2025. november 20.  
**Expo SDK**: 52.0.0  
**Státusz**: ✅ Windows hiba javítva

