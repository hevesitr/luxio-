# HomeScreen Refactoring Guide

## ✅ Elkészült Komponensek

A HomeScreen refaktorálása során 6 új moduláris komponenst hoztunk létre:

### 1. **FilterBar** (`src/components/discovery/FilterBar.js`)
- Szűrő gombok megjelenítése
- Verifikált szűrő toggle
- AI keresés gomb
- Térkép nézet gomb
- Haladó keresés gomb
- Sugar Dating mód (18+)

**Props:**
```javascript
<FilterBar
  theme={theme}
  showOnlyVerified={boolean}
  aiModeEnabled={boolean}
  sugarDatingMode={boolean}
  onToggleVerified={() => {}}
  onToggleAI={() => {}}
  onOpenMap={() => {}}
  onOpenSearch={() => {}}
  onToggleSugarDating={() => {}}
/>
```

### 2. **ActionButtons** (`src/components/discovery/ActionButtons.js`)
- Swipe akció gombok
- Undo (visszavonás)
- Dislike (X)
- Super Like (csillag)
- Like (szív)
- Videó profil

**Props:**
```javascript
<ActionButtons
  theme={theme}
  onUndo={() => {}}
  onDislike={() => {}}
  onSuperLike={() => {}}
  onLike={() => {}}
  onVideoProfile={() => {}}
  canUndo={boolean}
  disabled={boolean}
  visible={boolean}
/>
```

### 3. **StoryBar** (`src/components/discovery/StoryBar.js`)
- Story-k megjelenítése
- Saját story létrehozás
- Story nézet toggle
- Empty state CTA-val

**Props:**
```javascript
<StoryBar
  theme={theme}
  stories={array}
  currentUser={object}
  visible={boolean}
  onToggleVisibility={() => {}}
  onStoryPress={(index) => {}}
  onCreateStory={() => {}}
/>
```

### 4. **AISearchModal** (`src/components/discovery/AISearchModal.js`)
- AI-alapú keresés modal
- Szöveges leírás input
- Keresés és mégse gombok

**Props:**
```javascript
<AISearchModal
  theme={theme}
  visible={boolean}
  onClose={() => {}}
  onSearch={(description) => {}}
/>
```

### 5. **SugarDatingModal** (`src/components/discovery/SugarDatingModal.js`)
- Sugar Dating intro modal
- 18+ figyelmeztetés
- Használati útmutató
- Biztonsági tippek

**Props:**
```javascript
<SugarDatingModal
  theme={theme}
  visible={boolean}
  onClose={() => {}}
  onContinue={() => {}}
/>
```

### 6. **EmptyState** (`src/components/discovery/EmptyState.js`)
- Üres állapot megjelenítése
- Nincs több profil üzenet
- Újrakezdés gomb

**Props:**
```javascript
<EmptyState
  theme={theme}
  onReset={() => {}}
/>
```

## 📦 Komponens Struktúra

```
src/
├── components/
│   └── discovery/
│       ├── FilterBar.js          (120 sor)
│       ├── ActionButtons.js      (140 sor)
│       ├── StoryBar.js           (150 sor)
│       ├── AISearchModal.js      (130 sor)
│       ├── SugarDatingModal.js   (140 sor)
│       ├── EmptyState.js         (70 sor)
│       └── index.js              (10 sor)
└── screens/
    ├── HomeScreen.js             (1627 sor - eredeti)
    └── HomeScreen.REFACTORED.js  (készülőben)
```

## 🔄 Integráció Lépései

### 1. Importok Cseréje

**Régi:**
```javascript
// Minden a HomeScreen.js-ben volt
```

**Új:**
```javascript
import {
  FilterBar,
  ActionButtons,
  StoryBar,
  AISearchModal,
  SugarDatingModal,
  EmptyState,
} from '../components/discovery';
```

### 2. JSX Struktúra Egyszerűsítése

