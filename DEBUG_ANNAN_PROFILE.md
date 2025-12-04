# Debug: "AnnaNaN" Profil Probléma

## Probléma Leírása
A HomeScreen-en "AnnaNaN" jelenik meg a profilok helyett.

## Debug Lépések

### 1. Első Hipotézis: currentIndex Race Condition
- **Feltételezés:** A `currentIndex` és `profiles` state update timing probléma
- **Javítás:** Külön `useEffect` a `currentIndex` reset-hez
- **Eredmény:** ❌ Nem oldotta meg a problémát

### 2. Második Hipotézis: Cached History Data
- **Feltételezés:** Az AsyncStorage-ban rossz profil adatok vannak cache-elve
- **Vizsgálat:** A history-ból betöltött profilok lehetnek régiek
- **Eredmény:** ⏳ Vizsgálat alatt

### 3. Harmadik Hipotézis: SwipeCard Rendering
- **Feltételezés:** A SwipeCard komponens nem kapja meg helyesen a profilt
- **Vizsgálat:** Debug log-ok hozzáadva a SwipeCard-hoz
- **Eredmény:** ⏳ Vizsgálat alatt

## Kód Elemzés

### SwipeCard.js - Name és Age Megjelenítés
```javascript
<View style={styles.nameRow}>
  <Text style={styles.name}>{profile.name}</Text>
  <Text style={styles.age}>
    {typeof profile.age === 'number' && !isNaN(profile.age) ? profile.age : '?'}
  </Text>
</View>
```

**Styles:**
```javascript
nameRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,  // Kellene lennie 10px spacingnek!
},
name: {
  fontSize: 36,
  fontWeight: '700',
  color: '#fff',
  letterSpacing: -0.5,
},
age: {
  fontSize: 30,
  color: 'rgba(255, 255, 255, 0.85)',
  fontWeight: '400',
  marginLeft: 4,
},
```

### Megfigyelések
1. **Két külön Text komponens** van a név és az életkor számára
2. A `nameRow`-nak van `gap: 10` - kellene lennie spacingnek
3. Az `age` Text-nek van `marginLeft: 4` - extra spacing
4. A ternary operator ellenőrzi: `typeof profile.age === 'number' && !isNaN(profile.age)`
5. Ha `profile.age = NaN`, akkor `'?'` kellene megjelenjen, nem `'NaN'`!

### Ellentmondás
- **Várt:** "Anna?" vagy "Anna 24" (szóközzel)
- **Valóság:** "AnnaNaN" (szóköz nélkül)

Ez azt jelenti:
1. Vagy a `gap: 10` nem működik (régi React Native verzió?)
2. Vagy a profil adatok rosszak (name = "AnnaNaN"?)
3. Vagy valami más komponens rendereli a szöveget

## Debug Log-ok Hozzáadva

### HomeScreen.js
```javascript
useEffect(() => {
  console.log('=== VISIBLE PROFILES DEBUG ===');
  console.log('profiles.length:', profiles.length);
  console.log('currentIndex:', currentIndex);
  console.log('visibleProfiles.length:', visibleProfiles.length);
  if (visibleProfiles.length > 0) {
    console.log('First visible profile:', JSON.stringify(visibleProfiles[0]));
    console.log('First visible profile name:', visibleProfiles[0]?.name);
    console.log('First visible profile age:', visibleProfiles[0]?.age);
    console.log('First visible profile age type:', typeof visibleProfiles[0]?.age);
  }
}, [profiles, currentIndex, visibleProfiles]);
```

### SwipeCard.js
```javascript
useEffect(() => {
  console.log('=== SWIPECARD PROFILE DEBUG ===');
  console.log('profile:', JSON.stringify(profile, null, 2));
  console.log('profile.name:', profile.name);
  console.log('profile.age:', profile.age);
  console.log('profile.age type:', typeof profile.age);
  console.log('isNaN(profile.age):', isNaN(profile.age));
}, [profile]);
```

## Következő Lépések

1. ✅ Debug log-ok hozzáadva
2. ⏳ App újraindítása és log-ok ellenőrzése
3. ⏳ AsyncStorage törlése (ha szükséges)
4. ⏳ Profil adatok validálása

## Lehetséges Megoldások

### Megoldás 1: AsyncStorage Törlése
```javascript
// clear-async-storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.clear();
```

### Megoldás 2: Profil Validálás
```javascript
// Ensure age is always a valid number
const validatedProfile = {
  ...profile,
  age: typeof profile.age === 'number' && !isNaN(profile.age) ? profile.age : null
};
```

### Megoldás 3: Explicit Spacing
```javascript
<Text style={styles.name}>{profile.name}</Text>
<Text> </Text>  {/* Explicit space */}
<Text style={styles.age}>
  {typeof profile.age === 'number' && !isNaN(profile.age) ? profile.age : '?'}
</Text>
```

## Státusz
⏳ Debug folyamatban - várjuk a log-okat
