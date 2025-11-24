# 📝 .env Fájl Létrehozása

**Dátum:** 2024  
**Verzió:** 1.0.0

---

## 🚀 GYORS ÚTMUTATÓ

### Windows PowerShell

```powershell
cd backend

# Hozd létre a .env fájlt
New-Item -Path .env -ItemType File

# Nyisd meg szerkesztéshez
notepad .env
```

### Manuális Létrehozás

1. Nyisd meg a `backend` könyvtárat
2. Hozz létre egy új fájlt: `.env`
3. Másold be az alábbi tartalmat:

---

## 📋 .ENV TARTALOM

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=datingapp
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_SSL=false

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_characters_long
JWT_REFRESH_EXPIRES_IN=30d

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:19006

# AWS Configuration (opcionális - media upload-hoz)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=eu-central-1
AWS_S3_BUCKET=datingapp-media

# Email Configuration (opcionális - email küldéshez)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=hevesi.tr@gmail.com

# SMS Configuration (opcionális - SMS küldéshez)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Google Perspective API (opcionális - toxicity detection)
GOOGLE_PERSPECTIVE_API_KEY=your_google_perspective_api_key

# App Store Shared Secret (opcionális - receipt validation)
APP_STORE_SHARED_SECRET=your_app_store_shared_secret

# Google Play Service Account (opcionális - purchase validation)
GOOGLE_PLAY_SERVICE_ACCOUNT=/path/to/service-account.json
ANDROID_PACKAGE_NAME=com.datingapp.app
```

---

## ⚙️ MINIMUM SZÜKSÉGES BEÁLLÍTÁSOK

A szerver elindításához minimum ezek szükségesek:

```env
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

---

## 🔐 BIZTONSÁGI TIPPek

1. **Soha ne commitold a `.env` fájlt** a Git-be
2. **Használj erős jelszavakat** a JWT_SECRET-hez (minimum 32 karakter)
3. **Változtasd meg** az összes `your_*` értéket
4. **Production környezetben** használj külön, biztonságos értékeket

---

## ✅ ELLENŐRZÉS

```powershell
# Ellenőrizd, hogy a fájl létezik
Test-Path .env

# Nézd meg az első néhány sort
Get-Content .env -Head 5
```

---

**Utolsó frissítés:** 2024  
**Verzió:** 1.0.0

