# 🚀 Luxio Supabase Setup - Lépésről Lépésre

## ✅ 1. LÉPÉS: Supabase Projekt Létrehozása

### 1.1. Regisztráció
1. Nyisd meg a böngészőt és menj a **https://supabase.com/** oldalra
2. Kattints a **"Start your project"** vagy **"Sign in"** gombra
3. Jelentkezz be **GitHub** fiókkal (ingyenes)

### 1.2. Új Projekt
1. A Dashboard-on kattints a **"New Project"** gombra
2. Töltsd ki az űrlapot:
   - **Name**: `luxio` (vagy bármilyen név)
   - **Database Password**: Generálj egy erős jelszót (pl. `Luxio2024!SecurePass`) - **JEGYEZD FEL!**
   - **Region**: Válaszd az **EU Central (Frankfurt)** opciót (gyorsabb magyarországi felhasználóknak)
3. Kattints a **"Create new project"** gombra
4. Várj 1-2 percet, amíg a projekt inicializálódik

---

## ✅ 2. LÉPÉS: Adatbázis Schema Futtatása

### 2.1. SQL Editor Megnyitása
1. A Supabase Dashboard bal oldali menüjében kattints a **"SQL Editor"** opcióra
2. Kattints a **"New query"** gombra

### 2.2. Schema Másolása és Futtatása
1. Nyisd meg a projektben a **`supabase/schema.sql`** fájlt
2. **Másold ki az egész tartalmat** (Ctrl+A, majd Ctrl+C)
3. Illeszd be a Supabase SQL Editor-be (Ctrl+V)
4. Kattints a **"Run"** gombra (vagy F5)
5. Ellenőrizd, hogy a jobb alsó sarokban zöld pipa jelenik meg: **"Success. No rows returned"**

> 💡 **Fontos**: Ha hibaüzenet jelenik meg, valószínűleg már léteznek a táblák. Ez rendben van, folytasd a következő lépéssel.

---

## ✅ 3. LÉPÉS: API Kulcsok Lekérése

### 3.1. Project Settings Megnyitása
1. A Supabase Dashboard bal oldali menüjében kattints a **"Project Settings"** (fogaskerék ikon) opcióra
2. Kattints a **"API"** fülre

### 3.2. Kulcsok Másolása
Itt látod két fontos értéket:

1. **Project URL**
   - Példa: `https://xgvubkbfhleeagdvkhds.supabase.co`
   - **Másold ki ezt az értéket**   

2. **anon public** kulcs
   - Hosszú karakterlánc, pl: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Kattints a **"Reveal"** gombra, majd **másold ki**

---

## ✅ 4. LÉPÉS: .env Fájl Kitöltése

### 4.1. .env Fájl Megnyitása
1. Nyisd meg a projekt gyökerében a **`.env`** fájlt (már létrehoztuk az `env.example` alapján)
2. Jelenleg így néz ki:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_REDIRECT_URL=https://hevesitr.github.io/luxio-/auth-callback
   ```

### 4.2. Értékek Beillesztése
1. **SUPABASE_URL**: Illeszd be a 3.2. lépésben másolt Project URL-t
   ```
   SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   ```

2. **SUPABASE_ANON_KEY**: Illeszd be a 3.2. lépésben másolt anon public kulcsot
   ```
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **SUPABASE_REDIRECT_URL**: Ezt hagyd változatlanul (már be van állítva a GitHub Pages URL-re)
   ```
   SUPABASE_REDIRECT_URL=https://hevesitr.github.io/luxio-/auth-callback
   ```

4. **Mentsd el a fájlt** (Ctrl+S)

> ⚠️ **FIGYELEM**: A `.env` fájl **NE** kerüljön be a Git-be (már benne van a `.gitignore`-ban)

---

## ✅ 5. LÉPÉS: Supabase Auth Beállítások

### 5.1. URL Configuration
1. A Supabase Dashboard bal oldali menüjében kattints a **"Authentication"** opcióra
2. Kattints a **"URL Configuration"** fülre

### 5.2. Redirect URL Hozzáadása
1. A **"Redirect URLs"** mezőben kattints a **"Add URL"** gombra
2. Add hozzá: `https://hevesitr.github.io/luxio-/web/auth-callback.html`
3. Kattints a **"Save"** gombra

> 💡 **Fontos**: A `docs/web/auth-callback.html` fájlt fel kell tölteni a GitHub Pages-re. Ha még nem tetted meg, commitold és pushold a változtatásokat a GitHub-ra.

### 5.3. Site URL Beállítása
1. A **"Site URL"** mezőbe írd be: `https://hevesitr.github.io/luxio-/`
2. Kattints a **"Save"** gombra

### 5.4. Email Megerősítés (Opcionális)
1. A **"Authentication"** menüben kattints a **"Providers"** fülre
2. Az **"Email"** provider alatt kapcsold be a **"Confirm email"** opciót, ha szeretnél double-opt-in regisztrációt
   - Ha **BE** van kapcsolva: A felhasználóknak email-ben kell megerősíteniük a regisztrációt
   - Ha **KI** van kapcsolva: Azonnal be tudnak jelentkezni regisztráció után

---

## ✅ 6. LÉPÉS: Expo Újraindítása

### 6.1. Expo Leállítása
1. Ha fut az Expo, nyomd meg a **Ctrl+C** billentyűt a terminálban
2. Várj, amíg teljesen leáll

### 6.2. Expo Újraindítása
1. A terminálban futtasd:
   ```bash
   npm start
   ```
2. Várj, amíg a QR kód megjelenik
3. Olvasd be a QR kódot az Expo Go appal

