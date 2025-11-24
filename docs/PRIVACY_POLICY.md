# 🔒 Adatvédelmi Szabályzat - Luxio

**Utolsó frissítés:** 2024. január  
**Hatálybalépés:** 2024. január 1.

---

## 1. BEVEZETÉS

Üdvözöljük a Luxio-ban! Az adatvédelem fontos számunkra, és elkötelezettek vagyunk a személyes adataid védelme mellett. Ez az Adatvédelmi Szabályzat elmagyarázza, hogyan gyűjtjük, használjuk, tároljuk és védjük az adataidat.

---

## 2. ADATKEZELŐ

**Név:** Luxio Kft.  
**Cím:** [Cím]  
**Email:** hevesi.tr@gmail.com  
**Telefon:** [Telefonszám]

---

## 3. GYŰJTÖTT ADATOK

### 3.1. Regisztrációkor Gyűjtött Adatok
- **Név** (kötelező)
- **Email cím** (kötelező)
- **Telefonszám** (opcionális)
- **Születési dátum** (kötelező, 18+)
- **Nem** (kötelező)
- **Jelszó** (titkosítva tárolva)

### 3.2. Profil Adatok
- **Bemutatkozás** (opcionális)
- **Fotók** (opcionális, maximum 6)
- **Érdeklődési körök** (opcionális)
- **Kapcsolati cél** (opcionális)
- **Helyszín** (opcionális, GPS alapú)
- **Részletes információk** (magasság, munka, oktatás, stb.) (opcionális)

### 3.3. Használati Adatok
- **Swipe aktivitás** (like, pass, super like)
- **Matchek**
- **Üzenetek**
- **Profil megtekintések**
- **App használati statisztikák**

### 3.4. Technikai Adatok
- **IP cím**
- **Eszköz információ** (típus, operációs rendszer)
- **App verzió**
- **Használati logok**

---

## 4. ADATKEZELÉS CÉLJA

Az adataidat a következő célokra használjuk:

1. **Szolgáltatás nyújtása**
   - Fiók létrehozása és kezelése
   - Profil megjelenítése más felhasználóknak
   - Match-ek és üzenetek kezelése

2. **Biztonság**
   - Felhasználói autentikáció
   - Csalás és abuse megelőzése
   - Moderáció

3. **Javítások**
   - Szolgáltatás fejlesztése
   - Hibák javítása
   - Felhasználói élmény javítása

4. **Kommunikáció**
   - Fontos értesítések küldése
   - Marketing kommunikáció (csak hozzájárulással)

5. **Jogi kötelezettségek**
   - Jogi követelmények teljesítése
   - Adatvédelmi jogszabályok betartása

---

## 5. JOGALAP

Az adatkezelés jogalapja a GDPR 6. cikk (1) bekezdése szerint:

- **Hozzájárulás** (6. cikk (1) a) pont): Marketing kommunikáció, analytics
- **Szerződés teljesítése** (6. cikk (1) b) pont): Szolgáltatás nyújtása
- **Jogi kötelezettség** (6. cikk (1) c) pont): Jogi követelmények
- **Jogos érdek** (6. cikk (1) f) pont): Biztonság, csalás megelőzése

---

## 6. ADATMEGŐRZÉSI IDŐSZAKOK

- **Aktív fiók:** Amíg a fiók aktív
- **Inaktív fiók:** 2 év inaktivitás után automatikus törlés
- **Törlési kérés:** 30 napos grace period után törlés
- **Üzenetek:** 1 év után automatikus törlés
- **Logok:** 1 év
- **Jogi dokumentumok:** 7 év (könyvelési kötelezettség)

---

## 7. FELHASZNÁLÓI JOGOK (GDPR)

### 7.1. Hozzáférési Jog (Right of Access)
Hozzáférhetsz az összes adatodhoz. Kérheted adataid exportálását.

**Hogyan:** Beállítások → Adatvédelem → Adataim exportálása

### 7.2. Helyesbítési Jog (Right to Rectification)
Bármikor módosíthatod adataidat a profil beállításokban.

**Hogyan:** Profil → Szerkesztés

### 7.3. Törlési Jog (Right to Erasure - "Right to be Forgotten")
Bármikor törölheted a fiókodat. A törlés 30 napon belül történik.

