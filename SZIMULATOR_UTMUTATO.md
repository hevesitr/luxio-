# 📱 Szimulátor Tesztelés - Részletes Útmutató

## ✅ Lehetőségek Windows-on

### 1. 🤖 **Android Emulator** (AJÁNLOTT)

#### Előfeltételek:
1. **Android Studio** telepítése:
   - Töltsd le: https://developer.android.com/studio
   - Telepítsd az Android Studio-t
   - Nyisd meg az Android Studio-t

2. **Android SDK és Emulator beállítása:**
   - Android Studio → **More Actions** → **SDK Manager**
   - Telepítsd az **Android SDK** legújabb verzióját
   - Telepítsd az **Android Emulator**-t

3. **Virtuális eszköz létrehozása:**
   - Android Studio → **More Actions** → **Virtual Device Manager**
   - Kattints a **Create Device** gombra
   - Válassz egy eszközt (pl. **Pixel 5** vagy **Pixel 6**)
   - Válassz egy rendszerképet (pl. **Android 13** vagy **Android 14**)
   - Kattints **Finish**

#### Futtatás:

**1. Indítsd el az Android Emulator-t:**
   - Android Studio → **Virtual Device Manager**
   - Kattints a **Play** gombra a kívánt eszköz mellett
   - Várj, amíg elindul az emulator

**2. Futtasd az alkalmazást:**
```bash
cd C:\Users\heves\Desktop\dating-app
npm run android
```

Vagy:
```bash
npx expo start --android
```

Az Expo automatikusan felismeri a futó emulatort és telepíti az alkalmazást!

---

### 2. 🌐 **Web Böngésző** (LEGEGYSZERŰBB)

Ez a legegyszerűbb módszer, nincs szükség Android Studio-ra!

```bash
cd C:\Users\heves\Desktop\dating-app
npm run web
```

Vagy:
```bash
npx expo start --web
```

Ez megnyitja az alkalmazást a böngészőben (általában `http://localhost:8081`).

**⚠️ Megjegyzés:** Néhány funkció (pl. kamera, GPS) nem működik a web verzióban, de a legtöbb UI/UX teszteléshez tökéletes!

---

### 3. 📱 **Expo Go Valódi Telefonon** (AJÁNLOTT VALÓDI TESZTHEZ)

Ez a legjobb módszer valódi telefon funkciók teszteléséhez:

1. **Töltsd le az Expo Go app-ot:**
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
   - iOS: https://apps.apple.com/app/expo-go/id982107779

2. **Indítsd el az Expo-t:**
```bash
npx expo start
```

3. **Szkenneld be a QR kódot:**
   - Android: Expo Go app → **Scan QR code**
   - iOS: Kamera app → QR kód szkennelés

---

## 🎯 Gyors Összehasonlítás

| Módszer | Könnyűség | Valós Funkciók | Teljesítmény |
|---------|-----------|----------------|--------------|
| **Web** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Android Emulator** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Expo Go Telefon** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🚀 Gyors Start (Android Emulator)

### 1. Telepítés (Egyszer):
```bash
# 1. Töltsd le és telepítsd az Android Studio-t
# 2. Nyisd meg az Android Studio-t
# 3. SDK Manager → Telepítsd az SDK-t
# 4. Virtual Device Manager → Hozz létre egy eszközt
```

### 2. Használat (Minden alkalommal):
```bash
# 1. Indítsd el az Android Emulator-t (Android Studio-ból)
# 2. Futtasd:
cd C:\Users\heves\Desktop\dating-app
npm run android
```

---

## 💡 Tippek

### Android Emulator Optimalizálás:
1. **Hardware Acceleration:**
   - Windows-on engedélyezd a **Hyper-V**-t vagy **HAXM**-et
   - Android Studio → **Tools** → **SDK Manager** → **SDK Tools** → **Intel x86 Emulator Accelerator**

2. **Teljesítmény:**
   - Használj **x86_64** rendszerképet (gyorsabb, mint ARM)
   - Növeld az emulator RAM-ját (4GB+ ajánlott)
   - Engedélyezd a **Graphics: Hardware - GLES 2.0** opciót

3. **Gyorsabb indítás:**
   - Ne zárd be az emulatort, csak állítsd szüneteltetésre
   - Használj **Quick Boot** opciót

### Web Tesztelés:
- **Chrome DevTools:** F12 → Device Toolbar (Ctrl+Shift+M)
- **Responsive Design:** Teszteld különböző képernyőméreteken
- **Touch Events:** Chrome-ban szimulálhatod az érintést

---

## 🐛 Hibaelhárítás

### "Android Emulator not found"
```bash
# Ellenőrizd, hogy fut-e az emulator:
adb devices
```

Ha nem jelenik meg, indítsd el az emulatort Android Studio-ból.

### "Expo Go not connecting"
- Győződj meg, hogy a telefon és PC **ugyanazon a WiFi-n** van
- Próbáld ki a **Tunnel** módot:
```bash
npx expo start --tunnel
```

### "Web version not loading"
- Ellenőrizd, hogy a port szabad-e (8081)
- Próbáld másik porton:
```bash
npx expo start --web --port 3000
```

---

## 📊 Ajánlott Workflow

### Fejlesztés során:
1. **Web böngésző** - Gyors UI változtatások teszteléséhez
2. **Android Emulator** - Funkciók teszteléséhez
3. **Valódi telefon** - Végleges teszteléshez

### Teljesítmény tesztelés:
- **Valódi telefon** - Legjobb teljesítmény
- **Android Emulator** - Közepes teljesítmény
- **Web** - Leggyorsabb, de nem valós

---

## ✅ Ellenőrző Lista

### Android Emulator:
- [ ] Android Studio telepítve
- [ ] Android SDK telepítve
- [ ] Virtuális eszköz létrehozva
- [ ] Emulator elindítva
- [ ] `adb devices` mutatja az eszközt

### Web:
- [ ] Node.js telepítve
- [ ] Függőségek telepítve (`npm install`)
- [ ] Port 8081 szabad

### Expo Go:
- [ ] Expo Go app letöltve
- [ ] Telefon és PC ugyanazon a WiFi-n
- [ ] QR kód szkennelhető

---

## 🎉 Készen vagy!

Most már tudod tesztelni az alkalmazást szimulátorral is! 

**Ajánlás:** Kezd a **web verzióval** (leggyorsabb), majd ha minden működik, teszteld az **Android Emulator-ban** a valódi funkciókkal!

