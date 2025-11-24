# 💕 Luxio - Modern Társkereső Alkalmazás

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.77.0-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.0-black.svg)](https://expo.dev/)

Modern, biztonságos társkereső alkalmazás AI-alapú ajánlásokkal, videó profilokkal és fejlett biztonsági funkciókkal.

---

## 📋 TARTALOMJEGYZÉK

- [Főbb Funkciók](#főbb-funkciók)
- [Technológiai Stack](#technológiai-stack)
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
- **Node.js** + **Express**
- **PostgreSQL** (adatbázis)
- **JWT** (autentikáció)
- **bcrypt** (jelszó hashing)
- **Helmet** (biztonsági headers)
- **express-validator** (validáció)
- **Winston** (logging)

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

Hozz létre egy `.env` fájlt a projekt gyökerében:

```env
API_BASE_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_API_URL=https://api.datingapp.com/api/v1
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
- **Web:** https://hevesitr.github.io/luxio-/
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
