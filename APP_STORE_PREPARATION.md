# 📱 App Store és Play Store Előkészítés

**Dátum:** 2024  
**Verzió:** 1.0.0

---

## ✅ CHECKLIST

### Apple App Store

#### 1. Developer Account
- [ ] Apple Developer Program regisztráció ($99/év)
- [ ] App ID létrehozása
- [ ] Provisioning profiles
- [ ] Certificates

#### 2. App Store Connect
- [ ] App létrehozása
- [ ] App információ (név, kategória, stb.)
- [ ] Privacy Policy URL
- [ ] Support URL
- [ ] Marketing URL (opcionális)

#### 3. Metaadatok
- [ ] App név (maximum 30 karakter)
- [ ] Alcím (maximum 30 karakter)
- [ ] Rövid leírás (maximum 170 karakter)
- [ ] Hosszú leírás (maximum 4000 karakter)
- [ ] Kulcsszavak (maximum 100 karakter)
- [ ] Kategória
- [ ] Életkor besorolás (17+)

#### 4. Média
- [ ] App ikon (1024x1024px)
- [ ] Screenshot-ok (különböző méretek)
- [ ] App Preview videó (opcionális)
- [ ] Promóciós kép (opcionális)

#### 5. Jogi Dokumentáció
- [ ] Privacy Policy (kötelező)
- [ ] Terms of Service (ajánlott)
- [ ] End User License Agreement (EULA)

#### 6. Funkciók
- [ ] In-App Purchase konfiguráció
- [ ] Push Notifications konfiguráció
- [ ] App Transport Security (ATS)
- [ ] Életkor ellenőrzés (18+)

#### 7. Tesztelés
- [ ] TestFlight beta tesztelés
- [ ] Sandbox tesztelés
- [ ] Production build tesztelés

---

### Google Play Store

#### 1. Developer Account
- [ ] Google Play Console regisztráció ($25 egyszeri)
- [ ] Developer információk
- [ ] Fizetési információk

#### 2. App Információ
- [ ] App név (maximum 50 karakter)
- [ ] Rövid leírás (maximum 80 karakter)
- [ ] Hosszú leírás (maximum 4000 karakter)
- [ ] Kategória
- [ ] Tartalom besorolás (18+)

#### 3. Média
- [ ] App ikon (512x512px)
- [ ] Feature graphic (1024x500px)
- [ ] Screenshot-ok (minimum 2, maximum 8)
- [ ] Promóciós videó (opcionális)

#### 4. Jogi Dokumentáció
- [ ] Privacy Policy (kötelező)
- [ ] Terms of Service (ajánlott)

#### 5. Funkciók
- [ ] In-App Billing konfiguráció
- [ ] Push Notifications konfiguráció
- [ ] Életkor ellenőrzés (18+)

#### 6. Tesztelés
- [ ] Internal testing
- [ ] Closed testing
- [ ] Open testing (opcionális)

---

## 📋 APP STORE LISTING

### App Név
**Javasolt:** "Luxio" vagy "Társkereső App"

### Rövid Leírás (App Store)
"Modern társkereső alkalmazás AI-alapú ajánlásokkal, videó profilokkal és biztonsági funkciókkal. Találd meg a tökéletes párt!"

### Hosszú Leírás
[Lásd: APP_STORE_DESCRIPTION.md]

### Kulcsszavak (App Store)
társkereső, dating, match, ismerkedés, randevú, kapcsolat, AI, videó, biztonság

---

## 🔒 PRIVACY POLICY URL

**Kötelező mindkét store-ban**

URL: `https://hevesitr.github.io/luxio-/web/privacy-policy.html`

---

## 📞 SUPPORT URL

**Kötelező mindkét store-ban**

URL: `https://hevesitr.github.io/luxio-/#support`  
Email: `hevesi.tr@gmail.com`

---

## ⚠️ APPLE SPECIFIKUS KÖVETELMÉNYEK

### 1. Életkor Besorolás
- **17+** (Mature/Unrestricted Web Access)
- Indoklás: Társkereső alkalmazás, felnőtt tartalom

### 2. In-App Purchase
- Digitális javakra csak App Store billing
- Nem lehet külső fizetési lehetőség

### 3. Moderáció
- **Kötelező:** Tartalomszűrés
- **Kötelező:** Jelentés/blokkolás funkció
- **Kötelező:** Moderációs workflow

### 4. Privacy
- **Kötelező:** Privacy Policy
- **Kötelező:** Adatkezelési tájékoztató
- **Kötelező:** Életkor ellenőrzés (18+)

---

## ⚠️ GOOGLE PLAY SPECIFIKUS KÖVETELMÉNYEK

### 1. Tartalom Besorolás
- **18+** (Mature 17+)
- Indoklás: Társkereső alkalmazás

### 2. In-App Billing
- Digitális javakra csak Play Billing
- Nem lehet külső fizetési lehetőség

### 3. Moderáció
- **Kötelező:** Tartalomszűrés
- **Kötelező:** Jelentés/blokkolás funkció

### 4. Privacy
- **Kötelező:** Privacy Policy
- **Kötelező:** Életkor ellenőrzés (18+)

---

## 📝 APP STORE LEÍRÁS PÉLDA

[Létrehozandó: APP_STORE_DESCRIPTION.md]

---

## ✅ ELŐKÉSZÍTÉSI STÁTUSZ

### Dokumentáció ✅
- [x] Privacy Policy
- [x] Terms of Service
- [x] Safety Guidelines

### Backend ✅
- [x] API specifikáció
- [x] Adatbázis séma
- [x] Route-ok implementálva

### Frontend ⏳
- [ ] Consent kezelés UI
- [ ] GDPR funkciók UI
- [ ] App Store build

### Tesztelés ⏳
- [ ] Unit tesztek
- [ ] Integration tesztek
- [ ] E2E tesztek

---

**Utolsó frissítés:** 2024  
**Verzió:** 1.0.0

