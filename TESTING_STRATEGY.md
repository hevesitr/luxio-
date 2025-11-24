# 🧪 Tesztelési Stratégia - Luxio

**Dátum:** 2024  
**Verzió:** 1.0.0  
**Cél:** Teljes körű tesztelési terv App Store/Play Store feltöltéshez

---

## 📋 TARTALOMJEGYZÉK

1. [Unit Tesztek](#unit-tesztek)
2. [Integration Tesztek](#integration-tesztek)
3. [End-to-End (E2E) Tesztek](#end-to-end-e2e-tesztek)
4. [Terheléses Tesztek](#terheléses-tesztek)
5. [Biztonsági Tesztek](#biztonsági-tesztek)
6. [Médiafeltöltési Tesztek](#médiafeltöltési-tesztek)
7. [Fizetési Tesztek](#fizetési-tesztek)
8. [Manuális Tesztelési Checklist](#manuális-tesztelési-checklist)

---

## 🔬 UNIT TESZTEK

### Cél: 95%+ coverage kritikus moduloknál

### Tesztelendő Szolgáltatások

#### 1. **LocationService**
```javascript
describe('LocationService', () => {
  test('calculateDistance - valid coordinates', () => {
    // Haversine formula tesztelés
  });
  
  test('updateProfileDistances - null location handling', () => {
    // Null check tesztelés
  });
  
  test('getCurrentLocation - permission denied', () => {
    // Permission handling
  });
});
```

**Coverage cél:** 100%

---

#### 2. **AIRecommendationService**
```javascript
describe('AIRecommendationService', () => {
  test('getRecommendations - valid input', () => {
    // AI ajánlások generálása
  });
  
  test('extractRelationshipGoal - various inputs', () => {
    // Kapcsolati cél kinyerés
  });
  
  test('extractLocation - location parsing', () => {
    // Helyszín kinyerés
  });
  
  test('getRecommendations - empty profiles array', () => {
    // Edge case kezelés
  });
});
```

**Coverage cél:** 95%

---

#### 3. **PremiumService**
```javascript
describe('PremiumService', () => {
  test('getUserTier - default FREE', () => {
    // Alapértelmezett tier
  });
  
  test('setUserTier - valid tier', () => {
    // Tier beállítás
  });
  
  test('canSwipe - free tier limit', () => {
    // Swipe limit ellenőrzés
  });
  
  test('canBoost - monthly limit', () => {
    // Boost limit ellenőrzés
  });
});
```

**Coverage cél:** 100%

---

#### 4. **GamificationService**
```javascript
describe('GamificationService', () => {
  test('trackEvent - like event', () => {
    // Like esemény követése
  });
  
  test('getStreaks - daily streak calculation', () => {
    // Streak számítás
  });
  
  test('checkAndAwardBadges - badge awarding', () => {
    // Badge odaítélés
  });
});
```

**Coverage cél:** 90%

---

#### 5. **StoryService**
```javascript
describe('StoryService', () => {
  test('createStory - valid story data', () => {
    // Story létrehozás
  });
  
  test('getAllStories - expired stories removal', () => {
    // Lejárt story-k törlése
  });
  
  test('addView - view tracking', () => {
    // Megtekintés követés
  });
});
```

**Coverage cél:** 90%

---

### Tesztelési Framework

**Javasolt:** Jest + React Native Testing Library

```json
{
  "devDependencies": {
    "@testing-library/react-native": "^12.0.0",
    "@testing-library/jest-native": "^5.4.0",
    "jest": "^29.0.0",
    "jest-expo": "~50.0.0"
  }
}
```

---

## 🔗 INTEGRATION TESZTEK

### 1. **Profil Böngészés Flow**
```javascript
describe('Profile Browsing Integration', () => {
  test('Swipe left → Profile removed', async () => {
    // Swipe balra → Profil eltávolítva
  });
  
  test('Swipe right → Match check', async () => {
    // Swipe jobbra → Match ellenőrzés
  });
  
  test('Double tap → Like animation', async () => {
    // Dupla tap → Like animáció
  });
  
  test('Video profile → Playback', async () => {
    // Video profil → Lejátszás
  });
});
```

---

### 2. **Chat Flow**
```javascript
describe('Chat Integration', () => {
  test('Send text message → Appears in chat', async () => {
    // Szöveges üzenet küldés
  });
  
  test('Send voice message → Playback works', async () => {
    // Hangüzenet küldés
  });
  
  test('Send video message → Video plays', async () => {
    // Videóüzenet küldés
  });
  
  test('Read receipt → Status updates', async () => {
    // Olvasási visszaigazolás
  });
});
```

---

### 3. **Match Flow**
```javascript
describe('Match Integration', () => {
  test('Mutual like → Match created', async () => {
    // Kölcsönös like → Match létrehozva
  });
  
  test('Match → Appears in Matches tab', async () => {
    // Match → Megjelenik Matchek fülön
  });
  
  test('Match → Chat opens', async () => {
    // Match → Chat megnyílik
  });
});
```

---

### 4. **GPS/Map Integration**
```javascript
describe('GPS/Map Integration', () => {
  test('Location permission → Map displays', async () => {
    // Helymeghatározás engedély → Térkép megjelenik
  });
  
  test('Marker click → Profile card appears', async () => {
    // Marker kattintás → Profil kártya megjelenik
  });
  
  test('Like on map → Marker changes to heart', async () => {
    // Like a térképen → Marker szívre változik
  });
});
```

---

## 🎭 END-TO-END (E2E) TESZTEK

### Tesztelési Framework

**Javasolt:** Detox (React Native E2E testing)

```json
{
  "devDependencies": {
    "detox": "^20.0.0",
    "@config-plugins/detox": "^7.0.0"
  }
}
```

---

### E2E Teszt Scenáriók

#### 1. **Regisztráció és Profil Létrehozás**
```javascript
describe('Registration E2E', () => {
  test('User can register and create profile', async () => {
    // 1. Regisztrációs képernyő megnyitása
    // 2. Email/telefon megadása
    // 3. OTP verifikáció
    // 4. Alapvető információk megadása
    // 5. Életkor ellenőrzés (18+)
    // 6. Profil fotó feltöltés
    // 7. Főoldal megjelenítése
  });
});
```

---

#### 2. **Swipe és Match Flow**
```javascript
describe('Swipe and Match E2E', () => {
  test('User can swipe and get matches', async () => {
    // 1. Főoldal megnyitása
    // 2. Profilok betöltése
    // 3. Swipe jobbra (like)
    // 4. Swipe balra (pass)
    // 5. Match esetén animáció
    // 6. Match megjelenik Matchek fülön
    // 7. Chat megnyitása
  });
});
```

---

#### 3. **Chat és Üzenetküldés**
```javascript
describe('Chat E2E', () => {
  test('User can send messages', async () => {
    // 1. Match kiválasztása
    // 2. Chat megnyitása
    // 3. Szöveges üzenet küldés
    // 4. Hangüzenet küldés
    // 5. Videóüzenet küldés
    // 6. Olvasási visszaigazolás ellenőrzése
  });
});
```

---

#### 4. **Prémium Előfizetés**
```javascript
describe('Premium Subscription E2E', () => {
  test('User can purchase premium', async () => {
    // 1. Prémium képernyő megnyitása
    // 2. Csomag kiválasztása
    // 3. Fizetési folyamat (sandbox)
    // 4. Receipt validation
    // 5. Prémium funkciók aktiválása
    // 6. Funkciók ellenőrzése
  });
});
```

---

#### 5. **Jelentés és Blokkolás**
```javascript
describe('Report and Block E2E', () => {
  test('User can report and block', async () => {
    // 1. Profil megnyitása
    // 2. Jelentés gomb
    // 3. Ok kiválasztása
    // 4. Jelentés beküldése
    // 5. Blokkolás gomb
    // 6. Blokkolás megerősítése
    // 7. Profil eltávolítva
  });
});
```

---

## ⚡ TERHELÉSES TESZTEK

### 1. **Backend API Terheléses Tesztek**

**Eszköz:** Apache JMeter vagy k6

#### Tesztelendő Endpointok:
- `/api/profiles` - Profilok lekérése
- `/api/matches` - Matchek lekérése
- `/api/messages` - Üzenetek lekérése
- `/api/search` - Keresés
- `/api/upload` - Médiafeltöltés

#### Terhelési Scenáriók:
```javascript
// 1000 egyidejű felhasználó
// 10,000 request/perc
// 1 órás teszt
// Response time < 200ms (95th percentile)
```

---

### 2. **Chat Terheléses Tesztek**

```javascript
// 100 aktív chat
// 10 üzenet/másodperc
// 1 órás teszt
// Üzenetek sorrendje helyes
// Nincs üzenet elvesztés
```

---

### 3. **Médiafeltöltés Terheléses Tesztek**

```javascript
// 50 egyidejű feltöltés
// 5MB kép/felhasználó
// 50MB videó/felhasználó
// Feltöltési idő < 30 másodperc
// Nincs memória probléma
```

---

## 🔒 BIZTONSÁGI TESZTEK

### OWASP Mobile Top 10

#### 1. **M1: Improper Platform Usage**
- ✅ Biometrikus autentikáció helyes használata
- ✅ Keychain/Keystore használata érzékeny adatokhoz
- ⚠️ **HIÁNYZIK:** Session kezelés

---

#### 2. **M2: Insecure Data Storage**
- ⚠️ **HIÁNYZIK:** AsyncStorage titkosítás
- ⚠️ **HIÁNYZIK:** Érzékeny adatok titkosítása

**Javítás:**
```javascript
// react-native-encrypted-storage használata
import EncryptedStorage from 'react-native-encrypted-storage';

// Érzékeny adatok tárolása
await EncryptedStorage.setItem('user_token', token);
```

---

#### 3. **M3: Insecure Communication**
- ⚠️ **HIÁNYZIK:** TLS 1.2+ kötelező
- ⚠️ **HIÁNYZIK:** Certificate pinning

**Javítás:**
```javascript
// react-native-cert-pinner használata
import { fetch } from 'react-native-cert-pinner';

// Certificate pinning
fetch('https://api.example.com', {
  method: 'GET',
  pins: ['sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=']
});
```

---

#### 4. **M4: Insecure Authentication**
- ❌ **HIÁNYZIK:** Autentikációs rendszer
- ❌ **HIÁNYZIK:** Jelszó kezelés
- ❌ **HIÁNYZIK:** Token refresh

---

#### 5. **M5: Insufficient Cryptography**
- ⚠️ **HIÁNYZIK:** Adat titkosítás tárolásnál
- ⚠️ **HIÁNYZIK:** API kulcsok titkosítása

---

#### 6. **M6: Insecure Authorization**
- ⚠️ **HIÁNYZIK:** Role-based access control
- ⚠️ **HIÁNYZIK:** API authorization

---

#### 7. **M7: Client Code Quality**
- ✅ Code obfuscation (production build)
- ⚠️ **HIÁNYZIK:** Debug mode ellenőrzés

---

#### 8. **M8: Code Tampering**
- ✅ Code signing (App Store/Play Store)
- ⚠️ **HIÁNYZIK:** Runtime integrity check

---

#### 9. **M9: Reverse Engineering**
- ✅ Code obfuscation
- ⚠️ **HIÁNYZIK:** Root/jailbreak detection

**Javítás:**
```javascript
// react-native-device-info használata
import DeviceInfo from 'react-native-device-info';

// Root/jailbreak detection
const isRooted = await DeviceInfo.isEmulator();
if (isRooted) {
  // Blokkolás vagy figyelmeztetés
}
```

---

#### 10. **M10: Extraneous Functionality**
- ⚠️ **HIÁNYZIK:** Debug logok eltávolítása production-ből
- ⚠️ **HIÁNYZIK:** Backdoor kódok ellenőrzése

---

### OWASP API Top 10

#### 1. **API1: Broken Object Level Authorization**
- ⚠️ **HIÁNYZIK:** Backend API
- ⚠️ **HIÁNYZIK:** Object-level authorization

---

#### 2. **API2: Broken Authentication**
- ❌ **HIÁNYZIK:** API autentikáció
- ❌ **HIÁNYZIK:** Token management

---

#### 3. **API3: Broken Object Property Level Authorization**
- ⚠️ **HIÁNYZIK:** Property-level authorization

---

#### 4. **API4: Unrestricted Resource Consumption**
- ⚠️ **HIÁNYZIK:** Rate limiting
- ⚠️ **HIÁNYZIK:** Request size limits

---

#### 5. **API5: Broken Function Level Authorization**
- ⚠️ **HIÁNYZIK:** Function-level authorization

---

#### 6. **API6: Unrestricted Access to Sensitive Business Flows**
- ⚠️ **HIÁNYZIK:** Business logic protection

---

#### 7. **API7: Server Side Request Forgery (SSRF)**
- ⚠️ **HIÁNYZIK:** URL validation
- ⚠️ **HIÁNYZIK:** SSRF protection

---

#### 8. **API8: Security Misconfiguration**
- ⚠️ **HIÁNYZIK:** Security headers
- ⚠️ **HIÁNYZIK:** Error handling

---

#### 9. **API9: Improper Inventory Management**
- ⚠️ **HIÁNYZIK:** API inventory
- ⚠️ **HIÁNYZIK:** Version management

---

#### 10. **API10: Unsafe Consumption of APIs**
- ⚠️ **HIÁNYZIK:** Input validation
- ⚠️ **HIÁNYZIK:** Output sanitization

---

## 📸 MÉDIAFELTÖLTÉSI TESZTEK

### 1. **Kép Feltöltés Tesztek**

```javascript
describe('Image Upload Tests', () => {
  test('Valid image upload (JPG, < 10MB)', async () => {
    // Érvényes kép feltöltés
  });
  
  test('Invalid file type rejection', async () => {
    // Érvénytelen fájltípus elutasítása
  });
  
  test('File size limit enforcement', async () => {
    // Fájlméret limit érvényesítése
  });
  
  test('EXIF data removal', async () => {
    // EXIF adatok eltávolítása
  });
  
  test('Geolocation strip', async () => {
    // Geolokáció eltávolítása
  });
  
  test('NSFW detection', async () => {
    // NSFW detection tesztelés
  });
});
```

---

### 2. **Videó Feltöltés Tesztek**

```javascript
describe('Video Upload Tests', () => {
  test('Valid video upload (MP4, < 50MB)', async () => {
    // Érvényes videó feltöltés
  });
  
  test('Video duration limit', async () => {
    // Videó hossz limit
  });
  
  test('Video format validation', async () => {
    // Videó formátum validáció
  });
});
```

---

### 3. **Vírusellenőrzés Tesztek**

```javascript
describe('Virus Scan Tests', () => {
  test('Clean file passes scan', async () => {
    // Tiszta fájl átmegy
  });
  
  test('Infected file rejected', async () => {
    // Fertőzött fájl elutasítva
  });
});
```

---

## 💳 FIZETÉSI TESZTEK

### 1. **App Store In-App Purchase**

```javascript
describe('App Store IAP Tests', () => {
  test('Purchase flow - sandbox', async () => {
    // 1. Product ID kiválasztás
    // 2. Purchase request
    // 3. Sandbox payment
    // 4. Receipt validation
    // 5. Premium activation
  });
  
  test('Purchase restoration', async () => {
    // Vásárlás visszaállítása
  });
  
  test('Subscription renewal', async () => {
    // Előfizetés megújítása
  });
  
  test('Cancellation flow', async () => {
    // Lemondás folyamat
  });
});
```

---

### 2. **Google Play Billing**

```javascript
describe('Google Play Billing Tests', () => {
  test('Purchase flow - sandbox', async () => {
    // 1. Product ID kiválasztás
    // 2. Purchase request
    // 3. Sandbox payment
    // 4. Token validation
    // 5. Premium activation
  });
  
  test('Purchase acknowledgment', async () => {
    // Vásárlás megerősítése
  });
  
  test('Subscription management', async () => {
    // Előfizetés kezelés
  });
});
```

---

### 3. **Visszatérítési Tesztek**

```javascript
describe('Refund Tests', () => {
  test('Refund processing', async () => {
    // Visszatérítés feldolgozása
  });
  
  test('Premium deactivation on refund', async () => {
    // Prémium deaktiválás visszatérítéskor
  });
});
```

---

## ✅ MANUÁLIS TESZTELÉSI CHECKLIST

### Regisztráció és Bejelentkezés
- [ ] Regisztráció email-lel
- [ ] Regisztráció telefonszámmal
- [ ] OTP verifikáció
- [ ] Életkor ellenőrzés (18+)
- [ ] Bejelentkezés
- [ ] Jelszó visszaállítás
- [ ] Auto-logout inaktivitás esetén

---

### Profil Kezelés
- [ ] Profil létrehozás
- [ ] Profil szerkesztés
- [ ] Profil fotó feltöltés
- [ ] Több fotó feltöltés
- [ ] Profil verifikáció
- [ ] Profil törlés

---

### Swipe és Match
- [ ] Swipe jobbra (like)
- [ ] Swipe balra (pass)
- [ ] Dupla tap (like)
- [ ] Super Like
- [ ] Match animáció
- [ ] Match megjelenik Matchek fülön
- [ ] Undo funkció

---

### Chat
- [ ] Szöveges üzenet küldés
- [ ] Hangüzenet küldés
- [ ] Videóüzenet küldés
- [ ] Olvasási visszaigazolás
- [ ] Ice breaker kérdések
- [ ] Typing indicator

---

### Prémium Funkciók
- [ ] Prémium vásárlás (sandbox)
- [ ] Prémium funkciók aktiválása
- [ ] Boost funkció
- [ ] Passport funkció
- [ ] Likes You funkció
- [ ] Top Picks funkció
- [ ] Előfizetés lemondása

---

### Biztonság
- [ ] Jelentés funkció
- [ ] Blokkolás funkció
- [ ] Safety tippek
- [ ] Segélyhívó számok
- [ ] Biometrikus autentikáció

---

### GPS/Map
- [ ] Helymeghatározás engedély
- [ ] Térkép megjelenítés
- [ ] Marker kattintás
- [ ] Profil kártya megjelenítés
- [ ] Like a térképen
- [ ] Match marker változás

---

### Médiafeltöltés
- [ ] Kép feltöltés
- [ ] Videó feltöltés
- [ ] Fájlméret limit
- [ ] Fájltípus validáció
- [ ] EXIF strip
- [ ] NSFW detection

---

## 📊 TESZTELÉSI METRIKÁK

### Coverage Célok
- **Unit tesztek:** 95%+ kritikus moduloknál
- **Integration tesztek:** 80%+ kritikus flow-knál
- **E2E tesztek:** 100% kritikus user journey-knál

### Performance Célok
- **API response time:** < 200ms (95th percentile)
- **App startup time:** < 3 másodperc
- **Swipe response time:** < 100ms
- **Chat message delivery:** < 1 másodperc

### Biztonsági Célok
- **OWASP Mobile Top 10:** 0 kritikus sebezhetőség
- **OWASP API Top 10:** 0 kritikus sebezhetőség
- **Penetration test:** 0 kritikus sebezhetőség

---

## 🚀 TESZTELÉSI ÜTEMTERV

### Fázis 1: Unit Tesztek (2 hét)
- LocationService
- AIRecommendationService
- PremiumService
- GamificationService
- StoryService

### Fázis 2: Integration Tesztek (2 hét)
- Profil böngészés flow
- Chat flow
- Match flow
- GPS/Map flow

### Fázis 3: E2E Tesztek (2 hét)
- Regisztráció flow
- Swipe és match flow
- Chat flow
- Prémium előfizetés flow
- Jelentés és blokkolás flow

### Fázis 4: Terheléses Tesztek (1 hét)
- Backend API terhelés
- Chat terhelés
- Médiafeltöltés terhelés

### Fázis 5: Biztonsági Tesztek (2 hét)
- OWASP Mobile Top 10
- OWASP API Top 10
- Penetration testing

### Fázis 6: Manuális Tesztek (1 hét)
- Teljes funkcionalitás ellenőrzés
- UI/UX ellenőrzés
- Edge case tesztelés

**Összes idő:** 10 hét

---

**Utolsó frissítés:** 2024  
**Státusz:** ⚠️ Tesztelési framework telepítése szükséges

