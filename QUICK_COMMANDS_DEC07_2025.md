# 🚀 QUICK COMMANDS - December 7, 2025
## Essential Commands for Testing and Deployment

**Date:** December 7, 2025  
**Status:** ✅ Ready to use  
**Purpose:** Quick reference for common tasks

---

## START APP

### Clear Cache and Start
```bash
npm start -- --reset-cache
```

### Start with Tunnel (for testing on physical device)
```bash
npm start -- --tunnel
```

### Start Android
```bash
npm run android
```

### Start iOS
```bash
npm run ios
```

---

## TESTING

### Run All Tests
```bash
npm test -- --run
```

### Run Phase 1 Tests
```bash
npm test -- Phase1 --run
```

### Run Phase 2 Tests
```bash
npm test -- Phase2 --run
```

### Run with Coverage
```bash
npm test -- --coverage --run
```

### Watch Mode (for development)
```bash
npm test
```

---

## DATABASE

### Verify Supabase Connection
```bash
node scripts/verify-supabase-setup.js
```

### Check RLS Policies
```bash
node scripts/verify-rls-policies.js
```

### Check Storage Setup
```bash
node scripts/verify-storage-setup.js
```

---

## DEBUGGING

### Clear AsyncStorage
```bash
node clear-async-storage.js
```

### Check Database Status
```bash
node check-database-status.js
```

### Debug Profiles
```bash
node DEBUG_PROFILES.js
```

---

## CACHE MANAGEMENT

### Clear Metro Cache
```bash
npm start -- --reset-cache
```

### Clear All Caches (Windows)
```bash
CLEAR_CACHE.bat
```

### Clear Watchman (Mac/Linux)
```bash
watchman watch-del-all
```

---

## BUILD

### Build Android APK
```bash
cd android
./gradlew assembleRelease
```

### Build iOS (Mac only)
```bash
cd ios
pod install
cd ..
npx react-native run-ios --configuration Release
```

### EAS Build (Expo)
```bash
eas build --platform android
eas build --platform ios
eas build --platform all
```

---

## DEPLOYMENT

### Submit to App Store (iOS)
```bash
eas submit --platform ios
```

### Submit to Play Store (Android)
```bash
eas submit --platform android
```

### Update OTA (Expo)
```bash
eas update --branch production
```

---

## LOGS

### View Metro Logs
```bash
npm start
# Logs appear in terminal
```

### View Android Logs
```bash
adb logcat
```

### View iOS Logs (Mac only)
```bash
xcrun simctl spawn booted log stream --predicate 'processImagePath endswith "Luxio"'
```

---

## DEPENDENCIES

### Install Dependencies
```bash
npm install
```

### Update Dependencies
```bash
npm update
```

### Check for Vulnerabilities
```bash
npm audit
npm audit fix
```

### Install Specific Package
```bash
npm install <package-name> --save
```

---

## GIT

### Commit Changes
```bash
git add .
git commit -m "Your message"
git push
```

### Create Branch
```bash
git checkout -b feature/your-feature
```

### Merge Branch
```bash
git checkout main
git merge feature/your-feature
```

---

## SUPABASE

### Login to Supabase CLI
```bash
npx supabase login
```

### Link Project
```bash
npx supabase link --project-ref xgvubkbfhleeagdvkhds
```

### Run Migration
```bash
npx supabase db push
```

### Generate Types
```bash
npx supabase gen types typescript --project-id xgvubkbfhleeagdvkhds > src/types/supabase.ts
```

---

## TROUBLESHOOTING

### Reset Everything
```bash
# Clear caches
npm start -- --reset-cache

# Reinstall dependencies
rm -rf node_modules
npm install

# Clear AsyncStorage
node clear-async-storage.js

# Restart Metro
npm start
```

### Fix Android Build Issues
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Fix iOS Build Issues (Mac only)
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

---

## PERFORMANCE

### Analyze Bundle Size
```bash
npx react-native-bundle-visualizer
```

### Profile Performance
```bash
npm run android -- --variant=release
# Open React DevTools
```

---

## USEFUL ALIASES

Add to your `.bashrc` or `.zshrc`:

```bash
# Luxio aliases
alias luxio-start="npm start -- --reset-cache"
alias luxio-test="npm test -- --run"
alias luxio-android="npm run android"
alias luxio-ios="npm run ios"
alias luxio-clean="rm -rf node_modules && npm install && npm start -- --reset-cache"
```

---

## QUICK VERIFICATION

### After App.js Fix
```bash
# 1. Clear cache and start
npm start -- --reset-cache

# 2. Check console for:
# [App] ✅ All Phase 1 security services initialized successfully
# [App] ✅ All Phase 2 services initialized successfully
# [App] ✅ All services initialized successfully

# 3. Test features:
# - Home screen shows real profiles
# - Matches screen shows real matches
# - Chat works
# - Profile screen works
# - All screens accessible
```

---

## EMERGENCY COMMANDS

### App Crashed
```bash
# 1. Stop Metro
Ctrl+C

# 2. Clear everything
npm start -- --reset-cache
node clear-async-storage.js

# 3. Restart
npm start
```

### Database Issues
```bash
# 1. Verify connection
node scripts/verify-supabase-setup.js

# 2. Check policies
node scripts/verify-rls-policies.js

# 3. Re-run SQL scripts if needed
# Go to Supabase SQL Editor and run scripts
```

### Build Issues
```bash
# Android
cd android && ./gradlew clean && cd .. && npm run android

# iOS (Mac only)
cd ios && pod deintegrate && pod install && cd .. && npm run ios
```

---

## MONITORING

### Check App Health
```bash
# 1. Verify Supabase
node scripts/verify-supabase-setup.js

# 2. Run tests
npm test -- --run

# 3. Check for errors in console
npm start
```

### Monitor Performance
```bash
# Use React DevTools Profiler
# Open app in development mode
# Press 'j' in Metro terminal to open debugger
```

---

## DOCUMENTATION

### Generate API Docs
```bash
npx jsdoc -c jsdoc.json
```

### Update README
```bash
# Edit README.md
# Commit changes
git add README.md
git commit -m "docs: update README"
```

---

**Document Created:** December 7, 2025  
**Status:** ✅ Ready to use  
**Purpose:** Quick command reference

**💡 Tip:** Bookmark this file for quick access to common commands!
