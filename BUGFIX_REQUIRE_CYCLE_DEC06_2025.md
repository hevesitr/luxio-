# Bugfix: Require Cycle Between MatchService and SupabaseMatchService

**Date**: December 6, 2025  
**Status**: ✅ FIXED  
**Severity**: P1 (High) - Blocking app startup

## Problem

The app had a circular dependency (require cycle) between two services:
- `MatchService.js` imported `SupabaseMatchService.js`
- `SupabaseMatchService.js` imported `MatchService.js` back

This caused the Metro bundler to fail with:
```
Require cycle: SupabaseMatchService.js -> MatchService.js
```

## Root Cause

In `MatchService.js` (line 7):
```javascript
import SupabaseMatchService from './SupabaseMatchService';
```

And in the constructor (line 14):
```javascript
this.supabaseService = SupabaseMatchService;
```

However, `this.supabaseService` was **never actually used** anywhere in the code - it was dead code.

Meanwhile, `SupabaseMatchService.js` imported `MatchService` to use its local cache methods.

## Solution

Removed the unused import and assignment from `MatchService.js`:

**Before:**
```javascript
import SupabaseMatchService from './SupabaseMatchService';

class MatchService extends BaseService {
  constructor() {
    super('MatchService');
    this.supabaseService = SupabaseMatchService;  // ❌ Dead code
    this.pushService = new PushNotificationService();
```

**After:**
```javascript
class MatchService extends BaseService {
  constructor() {
    super('MatchService');
    this.pushService = new PushNotificationService();
```

## Changes Made

1. **Removed import**: Deleted `import SupabaseMatchService from './SupabaseMatchService';`
2. **Removed assignment**: Deleted `this.supabaseService = SupabaseMatchService;`

## Files Modified

- `src/services/MatchService.js` - Removed circular dependency

## Environment Setup

Also fixed environment variable configuration:
- Updated `.env` to use `EXPO_PUBLIC_` prefix for Supabase credentials
- Changed from `SUPABASE_URL` → `EXPO_PUBLIC_SUPABASE_URL`
- Changed from `SUPABASE_ANON_KEY` → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Verification

✅ App now starts without require cycle errors  
✅ Metro bundler completes successfully  
✅ No "Require cycle" warnings in console  
✅ App is ready for testing on Expo Go

## Next Steps

1. Test profile loading in HomeScreen
2. Verify swipe functionality works
3. Check if profiles display correctly (previously showing "profiles length: 0")
4. Test match creation and notifications

## Technical Notes

- The circular dependency was a classic case of dead code creating a module cycle
- `SupabaseMatchService` only needed `MatchService` for local cache operations
- By removing the unused import from `MatchService`, we broke the cycle without affecting functionality
- Both services can still communicate through their exported instances if needed
