# ✅ DEPLOYMENT CHECKLIST - LoveX Dating App

## Pre-Launch Checklist

---

## 🔴 CRITICAL (Must Complete Before Launch)

### 1. Code Quality ✅
- [x] All critical features implemented
- [x] No console errors or warnings
- [x] Core functionality tested (swipe, match, chat)
- [x] Property tests passing (19/19)
- [x] Zero critical bugs

### 2. Security ✅
- [x] RLS policies enabled
- [x] Authentication working
- [x] Password encryption (bcrypt)
- [x] HTTPS enforced
- [ ] API keys secured (check .env not in git)
- [ ] Certificate pinning configured (optional)

### 3. Supabase Setup ⚠️
- [x] Database schema applied
- [x] RLS policies configured
- [ ] **Storage buckets created** (MANUAL STEP REQUIRED)
  - [ ] Create 'avatars' bucket
  - [ ] Create 'photos' bucket
  - [ ] Apply storage policies
- [ ] **Realtime enabled** (MANUAL STEP REQUIRED)
  - [ ] Enable for 'messages' table
  - [ ] Enable for 'matches' table (optional)

### 4. Environment Variables ⚠️
- [ ] Production .env file created
- [ ] Supabase URL configured
- [ ] Supabase Anon Key configured
- [ ] Analytics keys (if using)
- [ ] Payment keys (if using Stripe)
- [ ] **Verify .env is in .gitignore**

---

## 🟡 HIGH PRIORITY (Complete Before Submission)

### 5. App Assets 📸
- [ ] **App Icon** (1024x1024 PNG)
  - Location: `assets/icon.png`
  - No transparency
  - High quality

- [ ] **Splash Screen**
  - Location: `assets/splash.png`
  - Brand colors
  - Simple design

- [ ] **Screenshots** (iOS)
  - [ ] 6.7" Display (1290 x 2796) - 5 screenshots
  - [ ] 6.5" Display (1242 x 2688) - 5 screenshots
  - [ ] 5.5" Display (1242 x 2208) - 5 screenshots
  
  **Recommended Screenshots:**
  1. Discovery feed with profiles
  2. Profile detail view
  3. Match animation
  4. Chat conversation
  5. User profile editing

- [ ] **Screenshots** (Android)
  - [ ] Phone (1080 x 1920) - 5 screenshots
  - [ ] Feature Graphic (1024 x 500)

### 6. App Store Listing 📝

**iOS App Store:**
- [ ] App Name: "LoveX - Társkereső Alkalmazás"
- [ ] Subtitle: "Találd meg a párod" (30 chars max)
- [ ] Description (Hungarian) - See DEPLOYMENT_PREPARATION.md
- [ ] Description (English) - See DEPLOYMENT_PREPARATION.md
- [ ] Keywords: dating,match,chat,love,relationship,singles,meet,romance,date,partner
- [ ] Support URL: https://lovex.app/support
- [ ] Privacy Policy URL: https://lovex.app/privacy
- [ ] Category: Social Networking
- [ ] Age Rating: 17+

**Google Play Store:**
- [ ] App Name: "LoveX - Dating & Match App"
- [ ] Short Description (80 chars): "Find your perfect match with smart recommendations and real-time chat"
- [ ] Full Description - See DEPLOYMENT_PREPARATION.md
- [ ] Category: Dating
- [ ] Content Rating: Mature 17+

### 7. Legal Documents 📄
- [ ] **Privacy Policy** published at https://lovex.app/privacy
  - [ ] Data collection practices
  - [ ] How data is used
  - [ ] Third-party services (Supabase)
  - [ ] User rights (GDPR)
  - [ ] Contact information

- [ ] **Terms of Service** published at https://lovex.app/terms
  - [ ] User responsibilities
  - [ ] Prohibited content
  - [ ] Account termination
  - [ ] Liability limitations
  - [ ] Dispute resolution

- [ ] **Age Verification**
  - [ ] 18+ requirement displayed
  - [ ] Age verification on signup
  - [ ] Clear messaging

### 8. Build Configuration ⚙️

**iOS (app.json):**
```json
{
  "expo": {
    "name": "LoveX",
    "slug": "lovex-dating",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.lovex.dating",
      "buildNumber": "1",
      "supportsTablet": false
    }
  }
}
```

**Android (app.json):**
```json
{
  "expo": {
    "android": {
      "package": "com.lovex.dating",
      "versionCode": 1
    }
  }
}
```

- [ ] Bundle identifiers configured
- [ ] Version numbers set
- [ ] Permissions configured
- [ ] App icons configured

---

## 🟢 RECOMMENDED (Nice to Have)

### 9. Testing 🧪
- [x] Fresh install on iOS device
- [x] Fresh install on Android device
- [x] Sign up flow
- [x] Login flow
- [x] Profile creation
- [x] Photo upload
- [x] Swipe functionality
- [x] Match creation
- [x] Chat messaging
- [ ] Push notifications (if implemented)
- [ ] Premium features (if implemented)
- [ ] Payment flow (if implemented)
- [ ] Logout and re-login
- [ ] App backgrounding/foregrounding
- [ ] Network offline/online

