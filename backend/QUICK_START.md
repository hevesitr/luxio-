# 🚀 Gyors Indítás - Backend

**Dátum:** 2024  
**Verzió:** 1.0.0

---

## ⚡ 5 PERCES BEÁLLÍTÁS

### 1. Environment Fájl Létrehozása

**Ha a `.env.example` fájl nem létezik, hozd létre manuálisan:**

```powershell
cd backend
# Hozd létre a .env.example fájlt (lásd alább a tartalmat)
# Majd másold:
Copy-Item .env.example .env
```

**Vagy hozd létre közvetlenül a `.env` fájlt:**

```powershell
cd backend
# Másold az alábbi tartalmat egy új .env fájlba
```

### 2. .env Fájl Szerkesztése

Nyisd meg a `.env` fájlt és állítsd be a minimum szükséges értékeket:

```env
# Minimum szükséges beállítások
DB_HOST=localhost
DB_PORT=5432
DB_NAME=datingapp
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_SSL=false

JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_characters_long

PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:19006
```

### 3. PostgreSQL Telepítés (Ha Nincs)

#### Windows
1. Töltsd le: https://www.postgresql.org/download/windows/
2. Telepítsd a PostgreSQL-t
3. Jegyezd meg a postgres felhasználó jelszavát

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

### 4. Adatbázis Létrehozása

```bash
# PostgreSQL bejelentkezés
psql -U postgres

# Adatbázis létrehozása
CREATE DATABASE datingapp;

# Kilépés
\q
```

### 5. Szerver Indítása

```bash
npm run dev
```

A szerver a `http://localhost:3000` címen fut.

---

## ✅ ELLENŐRZÉS

### Health Check

```bash
curl http://localhost:3000/health
```

Várható válasz:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123.45,
  "database": "connected"
}
```

---

## ⚠️ HIBAELHÁRÍTÁS

### "Database connection error: ECONNREFUSED"

**Ok:** PostgreSQL nem fut vagy rossz beállítások

**Megoldás:**
1. Ellenőrizd, hogy a PostgreSQL fut-e:
   ```bash
   # Windows
   Get-Service postgresql*
   
   # macOS/Linux
   brew services list  # macOS
   sudo systemctl status postgresql  # Linux
   ```

2. Indítsd el a PostgreSQL-t:
   ```bash
   # Windows (Services)
   # macOS
   brew services start postgresql@14
   
   # Linux
   sudo systemctl start postgresql
   ```

3. Ellenőrizd a `.env` fájlban a beállításokat

### ".env.example not found"

**Megoldás:**
A `.env.example` fájl már létrehozva van. Ha mégis hiányzik:

```bash
# Hozd létre manuálisan
touch .env.example
# vagy másold a fenti tartalmat
```

### "Cannot find module 'pg'"

**Megoldás:**
```bash
npm install
```

---

## 📝 MEGJEGYZÉSEK

- A szerver **folytatja a működését** akkor is, ha nincs adatbázis kapcsolat
- Az API endpoint-ok **hibát adnak vissza**, ha nincs adatbázis
- A kapcsolat **automatikusan újrapróbálkozik** 30 másodpercenként

---

**Utolsó frissítés:** 2024  
**Verzió:** 1.0.0

