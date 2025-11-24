# 🔌 Luxio Backend API

**Verzió:** 1.0.0  
**Stack:** Node.js + Express + PostgreSQL

---

## 📋 TARTALOMJEGYZÉK

1. [Telepítés](#telepítés)
2. [Konfiguráció](#konfiguráció)
3. [Adatbázis](#adatbázis)
4. [API Dokumentáció](#api-dokumentáció)
5. [Biztonság](#biztonság)
6. [Tesztelés](#tesztelés)
7. [Deployment](#deployment)

---

## 🚀 TELEPÍTÉS

### Előfeltételek
- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- npm >= 9.0.0

### Lépések

1. **Függőségek telepítése**
```bash
cd backend
npm install
```

2. **Környezeti változók beállítása**
```bash
cp .env.example .env
# Szerkeszd a .env fájlt a saját értékeiddel
```

3. **Adatbázis létrehozása**
```bash
createdb dating_app
```

4. **Adatbázis migrációk futtatása**
```bash
npm run migrate
```

5. **Seed adatok (opcionális)**
```bash
npm run seed
```

6. **Szerver indítása**
```bash
# Development
npm run dev

# Production
npm start
```

---

## ⚙️ KONFIGURÁCIÓ

### Környezeti változók (.env)

Lásd: `.env.example`

**Fontos változók:**
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Adatbázis kapcsolat
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - JWT titkosítási kulcsok (minimum 32 karakter)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` - Email küldés
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` - SMS küldés
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` - Média tárolás
- `FCM_SERVER_KEY` - Push notifications

---

## 🗄️ ADATBÁZIS

### Séma létrehozása

```bash
npm run migrate
```

Ez létrehozza az összes táblát a `DATABASE_SCHEMA.md` szerint.

### Seed adatok

```bash
npm run seed
```

---

## 📚 API DOKUMENTÁCIÓ

Lásd: `API_SPECIFICATION.md`

### Base URL
```
http://localhost:3000/api/v1
```

### Példa kérés

```bash
# Regisztráció
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "János",
    "birthDate": "1995-05-15",
    "gender": "male",
    "lookingFor": ["female"],
    "acceptTerms": true,
    "acceptPrivacy": true
  }'

# Bejelentkezés
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'

# Profilok lekérése (autentikáció szükséges)
curl -X GET http://localhost:3000/api/v1/profiles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔒 BIZTONSÁG

### Implementált biztonsági funkciók

1. **Helmet** - Security headers
2. **CORS** - Cross-Origin Resource Sharing
3. **Rate Limiting** - DDoS védelem
4. **Input Validation** - express-validator
5. **SQL Injection védelem** - Parameterized queries
6. **XSS védelem** - Data sanitization
7. **JWT Authentication** - Token-based auth
8. **Password Hashing** - bcrypt (12 rounds)
9. **HTTPS** - TLS/SSL (production)

### Biztonsági best practices

- ✅ Minden jelszó bcrypt-tel hash-elve
- ✅ JWT tokenek lejárati idővel
- ✅ Rate limiting minden endpoint-on
- ✅ Input validáció minden kérésnél
- ✅ SQL injection védelem (parameterized queries)
- ✅ XSS védelem (data sanitization)
- ✅ CORS korlátozás
- ✅ Security headers (Helmet)

---

## 🧪 TESZTELÉS

### Unit tesztek

```bash
npm test
```

### Integration tesztek

```bash
npm run test:integration
```

### E2E tesztek

```bash
npm run test:e2e
```

---

## 🚀 DEPLOYMENT

### Production környezet

1. **Környezeti változók beállítása**
   - `NODE_ENV=production`
   - Production adatbázis credentials
   - Production API keys

2. **PM2 használata (ajánlott)**
```bash
npm install -g pm2
pm2 start src/server.js --name dating-app-api
pm2 save
pm2 startup
```

3. **Nginx reverse proxy (ajánlott)**
```nginx
server {
    listen 80;
    server_name api.datingapp.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **SSL/TLS (Let's Encrypt)**
```bash
certbot --nginx -d api.datingapp.com
```

---

## 📊 MONITORING

### Logging

- **Winston** logger használata
- Log fájlok: `./logs/app.log`, `./logs/error.log`
- Log szintek: `error`, `warn`, `info`, `debug`

### Health Check

```bash
curl http://localhost:3000/health
```

---

## 🔧 FEJLESZTÉSI ÚTMUTATÓ

### Projekt struktúra

```
backend/
├── src/
│   ├── routes/          # API route-ok
│   ├── middleware/      # Middleware-ek
│   ├── controllers/     # Controller logika
│   ├── services/       # Business logika
│   ├── models/         # Adatmodell-ek
│   ├── database/       # Adatbázis migrációk
│   └── server.js       # Fő szerver fájl
├── tests/              # Tesztek
├── logs/               # Log fájlok
├── .env.example        # Környezeti változók példa
├── package.json        # NPM függőségek
└── README.md           # Ez a fájl
```

### Új endpoint hozzáadása

1. Route létrehozása `src/routes/`
2. Controller létrehozása `src/controllers/`
3. Service létrehozása `src/services/` (ha szükséges)
4. Route regisztrálása `src/server.js`-ben
5. Tesztek írása `tests/`

---

## 📝 TODO

- [ ] További route-ok implementálása (profiles, matches, messages, stb.)
- [ ] Médiafeltöltés implementálása (S3, EXIF strip, NSFW detection)
- [ ] Push notification implementálása
- [ ] Fizetési integráció (App Store/Play Store)
- [ ] GDPR funkciók teljes implementációja
- [ ] Moderáció rendszer teljes implementációja
- [ ] Unit tesztek írása
- [ ] Integration tesztek írása
- [ ] API dokumentáció (Swagger/OpenAPI)

---

## 📞 TÁMOGATÁS

Ha kérdésed van vagy problémába ütközöl, kérjük, nyiss egy issue-t a GitHub repository-ban.

---

**Utolsó frissítés:** 2024  
**Verzió:** 1.0.0

