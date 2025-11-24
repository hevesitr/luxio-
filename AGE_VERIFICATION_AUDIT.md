# 🔞 Életkor Ellenőrzés és Kiskorúak Védelme - Audit

**Dátum:** 2024  
**Verzió:** 1.0.0

---

## 📋 TARTALOMJEGYZÉK

1. [Jelenlegi Implementáció](#jelenlegi-implementáció)
2. [Hiányosságok](#hiányosságok)
3. [Javítási Terv](#javítási-terv)
4. [Jogi Követelmények](#jogi-követelmények)

---

## ✅ JELENLEGI IMPLEMENTÁCIÓ

### Backend ✅

1. **Regisztrációkor életkor ellenőrzés** ✅
   - `POST /auth/register` endpoint
   - Születési dátum validáció
   - 18+ ellenőrzés
   - 18 év alattiak automatikus elutasítása

2. **Életkor számítás** ✅
   - `calculateAge` függvény
   - Pontos életkor számítás

### Frontend ⚠️

1. **Profil szerkesztés** ⚠️
   - `EditProfileModal` tartalmaz életkor validációt (18+)
   - De nincs regisztrációs folyamat

---

## ⚠️ HIÁNYOSSÁGOK

### Kritikus Hiányosságok (P0)

1. **Regisztrációs folyamat** 🔴
   - ❌ Nincs regisztrációs képernyő
   - ❌ Nincs életkor ellenőrzés UI-ban
   - ❌ Nincs OTP verifikáció

2. **Folyamatos ellenőrzés** 🔴
   - ❌ Nincs életkor újraverifikáció
   - ❌ Nincs gyanús aktivitás észlelése

3. **Kiskorúak blokkolása** 🔴
   - ❌ Nincs automatikus blokkolás 18 év alattiaknak
   - ❌ Nincs jelentés funkció kiskorúak számára

### Magas Prioritású Hiányosságok (P1)

4. **ID Verifikáció** ⚠️
   - ❌ Nincs ID dokumentum feltöltés
   - ❌ Nincs selfie vs ID összehasonlítás
   - ❌ Nincs külső KYC szolgáltatás integráció

5. **Értesítések** ⚠️
   - ❌ Nincs értesítés 18. születésnap előtt
   - ❌ Nincs automatikus fiók aktiválás 18. születésnapkor

---

## 📝 JAVÍTÁSI TERV

### 1. Regisztrációs Képernyő

```javascript
// src/screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const RegisterScreen = ({ navigation }) => {
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const calculateAge = (date) => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age;
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const age = calculateAge(selectedDate);
      if (age < 18) {
        Alert.alert(
          'Életkor korlátozás',
          'Sajnáljuk, az alkalmazás használatához legalább 18 évesnek kell lenned.',
          [{ text: 'Rendben' }]
        );
        return;
      }
      setBirthDate(selectedDate);
    }
  };

  // ... rest of registration form
};
```

### 2. OTP Verifikáció

```javascript
// src/screens/OTPVerificationScreen.js
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

const OTPVerificationScreen = ({ navigation, route }) => {
  const { email, phone } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const handleOTPChange = (index, value) => {
    if (value.length > 1) return; // Only single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    // Call backend API
    const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: otpString }),
    });
    // ... handle response
  };

  // ... UI
};
```

### 3. Folyamatos Ellenőrzés

```javascript
// backend/src/services/AgeVerificationService.js
class AgeVerificationService {
  // Életkor újraverifikáció gyanús aktivitás esetén
  async requireReVerification(userId, reason) {
    await pool.query(
      `UPDATE users 
       SET email_verified = FALSE, 
           verification_status = 're_verification_required'
       WHERE id = $1`,
      [userId]
    );

    // Send email/SMS for re-verification
    await this.sendReVerificationRequest(userId, reason);
  }

  // Automatikus blokkolás 18 év alattiaknak
  async checkAndBlockMinors() {
    const minors = await pool.query(
      `SELECT id, email, birth_date 
       FROM users 
       WHERE DATE_PART('year', AGE(birth_date)) < 18
         AND is_active = TRUE`,
    );

    for (const minor of minors.rows) {
      await pool.query(
        `UPDATE users 
         SET is_banned = TRUE, 
             ban_reason = 'Under 18 years old',
             is_active = FALSE
         WHERE id = $1`,
        [minor.id]
      );

      // Log the action
      await this.logAgeViolation(minor.id);
    }
  }
}
```

### 4. ID Verifikáció (Opcionális, Prémium)

```javascript
// src/screens/IDVerificationScreen.js
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { View, Text, TouchableOpacity, Image } from 'react-native';

const IDVerificationScreen = ({ navigation }) => {
  const [idPhoto, setIdPhoto] = useState(null);
  const [selfie, setSelfie] = useState(null);

  const handleTakeIDPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setIdPhoto(result.assets[0].uri);
    }
  };

  const handleTakeSelfie = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelfie(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    // Upload to backend
    // Backend calls KYC service (Onfido, Jumio, etc.)
    // AI comparison
  };

  // ... UI
};
```

---

## ⚖️ JOGI KÖVETELMÉNYEK

### EU Szabályok

1. **GDPR** ✅
   - 18+ korlátozás dokumentálva
   - Életkor ellenőrzés implementálva

2. **Digital Services Act (DSA)** ⚠️
   - ⚠️ **HIÁNYZIK:** Tartalomszűrés kiskorúak számára
   - ⚠️ **HIÁNYZIK:** Jelentés funkció kiskorúak számára

3. **Age Verification** ⚠️
   - ✅ Regisztrációkor életkor ellenőrzés
   - ⚠️ **HIÁNYZIK:** Folyamatos ellenőrzés
   - ⚠️ **HIÁNYZIK:** ID verifikáció (opcionális)

---

## ✅ IMPLEMENTÁCIÓS ÚTMUTATÓ

### 1. Regisztrációs Képernyő Létrehozása

```bash
# Szükséges package
npm install @react-native-community/datetimepicker
```

### 2. OTP Szolgáltatás Integráció

```javascript
// Backend: Twilio vagy hasonló SMS szolgáltatás
// Frontend: OTP input komponens
```

### 3. Folyamatos Ellenőrzés

```javascript
// Backend: Cron job vagy scheduled task
// Ellenőrzi naponta az életkorokat
```

---

## 📊 ÖSSZEFOGLALÁS

### Implementálva ✅
- ✅ Backend életkor ellenőrzés (18+)
- ✅ Profil szerkesztés életkor validáció

### Implementálandó ⏳
- ⏳ Regisztrációs képernyő
- ⏳ OTP verifikáció
- ⏳ Folyamatos életkor ellenőrzés
- ⏳ ID verifikáció (opcionális)
- ⏳ Automatikus blokkolás kiskorúaknak

---

**Utolsó frissítés:** 2024  
**Verzió:** 1.0.0  
**Státusz:** ⚠️ Backend kész, frontend implementáció szükséges

