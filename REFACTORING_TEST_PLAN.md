# ProfileScreen Refactoring - Test Plan
**Date:** December 3, 2025
**Status:** Ready for Testing

## 📋 Pre-Test Checklist

### 1. Backup Original File
```bash
cp src/screens/ProfileScreen.js src/screens/ProfileScreen.ORIGINAL.js
```

### 2. Commit Current State
```bash
git add .
git commit -m "backup: Save state before ProfileScreen refactoring"
```

### 3. Verify Components Exist
Check that all these files exist:
- [ ] `src/components/profile/ProfileHeader.js`
- [ ] `src/components/profile/ProfileBio.js`
- [ ] `src/components/profile/ProfileInterests.js`
- [ ] `src/components/profile/ProfileDetails.js`
- [ ] `src/components/profile/ProfilePhotos.js`
- [ ] `src/components/profile/ProfileActions.js`

## 🧪 Testing Steps

### Step 1: Replace ProfileScreen (Temporary)
```bash
# Backup original
mv src/screens/ProfileScreen.js src/screens/ProfileScreen.ORIGINAL.js

# Use refactored version
cp src/screens/ProfileScreen.REFACTORED.js src/screens/ProfileScreen.js
```

### Step 2: Start the App
```bash
npm start
# or
npx expo start
```

### Step 3: Navigate to Profile Screen
1. Open the app
2. Navigate to Profile tab/screen
3. Check for any errors in console

## ✅ Test Cases

### Test 1: Visual Appearance
- [ ] Profile photo displays correctly
- [ ] Name and age display correctly
- [ ] Work and education display (if set)
- [ ] Completion card shows (if < 100%)
- [ ] Progress bar displays correctly
- [ ] Bio section displays
- [ ] Interests display as tags
- [ ] Details section shows filled fields
- [ ] Photos grid displays correctly
- [ ] Settings and Logout buttons visible

### Test 2: Edit Button
- [ ] Click edit button (top right)
- [ ] Edit modal opens
- [ ] Can edit name
- [ ] Can edit bio
- [ ] Can edit interests
- [ ] Save button works
- [ ] Changes reflect in UI
- [ ] Modal closes after save

### Test 3: Photo Upload
- [ ] Click profile photo
- [ ] Alert shows with options
- [ ] "Fotó készítése" option works
- [ ] "Galéria" option works
- [ ] Photo picker opens
- [ ] Selected photo uploads
- [ ] Profile photo updates
- [ ] Success message shows

### Test 4: Photo Grid
- [ ] Click on a photo in grid
- [ ] Alert shows with options
- [ ] "Megtekintés" works
- [ ] "Priváttá tétel" toggles lock icon
- [ ] "Törlés" removes photo
- [ ] "Add photo" button works (if < 6 photos)

### Test 5: Settings Button
- [ ] Click "Beállítások" button
- [ ] Navigates to Settings screen
- [ ] No errors in console

### Test 6: Logout Button
- [ ] Click "Kijelentkezés" button
- [ ] Confirmation alert shows
- [ ] "Mégsem" cancels
- [ ] "Kijelentkezés" logs out
- [ ] Navigates to login screen

### Test 7: Theme Switching
- [ ] Switch to dark theme
- [ ] All components update colors
- [ ] Switch to light theme
- [ ] All components update colors
- [ ] No visual glitches

### Test 8: Data Persistence
- [ ] Edit profile
- [ ] Close app
- [ ] Reopen app
- [ ] Changes are saved
- [ ] Profile loads correctly

### Test 9: Error Handling
- [ ] Try uploading invalid image
- [ ] Error message shows
- [ ] App doesn't crash
- [ ] Try saving with network off
- [ ] Error message shows
- [ ] App doesn't crash

### Test 10: Performance
- [ ] Scroll through profile
- [ ] No lag or stuttering
- [ ] Images load smoothly
- [ ] Animations are smooth

## 🐛 Bug Tracking

If you find bugs, document them here:

### Bug Template:
```
**Bug #X:**
- **Description:** What went wrong
- **Steps to Reproduce:** How to trigger the bug
- **Expected:** What should happen
- **Actual:** What actually happened
- **Component:** Which component is affected
- **Severity:** Critical / High / Medium / Low
```

## ✅ Success Criteria

Refactoring is successful if:
- [ ] All test cases pass
- [ ] No new bugs introduced
- [ ] Performance is same or better
- [ ] Code is more maintainable
- [ ] No console errors

## 🔄 Rollback Instructions

If tests fail and you need to rollback:

```bash
# Restore original
mv src/screens/ProfileScreen.ORIGINAL.js src/screens/ProfileScreen.js

# Restart app
npm start
```

## 📊 Test Results

### Test Run #1
- **Date:** _____________
- **Tester:** _____________
- **Result:** ⬜ Pass / ⬜ Fail
- **Notes:** _____________

### Test Run #2
- **Date:** _____________
- **Tester:** _____________
- **Result:** ⬜ Pass / ⬜ Fail
- **Notes:** _____________

## 🎉 Final Steps (After Successful Testing)

1. Delete backup files:
```bash
rm src/screens/ProfileScreen.ORIGINAL.js
rm src/screens/ProfileScreen.REFACTORED.js
```

2. Commit refactored version:
```bash
git add .
git commit -m "refactor: Split ProfileScreen into modular components

- Created 6 reusable components
- Improved code maintainability
- Same functionality, better structure
- All tests passing"
```

3. Update documentation:
- [ ] Update README if needed
- [ ] Update component documentation
- [ ] Mark task as complete in tasks.md

---

**Good luck with testing! 🚀**