**Hogyan:** Beállítások → Adatvédelem → Fiók törlése

### 7.4. Adatkezelés Korlátozásának Joga (Right to Restrict Processing)
Korlátozhatod adataid feldolgozását.

**Hogyan:** Beállítások → Adatvédelem → Adatkezelés korlátozása

### 7.5. Adathordozhatóság Joga (Right to Data Portability)
Exportálhatod adataidat JSON formátumban.

**Hogyan:** Beállítások → Adatvédelem → Adataim exportálása

### 7.6. Tiltakozási Jog (Right to Object)
Tiltakozhatsz adatkezelés ellen, különösen marketing célú adatkezelés esetén.

**Hogyan:** Beállítások → Adatvédelem → Marketing kommunikáció kikapcsolása

### 7.7. Automatizált Döntéshozatalhoz Kapcsolódó Jogok
Ellenőrizheted az AI-alapú ajánlásokat és döntéseket.

**Hogyan:** Profil → AI Ajánlások → Részletek

---

## 8. ADATTOVÁBBÍTÁS

### 8.1. Harmadik Fél Szolgáltatások
Az adataidat a következő szolgáltatásokkal osztjuk meg:

- **AWS (Amazon Web Services)** - Adattárolás és hosting
- **Google Cloud** - Analytics és push notifications
- **Twilio** - SMS küldés
- **Stripe/PayPal** - Fizetési feldolgozás

### 8.2. Adattovábbítás Biztonsága
- Minden adattovábbítás titkosítva (TLS 1.2+)
- Adatkezelési megállapodások harmadik felekkel
- GDPR megfelelőség

---

## 9. ADATVÉDELEM

### 9.1. Technikai Biztonsági Intézkedések
- **Titkosítás:** Jelszavak bcrypt-tel hash-elve, tokenek titkosítva
- **HTTPS:** Minden kommunikáció HTTPS-en keresztül
- **Certificate Pinning:** API kommunikáció védelme
- **Rate Limiting:** DDoS védelem
- **Input Validation:** SQL injection és XSS védelem

### 9.2. Szervezeti Biztonsági Intézkedések
- Hozzáférés korlátozása
- Munkavállalói képzés
- Rendszeres biztonsági auditok
- Incident response terv

---

## 10. COOKIE-K ÉS NYOMKÖVETŐ TECHNOLÓGIÁK

### 10.1. Használt Cookie-k
- **Szükséges cookie-k:** App működéséhez szükséges
- **Analytics cookie-k:** Használati statisztikák (hozzájárulással)
- **Marketing cookie-k:** Marketing célok (hozzájárulással)

### 10.2. Cookie Kezelés
Beállíthatod a cookie preferenciáidat a Beállítások menüben.

---

## 11. GYERMEKEK ADATVÉDELME

Az alkalmazás **18 éves kor alattiak számára nem elérhető**. Nem gyűjtünk tudatosan adatokat 18 év alatti személyekről. Ha észleljük, hogy egy 18 év alatti személy használja az alkalmazást, azonnal töröljük a fiókját.

---

## 12. VÁLTOZÁSOK AZ ADATVÉDELMI SZABÁLYZATBAN

Fenntartjuk a jogot az Adatvédelmi Szabályzat módosítására. Jelentős változások esetén értesítünk email-ben vagy az app-ban.

---

## 13. KAPCSOLAT

Ha kérdésed van az adatvédelmmel kapcsolatban, vagy szeretnéd gyakorolni jogaidat, lépj velünk kapcsolatba:

**Email:** hevesi.tr@gmail.com  
**Cím:** [Cím]  
**Telefon:** [Telefonszám]

---

## 14. FELHASZNÁLÁSI JOGOK GYAKORLÁSA

### Adatlekérés
Kérheted adataid exportálását a Beállítások → Adatvédelem → Adataim exportálása menüpontban.

### Adattörlés
Törölheted a fiókodat a Beállítások → Adatvédelem → Fiók törlése menüpontban.

### Consent Visszavonás
Bármikor visszavonhatod hozzájárulásodat a Beállítások → Adatvédelem menüben.

---

**Ez az Adatvédelmi Szabályzat a GDPR (General Data Protection Regulation) követelményeinek megfelelően készült.**

---

**Utolsó frissítés:** 2024. január  
**Verzió:** 1.0.0

