# 🔌 Backend API Specifikáció - Luxio

**Verzió:** 1.0.0  
**Dátum:** 2024  
**Base URL:** `https://api.datingapp.com/v1`

---

## 📋 TARTALOMJEGYZÉK

1. [Autentikáció](#autentikáció)
2. [Felhasználók](#felhasználók)
3. [Profilok](#profilok)
4. [Matchek](#matchek)
5. [Üzenetek](#üzenetek)
6. [Keresés és Szűrés](#keresés-és-szűrés)
7. [Médiafeltöltés](#médiafeltöltés)
8. [Moderáció](#moderáció)
9. [Fizetés](#fizetés)
10. [GDPR](#gdpr)
11. [Push Notifications](#push-notifications)

---

## 🔐 AUTENTIKÁCIÓ

### POST `/auth/register`

**Leírás:** Felhasználói regisztráció

**Request Body:**
```json
{
  "email": "user@example.com",
  "phone": "+36123456789", // opcionális
  "password": "SecurePassword123!",
  "name": "János",
  "birthDate": "1995-05-15", // ISO 8601
  "gender": "male", // male, female, other
  "lookingFor": ["female"], // array
  "acceptTerms": true,
  "acceptPrivacy": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Regisztráció sikeres. Kérjük, erősítsd meg az email címedet.",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "verificationRequired": true
  }
}
```

**Hibák:**
- `400 Bad Request` - Hiányzó vagy érvénytelen adatok
- `409 Conflict` - Email/telefon már regisztrálva
- `422 Unprocessable Entity` - Életkor < 18 év

---

### POST `/auth/verify-email`

**Leírás:** Email verifikáció OTP-vel

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email sikeresen megerősítve",
  "data": {
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "János"
    }
  }
}
```

---

### POST `/auth/verify-phone`

**Leírás:** Telefon verifikáció OTP-vel

**Request Body:**
```json
{
  "phone": "+36123456789",
  "otp": "123456"
}
```

**Response:** Ugyanaz, mint email verifikáció

---

### POST `/auth/login`

**Leírás:** Bejelentkezés

**Request Body:**
```json
{
  "email": "user@example.com", // vagy "phone": "+36123456789"
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "János",
      "isVerified": true
    }
  }
}
```

**Hibák:**
- `401 Unauthorized` - Hibás email/jelszó
- `403 Forbidden` - Email nincs megerősítve

---

### POST `/auth/refresh`

**Leírás:** Token frissítés

**Request Headers:**
```
Authorization: Bearer {refreshToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token_here",
    "refreshToken": "new_refresh_token_here"
  }
}
```

---

### POST `/auth/logout`

**Leírás:** Kijelentkezés

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Sikeresen kijelentkeztél"
}
```

---

### POST `/auth/forgot-password`

**Leírás:** Jelszó visszaállítás kérése

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Jelszó visszaállítási link elküldve"
}
```

---

### POST `/auth/reset-password`

**Leírás:** Jelszó visszaállítás

**Request Body:**
```json
{
  "token": "reset_token",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Jelszó sikeresen megváltoztatva"
}
```

---

## 👤 FELHASZNÁLÓK

### GET `/users/me`

**Leírás:** Saját felhasználói adatok lekérése

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "phone": "+36123456789",
    "name": "János",
    "birthDate": "1995-05-15",
    "age": 29,
    "gender": "male",
    "lookingFor": ["female"],
    "profile": {
      "id": "uuid",
      "photos": ["url1", "url2"],
      "bio": "Szeretem az életet...",
      "interests": ["Utazás", "Fotózás"],
      "isVerified": true,
      "isPremium": false,
      "premiumTier": "free"
    },
    "settings": {
      "notifications": {
        "matches": true,
        "messages": true,
        "likes": true
      },
      "privacy": {
        "showDistance": true,
        "showLastActive": true
      }
    },
    "createdAt": "2024-01-15T10:00:00Z",
    "lastActive": "2024-01-20T15:30:00Z"
  }
}
```

---

### PUT `/users/me`

**Leírás:** Saját felhasználói adatok frissítése

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "János",
  "bio": "Frissített bio",
  "interests": ["Utazás", "Fotózás", "Sport"],
  "relationshipGoal": "serious", // serious, casual, friendship
  "location": {
    "latitude": 47.4979,
    "longitude": 19.0402,
    "city": "Budapest",
    "country": "Hungary"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profil sikeresen frissítve",
  "data": {
    // Frissített felhasználói adatok
  }
}
```

---

### DELETE `/users/me`

**Leírás:** Fiók törlése (GDPR - Right to be Forgotten)

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "password": "SecurePassword123!", // megerősítéshez
  "reason": "opcionális törlés oka"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Fiókod 30 napon belül törlésre kerül"
}
```

---

## 📸 PROFILOK

### GET `/profiles`

**Leírás:** Profilok lekérése (swipe feed)

**Request Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (number, default: 10) - Hány profilt kérünk
- `offset` (number, default: 0) - Pagination offset
- `minAge` (number) - Minimum életkor
- `maxAge` (number) - Maximum életkor
- `maxDistance` (number) - Maximum távolság (km)
- `gender` (string) - Nem szűrés
- `relationshipGoal` (string) - Kapcsolati cél
- `interests` (string[]) - Érdeklődési körök
- `verifiedOnly` (boolean) - Csak verifikált profilok

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "profiles": [
      {
        "id": "uuid",
        "name": "Anna",
        "age": 27,
        "distance": 5.2, // km
        "photos": [
          {
            "url": "https://cdn.example.com/photo1.jpg",
            "isPrivate": false,
            "order": 1
          }
        ],
        "bio": "Szeretem az utazást...",
        "interests": ["Utazás", "Fotózás"],
        "relationshipGoal": "serious",
        "isVerified": true,
        "lastActive": "2024-01-20T14:00:00Z",
        "compatibilityScore": 85, // 0-100
        "commonInterests": ["Utazás", "Fotózás"]
      }
    ],
    "pagination": {
      "limit": 10,
      "offset": 0,
      "total": 150,
      "hasMore": true
    }
  }
}
```

---

### GET `/profiles/:id`

**Leírás:** Egy profil részletes adatainak lekérése

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Anna",
    "age": 27,
    "distance": 5.2,
    "photos": [...],
    "bio": "...",
    "interests": [...],
    "height": 165,
    "work": "Designer",
    "education": "Egyetem",
    "exercise": "Hetente 3-4x",
    "smoking": "Nem",
    "drinking": "Néha",
    "children": "Nem szeretnék",
    "religion": "Nem vallásos",
    "politics": "Középutas",
    "zodiacSign": "Oroszlán",
    "mbti": "ENFP",
    "relationshipGoal": "serious",
    "communicationStyle": "Gyakori",
    "isVerified": true,
    "isPremium": false,
    "prompts": [
      {
        "question": "Az én tökéletes vasárnapom...",
        "answer": "Kávé, könyv és egy jó film este"
      }
    ],
    "music": {
      "artists": ["Artist1", "Artist2"],
      "genres": ["Pop", "Rock"],
      "anthem": "Song Name"
    },
    "lastActive": "2024-01-20T14:00:00Z"
  }
}
```

---

### POST `/profiles/:id/view`

**Leírás:** Profil megtekintésének naplózása

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

## ❤️ MATCHEK

### POST `/matches/like`

**Leírás:** Profil like-olása

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "profileId": "uuid",
  "isSuperLike": false // opcionális
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isMatch": false, // vagy true, ha match van
    "match": null // vagy match objektum, ha van
  }
}
```

**Match Response (ha van match):**
```json
{
  "success": true,
  "data": {
    "isMatch": true,
    "match": {
      "id": "match_uuid",
      "profile": {
        "id": "uuid",
        "name": "Anna",
        "photos": [...],
        "age": 27
      },
      "matchedAt": "2024-01-20T15:00:00Z"
    }
  }
}
```

---

### POST `/matches/pass`

**Leírás:** Profil pass-elése (dislike)

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "profileId": "uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

### GET `/matches`

**Leírás:** Matchek listázása

**Request Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (number, default: 20)
- `offset` (number, default: 0)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "match_uuid",
        "profile": {
          "id": "uuid",
          "name": "Anna",
          "age": 27,
          "photos": [...],
          "isVerified": true,
          "lastActive": "2024-01-20T14:00:00Z"
        },
        "matchedAt": "2024-01-20T15:00:00Z",
        "unreadMessages": 3,
        "lastMessage": {
          "text": "Szia!",
          "timestamp": "2024-01-20T16:00:00Z"
        }
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 45,
      "hasMore": true
    }
  }
}
```

---

### DELETE `/matches/:matchId`

**Leírás:** Match törlése (unmatch)

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Match törölve"
}
```

---

## 💬 ÜZENETEK

### GET `/messages/:matchId`

**Leírás:** Üzenetek lekérése egy match-hez

**Request Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (number, default: 50)
- `before` (string, ISO 8601) - Üzenetek dátum előtt

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "message_uuid",
        "senderId": "uuid",
        "text": "Szia! Hogy vagy?",
        "type": "text", // text, voice, video, image
        "mediaUrl": null, // vagy URL, ha voice/video/image
        "duration": null, // másodperc, ha voice/video
        "readStatus": "read", // sent, delivered, read
        "timestamp": "2024-01-20T16:00:00Z"
      }
    ],
    "hasMore": false
  }
}
```

