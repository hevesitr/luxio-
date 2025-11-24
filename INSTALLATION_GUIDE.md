# 📦 Telepítési Útmutató - Luxio

**Dátum:** 2024  
**Verzió:** 1.0.0

---

## 📋 TARTALOMJEGYZÉK

1. [Előfeltételek](#előfeltételek)
2. [Frontend Telepítés](#frontend-telepítés)
3. [Backend Telepítés](#backend-telepítés)
4. [Adatbázis Beállítás](#adatbázis-beállítás)
5. [Environment Változók](#environment-változók)
6. [Tesztelés](#tesztelés)
7. [Hibaelhárítás](#hibaelhárítás)

---

## 🔧 ELŐFELTÉTELEK

### Szükséges Szoftverek

#### Frontend
- **Node.js** 18.0.0 vagy újabb
- **npm** 9.0.0 vagy újabb (vagy **yarn** 1.22.0+)
- **Expo CLI** (`npm install -g expo-cli`)
- **Git**

#### Backend
- **Node.js** 18.0.0 vagy újabb
- **PostgreSQL** 14.0 vagy újabb
- **npm** 9.0.0 vagy újabb

#### iOS Fejlesztés (opcionális)
- **Xcode** 14.0 vagy újabb
- **CocoaPods** (`sudo gem install cocoapods`)
- **iOS Simulator** (Xcode része)

#### Android Fejlesztés (opcionális)
- **Android Studio**
- **Android SDK** (API 33+)
- **Android Emulator**

---

## 📱 FRONTEND TELEPÍTÉS

### 1. Repository Klónozása

```bash
git clone https://github.com/yourusername/dating-app.git
cd dating-app
```

### 2. Dependencies Telepítése

```bash
npm install
```

**Várható időtartam:** 2-5 perc

### 3. iOS Dependencies (csak iOS-en)

```bash
cd ios
pod install
cd ..
```

**Megjegyzés:** Ez csak akkor szükséges, ha native modulokat használsz (pl. `react-native-maps`, `react-native-webview`).

### 4. Environment Változók

Hozz létre egy `.env` fájlt a projekt gyökerében:

```env
API_BASE_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_API_URL=https://api.datingapp.com/api/v1
```

### 5. Alkalmazás Indítása

```bash
# Development server
npm start

# Vagy platform-specifikus:
npm run ios      # iOS szimulátor
npm run android  # Android emulátor
npm run web      # Web böngésző
```

### 6. Expo Go Használata

1. Telepítsd az **Expo Go** appot az eszközödre:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Olvasd be a QR kódot a terminálból vagy böngészőből

---

## 🔌 BACKEND TELEPÍTÉS

### 1. Backend Könyvtárba Lépés

```bash
cd backend
```

### 2. Dependencies Telepítése

```bash
npm install
```

### 3. PostgreSQL Beállítása

Lásd: [Adatbázis Beállítás](#adatbázis-beállítás)

### 4. Environment Változók

```bash
cp .env.example .env
```

Szerkeszd a `.env` fájlt:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=datingapp
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars
JWT_REFRESH_EXPIRES_IN=30d

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:19006

# AWS (opcionális - media upload-hoz)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=eu-central-1
AWS_S3_BUCKET=datingapp-media
```

### 5. Adatbázis Migrációk

```bash
npm run migrate
```

Ez létrehozza az összes szükséges táblát.

### 6. Seed Adatok (Opcionális)

```bash
npm run seed
```

Ez létrehoz néhány teszt felhasználót.

### 7. Backend Indítása

```bash
# Development (nodemon)
npm run dev

# Production
npm start
```

A backend a `http://localhost:3000` címen fut.

---

## 🗄️ ADATBÁZIS BEÁLLÍTÁS

### PostgreSQL Telepítés

#### macOS
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows
Töltsd le a [PostgreSQL Windows installer](https://www.postgresql.org/download/windows/)-t.

### Adatbázis Létrehozása

```bash
# PostgreSQL bejelentkezés
psql -U postgres

# Adatbázis létrehozása
CREATE DATABASE datingapp;

# Felhasználó létrehozása (opcionális)
CREATE USER datingapp_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE datingapp TO datingapp_user;

# Kilépés
\q
```

### Kapcsolat Tesztelése

```bash
psql -U postgres -d datingapp -c "SELECT version();"
```

---

## 🔐 ENVIRONMENT VÁLTOZÓK

### Frontend (.env)

```env
# API URL
API_BASE_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_API_URL=https://api.datingapp.com/api/v1

# Feature flags (opcionális)
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_CRASH_REPORTING=true
```

### Backend (.env)

Lásd: [Backend Telepítés](#backend-telepítés) - 4. lépés

---

## 🧪 TESZTELÉS

### Frontend Tesztelés

```bash
# Unit tesztek (ha vannak)
npm test

# E2E tesztek (ha vannak)
npm run test:e2e

# Linter
npm run lint
```

### Backend Tesztelés

```bash
# Unit tesztek (ha vannak)
npm test

# API tesztek (ha vannak)
npm run test:api
```

### Manuális Tesztelés

1. **Regisztráció**
   - Nyisd meg az appot
   - Regisztrálj egy új fiókot
   - Ellenőrizd az email verifikációt

2. **Bejelentkezés**
   - Jelentkezz be a regisztrált fiókkal
   - Ellenőrizd a token tárolást

3. **Profil**
   - Tölts fel profil fotókat
   - Szerkeszd a profilodat

4. **Discovery**
   - Swipe-olj profilokon
   - Használd a videó profil funkciót
   - Teszteld a térkép funkciót

---

## 🔧 HIBAELHÁRÍTÁS

### Frontend Problémák

#### "Module not found" hibák

```bash
# Töröld a node_modules-t és telepítsd újra
rm -rf node_modules
npm install
```

#### iOS Pod install hibák

```bash
cd ios
pod deintegrate
pod install
cd ..
```

#### Metro bundler cache probléma

```bash
npm start -- --reset-cache
```

### Backend Problémák

#### Adatbázis kapcsolat hiba

```bash
# Ellenőrizd a PostgreSQL szolgáltatást
# macOS:
brew services list

# Linux:
sudo systemctl status postgresql

# Ellenőrizd a .env fájlban a DB beállításokat
```

#### Port már használatban

```bash
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### Migráció hibák

```bash
# Töröld az adatbázist és hozd létre újra
psql -U postgres -c "DROP DATABASE datingapp;"
psql -U postgres -c "CREATE DATABASE datingapp;"
npm run migrate
```

---

## 📚 TOVÁBBI INFORMÁCIÓK

- [Backend README](backend/README.md)
- [API Specifikáció](backend/API_SPECIFICATION.md)
- [Adatbázis Séma](backend/DATABASE_SCHEMA.md)
- [Fejlesztési Útmutató](DEVELOPMENT_GUIDE.md)

---

**Utolsó frissítés:** 2024  
**Verzió:** 1.0.0

