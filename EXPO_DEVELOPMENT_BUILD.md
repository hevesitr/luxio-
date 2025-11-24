# Expo Development Build Útmutató

## Mi az Expo Development Build?

Az **Expo Development Build** egy speciális verzió az Expo Go helyett, ami támogatja a natív modulokat (mint a `react-native-maps`).

## Két lehetőség:

### 1. **Egyszerű megoldás (Expo Go - ajánlott most)**
A térkép funkciót kikapcsoljuk, de a GPS funkció továbbra is működik:
- GPS helyzetmeghatározás ✅
- Távolság számítás ✅
- "Közelben" jelzés ✅
- Térkép ❌ (csak Development Build-ben működik)

### 2. **Development Build (ha kell a térkép)**

#### Android:
```bash
# 1. Telepítsd az EAS CLI-t
npm install -g eas-cli

# 2. Bejelentkezés
eas login

# 3. Development build létrehozása
eas build --profile development --platform android

# 4. Vagy helyi build (ha van Android Studio)
npx expo run:android
```

#### iOS (csak Mac-en):
```bash
npx expo run:ios
```

## Jelenlegi állapot

A jelenlegi kód **fallback megoldással** rendelkezik:
- Ha `react-native-maps` elérhető → térkép működik
- Ha nem elérhető → GPS funkció továbbra is működik, csak térkép nélkül

**Tehát most is működnie kell az alkalmazásnak Expo Go-ban is!** A térkép csak akkor jelenik meg, ha Development Build-et használsz.