---

### POST `/messages/:matchId`

**Leírás:** Üzenet küldése

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data (ha média)
```

**Request Body (text):**
```json
{
  "text": "Szia! Hogy vagy?",
  "type": "text"
}
```

**Request Body (voice/video):**
```
FormData:
- file: (binary)
- type: "voice" vagy "video"
- duration: 15 (másodperc)
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "message_uuid",
      "senderId": "uuid",
      "text": "Szia! Hogy vagy?",
      "type": "text",
      "readStatus": "sent",
      "timestamp": "2024-01-20T16:00:00Z"
    }
  }
}
```

---

### PUT `/messages/:messageId/read`

**Leírás:** Üzenet olvasottnak jelölése

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

### DELETE `/messages/:messageId`

**Leírás:** Üzenet törlése

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

## 🔍 KERESÉS ÉS SZŰRÉS

### POST `/search`

**Leírás:** Részletes keresés

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "query": "laza kapcsolat budapest",
  "filters": {
    "ageMin": 25,
    "ageMax": 35,
    "distance": 50,
    "gender": "female",
    "relationshipGoal": "casual",
    "interests": ["Utazás", "Sport"],
    "heightMin": 160,
    "heightMax": 180,
    "education": "Egyetem",
    "smoking": "Nem",
    "drinking": "Néha",
    "exercise": "Hetente 3-4x",
    "verifiedOnly": true,
    "onlineOnly": false,
    "newProfilesOnly": false
  },
  "limit": 20,
  "offset": 0
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "profiles": [...],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 45,
      "hasMore": true
    }
  }
}
```

