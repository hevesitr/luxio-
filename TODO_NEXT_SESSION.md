# TODO - Következő Session

## Prioritás 1: Discovery and Matching System (3. feladat)

### 3.1 MatchService Core Functionality
- [ ] Swipe rögzítés (left/right/super)
- [ ] Match létrehozás kölcsönös like esetén
- [ ] Match lekérése és kezelés
- [ ] Unmatch funkció

### 3.3 Discovery Feed Filtering
- [ ] Szűrők alkalmazása (age, distance, gender)
- [ ] Preference persistence
- [ ] Filter validáció

### 3.7 Compatibility Algorithm
- [ ] Scoring logika (shared interests)
- [ ] Location proximity weighting
- [ ] Activity pattern analysis

## Prioritás 2: Real-time Messaging System (4. feladat)

### 4.1 MessageService with Supabase Real-time
- [ ] Message sending
- [ ] Message persistence
- [ ] Delivery receipt generation

### 4.3 Real-time Subscriptions
- [ ] WebSocket connection management
- [ ] Message notification system
- [ ] Typing indicators

### 4.5 Message Pagination
- [ ] Conversation loading (50 messages)
- [ ] Infinite scroll
- [ ] Cursor-based pagination

## Prioritás 3: Premium Features (6. feladat)

### 6.1 PaymentService
- [ ] Subscription management
- [ ] Premium status checking
- [ ] Feature gating logic

### 6.4 Super Likes Functionality
- [ ] Super like allocation (5/day)
- [ ] Super like notification
- [ ] Daily reset logic

### 6.6 Rewind Functionality
- [ ] Swipe history tracking
- [ ] Undo last swipe
- [ ] Restore profile to feed

## Technikai Feladatok

### Tesztelés
- [ ] Property-based tesztek írása (fast-check)
- [ ] Unit tesztek a szolgáltatásokhoz
- [ ] Integration tesztek
- [ ] E2E tesztek (Detox)

### Optimalizálás
- [ ] Bundle size csökkentés
- [ ] Code splitting
- [ ] Lazy loading komponensek
- [ ] Image caching (react-native-fast-image)

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics (Mixpanel/Amplitude)
- [ ] Performance monitoring (Firebase)
- [ ] Crash reporting

## Dokumentáció

- [ ] API dokumentáció (Swagger/OpenAPI)
- [ ] Component dokumentáció (Storybook)
- [ ] Deployment guide
- [ ] User guide

## Deployment

- [ ] Environment setup (dev, staging, prod)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] App Store submission
- [ ] Google Play submission

## Következő Session Indítása

1. Nyisd meg: `.kiro/specs/refactor-dating-app/tasks.md`
2. Kattints "Start task" a 3.1 feladatnál
3. Olvasd el: `docs/SERVICE_LAYER_ARCHITECTURE.md`
4. Nézd meg: `QUICK_REFERENCE_SERVICES.md`

## Hasznos Parancsok

```bash
# Fejlesztés
npm start

# Tesztelés
npm test

# Build
npm run build

# Biztonsági ellenőrzés
node scripts/verify-security-implementation.js

# Supabase
# Futtasd az SQL szkripteket a Supabase Dashboard-on
```

## Megjegyzések

- Minden szolgáltatás a BaseService-ből származik
- Minden hiba ServiceError formátumban
- Minden művelet automatikusan logolódik
- Minden validáció a BaseService.validate()-tel

## Státusz

- ✅ Biztonsági Alapok (100%)
- ✅ Service Layer Architecture (100%)
- ⏳ Discovery and Matching (0%)
- ⏳ Real-time Messaging (0%)
- ⏳ Premium Features (0%)

**Teljes Projekt: 20% kész**