---

## ✅ 7. LÉPÉS: Tesztelés

### 7.1. Regisztráció Tesztelése
1. Az alkalmazásban kattints a **"Regisztráció"** gombra
2. Töltsd ki az űrlapot:
   - Név: `Teszt Felhasználó`
   - Email: **valódi email címet** adj meg (pl. `teszt@example.com`)
   - Jelszó: legalább 8 karakter
   - Neme, születési dátum, stb.
3. Kattints a **"Regisztráció"** gombra
4. Ha email megerősítés be van kapcsolva:
   - Nézd meg az email fiókodat
   - Kattints a megerősítő linkre
   - Vissza az alkalmazásba, jelentkezz be
5. Ha email megerősítés ki van kapcsolva:
   - Azonnal be kell jelentkezned

### 7.2. Supabase Dashboard Ellenőrzése
1. Menj vissza a Supabase Dashboard-ra
2. Kattints a **"Authentication" → "Users"** menüpontra
3. Itt látnod kellene az új felhasználót
4. Kattints a **"Table Editor" → "profiles"** menüpontra
5. Itt látnod kellene a felhasználó profilját (név, email, stb.)

### 7.3. Bejelentkezés Tesztelése
1. Az alkalmazásban kattints a **"Kijelentkezés"** gombra (ha be vagy jelentkezve)
2. Kattints a **"Bejelentkezés"** gombra
3. Add meg az email címet és jelszót
4. Kattints a **"Bejelentkezés"** gombra
5. Sikeres bejelentkezés esetén a fő képernyőre kell kerülnöd

---

## ✅ 8. LÉPÉS: Jelszó Visszaállítás Tesztelése

### 8.1. Jelszó Visszaállítás Flow
1. A bejelentkezési képernyőn kattints az **"Elfelejtetted?"** linkre
2. Add meg az email címet
3. Kattints a **"Kód Küldése"** gombra
4. Nézd meg az email fiókodat
5. Másold ki a linket az email-ből
6. Nyisd meg a linket a böngészőben
7. Add meg az új jelszót
8. Próbálj bejelentkezni az új jelszóval

---

## ✅ 9. LÉPÉS: Storage Beállítása (Opcionális, de ajánlott)

Ha szeretnél profilképeket és fotókat tárolni a Supabase Storage-ban:

### 9.1. Bucket-ek Létrehozása

1. A Supabase Dashboard bal oldali menüjében kattints a **"Storage"** opcióra
2. Kattints a **"Create bucket"** gombra
3. Hozd létre a következő bucket-eket:

   **a) Avatars bucket:**
   - **Name**: `avatars` (pontosan így, kisbetűvel!)
   - **Public bucket**: ✅ **BE** (kapcsold be!)
   - Kattints a **"Create bucket"** gombra

   **b) Photos bucket:**
   - **Name**: `photos` (pontosan így, kisbetűvel!)
   - **Public bucket**: ✅ **BE** (kapcsold be!)
   - Kattints a **"Create bucket"** gombra

### 9.2. Storage Policy-k Beállítása

Részletes útmutató: lásd a `docs/STORAGE_SETUP.md` fájlt.

Röviden:
1. Minden bucket esetében kattints a bucket nevére
2. Kattints a **"Policies"** fülre
3. Kattints a **"New Policy"** gombra
4. Másold be a policy SQL-t a `docs/STORAGE_SETUP.md` fájlból
5. Mentsd el

### 9.3. Tesztelés

1. Nyisd meg az alkalmazást
2. Menj a **Profil** fülre
3. Kattints a **"Fotó hozzáadása"** gombra
4. Válassz egy képet
5. A képnek feltöltődnie kell a Supabase Storage-ba
6. A Supabase Dashboard → **Storage** menüben ellenőrizd, hogy megjelent-e a fájl

---

## 🎉 KÉSZ!

Ha minden lépés sikeres volt, most már:
- ✅ Valódi felhőalapú adatbázisod van (Supabase)
- ✅ Email/jelszó regisztráció működik
- ✅ Bejelentkezés működik
- ✅ Jelszó visszaállítás működik
- ✅ Felhasználói profilok tárolódnak az adatbázisban

---

## ❓ Problémamegoldás

### Hiba: "Invalid API key"
- Ellenőrizd, hogy a `.env` fájlban helyesen másoltad-e be a kulcsokat
- Győződj meg róla, hogy nincs szóköz a kulcsok körül
- Indítsd újra az Expo-t (`npm start`)

### Hiba: "Email already registered"
- Ez normális, ha már regisztráltál ezzel az email címmel
- Próbálj másik email címet, vagy töröld a felhasználót a Supabase Dashboard → Authentication → Users menüben

### Hiba: "Failed to fetch"
- Ellenőrizd az internetkapcsolatot
- Győződj meg róla, hogy a `SUPABASE_URL` helyes
- Nézd meg a Supabase Dashboard → Project Settings → API oldalt, hogy aktív-e a projekt

### Email nem érkezik meg
- Nézd meg a Spam mappát
- Ellenőrizd a Supabase Dashboard → Authentication → Users menüben, hogy látszik-e a felhasználó
- Ha email megerősítés be van kapcsolva, a Supabase Dashboard → Authentication → Templates menüben ellenőrizd az email sablont

---

## 📞 További Segítség

Ha elakadtál bármelyik lépésnél:
1. Nézd meg a `docs/SUPABASE_SETUP.md` fájlt részletesebb információkért
2. A Supabase dokumentáció: https://supabase.com/docs
3. A Supabase Discord közösség: https://discord.supabase.com