---

### POST `/search/ai`

**Leírás:** AI-alapú keresés

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "description": "Laza kapcsolatot keresek Budapesten, aki szereti az utazást és a sportot"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "profiles": [...],
    "extractedFilters": {
      "relationshipGoal": "casual",
      "location": "Budapest",
      "interests": ["Utazás", "Sport"]
    }
  }
}
```

---

## 📤 MÉDIAFELTÖLTÉS

### POST `/media/upload`

**Leírás:** Média fájl feltöltése (kép, videó)

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:**
```
FormData:
- file: (binary)
- type: "photo" vagy "video"
- isPrivate: false (opcionális)
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/uploads/uuid.jpg",
    "thumbnailUrl": "https://cdn.example.com/uploads/uuid_thumb.jpg", // videó esetén
    "type": "photo",
    "size": 2048576, // bytes
    "width": 1080,
    "height": 1920,
    "duration": null // videó esetén másodperc
  }
}
```

**Biztonsági ellenőrzések:**
- Fájlméret limit: 10MB (kép), 50MB (videó)
- Fájltípus validáció: jpg, png, mp4
- EXIF/metaadatok eltávolítása
- NSFW detection
- Vírusellenőrzés

**Hibák:**
- `400 Bad Request` - Érvénytelen fájl
- `413 Payload Too Large` - Fájl túl nagy
- `422 Unprocessable Entity` - NSFW tartalom észlelve

---

### DELETE `/media/:mediaId`

**Leírás:** Média fájl törlése

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

## 🛡️ MODERÁCIÓ

### POST `/moderation/report`

**Leírás:** Felhasználó/profil jelentése

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "reportedUserId": "uuid",
  "reason": "Káromkodás vagy zaklatás", // vagy más ok
  "description": "Részletes leírás...", // opcionális
  "evidence": ["url1", "url2"] // opcionális, screenshot-ok
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Jelentésedet megkaptuk. Köszönjük!"
}
```

---

### POST `/moderation/block`

**Leírás:** Felhasználó blokkolása

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "blockedUserId": "uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Felhasználó blokkolva"
}
```

---

### GET `/moderation/blocked`

**Leírás:** Blokkolt felhasználók listája

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "blockedUsers": [
      {
        "id": "uuid",
        "name": "Anna",
        "blockedAt": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

### DELETE `/moderation/block/:userId`

**Leírás:** Blokkolás feloldása

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Blokkolás feloldva"
}
```

---

## 💳 FIZETÉS

### POST `/payments/subscribe`

