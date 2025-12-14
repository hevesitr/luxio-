# 🚀 NexusLink - Futurisztikus Társkereső Alkalmazás

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.77.0-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.0-black.svg)](https://expo.dev/)

Egyedi, modern társkereső alkalmazás AI-alapú ajánlásokkal, videó profilokkal, Spotify integrációval és fejlett prémium funkciókkal. Indigo és violet színsémával, egyedi UX dizájnnal.

---

## 📋 TARTALOMJEGYZÉK

- [Főbb Funkciók](#főbb-funkciók)
- [Technológiai Stack](#technológiai-stack)
- [Supabase Integráció](#supabase-integráció)
- [Telepítés](#telepítés)
- [Fejlesztés](#fejlesztés)
- [Backend](#backend)
- [Dokumentáció](#dokumentáció)
- [Biztonság](#biztonság)
- [Közreműködés](#közreműködés)

---

## ✨ FŐBB FUNKCIÓK

### 🎯 AI-Alapú Ajánlások
- Intelligens algoritmusok a preferenciák alapján
- Kompatibilitás számítás több mint 20 tényező alapján
- Természetes nyelvű keresés

### 📹 Videó Profilok
- TikTok-szerű videó feed
- Dupla kopp like funkció
- Full-screen swipe navigáció

### 🗺️ Élő Térkép
- GPS-alapú távolság számítás
- Kompakt profil kártyák
- Szív alakú marker-ek (liked/matched)

### 💬 Bővített Üzenetküldés
- Szöveges üzenetek
- Hangüzenetek
- Videóüzenetek
- Olvasási visszaigazolás

### 🎮 Gamifikáció
- Streak követés
- Badge-ek és achievement-ek
- Részletes statisztikák

### 🔒 Biztonság
- Profil verifikáció
- Jelentés és blokkolás
- Incognito mód
- Biometrikus hitelesítés
- EncryptedStorage

### 🌙 Sötét Mód
- Automatikus váltás
- Rendszer beállítás követés

### 💎 Prémium Funkciók
- Korlátlan like-ok
- Super Like-ok
- Boost
- Top Picks
- Passport

---

## 🛠️ TECHNOLÓGIAI STACK

### Frontend
- **React Native** 0.77.0
- **Expo** 54.0.0
- **React Navigation** 7.0.0
- **Expo AV** (videó lejátszás)
- **Expo Location** (GPS)
- **Expo Local Authentication** (biometrikus)
- **React Native Maps** (térkép)
- **React Native Encrypted Storage** (biztonságos tárolás)
- **React Native WebView** (dokumentációk)

### Backend
- **Supabase** (PostgreSQL + Real-time + Storage + Auth)
- **Node.js** + **Express** (opcionális API)
- **JWT** (autentikáció)
- **bcrypt** (jelszó hashing)
- **Helmet** (biztonsági headers)
- **express-validator** (validáció)
- **Winston** (logging)

---

## 🔥 SUPABASE INTEGRÁCIÓ

### ✅ Implementált Funkciók

#### 📊 Adatbázis
- **profiles**: Felhasználói profilok (fotók, bio, érdeklődések)
- **matches**: Match-ek kezelése (mutual like detektálás)
- **likes**: Like-ok mentése
- **passes**: Pass-ek (elutasítások)
- **messages**: Üzenetek (text, voice, video)

#### 💾 Storage
- **avatars**: Profilképek
- **photos**: Profil fotók (több kép)
- **videos**: Videó profilok
- **voice-messages**: Hangüzenetek
- **video-messages**: Videóüzenetek

#### ⚡ Real-time
- Azonnali üzenet kézbesítés
- WebSocket alapú kommunikáció
- Automatikus újracsatlakozás

#### 🔒 Biztonság
- Row Level Security (RLS) policies
- Csak saját adatok elérése
- Automatikus session kezelés

### 📦 Service Réteg

```javascript
// ProfileService - Profil kezelés
import ProfileService from './services/ProfileService';
await ProfileService.updateProfile(userId, { bio: 'Új bio' });

// SupabaseMatchService - Match kezelés
import SupabaseMatchService from './services/SupabaseMatchService';
const result = await SupabaseMatchService.saveLike(userId, likedUserId);
if (result.isMatch) { /* Match történt! */ }

// MessageService - Real-time üzenetek
import MessageService from './services/MessageService';
await MessageService.sendMessage(matchId, senderId, 'Hello!');
```

### 🚀 Setup Útmutató

**Gyors setup (15 perc):**

1. **SQL Séma futtatása**
   ```bash
   # Supabase Dashboard → SQL Editor
   # Futtasd: supabase/schema_extended.sql
   ```

2. **Storage bucket-ek létrehozása**
   ```bash
   # Supabase Dashboard → Storage
   # Hozd létre: avatars, photos, videos, voice-messages, video-messages
   ```

3. **Realtime engedélyezése**
   ```bash
   # Supabase Dashboard → Database → Replication
   # Engedélyezd: messages tábla
   ```

**Részletes útmutató:** [docs/SUPABASE_SETUP_GUIDE.md](docs/SUPABASE_SETUP_GUIDE.md)  
**Gyors referencia:** [SUPABASE_QUICK_REFERENCE.md](SUPABASE_QUICK_REFERENCE.md)

### 📱 Offline Support

Az alkalmazás offline módban is működik:
- Lokális cache AsyncStorage-ban
- Automatikus szinkronizálás online állapotban
- Optimista UI frissítések

---

## 📦 TELEPÍTÉS

### Előfeltételek

- **Node.js** 18+ 
- **npm** vagy **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **PostgreSQL** 14+ (backend-hez)

### Frontend Telepítés

```bash
# Repository klónozása
git clone https://github.com/yourusername/dating-app.git
cd dating-app

# Dependencies telepítése
npm install

# iOS dependencies (ha iOS-en fejlesztesz)
cd ios && pod install && cd ..

# Alkalmazás indítása
npm start
```

### Backend Telepítés

```bash
# Backend könyvtárba lépés
cd backend

# Dependencies telepítése
npm install

# Environment változók beállítása
cp .env.example .env
# Szerkeszd a .env fájlt a saját értékeiddel

# Adatbázis migrációk futtatása
npm run migrate

# Seed adatok (opcionális)
npm run seed

# Backend indítása
npm run dev
```

---

## 🚀 FEJLESZTÉS

### Frontend Fejlesztés

```bash
# Development server indítása
npm start

# iOS szimulátor
npm run ios

# Android emulátor
npm run android

# Web böngésző
npm run web
```

### Backend Fejlesztés

```bash
# Development server (nodemon)
npm run dev

# Production build
npm run build

# Production start
npm start
```

### Tesztelés

```bash
# Unit tesztek (ha vannak)
npm test

# E2E tesztek (ha vannak)
npm run test:e2e
```

---

## 🔧 KONFIGURÁCIÓ

### Frontend Environment

Hozz létre egy `.env` fájlt a projekt gyökerében (kiindulás: `env.example`):

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_REDIRECT_URL=https://hevesitr.github.io/luxio-/auth-callback
```

### Backend Environment

Lásd: `backend/.env.example`

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=datingapp
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d

# Server
PORT=3000
NODE_ENV=development

# AWS (opcionális)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=eu-central-1
AWS_S3_BUCKET=datingapp-media
```

---

## 📚 DOKUMENTÁCIÓ

### Főbb Dokumentációk

- [API Specifikáció](backend/API_SPECIFICATION.md)
- [Adatbázis Séma](backend/DATABASE_SCHEMA.md)
- [Biztonsági Audit](SECURITY_AUDIT.md)
- [GDPR Megfelelőség](GDPR_COMPLIANCE.md)
- [Kódellenőrzési Jelentés](CODE_REVIEW_REPORT.md)
- [Tesztelési Stratégia](TESTING_STRATEGY.md)

### Jogi Dokumentációk

- [Adatvédelmi Szabályzat](docs/PRIVACY_POLICY.md)
- [Felhasználási Feltételek](docs/TERMS_OF_SERVICE.md)
- [Biztonsági Útmutató](docs/SAFETY_GUIDELINES.md)
- [Supabase Setup](docs/SUPABASE_SETUP.md)

> GitHub Pages változatok: engedélyezd a Pages szolgáltatást (`Settings → Pages → Source: main, /docs`), majd használd a `docs/web/privacy-policy.html`, `docs/web/terms-of-service.html` és `docs/web/safety-guidelines.html` URL-eket a Play Console-ban.

### Telepítési Útmutatók

- [Backend README](backend/README.md)
- [Certificate Pinning Setup](CERTIFICATE_PINNING_SETUP.md)
- [App Store Előkészítés](APP_STORE_PREPARATION.md)

---

## 🔒 BIZTONSÁG

### Implementált Biztonsági Funkciók

- ✅ JWT autentikáció
- ✅ Password hashing (bcrypt, 12 rounds)
- ✅ EncryptedStorage (frontend)
- ✅ Certificate pinning támogatás
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection védelem
- ✅ XSS védelem
- ✅ Security headers (Helmet)
- ✅ CORS konfiguráció

### Biztonsági Audit

Lásd: [SECURITY_AUDIT.md](SECURITY_AUDIT.md)

---

## 📊 PROJEKT STRUKTÚRA

```
dating-app/
├── src/
│   ├── components/          # Reusable komponensek
│   ├── screens/             # Képernyők
│   ├── services/            # Szolgáltatások
│   ├── context/             # React Context
│   ├── data/                # Mock adatok
│   └── hooks/               # Custom hooks
├── backend/
│   ├── src/
│   │   ├── routes/          # API route-ok
│   │   ├── middleware/     # Middleware
│   │   ├── services/        # Backend szolgáltatások
│   │   └── database/       # Adatbázis scriptek
│   ├── API_SPECIFICATION.md
│   └── DATABASE_SCHEMA.md
├── docs/                    # Jogi dokumentációk
├── SECURITY_AUDIT.md
├── GDPR_COMPLIANCE.md
└── README.md
```

---

## 🤝 KÖZREMŰKÖDÉS

Közreműködés üdvözöljük! Kérjük, olvasd el a [CONTRIBUTING.md](CONTRIBUTING.md) fájlt (ha létezik).

### Fejlesztési Folyamat

1. Fork a repository-t
2. Hozz létre egy feature branch-et (`git checkout -b feature/AmazingFeature`)
3. Commit a változtatásaidat (`git commit -m 'Add some AmazingFeature'`)
4. Push a branch-re (`git push origin feature/AmazingFeature`)
5. Nyiss egy Pull Request-et

---

## 📝 LICENC

Ez a projekt MIT licenc alatt áll. Lásd: [LICENSE](LICENSE) fájl.

---

## 📞 KAPCSOLAT

- **Email:** hevesi.tr@gmail.com
- **Web:** https://hevesitr.github.io/lovex-/
- **GitHub:** https://github.com/yourusername/dating-app

---

## 🙏 KÖSZÖNETNYILVÁNÍTÁS

- [Expo](https://expo.dev/) - React Native framework
- [React Navigation](https://reactnavigation.org/) - Navigation library
- [PostgreSQL](https://www.postgresql.org/) - Adatbázis
- Minden közreműködő és felhasználó

---

**Utolsó frissítés:** 2024  
**Verzió:** 1.0.0


---

## 🔄 LEGUTÓBBI FRISSÍTÉSEK (2025. December 3.)

### ✅ Biztonsági Alapok Implementálva
- **RLS Szabályzatok**: 9 tábla teljes Row Level Security védelemmel
- **Token-alapú Auth**: JWT token kezelés automatikus frissítéssel
- **Jelszó Titkosítás**: bcrypt hash-elés (min 10 kör)
- **Session Kezelés**: Automatikus session visszaállítás

### ✅ Service Layer Architecture
- **BaseService**: Egységes alap szolgáltatás osztály
- **ServiceError**: Szabványosított hibakezelés (9 kategória)
- **ProfileService**: Teljes profil kezelés (fotók, prompt-ok)
- **StorageService**: Fájl feltöltés + képtömörítés (max 200KB)
- **LocationService**: GPS + Haversine távolság számítás

### 📊 Statisztikák
- **20 fájl** létrehozva/frissítve
- **~2,820 sor** új kód
- **~77 új funkció**
- **18 követelmény** teljesítve

### 📚 Új Dokumentáció
- `docs/SECURITY_IMPLEMENTATION.md` - Biztonsági implementáció
- `docs/SERVICE_LAYER_ARCHITECTURE.md` - Service Layer útmutató
- `docs/AUTHSERVICE_INICIALIZALAS.md` - AuthService használat
- `QUICK_REFERENCE_SERVICES.md` - Gyors referencia
- `SESSION_COMPLETE_DEC03_2025_REFACTOR.md` - Session összefoglaló

---

## 🚀 GYORS INDÍTÁS

### Előfeltételek
```bash
node >= 18.0.0
npm >= 9.0.0
expo-cli
```

### Telepítés
```bash
# Függőségek telepítése
npm install

# Expo indítása
npm start

# Android
npm run android

# iOS
npm run ios
```

### Környezeti Változók
Hozz létre egy `.env` fájlt:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

---

## 🔐 BIZTONSÁG

### Implementált Biztonsági Funkciók
- ✅ Row Level Security (RLS) minden táblán
- ✅ JWT token-alapú hitelesítés
- ✅ Automatikus token frissítés
- ✅ Bcrypt jelszó hash-elés (min 10 kör)
- ✅ Titkosított token tárolás
- ✅ Session lejárat kezelés

### Biztonsági Ellenőrzés
```bash
node scripts/verify-security-implementation.js
```

---

## 📖 DOKUMENTÁCIÓ

### Magyar Útmutatók
- [Biztonsági Telepítés](docs/SECURITY_SETUP_GUIDE.md)
- [Service Layer Architektúra](docs/SERVICE_LAYER_ARCHITECTURE.md)
- [AuthService Használat](docs/AUTHSERVICE_INICIALIZALAS.md)
- [Gyors Referencia](QUICK_REFERENCE_SERVICES.md)

### Supabase
- [RLS Szabályzatok](supabase/rls_policies.sql)
- [Auth Konfiguráció](supabase/auth_config.md)
- [Schema](supabase/schema_extended.sql)

---

## 🛠️ FEJLESZTÉS

### Projekt Struktúra
```
src/
├── services/          # Szolgáltatási réteg
│   ├── AuthService.js
│   ├── ProfileService.js
│   ├── StorageService.js
│   ├── LocationService.js
│   ├── BaseService.js
│   └── ServiceError.js
├── screens/           # Képernyők
├── components/        # Komponensek
└── context/          # Context API

supabase/
├── rls_policies.sql  # RLS szabályzatok
├── schema_extended.sql
└── auth_config.md

docs/                 # Dokumentáció
```

### Szolgáltatások Használata
```javascript
// Hitelesítés
import AuthService from './src/services/AuthService';
const result = await AuthService.signIn(email, password);

// Profil
import ProfileService from './src/services/ProfileService';
const result = await ProfileService.getProfile(userId);

// Fájl feltöltés
import StorageService from './src/services/StorageService';
const result = await StorageService.uploadImage(userId, photoUri, 'photos');

// Helymeghatározás
import LocationService from './src/services/LocationService';
const result = await LocationService.getCurrentLocation();
```

---

## 📈 PROJEKT STÁTUSZ

### Befejezett Fázisok
- ✅ **Fázis 1**: Biztonsági Alapok (100%)
- ✅ **Fázis 2**: Service Layer Architecture (100%)

### Folyamatban
- ⏳ **Fázis 3**: Discovery and Matching (0%)
- ⏳ **Fázis 4**: Real-time Messaging (0%)
- ⏳ **Fázis 5**: Premium Features (0%)

**Teljes Projekt Előrehaladás: 20%** 📊

---

## 🤝 KÖZREMŰKÖDÉS

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

---

## 📄 LICENC

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 KAPCSOLAT

- **GitHub**: [hevesitr/luxio](https://github.com/hevesitr/luxio)
- **Email**: support@lovex.app

---

**Utolsó frissítés**: 2025. December 3.
**Verzió**: 1.0.0-beta
**Státusz**: 🚧 Fejlesztés alatt
