# React Query Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. Kód Ellenőrzés
- [x] React Query telepítve
- [x] QueryProvider konfigurálva
- [x] 31 custom hook létrehozva
- [x] 3 optimalizált képernyő
- [x] App.js frissítve
- [ ] Tesztelés befejezve
- [ ] Hibák javítva

### 2. Konfiguráció Ellenőrzés
- [x] Cache stratégia beállítva
- [x] Stale time konfigurálva
- [x] Retry logic beállítva
- [x] Error handling implementálva
- [ ] Production környezet tesztelve

### 3. Performance Ellenőrzés
- [ ] Memory leaks ellenőrizve
- [ ] Re-renders optimalizálva
- [ ] API calls deduplikálva
- [ ] Bundle size ellenőrizve

## 🚀 Deployment Lépések

### 1. Development Build Tesztelés

```bash
# Indítsd el az appot development módban
npm start

# Vagy Expo Go-val
npx expo start
```

**Ellenőrizd**:
- ✅ App elindul hiba nélkül
- ✅ Minden képernyő működik
- ✅ React Query hooks működnek
- ✅ Cache működik
- ✅ Optimistic updates működnek

### 2. Production Build Készítés

#### iOS Build
```bash
# EAS Build (ajánlott)
eas build --platform ios --profile production

# Vagy local build
npx expo run:ios --configuration Release
```

#### Android Build
```bash
# EAS Build (ajánlott)
eas build --platform android --profile production

# Vagy local build
npx expo run:android --variant release
```

### 3. Build Konfiguráció

**app.json / app.config.js**:
```json
{
  "expo": {
    "name": "Dating App",
    "slug": "dating-app",
    "version": "2.0.0",
    "extra": {
      "reactQueryConfig": {
        "staleTime": 300000,
        "cacheTime": 600000,
        "retry": 2
      }
    }
  }
}
```

### 4. Environment Variables

**.env.production**:
```bash
# Supabase
SUPABASE_URL=your_production_url
SUPABASE_ANON_KEY=your_production_key

# React Query
REACT_QUERY_DEVTOOLS_ENABLED=false
REACT_QUERY_CACHE_TIME=600000
REACT_QUERY_STALE_TIME=300000
```

### 5. Bundle Size Optimalizálás

```bash
# Elemezd a bundle size-t
npx expo export --platform all

# Ellenőrizd a méreteket
ls -lh dist/
```

**Optimalizációk**:
- ✅ React Query DevTools csak dev-ben
- ✅ Unused imports eltávolítva
- ✅ Code splitting használva
- ✅ Images optimalizálva

## 📊 Production Monitoring

### 1. Error Tracking

**Sentry Setup**:
```bash
npm install @sentry/react-native
```

**Konfiguráció**:
```javascript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your_sentry_dsn',
  environment: 'production',
  beforeSend(event) {
    // Filter React Query errors if needed
    return event;
  },
});
```

### 2. Analytics

**React Query Analytics**:
```javascript
import { queryClient } from './src/context/QueryProvider';

// Track query success/failure
queryClient.setDefaultOptions({
  queries: {
    onSuccess: (data, query) => {
      analytics.track('Query Success', {
        queryKey: query.queryKey,
      });
    },
    onError: (error, query) => {
      analytics.track('Query Error', {
        queryKey: query.queryKey,
        error: error.message,
      });
    },
  },
});
```

### 3. Performance Monitoring

**Metrics to Track**:
- Cache hit rate
- API call count
- Average response time
- Error rate
- User engagement

## 🔧 Production Optimalizációk

### 1. Cache Persistence (Opcionális)

```bash
npm install @tanstack/react-query-persist-client
npm install @react-native-async-storage/async-storage
```

**Setup**:
```javascript
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
});
```

### 2. Offline Support

**React Query Offline Plugin**:
```javascript
import { onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

onlineManager.setEventListener(setOnline => {
  return NetInfo.addEventListener(state => {
    setOnline(!!state.isConnected);
  });
});
```

### 3. Background Sync

**Mutation Queue**:
```javascript
import { MutationCache } from '@tanstack/react-query';

const mutationCache = new MutationCache({
  onSuccess: (data, variables, context, mutation) => {
    // Sync successful mutations
  },
  onError: (error, variables, context, mutation) => {
    // Queue failed mutations for retry
  },
});
```

## 📱 Platform Specific

### iOS Specific

**Info.plist**:
```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <false/>
</dict>
```

### Android Specific

**AndroidManifest.xml**:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## 🧪 Production Testing

### 1. Beta Testing

**TestFlight (iOS)**:
```bash
eas build --platform ios --profile preview
eas submit --platform ios
```

**Google Play Internal Testing (Android)**:
```bash
eas build --platform android --profile preview
eas submit --platform android
```

### 2. A/B Testing

**Feature Flags**:
```javascript
const useFeatureFlag = (flag) => {
  return useQuery(['feature-flag', flag], () => 
    fetchFeatureFlag(flag)
  );
};

// Usage
const { data: useReactQuery } = useFeatureFlag('react-query-enabled');
```

## 📈 Post-Deployment Monitoring

### Week 1 Checklist
- [ ] Monitor error rate
- [ ] Check cache hit rate
- [ ] Analyze API call reduction
- [ ] Monitor user engagement
- [ ] Collect user feedback

### Week 2 Checklist
- [ ] Analyze performance metrics
- [ ] Optimize slow queries
- [ ] Fix reported bugs
- [ ] A/B test results

### Month 1 Checklist
- [ ] Full performance review
- [ ] User satisfaction survey
- [ ] Plan next optimizations
- [ ] Update documentation

## 🔄 Rollback Plan

### If Issues Occur

**Quick Rollback**:
```bash
# Revert to old screens
git checkout HEAD~1 -- App.js
git checkout HEAD~1 -- src/screens/HomeScreen.js
git checkout HEAD~1 -- src/screens/MatchesScreen.js

# Rebuild
eas build --platform all --profile production
```

**Gradual Rollback**:
```javascript
// Feature flag to disable React Query
const USE_REACT_QUERY = false;

// In App.js
import HomeScreen from USE_REACT_QUERY 
  ? './src/screens/HomeScreen.OPTIMIZED'
  : './src/screens/HomeScreen.OLD';
```

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Tesztelés befejezve
- [ ] Hibák javítva
- [ ] Performance optimalizálva
- [ ] Bundle size ellenőrizve
- [ ] Environment variables beállítva

### Deployment
- [ ] iOS build sikeres
- [ ] Android build sikeres
- [ ] Beta testing sikeres
- [ ] Production deploy sikeres

### Post-Deployment
- [ ] Error tracking működik
- [ ] Analytics működik
- [ ] Performance monitoring működik
- [ ] User feedback gyűjtése

## 🎯 Success Metrics

### Target Metrics
- **Cache Hit Rate**: > 70%
- **API Call Reduction**: > 50%
- **Error Rate**: < 1%
- **User Engagement**: +20%
- **App Rating**: > 4.5 stars

### Monitoring Dashboard
- Sentry for errors
- Analytics for usage
- Custom dashboard for React Query metrics

## 📞 Support

### If Issues Occur
1. Check error logs in Sentry
2. Review React Query DevTools (dev)
3. Check network requests
4. Review user feedback
5. Contact team for support

---

**Status**: ⏳ Ready for Deployment
**Date**: December 4, 2025
**Version**: 2.0.0 (React Query)

**Next Steps**:
1. Complete testing
2. Fix any issues
3. Deploy to beta
4. Monitor metrics
5. Deploy to production