**Leírás:** Prémium előfizetés vásárlása

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "tier": "gold", // plus, gold, platinum
  "platform": "ios", // ios, android
  "receipt": "app_store_receipt_data", // App Store receipt
  "transactionId": "transaction_id" // Play Store transaction ID
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "subscription_uuid",
      "tier": "gold",
      "startDate": "2024-01-20T15:00:00Z",
      "endDate": "2024-02-20T15:00:00Z",
      "autoRenew": true,
      "status": "active"
    }
  }
}
```

---

### GET `/payments/subscription`

**Leírás:** Aktuális előfizetés lekérése

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "subscription_uuid",
      "tier": "gold",
      "startDate": "2024-01-20T15:00:00Z",
      "endDate": "2024-02-20T15:00:00Z",
      "autoRenew": true,
      "status": "active"
    }
  }
}
```

---

### POST `/payments/cancel`

**Leírás:** Előfizetés lemondása

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Előfizetés lemondva"
}
```

---

### POST `/payments/restore`

**Leírás:** Vásárlások visszaállítása (App Store/Play Store)

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "platform": "ios", // ios, android
  "receipts": ["receipt1", "receipt2"] // App Store receipts
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "restoredSubscriptions": [...]
  }
}
```

---

## 🔒 GDPR

### GET `/gdpr/data`

**Leírás:** Adatlekérés (Right to Access)

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "János",
      // ... összes felhasználói adat
    },
    "profile": {
      // ... profil adatok
    },
    "matches": [
      // ... match adatok
    ],
    "messages": [
      // ... üzenet adatok (anonimizálva)
    ],
    "activity": {
      // ... aktivitás logok (anonimizálva)
    },
    "exportedAt": "2024-01-20T15:00:00Z"
  }
}
```

---

### POST `/gdpr/delete`

**Leírás:** Adat törlés kérése (Right to be Forgotten)

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "password": "SecurePassword123!", // megerősítéshez
  "reason": "opcionális"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Fiókod 30 napon belül törlésre kerül. Ezen idő alatt visszavonhatod a kérést."
}
```

---

### POST `/gdpr/consent`

**Leírás:** Consent kezelés

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "consentType": "marketing", // marketing, analytics, etc.
  "accepted": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Consent frissítve"
}
```

---

## 🔔 PUSH NOTIFICATIONS

### POST `/notifications/register`

**Leírás:** Push notification token regisztrálása

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "token": "fcm_token_or_apns_token",
  "platform": "ios", // ios, android
  "deviceId": "device_uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

### PUT `/notifications/settings`

**Leírás:** Értesítési beállítások frissítése

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "matches": true,
  "messages": true,
  "likes": true,
  "superLikes": true,
  "topPicks": false,
  "promotions": false,
  "quietHours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

## 📊 STATISZTIKÁK

### GET `/stats/analytics`

**Leírás:** Felhasználói statisztikák

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "swipes": {
      "total": 1250,
      "likes": 450,
      "passes": 800,
      "superLikes": 25
    },
    "matches": {
      "total": 45,
      "thisWeek": 5,
      "thisMonth": 12
    },
    "messages": {
      "sent": 320,
      "received": 280,
      "conversations": 15
    },
    "profileViews": 1234,
    "likesReceived": 89,
    "matchRate": 10.0, // %
    "averageResponseTime": 7200 // másodperc
  }
}
```

---

## 🔐 BIZTONSÁGI FEJLESZTÉSEK

### Rate Limiting
- **100 request/perc/felhasználó** alapértelmezett
- **10 request/perc** regisztráció/bejelentkezés
- **50 request/perc** médiafeltöltés

### CORS
- Csak engedélyezett origin-ok
- Credentials támogatás

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

### Input Validation
- Minden input validálva
- SQL injection védelem
- XSS védelem
- CSRF token

---

## 📝 HIBAKEZELÉS

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Részletes hibaüzenet",
    "details": {} // opcionális
  }
}
```

### HTTP Status Codes
- `200 OK` - Sikeres kérés
- `201 Created` - Létrehozva
- `400 Bad Request` - Hibás kérés
- `401 Unauthorized` - Nincs autentikáció
- `403 Forbidden` - Nincs jogosultság
- `404 Not Found` - Nem található
- `409 Conflict` - Konfliktus
- `413 Payload Too Large` - Fájl túl nagy
- `422 Unprocessable Entity` - Validációs hiba
- `429 Too Many Requests` - Rate limit
- `500 Internal Server Error` - Szerver hiba

---

**Utolsó frissítés:** 2024  
**Verzió:** 1.0.0

