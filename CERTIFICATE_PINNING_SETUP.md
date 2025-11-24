# 🔒 Certificate Pinning Beállítás

**Dátum:** 2024  
**Verzió:** 1.0.0

---

## 📋 ÁTtekintés

Certificate pinning biztosítja, hogy az alkalmazás csak a megbízható SSL tanúsítványokkal kommunikáljon, megelőzve a man-in-the-middle támadásokat.

---

## 📦 Telepítés

```bash
npm install react-native-cert-pinner
```

**Megjegyzés:** Ez a package native modulokat használ, ezért szükséges:
- iOS: `cd ios && pod install`
- Android: Automatikus (ha jól van konfigurálva)

---

## 🔧 Konfiguráció

### 1. Certificate Hash Kinyerése

#### OpenSSL használatával:

```bash
# Production API certificate hash
openssl s_client -servername api.datingapp.com -connect api.datingapp.com:443 < /dev/null 2>/dev/null | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64

# Vagy egyszerűbben:
openssl s_client -connect api.datingapp.com:443 < /dev/null 2>/dev/null | openssl x509 -fingerprint -sha256 -noout | cut -d'=' -f2 | tr -d ':'
```

#### Online eszköz:
- https://www.ssllabs.com/ssltest/analyze.html
- https://www.certificate-transparency.org/

### 2. Hash Beállítása

Frissítsd a `src/services/APIService.js` fájlt:

```javascript
const pinningConfig = isPinningAvailable ? {
  pins: [
    'sha256/ACTUAL_CERTIFICATE_HASH_HERE', // Production
    // 'sha256/BACKUP_CERTIFICATE_HASH_HERE', // Backup (ha van)
  ],
} : {};
```

### 3. Development vs Production

```javascript
// Development: fallback engedélyezve (ha a certificate pinning nem működik)
...(__DEV__ && { fallback: true }),

// Production: fallback NEM engedélyezett (szigorú pinning)
// Ne add hozzá a fallback: true-t production-ben!
```

---

## 🧪 Tesztelés

### 1. Certificate Pinning Ellenőrzés

```javascript
// src/services/APIService.js - teszteléshez
console.log('Certificate pinning available:', isPinningAvailable);
```

### 2. Man-in-the-Middle Teszt

1. Proxy eszköz beállítása (Burp Suite, Charles Proxy)
2. Alkalmazás futtatása
3. **Várható eredmény:** Connection error vagy certificate pinning failure

---

## ⚠️ FONTOS MEGJEGYZÉSEK

### 1. Certificate Rotation

Ha a certificate lejár vagy frissül:
- **Frissítsd a hash-t** az `APIService.js`-ben
- **Teszteld** mindkét platformon (iOS, Android)
- **Deploy** új verzió

### 2. Backup Certificate

Ajánlott backup certificate hash használata:
- Fő certificate + backup certificate
- Smooth transition certificate rotation-nál

### 3. Development

Development-ben:
- Használhatsz `fallback: true`-t
- De **NE** használd production-ben!

---

## 🔍 Hibakeresés

### Certificate Pinning Error

**Hiba:**
```
Certificate pinning failed
```

**Megoldás:**
1. Ellenőrizd a certificate hash-t
2. Ellenőrizd, hogy a certificate érvényes-e
3. Development-ben: engedélyezd a fallback-ot

### Package Not Found

**Hiba:**
```
Cannot find module 'react-native-cert-pinner'
```

**Megoldás:**
```bash
npm install react-native-cert-pinner
cd ios && pod install  # iOS
# Android: rebuild
```

---

## 📚 További Információk

- [OWASP Certificate Pinning](https://owasp.org/www-community/controls/Certificate_and_Public_Key_Pinning)
- [react-native-cert-pinner GitHub](https://github.com/approov/react-native-cert-pinner)

---

**Utolsó frissítés:** 2024  
**Verzió:** 1.0.0

