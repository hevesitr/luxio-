# Fix: LinearGradient 'transparent' Hiba

## Probléma
Android-on a LinearGradient `colors={['transparent', ...]}` hibát okoz:
```
Cannot set prop 'colors' on view 'LinearGradientView'
NullPointerException: null cannot be cast to non-null type kotlin.Double
```

## Megoldás
A 'transparent' helyett használjuk: `'rgba(0,0,0,0)'`

## Javítandó Fájlok

1. ✅ `src/components/SwipeCard.js` - JAVÍTVA
2. ✅ `src/components/discovery/ProfileCard.js` - JAVÍTVA
3. ✅ `src/screens/EventsScreen.js` - JAVÍTVA
4. ✅ `src/components/StoryViewer.js` - JAVÍTVA
5. ✅ `src/components/VideoProfile.js` - JAVÍTVA
6. ✅ `src/screens/LikesYouScreen.js` - JAVÍTVA
7. ✅ `src/screens/ProfileDetailScreen.js` - JAVÍTVA
8. ✅ `src/screens/ProfileScreen.js` - JAVÍTVA
9. ✅ `src/screens/TopPicksScreen.js` - JAVÍTVA

**Összes javítás kész!** ✅

## Változtatás
**Előtte:**
```javascript
colors={['transparent', 'rgba(0,0,0,0.8)']}
```

**Utána:**
```javascript
colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
```
