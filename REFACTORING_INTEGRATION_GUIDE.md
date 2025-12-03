# ProfileScreen Refactoring Integration Guide
**Date:** December 3, 2025
**Status:** Ready for Integration

## 🎯 Overview

ProfileScreen has been refactored into 6 modular components. This guide helps you safely integrate them.

## 📦 New Components Created

All components are in `src/components/profile/`:

1. **ProfileHeader.js** - Photo, name, completion progress
2. **ProfileBio.js** - Bio text section
3. **ProfileInterests.js** - Interest tags
4. **ProfileDetails.js** - Personal details (height, zodiac, etc.)
5. **ProfilePhotos.js** - Photo grid with add button
6. **ProfileActions.js** - Settings and logout buttons

## ✅ Pre-Integration Checklist

Before integrating, make sure:
- [ ] Current code is committed to Git
- [ ] All tests are passing
- [ ] App is running without errors
- [ ] You have a backup of ProfileScreen.js

## 🔧 Integration Steps

### Step 1: Backup Current ProfileScreen
```bash
cp src/screens/ProfileScreen.js src/screens/ProfileScreen.backup.js
```

### Step 2: Review New Components
Check each component in `src/components/profile/` to understand:
- Props they accept
- Event handlers they need
- Theme integration

### Step 3: Test Components Individually (Optional)
You can test each component in isolation before full integration.

### Step 4: Integrate Components
Replace sections of ProfileScreen.js with new components:

**Before (Monolithic):**
```jsx
<View style={styles.header}>
  {/* 200+ lines of header code */}
</View>
```

**After (Modular):**
```jsx
<ProfileHeader
  userProfile={userProfile}
  completionPercentage={completionPercentage}
  completionMessage={completionMessage}
  onEditPress={() => setEditModalVisible(true)}
  onPhotoPress={handlePhotoPress}
  theme={theme}
/>
```

### Step 5: Update Imports
Add at the top of ProfileScreen.js:
```jsx
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileBio from '../components/profile/ProfileBio';
import ProfileInterests from '../components/profile/ProfileInterests';
import ProfileDetails from '../components/profile/ProfileDetails';
import ProfilePhotos from '../components/profile/ProfilePhotos';
import ProfileActions from '../components/profile/ProfileActions';
```

### Step 6: Remove Old Code
After integrating each component, remove the corresponding old code.

### Step 7: Test Thoroughly
- [ ] Profile displays correctly
- [ ] Edit button works
- [ ] Photo upload works
- [ ] Settings navigation works
- [ ] Logout works
- [ ] Theme switching works
- [ ] All data displays correctly

### Step 8: Commit Changes
```bash
git add .
git commit -m "refactor: Split ProfileScreen into modular components"
```

## 🚨 Rollback Plan

If something goes wrong:
```bash
cp src/screens/ProfileScreen.backup.js src/screens/ProfileScreen.js
```

## 📊 Expected Results

**Before:**
- 1 file: 837 lines
- Hard to maintain
- Hard to test

**After:**
- 7 files: ~700 lines total
- Easy to maintain
- Easy to test
- Reusable components

## 🐛 Common Issues

### Issue 1: Props Not Passing
**Solution:** Check that all required props are passed to components

### Issue 2: Theme Not Working
**Solution:** Ensure `theme` prop is passed to all components

### Issue 3: Event Handlers Not Working
**Solution:** Verify all `onXxxPress` handlers are connected

## 📝 Component Props Reference

### ProfileHeader
```jsx
<ProfileHeader
  userProfile={object}          // User data
  completionPercentage={number} // 0-100
  completionMessage={string}    // Completion tip
  onEditPress={function}        // Edit button handler
  onPhotoPress={function}       // Photo tap handler
  theme={object}                // Theme context
/>
```

### ProfileBio
```jsx
<ProfileBio
  bio={string}     // User bio text
  theme={object}   // Theme context
/>
```

### ProfileInterests
```jsx
<ProfileInterests
  interests={array}  // Array of interest strings
  theme={object}     // Theme context
/>
```

### ProfileDetails
```jsx
<ProfileDetails
  userProfile={object}  // User data with height, zodiac, etc.
  theme={object}        // Theme context
/>
```

### ProfilePhotos
```jsx
<ProfilePhotos
  photos={array}         // Array of photo objects
  onPhotoPress={function}  // Photo tap handler
  onAddPhoto={function}    // Add photo handler
  theme={object}           // Theme context
/>
```

### ProfileActions
```jsx
<ProfileActions
  onSettingsPress={function}  // Settings button handler
  onLogoutPress={function}    // Logout button handler
  theme={object}              // Theme context
/>
```

## 🎉 Success Criteria

Integration is successful when:
- ✅ App runs without errors
- ✅ All ProfileScreen features work
- ✅ Code is more maintainable
- ✅ Components are reusable
- ✅ Tests pass (if any)

---

**Need Help?** Check the component files for implementation details.
