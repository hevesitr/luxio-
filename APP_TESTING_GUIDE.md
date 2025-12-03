# App Testing Guide - December 3, 2025
**Status:** App is running
**Metro Bundler:** Active (Process #16)

## 🎯 What to Test

### 1. Premium Features (NEW) ✨
Navigate to: **Profile → Premium** or **Settings → Premium**

**Test Cases:**
- [ ] View subscription plans (Monthly, Quarterly, Yearly)
- [ ] Check plan features display correctly
- [ ] Try to purchase a plan (mock payment)
- [ ] Verify current subscription status shows
- [ ] Check completion banner if already premium

**Expected Behavior:**
- Plans display with prices
- Features listed for each plan
- Purchase flow works (mock)
- No crashes or errors

---

### 2. Safety Features (NEW) 🛡️
Navigate to: **Profile → Safety** or from any user profile

**Test Cases:**
- [ ] View safety tips
- [ ] View emergency contacts
- [ ] Try to report a user (need userId in params)
- [ ] Try to block a user (need userId in params)
- [ ] Check safety guidelines links

**Expected Behavior:**
- Safety tips display
- Emergency contacts show
- Report/block only show if userId provided
- No crashes or errors

---

### 3. HomeScreen Premium Features (NEW) 💎

**Test Cases:**
- [ ] Try to use Super Like (star button)
- [ ] Check if premium prompt shows (if not premium)
- [ ] Try to use Rewind (undo button)
- [ ] Check if premium prompt shows (if not premium)
- [ ] Verify daily limit message for Super Likes

**Expected Behavior:**
- Premium check before using features
- Upgrade prompt for free users
- Daily limit (5 Super Likes) enforced
- Haptic feedback on actions

---

### 4. Existing Features (Regression Testing) ✅

**HomeScreen:**
- [ ] Swipe left (dislike)
- [ ] Swipe right (like)
- [ ] Match animation shows
- [ ] Profile cards display correctly
- [ ] Stories display at top

**ProfileScreen:**
- [ ] Profile photo displays
- [ ] Edit button works
- [ ] Bio displays
- [ ] Interests display as tags
- [ ] Settings button works
- [ ] Logout button works

**ChatScreen:**
- [ ] Messages display
- [ ] Can send messages
- [ ] Real-time updates work
- [ ] Typing indicator shows
- [ ] Read receipts display

**MatchesScreen:**
- [ ] Matches list displays
- [ ] Can tap to open chat
- [ ] Match photos show

---

## 🐛 Known Issues to Watch For

### Potential Issues:
1. **Premium Check Errors**
   - If user not logged in
   - If PaymentService fails
   - Network errors

2. **Safety Feature Errors**
   - If userId not provided
   - If SafetyService fails
   - Network errors

3. **Navigation Issues**
   - Premium screen navigation
   - Safety screen navigation
   - Back button behavior

---

## 📱 How to Test

### Option 1: Physical Device
1. Open Expo Go app
2. Scan QR code from terminal
3. App should load
4. Navigate and test features

### Option 2: Emulator
1. Press `a` in terminal for Android
2. Press `i` in terminal for iOS
3. App should load in emulator
4. Navigate and test features

### Option 3: Web (Limited)
1. Press `w` in terminal
2. Opens in browser
3. Some features may not work

---

## 🔍 What to Look For

### Console Errors:
- Open React Native DevTools (press `j` in terminal)
- Watch for red error messages
- Watch for yellow warnings

### Visual Issues:
- Layout problems
- Missing images
- Incorrect colors
- Text overflow

### Functional Issues:
- Buttons not working
- Navigation broken
- Data not loading
- Crashes

---

## ✅ Success Criteria

App is working correctly if:
- ✅ No crashes
- ✅ No console errors
- ✅ All navigation works
- ✅ Premium features accessible
- ✅ Safety features accessible
- ✅ Existing features still work
- ✅ UI looks correct

---

## 🚨 If You Find Bugs

### Report Format:
```
**Bug:** [Short description]
**Screen:** [Which screen]
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected:** [What should happen]
**Actual:** [What actually happened]
**Error Message:** [If any]
**Severity:** Critical / High / Medium / Low
```

### Where to Report:
- Create issue in project
- Or tell me directly
- Include screenshots if possible

---

## 📊 Testing Checklist

### Quick Test (5 minutes):
- [ ] App launches
- [ ] Can navigate between tabs
- [ ] No immediate crashes
- [ ] Premium screen loads
- [ ] Safety screen loads

### Medium Test (15 minutes):
- [ ] All quick tests
- [ ] Try premium features
- [ ] Try safety features
- [ ] Test swipe functionality
- [ ] Test messaging

### Full Test (30 minutes):
- [ ] All medium tests
- [ ] Test all screens
- [ ] Test all features
- [ ] Check edge cases
- [ ] Verify error handling

---

## 🎉 Current Status

**App Status:** ✅ Running
**Metro Bundler:** ✅ Active
**Build Status:** ✅ Bundled successfully
**New Features:** ✅ Integrated
**Components:** ✅ Created (not yet integrated)

**Ready for Testing!** 🚀

---

## 💡 Tips

1. **Clear Cache if Issues:**
   ```bash
   npx expo start -c
   ```

2. **Restart Metro if Needed:**
   - Stop current process
   - Run `npm start` again

3. **Check Logs:**
   - Press `j` to open DevTools
   - Watch console for errors

4. **Test on Real Device:**
   - More accurate than emulator
   - Better performance testing

---

**Happy Testing!** 🎯
