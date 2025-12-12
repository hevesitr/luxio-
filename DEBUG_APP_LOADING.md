# APP LOADING DEBUG - DEC 08, 2025

## 🔍 PROBLÉMA

Az app nem tölt be, csak pörög (loading spinner).

## 🛠️ DEBUG LÉPÉSEK

### 1. Cache törlés
```bash
# Metro bundler cache törlése
npm start -- --clear

# VAGY teljes cache törlés
rm -rf .expo
rm -rf node_modules/.cache
npm start -- --clear
```

### 2. Ellenőrizd a Metro bundler terminált
Nézd meg, hogy vannak-e hibák a Metro bundler terminálban:
- ❌ **Error**: Syntax error, import error, stb.
- ⚠️ **Warning**: Figyelmeztetések (általában nem blokkolók)
- ✅ **Success**: "Bundled successfully"

### 3. Ellenőrizd a device/emulator logokat

#### Android:
```bash
adb logcat | grep -i "error\|exception"
```

#### iOS (Mac):
```bash
xcrun simctl spawn booted log stream --predicate 'processImagePath endswith "LoveX"' | grep -i "error"
```

### 4. Ellenőrizd a HomeScreen kódot

**Lehetséges problémák**:
1. ❌ **Hiányzó import**: Valami komponens nincs importálva
2. ❌ **Syntax error**: Zárójelek, vesszők hiánya
3. ❌ **Infinite loop**: useEffect végtelen ciklus
4. ❌ **Context error**: Theme vagy Auth context nem elérhető

### 5. Próbáld ki az egyszerű verziót

Ha a HomeScreen.js nem működik, próbáld ki az egyszerű verziót:

```bash
# Backup jelenlegi
cp src/screens/HomeScreen.js src/screens/HomeScreen.BACKUP3.js

# Egyszerű verzió használata
cp App.simple.js App.js
```

## 🔧 GYORS JAVÍTÁSOK

### Javítás 1: Context Provider ellenőrzés

Ellenőrizd, hogy az App.js-ben vannak-e a context providerek:

```javascript
// App.js
<ThemeProvider>
  <AuthProvider>
    <NavigationContainer>
      {/* ... */}
    </NavigationContainer>
  </AuthProvider>
</ThemeProvider>
```

### Javítás 2: useEffect dependency warning

Ha van useEffect dependency warning, javítsd:

```javascript
// ELŐTTE (warning)
useEffect(() => {
  loadProfiles();
}, []); // loadProfiles nincs a dependency array-ben

// UTÁNA (javítva)
useEffect(() => {
  loadProfiles();
}, [loadProfiles]); // VAGY

const loadProfiles = useCallback(async () => {
  // ...
}, [user?.id]); // dependencies
```

### Javítás 3: Async/Await error handling

```javascript
const loadProfiles = async () => {
  try {
    setLoading(true);
    // ... async operations
  } catch (error) {
    console.error('Error:', error);
    // Fallback
    setProfiles(initialProfiles);
  } finally {
    setLoading(false); // FONTOS: mindig állítsd false-ra
  }
};
```

## 🚨 LEGGYAKORIBB OKOK

### 1. Loading state nem változik false-ra
```javascript
// PROBLÉMA: setLoading(false) hiányzik
const loadProfiles = async () => {
  setLoading(true);
  const profiles = await fetchProfiles();
  setProfiles(profiles);
  // ❌ setLoading(false) HIÁNYZIK!
};

// MEGOLDÁS: finally block
const loadProfiles = async () => {
  try {
    setLoading(true);
    const profiles = await fetchProfiles();
    setProfiles(profiles);
  } finally {
    setLoading(false); // ✅ MINDIG lefut
  }
};
```

### 2. Context provider hiányzik
```javascript
// PROBLÉMA: useTheme() vagy useAuth() undefined
const { theme } = useTheme(); // ❌ undefined, ha nincs ThemeProvider

// MEGOLDÁS: Ellenőrizd App.js-t
<ThemeProvider>
  <AuthProvider>
    {/* ... */}
  </AuthProvider>
</ThemeProvider>
```

### 3. Infinite loop useEffect-ben
```javascript
// PROBLÉMA: useEffect végtelen ciklus
useEffect(() => {
  setProfiles([...profiles, newProfile]); // ❌ profiles változik → újra fut
}, [profiles]); // ❌ BAD

// MEGOLDÁS: Functional update
useEffect(() => {
  setProfiles(prev => [...prev, newProfile]); // ✅ GOOD
}, []); // ✅ Csak egyszer fut
```

### 4. Navigation prop hiányzik
```javascript
// PROBLÉMA: navigation undefined
const HomeScreen = ({ navigation, onMatch }) => {
  // ...
  navigation.navigate('Map'); // ❌ undefined, ha nincs navigation prop
};

// MEGOLDÁS: Ellenőrizd, hogy a screen a NavigationContainer-ben van
<Stack.Screen name="Home" component={HomeScreen} />
```

## 📋 ELLENŐRZŐ LISTA

- [ ] Metro bundler fut és nincs error
- [ ] Cache törölve (`npm start -- --clear`)
- [ ] Device/emulator újraindítva
- [ ] App.js context providerek rendben
- [ ] HomeScreen.js syntax rendben
- [ ] Loading state mindig false-ra áll
- [ ] useEffect dependencies rendben
- [ ] Navigation prop elérhető
- [ ] Theme és Auth context működik

## 🔄 KÖVETKEZŐ LÉPÉSEK

1. **Nézd meg a Metro bundler terminált** - Van-e error?
2. **Nézd meg a device logokat** - Van-e exception?
3. **Próbáld ki az egyszerű verziót** - App.simple.js működik?
4. **Ellenőrizd a context providereket** - App.js rendben van?

## 💡 GYORS TESZT

Próbáld ki ezt az egyszerű HomeScreen-t:

```javascript
// src/screens/HomeScreen.SIMPLE.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>HomeScreen Works!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    color: '#fff',
    fontSize: 24,
  },
});

export default HomeScreen;
```

Ha ez működik, akkor a probléma a HomeScreen.js kódjában van.

---

**Létrehozva**: 2025. december 8.
**Cél**: App loading probléma debug
