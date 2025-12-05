# Supabase Email Verification Setup Guide

Ez a dokumentum részletes útmutatót ad a Supabase email verification rendszerének konfigurálásához a LoveX dating app számára.

## 📋 Előfeltételek

- Supabase projekt létrehozva
- Domain konfigurálva (opcionális, de ajánlott)
- Email szolgáltató beállítva

## 🔧 1. Supabase Dashboard Konfiguráció

### 1.1 Authentication Settings

1. Navigálj a Supabase Dashboard-ra
2. Válaszd ki a projektet
3. Menj az "Authentication" > "Settings" oldalra

### 1.2 Email Templates Konfigurálása

#### Confirm Signup Template
```
Subject: Erősítse meg email címét - LoveX

Kedves {{ .Email }},

Köszönjük, hogy regisztrált a LoveX-en!

Az alábbi linkre kattintva erősítheti meg email címét:
{{ .ConfirmationURL }}

Ha nem Ön regisztrált, kérjük, hagyja figyelmen kívül ezt az email-t.

Üdvözlettel,
LoveX Csapat
```

#### Invite User Template
```
Subject: Meghívó a LoveX-re

Kedves {{ .Email }},

Meghívták Önt a LoveX közösségbe!

Az alábbi linkre kattintva aktiválhatja fiókját:
{{ .ConfirmationURL }}

Üdvözlettel,
LoveX Csapat
```

#### Reset Password Template
```
Subject: Jelszó visszaállítás - LoveX

Kedves {{ .Email }},

Jelszava visszaállítására irányuló kérelem érkezett.

Az alábbi linkre kattintva állíthatja vissza jelszavát:
{{ .ConfirmationURL }}

Ha nem Ön kérte a visszaállítást, kérjük, hagyja figyelmen kívül ezt az email-t.

Üdvözlettel,
LoveX Csapat
```

### 1.3 Email Provider Konfigurálása

#### SMTP Settings (Ajánlott)
```
Host: smtp.gmail.com (vagy más SMTP provider)
Port: 587
Username: your-email@gmail.com
Password: your-app-password
```

#### Alternative: Supabase Built-in Email
- Használhatod a Supabase beépített email szolgáltatását is fejlesztéskor
- Production-ben azonban ajánlott saját SMTP provider használata

## 🔗 2. Deep Linking Konfiguráció

### 2.1 Expo Configuration

Frissítsd az `app.json` vagy `app.config.js` fájlt:

```json
{
  "expo": {
    "scheme": "lovex",
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### 2.2 Supabase Redirect URLs

A Supabase Dashboard-on állítsd be a következő redirect URL-eket:

```
https://your-project.supabase.co/auth/callback
lovex://verify-email
lovex://reset-password
```

## 📱 3. Mobile App Konfiguráció

### 3.1 Deep Linking Handler

Az app már tartalmazza a `DeepLinkingService.js` fájlt, amely automatikusan kezeli:

- Email verification callback-eket
- Password reset callback-eket
- Navigation az megfelelő képernyőkre

### 3.2 Navigation Setup

Az `App.js` fájlban már be van állítva:

- `EmailVerificationSuccessScreen` hozzáadása a navigációhoz
- Deep linking listener-ek beállítása
- Automatikus navigáció sikeres verifikáció után

## 🧪 4. Testing

### 4.1 Email Verification Testing

1. Regisztrálj új felhasználót
2. Ellenőrizd az email küldést a Supabase Dashboard-on (Authentication > Logs)
3. Klikkelj a verifikációs linkre
4. Ellenőrizd, hogy az app helyesen navigál az EmailVerificationSuccessScreen-re

### 4.2 Password Reset Testing

1. Klikkelj a "Forgot Password" linkre
2. Add meg az email címed
3. Ellenőrizd az email küldést
4. Klikkelj a reset linkre
5. Ellenőrizd a navigációt

## 🔒 5. Security Considerations

### 5.1 Rate Limiting

Az EmailService automatikusan limitálja az email küldést:
- Maximum 3 email/óra/felhasználó
- Automatikus tisztítás 1 óránál régebbi rekordoknál

### 5.2 Token Expiration

Supabase automatikusan kezeli a token lejáratokat:
- Email verification token: 24 óra
- Password reset token: 1 óra

### 5.3 Error Handling

Minden email művelet tartalmaz:
- Hiba logging-ot
- User-friendly hibaüzeneteket
- Retry mechanizmust

## 🚀 6. Production Deployment

### 6.1 Environment Variables

Győződj meg arról, hogy a következő environment változók be vannak állítva:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 6.2 Domain Verification

Production-ben ajánlott saját domain használata:

1. Vásárolj domain-t
2. Add hozzá a Supabase projekt Site URL-jeként
3. Konfiguráld az email template-eket az új domain-nel

### 6.3 Email Provider

Production-ben használd a következőket:

- SendGrid
- Mailgun
- Amazon SES
- Postmark

## 📊 7. Monitoring

### 7.1 Supabase Analytics

Figyeld a következő metrikákat:
- Email küldési sikeresség
- Verification completion rate
- Password reset sikeresség

### 7.2 App Analytics

Trackeld az email verification eseményeket:
- Email verification banner megjelenítés
- Resend button klikkek
- Successful verifications
- Failed verifications

## 🐛 8. Troubleshooting

### Gyakori problémák:

#### Email nem érkezik meg
- Ellenőrizd a spam mappát
- Győződj meg az SMTP konfigurációról
- Nézd meg a Supabase logs-ot

#### Deep link nem működik
- Ellenőrizd az app.json scheme konfigurációt
- Teszteld az Expo linking-et
- Nézd meg a device logs-ot

#### Verification nem sikerül
- Ellenőrizd a token expiration-t
- Nézd meg a Supabase auth logs-ot
- Ellenőrizd a redirect URL-eket

## 📞 9. Support

Ha problémába ütközöl:

1. Nézd meg a Supabase dokumentációt: https://supabase.com/docs/guides/auth
2. Ellenőrizd az Expo linking dokumentációt
3. Nézd meg az app logs-okat a Logger service segítségével

---

**Utolsó frissítés:** December 2025
**Verzió:** 1.0
**Kompatibilitás:** LoveX Dating App v1.0+
