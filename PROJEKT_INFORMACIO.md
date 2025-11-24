# 📋 Projekt Információ - Luxio

## 🎯 Projekt Célja

Modern, Tinder-szerű társkereső mobilalkalmazás készítése React Native-vel, amely iOS és Android platformokon is működik.

## 🏗️ Architektúra

### Technológiai Stack

| Technológia | Verzió | Cél |
|------------|--------|-----|
| React | 18.2.0 | UI komponensek |
| React Native | 0.73.0 | Mobil alkalmazás alap |
| Expo | ~50.0.0 | Fejlesztői környezet |
| React Navigation | ^6.1.9 | Navigáció |
| React Native Reanimated | ~3.6.0 | Animációk |
| React Native Gesture Handler | ~2.14.0 | Gesztuskezelés |

### Komponens Struktúra

```
App.js (Root)
├── NavigationContainer
└── TabNavigator
    ├── HomeScreen (Felfedezés)
    │   └── SwipeCard
    ├── MatchesScreen (Matchek)
    │   └── ChatScreen (Modal)
    └── ProfileScreen (Profil)
```

## 📁 Fájlstruktúra Részletesen

```
dating-app/
│
├── 📱 App.js                          # Fő app komponens, navigáció
├── 📋 app.json                        # Expo konfiguráció
├── ⚙️ babel.config.js                 # Babel konfiguráció
├── 📦 package.json                    # Függőségek
├── 🚫 .gitignore                      # Git ignore szabályok
│
├── 📖 README.md                       # Teljes dokumentáció
├── 🚀 GYORSINDITAS.md                # Gyorsindítási útmutató
├── 📋 PROJEKT_INFORMACIO.md          # Ez a fájl
│
├── 🪟 TELEPITES.bat                   # Windows telepítő
├── 🪟 INDITAS.bat                     # Windows indító
│
├── 📂 src/
│   │
│   ├── 📂 components/                 # Újrafelhasználható komponensek
│   │   └── SwipeCard.js              # Swipe-olható profil kártya
│   │
│   ├── 📂 screens/                    # Képernyők
│   │   ├── HomeScreen.js             # Felfedezés (swipe)
│   │   ├── MatchesScreen.js          # Matchek listája
│   │   ├── ChatScreen.js             # Beszélgetés
│   │   └── ProfileScreen.js          # Felhasználói profil
│   │
│   └── 📂 data/                       # Statikus adatok
│       └── profiles.js               # Demo profilok
│
└── 📂 assets/                         # Képek, ikonok
    ├── icon.png                      # App ikon
    ├── splash.png                    # Splash screen
    ├── adaptive-icon.png             # Android ikon
    └── favicon.png                   # Web favicon
```

## 🎨 Design Rendszer

### Színpaletta

```css
Primary Color:   #FF3B75  /* Rózsaszín - Fő brand szín */
Success Color:   #4CAF50  /* Zöld - Like gomb */
Error Color:     #F44336  /* Piros - Dislike gomb */
Info Color:      #2196F3  /* Kék - Super like */
Warning Color:   #FFC107  /* Sárga - Figyelmeztetések */

Background:      #F5F5F5  /* Világos szürke */
Card Background: #FFFFFF  /* Fehér */
Text Primary:    #333333  /* Sötét szürke */
Text Secondary:  #999999  /* Közepes szürke */
Border:          #F0F0F0  /* Világos szürke */
```

### Tipográfia

- **Főcím**: 32px, Bold
- **Alcím**: 20px, Bold
- **Szöveg**: 16px, Regular
- **Kisszöveg**: 14px, Regular
- **Apró szöveg**: 12px, Regular

### Komponens Méretek

- **Kártya szélessége**: 90% képernyő szélesség
- **Kártya magassága**: 70% képernyő magasság
- **Gomb méret (fő)**: 70x70px
- **Gomb méret (mellék)**: 60x60px
- **Avatar méret**: 40px
- **Border radius**: 10-20px

## 🔄 Működési Folyamatok

### 1. Swipe Folyamat

```
User swipe/gomb nyomás
    ↓
Animáció lefut
    ↓
onSwipeLeft / onSwipeRight callback
    ↓
Következő profil betöltése
    ↓
(Ha jobbra) → Match ellenőrzés (50% esély)
    ↓
(Ha match) → Alert + Match hozzáadása
```

### 2. Match Folyamat

```
Sikeres swipe right
    ↓
Random match ellenőrzés
    ↓
(Ha sikeres)
    ↓
Alert megjelenítés
    ↓
Profil hozzáadása matches tömbhöz
    ↓
Match látható a Matchek fülön
```

### 3. Chat Folyamat

```
Match kiválasztása a listából
    ↓
Modal megnyitása ChatScreen-nel
    ↓
Üzenet írása
    ↓
Küldés gomb
    ↓
Üzenet megjelenítése
    ↓
(1-3 mp múlva) Automatikus válasz szimuláció
```

