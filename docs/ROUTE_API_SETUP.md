# 🗺️ Útvonal API Beállítás

Ez a dokumentáció leírja, hogyan kell beállítani a valódi útvonal generálást Google Directions API vagy Mapbox Directions API használatával.

## 📋 Tartalomjegyzék

- [Áttekintés](#áttekintés)
- [Google Directions API](#google-directions-api)
- [Mapbox Directions API](#mapbox-directions-api)
- [Beállítás](#beállítás)
- [Használat](#használat)
- [Fallback](#fallback)

---

## 🎯 Áttekintés

A `RouteService` lehetővé teszi valódi útvonal generálást két pont között. Támogatja a következő szolgáltatókat:

- **Google Directions API** (ajánlott)
- **Mapbox Directions API** (alternatíva)
- **Szimulált útvonal** (fallback, ha nincs API kulcs)

---

## 🔑 Google Directions API

### 1. API kulcs beszerzése

1. Látogasd meg a [Google Cloud Console](https://console.cloud.google.com/)
2. Hozz létre egy új projektet vagy válassz egy meglévőt
3. Engedélyezd a **Maps JavaScript API** és **Directions API** szolgáltatásokat
4. Hozz létre egy API kulcsot a **Credentials** menüben
5. Korlátozd a kulcsot (ajánlott):
   - **Application restrictions**: Android/iOS app
   - **API restrictions**: Directions API

### 2. Költség

- **Ingyenes**: $200 USD/ hó (első $200)
- **Utána**: $5 per 1000 kérés
- **Részletek**: [Google Maps Pricing](https://cloud.google.com/maps-platform/pricing)

### 3. Előnyök

- ✅ Pontos útvonalak
- ✅ Valós idejű forgalom adatok
- ✅ Több útvonal opció
- ✅ Távolság és idő becslés

---

## 🗺️ Mapbox Directions API

### 1. Access token beszerzése

1. Látogasd meg a [Mapbox Account](https://account.mapbox.com/)
2. Regisztrálj vagy jelentkezz be
3. Menj a **Access tokens** menübe
4. Másold ki a **Default public token**-t vagy hozz létre egy újat

### 2. Költség

- **Ingyenes**: 100,000 kérés/hó
- **Utána**: $0.50 per 1000 kérés
- **Részletek**: [Mapbox Pricing](https://www.mapbox.com/pricing/)

### 3. Előnyök

- ✅ Ingyenes kvóta
- ✅ Gyors válaszidő
- ✅ Jó teljesítmény
- ✅ Könnyű integráció

---

## ⚙️ Beállítás

### 1. Environment változók beállítása

Másold a `.env.example` fájlt `.env` névre:

```bash
cp .env.example .env
```

### 2. API kulcsok hozzáadása

Nyisd meg a `.env` fájlt és add hozzá az API kulcsokat:

```env
# Google Maps API
GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# VAGY Mapbox
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNxxxxxxxxxxxxx

# Szolgáltató választása
ROUTE_PROVIDER=google  # vagy 'mapbox'
```

### 3. Expo konfiguráció

Ha Expo-t használsz, add hozzá az `app.json`-hoz:

```json
{
  "expo": {
    "extra": {
      "googleMapsApiKey": process.env.GOOGLE_MAPS_API_KEY,
      "mapboxAccessToken": process.env.MAPBOX_ACCESS_TOKEN
    }
  }
}
```

### 4. React Native konfiguráció

Ha natív React Native-t használsz, használd a `react-native-config` csomagot:

```bash
npm install react-native-config
```

---

## 🚀 Használat

### Automatikus használat

A `LiveMapView` automatikusan használja a `RouteService`-t, ha az API kulcsok be vannak állítva:

```javascript
// A RouteService automatikusan:
// 1. Ellenőrzi az API kulcsokat
// 2. Lekéri a valódi útvonalat
// 3. Cache-eli az eredményeket
// 4. Fallback szimulált útvonalra, ha hiba van
```

### Manuális használat

```javascript
import RouteService from '../services/RouteService';

// Google Directions API
const coordinates = await RouteService.getRouteCoordinates(
  originLat,
  originLon,
  destLat,
  destLon,
  'google'
);

// Mapbox Directions API
const coordinates = await RouteService.getRouteCoordinates(
  originLat,
  originLon,
  destLat,
  destLon,
  'mapbox'
);
```

---

## 🔄 Fallback

Ha nincs API kulcs beállítva, vagy hiba történik, a `RouteService` automatikusan szimulált útvonalat használ:

- ✅ **Cubic Bezier görbe** - Valósághű görbe
- ✅ **25 pont** - Sima útvonal
- ✅ **Nincs API költség** - Teljesen ingyenes
- ⚠️ **Nem valódi útvonal** - Csak szimuláció

---

## 🐛 Hibaelhárítás

### API kulcs nem működik

1. **Ellenőrizd a kulcsot**: Másold ki újra a Google Cloud Console-ból
2. **API engedélyezve?**: Győződj meg, hogy a Directions API engedélyezve van
3. **Korlátozások**: Ellenőrizd, hogy nincs-e túl szigorú korlátozás a kulcson
4. **Kvóta**: Nézd meg, hogy nincs-e túllépve a kvóta

### Útvonal nem jelenik meg

1. **Console log**: Nézd meg a konzolt hibákért
2. **Cache**: Töröld a cache-t és próbáld újra
3. **Koordináták**: Ellenőrizd, hogy a koordináták érvényesek

### Lassú betöltés

1. **Cache**: Az útvonalak cache-elődnek, második betöltés gyorsabb
2. **API válaszidő**: A Google/Mapbox API válaszideje függ a hálózattól
3. **Több útvonal**: Ha sok útvonal van, lehet lassabb

---

## 📊 Teljesítmény

### Cache

Az útvonalak automatikusan cache-elődnek:
- **Kulcs**: `profileId-originLat-originLon-destLat-destLon`
- **Élettartam**: A komponens élettartama alatt
- **Frissítés**: Ha a koordináták változnak

### Optimalizálás

1. **Batch kérések**: Több útvonal egyszerre (jövőbeli fejlesztés)
2. **Debouncing**: Ne kérj le útvonalat minden mozgásnál
3. **Lazy loading**: Csak akkor kérj le útvonalat, ha látható

---

## 🔒 Biztonság

### API kulcs védelem

- ❌ **NE** commitold a `.env` fájlt Git-be
- ✅ Használd a `.gitignore`-t
- ✅ Korlátozd a kulcsot platformonként
- ✅ Használj környezeti változókat

### Rate limiting

- **Google**: 100 kérés/másodperc
- **Mapbox**: 600 kérés/perc
- **Fallback**: Nincs limit (szimulált)

---

## 📚 További információk

- [Google Directions API Dokumentáció](https://developers.google.com/maps/documentation/directions)
- [Mapbox Directions API Dokumentáció](https://docs.mapbox.com/api/navigation/directions/)
- [RouteService Forráskód](../src/services/RouteService.js)

---

## ✅ Összefoglalás

1. **Szerezz API kulcsot** (Google vagy Mapbox)
2. **Add hozzá a `.env` fájlhoz**
3. **Indítsd újra az alkalmazást**
4. **Élvezd a valódi útvonalakat!** 🎉

Ha nincs API kulcs, a szimulált útvonal automatikusan működik.

