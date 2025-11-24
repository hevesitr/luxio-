# 🔧 Hibaelhárítás - Backend

**Dátum:** 2024  
**Verzió:** 1.0.0

---

## ❌ GYAKORI PROBLÉMÁK ÉS MEGOLDÁSAIK

### 1. Database Connection Error: ECONNREFUSED

**Hiba:**
```
Database connection error: AggregateError [ECONNREFUSED]:
  Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Okok:**
- PostgreSQL nem fut
- Rossz port beállítás
- Firewall blokkolja a kapcsolatot

**Megoldások:**

#### A. PostgreSQL Indítása

**Windows:**
```powershell
# Ellenőrzés
Get-Service postgresql*

# Indítás
Start-Service postgresql-x64-14
# vagy a Services-ben manuálisan
```

**macOS:**
```bash
brew services start postgresql@14
```

**Linux:**
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

#### B. Port Ellenőrzése

```bash
# Windows
netstat -an | findstr 5432

# macOS/Linux
lsof -i :5432
```

Ha más porton fut, frissítsd a `.env` fájlban a `DB_PORT` értékét.

#### C. .env Fájl Ellenőrzése

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=datingapp
DB_USER=postgres
DB_PASSWORD=your_password
```

---

### 2. .env.example Not Found

**Hiba:**
```
cp: Cannot find path '.env.example' because it does not exist.
```

**Megoldás:**

A `.env.example` fájl már létrehozva van. Ha mégis hiányzik:

```bash
# Hozd létre manuálisan a backend/.env.example fájlt
# vagy másold a fenti tartalmat
```

---

### 3. Module Not Found Errors

**Hiba:**
```
Error: Cannot find module 'pg'
Error: Cannot find module 'express'
```

**Megoldás:**

```bash
cd backend
npm install
```

---

### 4. Database Does Not Exist

**Hiba:**
```
error: database "datingapp" does not exist
```

**Megoldás:**

```bash
# PostgreSQL bejelentkezés
psql -U postgres

# Adatbázis létrehozása
CREATE DATABASE datingapp;

# Kilépés
\q
```

---

### 5. Authentication Failed

**Hiba:**
```
error: password authentication failed for user "postgres"
```

**Megoldások:**

#### A. Jelszó Visszaállítása

**Windows:**
1. Nyisd meg a "pgAdmin" alkalmazást
2. Jobb klikk a "Login/Group Roles" → "postgres" → "Properties"
3. "Definition" tab → "Password" mező

**macOS/Linux:**
```bash
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'new_password';
\q
```

#### B. .env Fájl Frissítése

```env
DB_PASSWORD=new_password
```

---

### 6. Permission Denied

**Hiba:**
```
error: permission denied for database "datingapp"
```

**Megoldás:**

```sql
-- PostgreSQL-ben (postgres felhasználóként)
GRANT ALL PRIVILEGES ON DATABASE datingapp TO your_user;
```

---

### 7. Port Already in Use

**Hiba:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Megoldás:**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

---

### 8. npm audit vulnerabilities

**Figyelmeztetés:**
```
1 moderate severity vulnerability
```

**Megoldás:**

```bash
# Automatikus javítás (ha lehetséges)
npm audit fix

# Vagy manuális frissítés
npm update <package-name>
```

**Megjegyzés:** Néhány vulnerability nem kritikus, és nem blokkolja a működést.

---

### 9. Winston Logs Directory Missing

**Hiba:**
```
Error: ENOENT: no such file or directory, open './logs/error.log'
```

**Megoldás:**

```bash
cd backend
mkdir logs
```

---

### 10. Migrációk Hibák

**Hiba:**
```
error: relation "users" already exists
```

**Megoldás:**

Ez normális, ha a táblák már léteznek. A migráció script automatikusan kezeli ezt.

Ha mégis problémád van:

```sql
-- PostgreSQL-ben
DROP DATABASE datingapp;
CREATE DATABASE datingapp;
```

Majd futtasd újra:
```bash
npm run migrate
```

---

## 🔍 DEBUGGING TIPPek

### 1. Részletes Logging

```bash
# .env fájlban
LOG_LEVEL=debug
NODE_ENV=development
```

### 2. Database Connection Tesztelés

```bash
# PostgreSQL CLI
psql -U postgres -d datingapp -c "SELECT NOW();"
```

### 3. API Tesztelés

```bash
# Health check
curl http://localhost:3000/health

# Vagy böngészőben
http://localhost:3000/health
```

### 4. Environment Változók Ellenőrzése

```bash
# Node.js-ben
node -e "require('dotenv').config(); console.log(process.env.DB_HOST);"
```

---

## 📞 TOVÁBBI SEGÍTSÉG

- [PostgreSQL Dokumentáció](https://www.postgresql.org/docs/)
- [Node.js pg Dokumentáció](https://node-postgres.com/)
- [Backend README](README.md)
- [Database Setup](DATABASE_SETUP.md)

---

**Utolsó frissítés:** 2024  
**Verzió:** 1.0.0