### 10. Analytics & Monitoring 📊
- [ ] Crash reporting configured (Sentry)
- [ ] Analytics configured (Google Analytics / Mixpanel)
- [ ] Performance monitoring (Firebase Performance)
- [ ] Error tracking enabled

### 11. Beta Testing 👥
- [ ] **iOS TestFlight**
  - [ ] Invite 25-100 testers
  - [ ] Collect feedback
  - [ ] Fix critical issues

- [ ] **Android Internal Testing**
  - [ ] Invite testers
  - [ ] Collect feedback
  - [ ] Fix critical issues

- [ ] **Duration:** 1-2 weeks
- [ ] **Feedback:** Address critical issues only

---

## 🚀 BUILD & SUBMIT

### 12. Build Process

**Install EAS CLI:**
```bash
npm install -g eas-cli
```

**Login:**
```bash
eas login
```

**Configure:**
```bash
eas build:configure
```

**Build iOS:**
```bash
eas build --platform ios
```

**Build Android:**
```bash
eas build --platform android
```

**Submit iOS:**
```bash
eas submit --platform ios
```

**Submit Android:**
```bash
eas submit --platform android
```

### 13. Submission Checklist

**iOS App Store:**
- [ ] Build uploaded
- [ ] Screenshots uploaded
- [ ] Description filled
- [ ] Keywords added
- [ ] Privacy policy URL added
- [ ] Support URL added
- [ ] Age rating selected
- [ ] Pricing set (Free)
- [ ] Submit for review

**Google Play Store:**
- [ ] Build uploaded
- [ ] Screenshots uploaded
- [ ] Feature graphic uploaded
- [ ] Description filled
- [ ] Privacy policy URL added
- [ ] Content rating completed
- [ ] Pricing set (Free)
- [ ] Submit for review

---

## 📅 TIMELINE

### Week 1: Preparation
- [ ] Day 1-2: Create assets (icon, screenshots)
- [ ] Day 3-4: Write descriptions and legal docs
- [ ] Day 5: Configure builds
- [ ] Day 6-7: Test on devices

### Week 2: Beta Testing (Optional)
- [ ] Day 1: Submit to TestFlight/Internal Testing
- [ ] Day 2-7: Collect feedback
- [ ] Day 8-14: Fix critical issues

### Week 3: Submission
- [ ] Day 1: Final testing
- [ ] Day 2: Build production versions
- [ ] Day 3: Submit to stores
- [ ] Day 4-14: Review process (Apple: 1-7 days, Google: 1-3 days)

---

## ⚠️ MANUAL STEPS REQUIRED

### Supabase Dashboard (CRITICAL)
1. **Storage Buckets:**
   - Go to Storage → Create bucket
   - Create 'avatars' (public)
   - Create 'photos' (public)
   - Apply policies from `supabase/storage-policies-clean.sql`

2. **Realtime:**
   - Go to Database → Replication
   - Enable for 'messages' table
   - Enable for 'matches' table (optional)

### Legal Documents (HIGH PRIORITY)
1. **Privacy Policy:**
   - Create at https://lovex.app/privacy
   - Or use privacy policy generator
   - Must be accessible before submission

2. **Terms of Service:**
   - Create at https://lovex.app/terms
   - Or use terms generator
   - Must be accessible before submission

---

## 📊 PROGRESS TRACKER

### Overall Progress
- ✅ Code Complete: 100%
- ✅ Testing: 45% (property tests)
- ⏳ Assets: 0%
- ⏳ Legal: 0%
- ⏳ Build Config: 50%
- ⏳ Submission: 0%

### Estimated Time to Launch
- **Assets:** 4-6 hours
- **Legal:** 2-3 hours
- **Testing:** 2-3 hours
- **Build & Submit:** 2-3 hours
- **Total:** 10-15 hours

---

## 🎯 LAUNCH STRATEGY

### Soft Launch (Recommended)
1. **Week 1:** Hungary only
2. **Week 2:** Monitor metrics, fix bugs
3. **Week 3:** Expand to neighboring countries
4. **Week 4:** Full international launch

### Metrics to Track
- Daily Active Users (DAU)
- Match rate
- Message response rate
- Retention (Day 1, Day 7, Day 30)
- Crash-free rate (target: >99%)
- App Store rating (target: >4.0)

---

## 📞 SUPPORT PLAN

### Support Channels
- [ ] In-app support form
- [ ] Email: support@lovex.app
- [ ] FAQ section
- [ ] Social media (Instagram, Facebook)

### Response Time Goals
- Critical issues: <2 hours
- High priority: <24 hours
- Normal: <48 hours

---

## ✅ FINAL CHECKLIST

Before clicking "Submit for Review":

- [ ] All critical items complete
- [ ] All high priority items complete
- [ ] App tested on real devices
- [ ] No critical bugs
- [ ] Legal documents published
- [ ] Support email working
- [ ] Privacy policy accessible
- [ ] Terms of service accessible
- [ ] Screenshots look good
- [ ] Description is compelling
- [ ] Pricing is correct (Free)
- [ ] Age rating is correct (17+)
- [ ] Build is production-ready

---

**Status:** Ready to start deployment preparation
**Estimated Time:** 10-15 hours
**Next Step:** Create app icon and screenshots

**Good luck with your launch! 🚀**