**Régi (példa):**
```javascript
<View style={styles.topButtonsContainer}>
  <TouchableOpacity
    style={[styles.verifiedFilterButton, showOnlyVerified && styles.verifiedFilterButtonActive]}
    onPress={handleToggleVerifiedFilter}
  >
    <Ionicons
      name={showOnlyVerified ? 'checkmark-circle' : 'checkmark-circle-outline'}
      size={20}
      color={showOnlyVerified ? theme.colors.primary : theme.colors.text}
    />
    <Text style={[styles.verifiedFilterText, showOnlyVerified && styles.verifiedFilterTextActive]}>
      {showOnlyVerified ? 'Csak verifikált' : 'Összes'}
    </Text>
  </TouchableOpacity>
  {/* ... több gomb ... */}
</View>
```

**Új:**
```javascript
<FilterBar
  theme={theme}
  showOnlyVerified={showOnlyVerified}
  aiModeEnabled={aiModeEnabled}
  sugarDatingMode={sugarDatingMode}
  onToggleVerified={handleToggleVerifiedFilter}
  onToggleAI={() => setAiModalVisible(true)}
  onOpenMap={() => navigation.navigate('Profil', { screen: 'Map' })}
  onOpenSearch={handleOpenSearch}
  onToggleSugarDating={() => setSugarDatingMode(!sugarDatingMode)}
/>
```

### 3. Stílusok Csökkentése

A komponensek saját stílusokat tartalmaznak, így a HomeScreen stílusai jelentősen csökkennek:

**Előtte:** ~400 sor stílus  
**Utána:** ~150 sor stílus

## 📊 Előnyök

### Kód Méret
- **Eredeti HomeScreen:** 1627 sor
- **Refaktorált HomeScreen:** ~800 sor (50% csökkenés)
- **Komponensek összesen:** ~760 sor (újrafelhasználható)

### Karbantarthatóság
- ✅ Kisebb, fókuszált komponensek
- ✅ Egyértelmű felelősségi körök
- ✅ Könnyebb tesztelés
- ✅ Jobb újrafelhasználhatóság

### Teljesítmény
- ✅ Komponensek külön-külön optimalizálhatók
- ✅ React.memo használható
- ✅ Kisebb re-render scope

## 🧪 Tesztelés

### 1. Komponens Tesztek

```javascript
// FilterBar.test.js
import { render, fireEvent } from '@testing-library/react-native';
import FilterBar from '../FilterBar';

test('toggles verified filter', () => {
  const onToggle = jest.fn();
  const { getByText } = render(
    <FilterBar
      theme={mockTheme}
      showOnlyVerified={false}
      onToggleVerified={onToggle}
    />
  );
  
  fireEvent.press(getByText('Összes'));
  expect(onToggle).toHaveBeenCalled();
});
```

### 2. Integráció Teszt

```javascript
// HomeScreen.test.js
test('renders all discovery components', () => {
  const { getByTestId } = render(<HomeScreen />);
  
  expect(getByTestId('filter-bar')).toBeTruthy();
  expect(getByTestId('action-buttons')).toBeTruthy();
  expect(getByTestId('story-bar')).toBeTruthy();
});
```

## 🚀 Következő Lépések

1. ✅ **Komponensek létrehozva** (6/6)
2. ⏳ **HomeScreen.REFACTORED.js befejezése**
3. ⏳ **Tesztelés**
4. ⏳ **Dokumentáció frissítése**
5. ⏳ **Régi HomeScreen.js cseréje**

## 📝 Megjegyzések

- A komponensek teljes mértékben visszafelé kompatibilisek
- Minden prop opcionális default értékekkel
- Theme support minden komponensben
- Accessibility támogatás (később bővíthető)

## 🔗 Kapcsolódó Fájlok

- `src/components/profile/*` - ProfileScreen komponensek (már kész)
- `src/components/chat/*` - ChatScreen komponensek (már kész)
- `src/components/VerificationBadge.js` - Verifikációs jelvény (már kész)

---

**Státusz:** 🟡 Folyamatban  
**Utolsó frissítés:** 2025. December 3.  
**Következő:** HomeScreen.REFACTORED.js befejezése
