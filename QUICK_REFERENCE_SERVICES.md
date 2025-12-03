# Gyors Referencia - Szolgáltatások

## AuthService

```javascript
import AuthService from './src/services/AuthService';

// Inicializálás (App.js-ben már megtörtént)
await AuthService.initialize();

// Bejelentkezés
const { user, session } = await AuthService.signIn(email, password);

// Regisztráció
const { user } = await AuthService.signUp({ email, password, profile });

// Kijelentkezés
await AuthService.signOut();

// Jelenlegi user
const user = await AuthService.getCurrentUser();

// Session
const session = AuthService.getCurrentSession();

// Token
const token = AuthService.getAccessToken();
```

## ProfileService

```javascript
import ProfileService from './src/services/ProfileService';

// Profil létrehozása
const result = await ProfileService.createProfile(userId, {
  full_name: 'Név',
  gender: 'male',
  birth_date: '1990-01-01',
  bio: 'Bio szöveg'
});

// Profil lekérése
const result = await ProfileService.getProfile(userId);

// Profil frissítése
const result = await ProfileService.updateProfile(userId, { bio: 'Új bio' });

// Fotók feltöltése
const result = await ProfileService.addProfilePhotos(userId, [
  'file://photo1.jpg',
  'file://photo2.jpg'
]);

// Fotók újrarendezése
const result = await ProfileService.reorderPhotos(userId, photoUrls);

// Fotó törlése
const result = await ProfileService.deleteProfilePhoto(userId, photoUrl);

// Prompt-ok frissítése
const result = await ProfileService.updatePrompts(userId, [
  { question: 'Kérdés 1', answer: 'Válasz 1' },
  { question: 'Kérdés 2', answer: 'Válasz 2' },
  { question: 'Kérdés 3', answer: 'Válasz 3' }
]);

// Profil validálása
const result = await ProfileService.validateProfile(userId);
console.log('Érvényes:', result.data.valid);
console.log('Teljesség:', result.data.completeness + '%');
```

## StorageService

```javascript
import StorageService from './src/services/StorageService';

// Kép feltöltése (automatikus tömörítés)
const result = await StorageService.uploadImage(
  userId,
  'file://photo.jpg',
  'photos'
);

// Több kép feltöltése
const result = await StorageService.uploadMultipleImages(
  userId,
  ['file://1.jpg', 'file://2.jpg'],
  'photos'
);

// Videó feltöltése
const result = await StorageService.uploadVideo(
  userId,
  'file://video.mp4',
  'videos'
);

// Fájl törlése
const result = await StorageService.deleteFile(fileUrl, 'photos');

// Fájlok listázása
const result = await StorageService.listFiles(userId, 'photos');
```

## LocationService

```javascript
import LocationService from './src/services/LocationService';

// Jogosultság kérése
const result = await LocationService.requestPermission();

// Jelenlegi pozíció
const result = await LocationService.getCurrentLocation();
const { latitude, longitude } = result.data;

// Távolság számítása
const distance = LocationService.calculateDistance(
  { latitude: 47.4979, longitude: 19.0402 }, // Budapest
  { latitude: 48.8566, longitude: 2.3522 },  // Párizs
  'km'
);

// Távolság formázása
const formatted = LocationService.formatDistance(1.5, 'km', 'hu');

// Közeli felhasználók
const result = await LocationService.findNearbyUsers(
  myLocation,
  50, // 50 km
  'km'
);

// Helyadat frissítése
const result = await LocationService.updateUserLocation(userId, {
  latitude: 47.4979,
  longitude: 19.0402
});

// Folyamatos figyelés
const result = await LocationService.subscribeToLocationChanges(
  (location) => {
    console.log('Új pozíció:', location);
  }
);

// Figyelés leállítása
await LocationService.unsubscribeFromLocationChanges();
```

## PasswordService

```javascript
import PasswordService from './src/services/PasswordService';

// Jelszó validálása
const validation = PasswordService.validatePassword('MyP@ssw0rd');
console.log('Érvényes:', validation.valid);
console.log('Hibák:', validation.errors);

// Jelszó erősség
const strength = PasswordService.calculatePasswordStrength('MyP@ssw0rd');
console.log('Erősség:', strength.strength); // 'weak', 'fair', 'strong', 'very-strong'
console.log('Pontszám:', strength.score); // 0-4
console.log('Visszajelzés:', strength.feedback);

// Jelszó generálása
const password = PasswordService.generatePassword(16);

// Követelmények lekérése
const requirements = PasswordService.getPasswordRequirements();
```

## Hibakezelés

Minden szolgáltatás `{ success, data?, error? }` formátumot ad vissza:

```javascript
const result = await ProfileService.getProfile(userId);

if (result.success) {
  console.log('Siker:', result.data);
} else {
  console.error('Hiba:', result.error.userMessage);
  console.error('Kód:', result.error.code);
  console.error('Kategória:', result.error.category);
}
```

## Validáció

BaseService validáció használata:

```javascript
const validation = this.validate(data, {
  name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 50
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  age: {
    required: false,
    type: 'number',
    min: 18,
    max: 120
  }
});

if (!validation.valid) {
  console.error('Hibák:', validation.errors);
}
```

## Logolás

```javascript
import Logger from './src/services/Logger';

Logger.info('Információ', { context: 'data' });
Logger.debug('Debug üzenet', { details: 'info' });
Logger.warn('Figyelmeztetés', { reason: 'something' });
Logger.error('Hiba', { error: 'message' });
Logger.success('Siker', { result: 'data' });
```

## Konstansok

### ProfileService
- MIN_PHOTOS: 6
- MAX_PHOTOS: 9
- MIN_PROMPTS: 3
- MAX_PROMPTS: 5
- MAX_PROMPT_LENGTH: 150

### StorageService
- MAX_IMAGE_SIZE: 200KB
- MAX_VIDEO_SIZE_UPLOAD: 50MB
- MAX_VIDEO_DURATION: 30s
- SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png']
- SUPPORTED_VIDEO_FORMATS: ['mp4']

### LocationService
- EARTH_RADIUS_KM: 6371
- EARTH_RADIUS_MILES: 3959
- ACCURACY_THRESHOLD_KM: 1
