# 👨‍💻 Fejlesztési Útmutató - Luxio

**Dátum:** 2024  
**Verzió:** 1.0.0

---

## 📋 TARTALOMJEGYZÉK

1. [Fejlesztési Környezet](#fejlesztési-környezet)
2. [Kód Stílus](#kód-stílus)
3. [Git Workflow](#git-workflow)
4. [Komponens Fejlesztés](#komponens-fejlesztés)
5. [API Fejlesztés](#api-fejlesztés)
6. [Tesztelés](#tesztelés)
7. [Debugging](#debugging)

---

## 🛠️ FEJLESZTÉSI KÖRNYEZET

### Szükséges Eszközök

- **VS Code** (ajánlott) vagy más IDE
- **React Native Debugger** (opcionális)
- **Postman** vagy **Insomnia** (API teszteléshez)
- **pgAdmin** vagy **DBeaver** (adatbázis kezeléshez)

### VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## 📝 KÓD STÍLUS

### JavaScript/React Native

- **ESLint** konfiguráció használata
- **Prettier** formázás
- **2 spaces** indentáció
- **Single quotes** string-ekhez
- **Semicolons** használata

### Példa

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Effect logic
  }, [prop1]);

  return (
    <View style={styles.container}>
      <Text>{prop1}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MyComponent;
```

### Komponens Nevezéktan

- **PascalCase** komponensekhez: `UserProfile.js`
- **camelCase** fájlokhoz: `userService.js`
- **kebab-case** könyvtárakhoz: `user-profile/`

---

## 🌿 GIT WORKFLOW

### Branch Naming

- `feature/feature-name` - Új funkciók
- `bugfix/bug-name` - Bug javítások
- `hotfix/hotfix-name` - Kritikus javítások
- `refactor/refactor-name` - Refaktorálás

### Commit Messages

```
feat: Add user profile screen
fix: Fix login token expiration
refactor: Simplify API service
docs: Update README
test: Add unit tests for user service
```

### Pull Request Template

```markdown
## Leírás
Rövid leírás a változtatásokról

## Típus
- [ ] Feature
- [ ] Bugfix
- [ ] Refactor
- [ ] Documentation

## Tesztelés
- [ ] Unit tesztek
- [ ] Manuális tesztelés
- [ ] E2E tesztek
```

---

## 🧩 KOMPONENS FEJLESZTÉS

### Új Komponens Létrehozása

1. **Komponens fájl létrehozása**

```javascript
// src/components/NewComponent.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const NewComponent = ({ prop1, prop2 }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{prop1}</Text>
    </View>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
  },
  text: {
    color: theme.colors.text,
  },
});

export default NewComponent;
```

2. **Dark mode támogatás**

Mindig használd a `useTheme` hook-ot és a `createStyles` függvényt.

3. **PropTypes vagy TypeScript**

```javascript
import PropTypes from 'prop-types';

NewComponent.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};
```

### Új Képernyő Létrehozása

1. **Képernyő fájl létrehozása**

```javascript
// src/screens/NewScreen.js
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const NewScreen = ({ navigation, route }) => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Text>New Screen</Text>
    </SafeAreaView>
  );
};

export default NewScreen;
```

2. **Navigáció regisztrálása**

```javascript
// App.js
import NewScreen from './src/screens/NewScreen';

// Stack.Navigator-ben:
<Stack.Screen name="NewScreen" component={NewScreen} />
```

---

## 🔌 API FEJLESZTÉS

### Új Endpoint Létrehozása

1. **Route fájl létrehozása vagy módosítása**

```javascript
// backend/src/routes/newRoute.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');

// GET /api/v1/new-route
router.get('/', authenticate, async (req, res) => {
  try {
    // Logic
    res.json({
      success: true,
      data: { /* data */ },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

module.exports = router;
```

2. **Route regisztrálása**

```javascript
// backend/src/server.js
const newRoute = require('./routes/newRoute');
app.use('/api/v1/new-route', newRoute);
```

3. **Validáció hozzáadása**

```javascript
const { body, validationResult } = require('express-validator');

router.post(
  '/',
  authenticate,
  [
    body('field1').isString().notEmpty(),
    body('field2').isEmail(),
  ],
  validate,
  async (req, res) => {
    // Logic
  }
);
```

---

## 🧪 TESZTELÉS

### Unit Tesztek

```javascript
// __tests__/services/UserService.test.js
import UserService from '../../src/services/UserService';

describe('UserService', () => {
  it('should return user data', async () => {
    const user = await UserService.getUser(1);
    expect(user).toBeDefined();
  });
});
```

### API Tesztek

```javascript
// __tests__/api/auth.test.js
const request = require('supertest');
const app = require('../../src/server');

describe('POST /api/v1/auth/register', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!@#',
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

---

## 🐛 DEBUGGING

### React Native Debugging

1. **React Native Debugger**

```bash
# Telepítés
brew install --cask react-native-debugger

# Indítás
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

2. **Chrome DevTools**

- Shake az eszközön
- Válaszd a "Debug" opciót
- Nyisd meg a Chrome DevTools-t

3. **Console Logging**

```javascript
console.log('Debug info:', data);
console.warn('Warning:', warning);
console.error('Error:', error);
```

### Backend Debugging

1. **Node.js Debugger**

```bash
# VS Code launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "dev"],
  "console": "integratedTerminal"
}
```

2. **Winston Logging**

```javascript
const logger = require('./src/utils/logger');

logger.info('Info message');
logger.error('Error message', error);
```

---

## 📚 TOVÁBBI INFORMÁCIÓK

- [React Native Dokumentáció](https://reactnative.dev/docs/getting-started)
- [Expo Dokumentáció](https://docs.expo.dev/)
- [Express.js Dokumentáció](https://expressjs.com/)
- [PostgreSQL Dokumentáció](https://www.postgresql.org/docs/)

---

**Utolsó frissítés:** 2024  
**Verzió:** 1.0.0

