# 🗄️ Adatbázis Beállítás - PostgreSQL

**Dátum:** 2024  
**Verzió:** 1.0.0

---

## 📋 TARTALOMJEGYZÉK

1. [PostgreSQL Telepítés](#postgresql-telepítés)
2. [Adatbázis Létrehozása](#adatbázis-létrehozása)
3. [Kapcsolat Tesztelése](#kapcsolat-tesztelése)
4. [Migrációk Futtatása](#migrációk-futtatása)
5. [Hibaelhárítás](#hibaelhárítás)

---

## 💾 POSTGRESQL TELEPÍTÉS

### Windows

1. **Letöltés:**
   - https://www.postgresql.org/download/windows/
   - Válaszd a "Download the installer" opciót

2. **Telepítés:**
   - Futtasd a telepítőt
   - Jegyezd meg a **postgres** felhasználó jelszavát
   - Port: **5432** (alapértelmezett)

3. **Szolgáltatás indítása:**
   - Windows Services-ben keresd a "postgresql" szolgáltatást
   - Indítsd el, ha nem fut

### macOS

```bash
# Homebrew telepítése (ha nincs)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# PostgreSQL telepítése
brew install postgresql@14

# Szolgáltatás indítása
brew services start postgresql@14
```

### Linux (Ubuntu/Debian)

```bash
# Frissítés
sudo apt update

# PostgreSQL telepítése
sudo apt install postgresql postgresql-contrib

# Szolgáltatás indítása
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Automatikus indítás
```

---

## 🗄️ ADATBÁZIS LÉTREHOZÁSA

### 1. PostgreSQL Bejelentkezés

```bash
# Windows (Command Prompt vagy PowerShell)
psql -U postgres

# macOS/Linux
psql -U postgres
# vagy
sudo -u postgres psql
```

### 2. Adatbázis Létrehozása

```sql
-- Adatbázis létrehozása
CREATE DATABASE datingapp;

-- Felhasználó létrehozása (opcionális, de ajánlott)
CREATE USER datingapp_user WITH PASSWORD 'your_secure_password';

-- Jogosultságok megadása
GRANT ALL PRIVILEGES ON DATABASE datingapp TO datingapp_user;

-- Kilépés
\q
```

### 3. Kapcsolat Tesztelése

```bash
# Tesztelés az új felhasználóval
psql -U datingapp_user -d datingapp

# Vagy a postgres felhasználóval
psql -U postgres -d datingapp
```

---

## 🔧 KAPCSOLAT TESZTELÉSE

### Backend-ből

```bash
cd backend
npm run dev
```

Várható kimenet:
```
✅ Database connected successfully
info: Server running on port 3000
```

Ha hiba van:
```
❌ Database connection error: connect ECONNREFUSED
⚠️  Server will continue without database. Some features may not work.
```

### Manuális Tesztelés

```bash
# PostgreSQL CLI
psql -U postgres -d datingapp -c "SELECT version();"
```

---

## 📊 MIGRÁCIÓK FUTTATÁSA

### 1. Migrációk Futtatása

```bash
cd backend
npm run migrate
```

Ez létrehozza az összes szükséges táblát.

### 2. Seed Adatok (Opcionális)

```bash
npm run seed
```

Ez létrehoz néhány teszt felhasználót.

---

## 🔍 HIBÁELHÁRÍTÁS

### "ECONNREFUSED" Hiba

**Ok:** PostgreSQL nem fut vagy rossz beállítások

**Megoldás:**

1. **Ellenőrizd, hogy a PostgreSQL fut-e:**
   ```bash
   # Windows
   Get-Service postgresql*
   
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```

2. **Indítsd el a PostgreSQL-t:**
   ```bash
   # Windows (Services)
   # Vagy PowerShell:
   Start-Service postgresql-x64-14
   
   # macOS
   brew services start postgresql@14
   
   # Linux
   sudo systemctl start postgresql
   ```

3. **Ellenőrizd a portot:**
   ```bash
   # Windows
   netstat -an | findstr 5432
   
   # macOS/Linux
   lsof -i :5432
   ```

### "Authentication failed" Hiba

**Ok:** Hibás felhasználónév vagy jelszó

**Megoldás:**
1. Ellenőrizd a `.env` fájlban a `DB_USER` és `DB_PASSWORD` értékeket
2. Próbáld meg a `postgres` felhasználót (alapértelmezett)

### "Database does not exist" Hiba

**Ok:** Az adatbázis nincs létrehozva

**Megoldás:**
```sql
-- PostgreSQL-ben
CREATE DATABASE datingapp;
```

### "Permission denied" Hiba

**Ok:** Nincs jogosultság az adatbázishoz

**Megoldás:**
```sql
-- PostgreSQL-ben (postgres felhasználóként)
GRANT ALL PRIVILEGES ON DATABASE datingapp TO datingapp_user;
```

---

## 📝 .ENV BEÁLLÍTÁSOK

### Minimum Szükséges

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=datingapp
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false
```

### Ajánlott (Biztonságos)

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=datingapp
DB_USER=datingapp_user
DB_PASSWORD=strong_secure_password_here
DB_SSL=false
```

---

## ✅ ELLENŐRZÉSI LISTA

- [ ] PostgreSQL telepítve
- [ ] PostgreSQL szolgáltatás fut
- [ ] Adatbázis létrehozva (`datingapp`)
- [ ] Felhasználó létrehozva (opcionális)
- [ ] `.env` fájl beállítva
- [ ] Kapcsolat tesztelve
- [ ] Migrációk futtatva
- [ ] Seed adatok (opcionális)

---

## 🔗 HASZNOS PARANCSOK

```bash
# PostgreSQL verzió
psql --version

# Adatbázisok listázása
psql -U postgres -c "\l"

# Táblák listázása
psql -U postgres -d datingapp -c "\dt"

# Kapcsolatok listázása
psql -U postgres -c "SELECT * FROM pg_stat_activity;"
```

---

**Utolsó frissítés:** 2024  
**Verzió:** 1.0.0

