# 🚀 Deployment Útmutató - Luxio

**Dátum:** 2024  
**Verzió:** 1.0.0

---

## 📋 TARTALOMJEGYZÉK

1. [Előfeltételek](#előfeltételek)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Adatbázis Setup](#adatbázis-setup)
5. [Environment Változók](#environment-változók)
6. [SSL/TLS Konfiguráció](#ssltls-konfiguráció)
7. [Monitoring](#monitoring)

---

## 🔧 ELŐFELTÉTELEK

### Szükséges Szolgáltatások

- **VPS/Cloud Server** (AWS, DigitalOcean, Hetzner, stb.)
- **Domain név** (pl. api.datingapp.com)
- **SSL Certificate** (Let's Encrypt vagy más)
- **PostgreSQL** adatbázis
- **Node.js** 18+ a szerveren
- **PM2** vagy hasonló process manager
- **Nginx** reverse proxy-hez

---

## 🔌 BACKEND DEPLOYMENT

### 1. Szerver Előkészítése

```bash
# SSH kapcsolat
ssh user@your-server.com

# Node.js telepítése
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 telepítése
sudo npm install -g pm2

# PostgreSQL telepítése
sudo apt-get install postgresql postgresql-contrib
```

### 2. Projekt Klónozása

```bash
# Projekt könyvtár
cd /var/www
git clone https://github.com/yourusername/dating-app.git
cd dating-app/backend
npm install --production
```

### 3. Environment Változók

```bash
# .env fájl létrehozása
cp .env.example .env
nano .env
```

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=datingapp
DB_USER=datingapp_user
DB_PASSWORD=secure_password_here
DB_SSL=true

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars_production
JWT_REFRESH_EXPIRES_IN=30d

# Server
PORT=3000
NODE_ENV=production

# CORS
CORS_ORIGIN=https://hevesitr.github.io/luxio-/

# AWS
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=eu-central-1
AWS_S3_BUCKET=datingapp-media-prod
```

### 4. Adatbázis Migrációk

```bash
npm run migrate
npm run seed  # Opcionális
```

### 5. PM2 Konfiguráció

```bash
# PM2 ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'dating-app-backend',
    script: './src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
  }],
};
```

```bash
# PM2 indítás
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Nginx Konfiguráció

```bash
sudo nano /etc/nginx/sites-available/dating-app-api
```

```nginx
server {
    listen 80;
    server_name api.datingapp.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.datingapp.com;

    ssl_certificate /etc/letsencrypt/live/api.datingapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.datingapp.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Symlink létrehozása
sudo ln -s /etc/nginx/sites-available/dating-app-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.datingapp.com
```

---

## 📱 FRONTEND DEPLOYMENT

### 1. Expo Build

```bash
# Development build
eas build --platform ios --profile development
eas build --platform android --profile development

# Production build
eas build --platform ios --profile production
eas build --platform android --profile production
```

### 2. EAS Konfiguráció

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "your-app-id",
        "appleTeamId": "your-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./service-account.json",
        "track": "production"
      }
    }
  }
}
```

### 3. App Store Submission

```bash
# iOS
eas submit --platform ios --profile production

# Android
eas submit --platform android --profile production
```

---

## 🗄️ ADATBÁZIS SETUP

### PostgreSQL Production Konfiguráció

```bash
# PostgreSQL konfiguráció
sudo nano /etc/postgresql/14/main/postgresql.conf

# Módosítások:
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

```bash
# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Backup Script

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/postgresql"
mkdir -p $BACKUP_DIR

pg_dump -U datingapp_user -d datingapp > $BACKUP_DIR/datingapp_$DATE.sql

# Törlés 30 napnál régebbi backup-ok
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
```

```bash
# Cron job (napi backup)
0 2 * * * /path/to/backup.sh
```

---

## 🔐 ENVIRONMENT VÁLTOZÓK

### Production Checklist

- [ ] `NODE_ENV=production`
- [ ] Erős JWT secret-ek (minimum 32 karakter)
- [ ] Biztonságos adatbázis jelszó
- [ ] CORS origin beállítva
- [ ] AWS credentials (ha használod)
- [ ] Email service credentials (SMTP)
- [ ] SMS service credentials (Twilio, stb.)

---

## 🔒 SSL/TLS KONFIGURÁCIÓ

### Certificate Pinning

Lásd: [CERTIFICATE_PINNING_SETUP.md](CERTIFICATE_PINNING_SETUP.md)

### Nginx SSL Best Practices

```nginx
# Modern SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

---

## 📊 MONITORING

### PM2 Monitoring

```bash
# PM2 monitoring
pm2 monit

# PM2 logs
pm2 logs dating-app-backend

# PM2 status
pm2 status
```

### Logging

```bash
# Winston logs
tail -f /var/www/dating-app/backend/logs/combined.log
tail -f /var/www/dating-app/backend/logs/error.log
```

### Health Check Endpoint

```javascript
// backend/src/routes/health.js
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
```

---

## 🔄 CI/CD PIPELINE

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy Backend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/dating-app/backend
            git pull
            npm install --production
            npm run migrate
            pm2 restart dating-app-backend
```

---

## ✅ DEPLOYMENT CHECKLIST

### Backend
- [ ] Szerver előkészítve
- [ ] Node.js telepítve
- [ ] PostgreSQL konfigurálva
- [ ] Environment változók beállítva
- [ ] Adatbázis migrációk futtatva
- [ ] PM2 konfigurálva
- [ ] Nginx konfigurálva
- [ ] SSL certificate telepítve
- [ ] Firewall beállítva
- [ ] Monitoring beállítva

### Frontend
- [ ] EAS build konfigurálva
- [ ] Production build kész
- [ ] App Store submission
- [ ] Play Store submission
- [ ] Certificate pinning hash beállítva

---

**Utolsó frissítés:** 2024  
**Verzió:** 1.0.0

