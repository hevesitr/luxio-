# 📱 SIMPLE APP - UI RÉSZLETEK

**Dátum:** 2025. december 7.  
**Verzió:** App.simple.js  
**Status:** ✅ FUTÓ

---

## 🎨 FELSŐ MENÜSOR (Header)

### Felfedezés Tab - Header

```
┌─────────────────────────────────────────────────────┐
│  Felfedezés                          🔍 (Filter)    │
└─────────────────────────────────────────────────────┘
```

**Elemek:**
- **Cím:** "Felfedezés" (28px, bold, #333)
- **Filter Ikon:** Jobbra pozicionálva (24px, #FF6B6B)
  - Tap: Szűrő panel megnyitása/bezárása

**Kód:**
```javascript
<View style={styles.header}>
  <Text style={styles.screenTitle}>Felfedezés</Text>
  <TouchableOpacity
    style={styles.filterIcon}
    onPress={() => setShowFilters(!showFilters)}
  >
    <Ionicons name="filter" size={24} color="#FF6B6B" />
  </TouchableOpacity>
</View>
```

---

### Matchek Tab - Header

```
┌─────────────────────────────────────────────────────┐
│  Matchek                                            │
│  2 aktív match                                      │
└─────────────────────────────────────────────────────┘
```

**Elemek:**
- **Cím:** "Matchek" (28px, bold, #333)
- **Alcím:** "X aktív match" (16px, #666)

**Kód:**
```javascript
<View style={styles.header}>
  <Text style={styles.screenTitle}>Matchek</Text>
  <Text style={styles.subtitle}>{matches.length} aktív match</Text>
</View>
```

---

### Profil Tab - Header

```
┌─────────────────────────────────────────────────────┐
│  Profil                                             │
└─────────────────────────────────────────────────────┘
```

**Elemek:**
- **Cím:** "Profil" (28px, bold, #333)

**Kód:**
```javascript
<View style={styles.header}>
  <Text style={styles.screenTitle}>Profil</Text>
</View>
```

---

## 📸 PROFILKÉP LAPOZÁS (Photo Navigation)

### Felépítés

```
┌─────────────────────────────────────────────────────┐
│  ■ ■ ■ ■ ■  (Photo Indicators)                     │
│                                                     │
│                                                     │
│  [Profil Kép]                                       │
│                                                     │
│  ◄─────────────────────────────────────────────►   │
│  (Photo Navigation Areas)                           │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Név, Kor                                    │   │
│  │ Bio                                         │   │
│  │ Város | Foglalkozás | Végzettség | Táv     │   │
│  │ Érdeklődések                                │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

### 1️⃣ PHOTO INDICATORS (Fotó Mutatók)

**Pozíció:** Felső bal sarok  
**Megjelenés:** Vízszintes sáv

```
┌─────────────────────────────────────────┐
│ ■ ■ ■ ■ ■                              │
│ (Aktív) (Inaktív) (Inaktív) ...        │
└─────────────────────────────────────────┘
```

**Stílus:**
- **Aktív:** Fehér (#FFF), 3px magas
- **Inaktív:** Félig átlátszó fehér (rgba(255,255,255,0.3)), 3px magas
- **Rés:** 4px
- **Padding:** 16px (felső, bal, jobb)

**Kód:**
```javascript
{photos.length > 1 && (
  <View style={styles.indicators}>
    {photos.map((_, index) => (
      <View
        key={index}
        style={[
          styles.indicator,
          index === currentPhotoIndex && styles.indicatorActive
        ]}
      />
    ))}
  </View>
)}
```

---

### 2️⃣ PHOTO NAVIGATION (Fotó Navigáció)

**Pozíció:** Teljes képernyő (overlay)  
**Funkció:** Bal/jobb oldal tapintása

```
┌──────────────────┬──────────────────┐
│                  │                  │
│   Előző fotó     │   Következő fotó │
│   (Tap area)     │   (Tap area)     │
│                  │                  │
└──────────────────┴──────────────────┘
```

**Logika:**
- **Bal oldal:** Előző fotó (ha van)
- **Jobb oldal:** Következő fotó (ha van)
- **Disabled:** Ha az első/utolsó fotónál vagyunk

**Kód:**
```javascript
{photos.length > 1 && (
  <View style={styles.photoNavigation}>
    <TouchableOpacity
      style={styles.photoNavButton}
      onPress={() => handlePhotoPress('left')}
      disabled={currentPhotoIndex === 0}
    />
    <TouchableOpacity
      style={styles.photoNavButton}
      onPress={() => handlePhotoPress('right')}
      disabled={currentPhotoIndex === photos.length - 1}
    />
  </View>
)}
```

---

### 3️⃣ PROFIL INFORMÁCIÓ (Info Container)

**Pozíció:** Alsó rész (gradient overlay felett)  
**Háttér:** Fekete gradient (rgba(0,0,0,0) → rgba(0,0,0,0.8))

#### A. Név és Kor

```
Anna, 25  ✓
```

- **Név:** 28px, bold, fehér
- **Kor:** 28px, regular, fehér
- **Ellenőrzés ikon:** 24px, kék (#007AFF)

**Kód:**
```javascript
<View style={styles.nameRow}>
  <Text style={styles.name}>
    {displayName}
    {age && <Text style={styles.age}>, {age}</Text>}
  </Text>
  {isVerified && (
    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
  )}
</View>
```

#### B. Bio

```
Szeretem a jó zenét és a kalandokat! 🎵✈️
```

- **Méret:** 16px, fehér
- **Sorok:** Max 3
- **Padding:** 12px (alsó)

**Kód:**
```javascript
{bio && (
  <Text style={styles.bio} numberOfLines={3}>
    {bio}
  </Text>
)}
```

#### C. Tagek (Város, Foglalkozás, Végzettség, Távolság)

```
📍 Budapest  💼 Szoftverfejlesztő  🎓 ELTE  🧭 5 km away
```

- **Ikon + Szöveg:** 14px, fehér
- **Háttér:** Félig átlátszó fehér (rgba(255,255,255,0.2))
- **Padding:** 12px (vízszintes), 6px (függőleges)
- **Border radius:** 16px
- **Rés:** 8px

**Kód:**
```javascript
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  {city && (
    <View style={styles.tag}>
      <Ionicons name="location" size={14} color="#fff" />
      <Text style={styles.tagText}>{city}</Text>
    </View>
  )}
  {profile.occupation && (
    <View style={styles.tag}>
      <Ionicons name="briefcase" size={14} color="#fff" />
      <Text style={styles.tagText}>{profile.occupation}</Text>
    </View>
  )}
  {/* ... további tagek ... */}
</ScrollView>
```

#### D. Érdeklődések

```
🎵 zene  ✈️ utazás  📚 olvasás  🏃 sport  ☕ kávézók
```

- **Szöveg:** 13px, fehér
- **Háttér:** Félig átlátszó fehér (rgba(255,255,255,0.15))
- **Border:** 1px, rgba(255,255,255,0.3)
- **Padding:** 12px (vízszintes), 6px (függőleges)
- **Border radius:** 16px
- **Rés:** 8px
- **Max:** 5 érdeklődés

**Kód:**
```javascript
{profile.interests && profile.interests.length > 0 && (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {profile.interests.slice(0, 5).map((interest, index) => (
      <View key={index} style={styles.interest}>
        <Text style={styles.interestText}>{interest}</Text>
      </View>
    ))}
  </ScrollView>
)}
```

---

## 🎬 INTERAKCIÓK

### Fotó Lapozás

| Akció | Eredmény |
|-------|----------|
| **Bal oldal tap** | Előző fotó (ha van) |
| **Jobb oldal tap** | Következő fotó (ha van) |
| **Indikátor** | Frissül az aktuális fotó alapján |
| **Disabled** | Első/utolsó fotónál |

### Swipe Gesztúra

| Gesztúra | Eredmény |
|----------|----------|
| **Jobbra swipe** | Like (onSwipeRight) |
| **Balra swipe** | Pass (onSwipeLeft) |
| **Felfelé swipe** | Super Like (onSuperLike) |
| **Animáció** | Spring animation (Animated API) |

---

## 🎨 SZÍN PALETTA

| Elem | Szín | Hex |
|------|------|-----|
| **Cím** | Sötét szürke | #333 |
| **Alcím** | Szürke | #666 |
| **Filter ikon** | Piros | #FF6B6B |
| **Ellenőrzés ikon** | Kék | #007AFF |
| **Szöveg (info)** | Fehér | #FFF |
| **Gradient** | Fekete (0-80%) | rgba(0,0,0,0-0.8) |
| **Tag háttér** | Fehér (20%) | rgba(255,255,255,0.2) |
| **Interest háttér** | Fehér (15%) | rgba(255,255,255,0.15) |

---

## 📐 MÉRETEK

| Elem | Méret |
|------|-------|
| **Képernyő szélesség** | 100% |
| **Képernyő magasság** | 100% |
| **Header padding** | 20px |
| **Info padding** | 20px |
| **Gradient magasság** | 50% |
| **Border radius** | 20px |
| **Indikátor magasság** | 3px |
| **Tag padding** | 12px (h), 6px (v) |

---

## 🔄 STATE MANAGEMENT

```javascript
const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
const [showFilters, setShowFilters] = useState(false);
const [likedProfiles, setLikedProfiles] = useState([]);
const [filters, setFilters] = useState({
  ageMin: 18,
  ageMax: 35,
  distance: 50,
  verifiedOnly: false
});
```

---

## 📊 ADATSTRUKTÚRA

```javascript
profile = {
  id: 1,
  name: 'Anna',
  age: 25,
  city: 'Budapest',
  bio: 'Szeretem a jó zenét...',
  photos: [
    'https://images.unsplash.com/...',
    'https://images.unsplash.com/...',
    'https://images.unsplash.com/'
  ],
  interests: ['zene', 'utazás', 'koncertek', ...],
  occupation: 'Szoftverfejlesztő',
  education: 'ELTE',
  distance: 5,
  verified: true,
  lastActive: new Date(...)
}
```

---

## ✅ FUNKCIÓK ÖSSZEFOGLALÁSA

✅ **Fotó lapozás** - Bal/jobb tap  
✅ **Fotó indikátorok** - Aktuális pozíció mutatása  
✅ **Swipe gesztúra** - Like/Pass/Super Like  
✅ **Gradient overlay** - Szöveg olvashatósága  
✅ **Ellenőrzés badge** - Verifikált profil jelzése  
✅ **Responsive design** - Minden mérethez alkalmazkodik  
✅ **Smooth animáció** - Spring animation  

---

**Készült:** 2025. december 7.  
**Status:** ✅ TELJES DOKUMENTÁCIÓ