## 🔧 Főbb Komponensek Működése

### SwipeCard.js

**Funkciók:**
- Pan gesture kezelés (húzás)
- Animált transzformációk (forgatás, mozgás)
- "LIKE" / "NOPE" stamp megjelenítés
- Threshold ellenőrzés (mikor számít swipe-nak)
- Callback hívások

**Animációk:**
- `translateX/Y`: Kártya pozíció
- `rotate`: Forgatás (-15° és +15° között)
- `opacity`: Átlátszóság változás
- Spring animáció a visszaállításhoz

### HomeScreen.js

**Állapotok:**
- `profiles`: Összes profil lista
- `currentIndex`: Aktuális profil index

**Funkciók:**
- Swipe kezelés
- Gombok kezelése
- Match szimuláció
- "Nincs több profil" kezelés
- Újrakezdés lehetőség

### MatchesScreen.js

**Állapotok:**
- `selectedMatch`: Kiválasztott match
- `chatVisible`: Chat modal láthatósága

**Props:**
- `matches`: Match-ek tömbje (App.js-ből)

### ChatScreen.js

**Állapotok:**
- `messages`: Üzenetek tömbje
- `inputText`: Aktuális üzenet szöveg

**Funkciók:**
- Üzenet küldés
- Automatikus válasz szimuláció
- Időbélyeg formázás
- Scroll to bottom

### ProfileScreen.js

**Statikus tartalom jelenleg:**
- Felhasználói információk
- Fotók galériája
- Érdeklődési körök
- Beállítások menü

## 📊 Adatstruktúrák

### Profile objektum

```javascript
{
  id: number,
  name: string,
  age: number,
  photo: string (URL),
  distance: number (km),
  bio: string,
  interests: string[]
}
```

### Match objektum

```javascript
{
  ...Profile,
  matchedAt: Date
}
```

### Message objektum

```javascript
{
  id: number,
  text: string,
  sender: 'me' | 'them',
  timestamp: Date
}
```

## 🚀 Teljesítmény Optimalizáció

- **Reanimated 2/3**: GPU-gyorsított animációk
- **FlatList**: Virtualizált listák nagy adatmennyiséghez
- **Image caching**: Expo automatikus képgyorsítótár
- **Lazy loading**: Komponensek igény szerinti betöltése

## 🔐 Biztonsági Megfontolások (Jövő)

⚠️ **Jelenlegi állapot: DEMO**

Éles használathoz szükséges:
- 🔒 Felhasználói autentikáció (Firebase Auth)
- 🗄️ Backend szerveroldali logika
- 🔐 API kulcsok titkosítása
- 👤 Adatvédelmi beállítások
- 🚫 Jelentési/blokkolási funkciók
- ✅ Profil ellenőrzés
- 🔒 HTTPS kommunikáció

## 📈 Skálázhatóság

### Jelenlegi korlátozások:
- Statikus profil adatok
- Nincs perzisztens tárolás
- Nincs valós backend
- Szimulált match-ek

### Skálázási lépések:
1. **Firebase integráció**
   - Firestore adatbázis
   - Cloud Functions
   - Storage képeknek

2. **State management**
   - Redux vagy Context API
   - Persist state (AsyncStorage)

3. **Real-time funkciók**
   - Socket.io vagy Firebase Realtime
   - Push notifikációk (FCM)

4. **Geolokáció**
   - Expo Location API
   - Távolság alapú szűrés

## 🐛 Ismert Problémák és Megoldások

### Probléma: Animációk lassúak
**Megoldás**: Győződj meg róla, hogy a `react-native-reanimated` plugin be van állítva a babel.config.js-ben.

### Probléma: Képek nem töltődnek be
**Megoldás**: Ellenőrizd az internet kapcsolatot (Unsplash képek külső URL-ek).

### Probléma: "Expo Go" nem található hiba
**Megoldás**: Telepítsd az Expo Go app-ot a telefonodra az App Store/Play Store-ból.

## 🔄 Verziókezelés

**Jelenlegi verzió**: 1.0.0

### Semantic Versioning:
- **Major**: Visszafelé nem kompatibilis változások
- **Minor**: Új funkciók, visszafelé kompatibilis
- **Patch**: Bugfix-ek

## 📞 Support

Ha problémád van:
1. Olvasd el a README.md-t
2. Nézd meg a GYORSINDITAS.md-t
3. Ellenőrizd a PROJEKT_INFORMACIO.md-t (ez a fájl)

## 📝 Changelog

### v1.0.0 (2025-11-20)
- ✨ Kezdeti verzió
- 🎨 Swipe funkcionalitás
- 💕 Match rendszer
- 💬 Chat funkció
- 👤 Profil oldal
- 📱 Bottom tab navigáció

---

**Készítve**: 2025. november 20.  
**Státusz**: ✅ Működőképes demo  
**Platform**: iOS, Android, Web  
**Licenc**: MIT

