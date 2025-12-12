# COMPREHENSIVE TESTING GUIDE - DEC 07, 2025

## AUTOMATED TESTING

### Screen Verification Script
```bash
# Verify all screens are properly registered
node scripts/verify-all-screens.js
```

**Expected Output**:
```
==============================================================
SCREEN VERIFICATION REPORT
==============================================================

Checking 55 screens...

✓ HomeScreen
✓ MatchesScreen
✓ ProfileScreen
✓ LoginScreen
✓ RegisterScreen
...

==============================================================
SUMMARY
==============================================================

Total Screens: 55
Passed: 55
Warnings: 0
Failed: 0

Verification PASSED
```

### Unit Tests
```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm test -- --testPathPattern=services
npm test -- --testPathPattern=screens
npm test -- --testPathPattern=components
```

**Expected Coverage**:
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

### Property-Based Tests
```bash
# Run property-based tests
npm test -- --testPathPattern=generators

# Run specific generator tests
npm test -- --testPathPattern=userGenerators
npm test -- --testPathPattern=messageGenerators
npm test -- --testPathPattern=locationGenerators
```

### Integration Tests
```bash
# Run integration tests
npm test -- --testPathPattern=integration

# Run specific integration test
npm test -- integration-test-report.json
```

## MANUAL TESTING CHECKLIST

### 1. AUTHENTICATION FLOW ✓

#### Registration
- [ ] Open app → See Login screen
- [ ] Tap "Regisztráció" → RegisterScreen opens
- [ ] Fill in email, password, name
- [ ] Accept terms and privacy policy
- [ ] Tap "Regisztráció" → Account created
- [ ] Verify email sent
- [ ] Click email link → EmailVerificationSuccessScreen
- [ ] Redirect to Onboarding

#### Login
- [ ] Enter valid credentials → Login successful
- [ ] Enter invalid credentials → Error message
- [ ] Tap "Elfelejtett jelszó" → PasswordResetRequestScreen
- [ ] Enter email → Reset email sent
- [ ] Click reset link → NewPasswordScreen
- [ ] Enter new password → Password updated
- [ ] Login with new password → Success

#### Onboarding
- [ ] Step 1: Welcome → Name, birthday, gender
- [ ] Step 2: Photos → Upload 3-6 photos
- [ ] Step 3: Bio → Write bio, select interests
- [ ] Step 4: Preferences → Set age range, distance, gender
- [ ] Step 5: Review → Confirm and complete
- [ ] Redirect to HomeScreen

### 2. HOME SCREEN NAVIGATION ✓

#### Top Icons (7)
- [ ] Passport → PassportScreen opens
- [ ] Verified → Filter verified profiles
- [ ] Boost → BoostScreen opens
- [ ] Top Picks → TopPicksScreen opens
- [ ] Search → SearchScreen opens
- [ ] Premium → PremiumScreen opens
- [ ] Lightning → BoostScreen opens

#### Swipe Actions
- [ ] Swipe left → Pass (profile disappears)
- [ ] Swipe right → Like (profile disappears)
- [ ] Tap star → Super Like (profile disappears)
- [ ] Match occurs → MatchAnimation shows
- [ ] Tap "Beszélgetés indítása" → ChatScreen opens
- [ ] Tap "Folytatás" → Animation closes

#### Bottom Navigation (5)
- [ ] Felfedezés (active) → HomeScreen
- [ ] Események → EventsScreen
- [ ] Matchek → MatchesScreen
- [ ] Videók → VideosScreen
- [ ] Profil → ProfileScreen

### 3. PROFILE SCREEN MENU ✓

#### Fő Funkciók (9)
- [ ] Boost → BoostScreen
- [ ] Ki lájkolt téged → LikesYouScreen
- [ ] Top Picks → TopPicksScreen
- [ ] Passport → PassportScreen
- [ ] Prémium → PremiumScreen
- [ ] AI Javaslatok → AIRecommendationsScreen
- [ ] Térkép → MapScreen
- [ ] Profil Kérdések → ProfilePromptsScreen
- [ ] Személyiség Teszt → PersonalityTestScreen

#### Prémium Funkciók (6)
- [ ] Ajándékok → GiftsScreen
- [ ] Kreditek → CreditsScreen
- [ ] Profil Megtekintések → ProfileViewsScreen
- [ ] Kedvencek → FavoritesScreen
- [ ] Hasonló Emberek → LookalikesScreen
- [ ] Videó Hívás → VideoChatScreen

#### Sugar Dating (2)
- [ ] Sugar Daddy → SugarDaddyScreen
- [ ] Sugar Baby → SugarBabyScreen

#### Közösség (1)
- [ ] Események → EventsScreen

#### Beállítások (10)
- [ ] Social Media → SocialMediaScreen
- [ ] Beállítások → SettingsScreen
- [ ] Statisztikák → AnalyticsScreen
- [ ] Gamifikáció → GamificationScreen
- [ ] Profil Verifikáció → VerificationScreen
- [ ] Biztonság → SafetyScreen
- [ ] Súgó → HelpScreen
- [ ] Adatvédelem → PrivacySettingsScreen
- [ ] Blokkolt Felhasználók → BlockedUsersScreen
- [ ] Fiók Szüneteltetése → PauseAccountScreen

### 4. MATCHING & DISCOVERY ✓

#### Discovery
- [ ] HomeScreen shows profiles
- [ ] Profiles have photos, name, age, distance
- [ ] Match % badge shows compatibility
- [ ] Swipe gestures work smoothly
- [ ] Profile detail opens on tap

#### AI Recommendations
- [ ] AIRecommendationsScreen shows AI-picked profiles
- [ ] Profiles sorted by compatibility
- [ ] Can like/pass from list
- [ ] Tap profile → ProfileDetailScreen

#### Map View
- [ ] MapScreen shows user location
- [ ] Shows nearby profiles on map
- [ ] Tap marker → Profile preview
- [ ] Tap profile → ProfileDetailScreen
- [ ] Can filter by distance

#### Search
- [ ] SearchScreen has advanced filters
- [ ] Age range slider works
- [ ] Distance slider works
- [ ] Gender selection works
- [ ] Interests multi-select works
- [ ] Apply filters → Filtered results

### 5. MESSAGING & COMMUNICATION ✓

#### Matches Screen
- [ ] Shows list of matches
- [ ] Shows last message preview
- [ ] Shows unread count badge
- [ ] Tap match → ChatScreen opens

#### Chat Screen
- [ ] Shows message history
- [ ] Can send text messages
- [ ] Can send photos
- [ ] Can send GIFs
- [ ] Can send voice messages
- [ ] Real-time message updates
- [ ] Typing indicator shows
- [ ] Read receipts work

#### Video Chat
- [ ] Tap video icon → VideoChatScreen
- [ ] Camera preview shows
- [ ] Can toggle camera/mic
- [ ] Can end call
- [ ] IncomingCallScreen shows for incoming calls

#### Chat Rooms
- [ ] ChatRoomsScreen shows available rooms
- [ ] Can join room
- [ ] ChatRoomScreen shows group messages
- [ ] Can send messages in room
- [ ] Can leave room

### 6. PREMIUM FEATURES ✓

#### Boost
- [ ] BoostScreen shows boost options
- [ ] Can purchase boost (30 min, 1 hour, 3 hours)
- [ ] Boost activates immediately
- [ ] Profile visibility increases
- [ ] Boost timer shows remaining time

#### Likes You
- [ ] LikesYouScreen shows who liked you
- [ ] Blurred profiles for non-premium
- [ ] Premium users see clear profiles
- [ ] Can like back from list
- [ ] Match occurs immediately

#### Top Picks
- [ ] TopPicksScreen shows daily picks
- [ ] AI-selected profiles
- [ ] High compatibility scores
- [ ] Can like/pass
- [ ] Refreshes daily

#### Premium Subscription
- [ ] PremiumScreen shows plans (Basic, Gold, Platinum)
- [ ] Shows feature comparison
- [ ] Can select plan
- [ ] Payment flow works
- [ ] Premium features unlock

#### Passport
- [ ] PassportScreen shows city list
- [ ] Can search cities
- [ ] Select city → Location changes
- [ ] Profiles from new location show
- [ ] Can reset to current location

#### Credits
- [ ] CreditsScreen shows balance
- [ ] Can purchase credit packs
- [ ] Payment flow works
- [ ] Credits added to balance
- [ ] Can use credits for features

### 7. PROFILE & PERSONALIZATION ✓

#### Profile Editing
- [ ] Tap edit icon → EditProfileModal
- [ ] Can change name, bio
- [ ] Can add/remove photos
- [ ] Can select interests
- [ ] Can set height, work, education
- [ ] Save → Profile updated

#### Profile Prompts
- [ ] ProfilePromptsScreen shows questions
- [ ] Can select up to 3 prompts
- [ ] Can write answers
- [ ] Save → Prompts added to profile
- [ ] Prompts show on profile detail

#### Personality Test
- [ ] PersonalityTestScreen shows questions
- [ ] 5 questions with multiple choice
- [ ] Progress bar shows completion
- [ ] Submit → Results calculated
- [ ] Results show personality type
- [ ] Results saved to profile

#### Photo Upload
- [ ] PhotoUploadScreen opens
- [ ] Can select from gallery
- [ ] Can take new photo
- [ ] Can crop/edit photo
- [ ] Upload → Photo added to profile
- [ ] Can set as main photo
- [ ] Can delete photos

### 8. SETTINGS & ACCOUNT ✓

#### Settings
- [ ] SettingsScreen shows all options
- [ ] Can toggle notifications
- [ ] Can change language
- [ ] Can set distance units
- [ ] Can enable dark mode
- [ ] Save → Settings applied

#### Analytics
- [ ] AnalyticsScreen shows stats
- [ ] Profile views count
- [ ] Likes received/sent
- [ ] Matches count
- [ ] Messages sent/received
- [ ] Charts and graphs display

#### Verification
- [ ] VerificationScreen shows process
- [ ] Can upload ID photo
- [ ] Can take selfie
- [ ] Submit → Verification pending
- [ ] Verified badge shows when approved

#### Safety
- [ ] SafetyScreen shows safety tips
- [ ] Can report users
- [ ] Can block users
- [ ] Can unmatch users
- [ ] Safety resources available

#### Privacy Settings
- [ ] PrivacySettingsScreen shows options
- [ ] Can hide profile
- [ ] Can hide distance
- [ ] Can hide age
- [ ] Can control who sees profile
- [ ] Save → Privacy updated

#### Blocked Users
- [ ] BlockedUsersScreen shows list
- [ ] Shows blocked user count
- [ ] Can unblock users
- [ ] Unblock → User removed from list

#### Pause Account
- [ ] PauseAccountScreen shows options
- [ ] Can pause for 1 day, 1 week, 1 month
- [ ] Pause → Profile hidden
- [ ] Can reactivate anytime
- [ ] Reactivate → Profile visible again

#### Data Export
- [ ] DataExportScreen shows GDPR info
- [ ] Request data export
- [ ] Email sent with download link
- [ ] Download → ZIP file with all data

#### Delete Account
- [ ] DeleteAccountScreen shows warning
- [ ] Must confirm deletion
- [ ] Enter password to confirm
- [ ] Delete → Account permanently deleted
- [ ] All data removed

### 9. LEGAL & COMPLIANCE ✓

#### Cookie Consent
- [ ] ConsentScreen shows on first launch
- [ ] Can accept all cookies
- [ ] Can customize cookie preferences
- [ ] Can reject non-essential cookies
- [ ] Choice saved

#### Terms of Service
- [ ] TermsScreen shows ÁSZF
- [ ] Can scroll through terms
- [ ] Can accept terms
- [ ] Must accept to use app

#### Privacy Policy
- [ ] PrivacyScreen shows policy
- [ ] Can scroll through policy
- [ ] Shows data collection info
- [ ] Shows data usage info

#### Legal Updates
- [ ] LegalUpdateScreen shows when terms change
- [ ] Must accept new terms
- [ ] Can view changes
- [ ] Accept → Continue using app

### 10. SOCIAL & EVENTS ✓

#### Events
- [ ] EventsScreen shows upcoming events
- [ ] Can filter by type, date, location
- [ ] Tap event → Event details
- [ ] Can RSVP to event
- [ ] Can invite matches

#### Videos
- [ ] VideosScreen shows video profiles
- [ ] Can play videos
- [ ] Can like/pass from video
- [ ] Can comment on videos
- [ ] Can share videos

#### Live Stream
- [ ] LiveStreamScreen shows live streams
- [ ] Can start own stream
- [ ] Can join others' streams
- [ ] Can send gifts during stream
- [ ] Can chat in stream

#### Social Media
- [ ] SocialMediaScreen shows integrations
- [ ] Can connect Instagram
- [ ] Can connect Facebook
- [ ] Can connect Spotify
- [ ] Connected accounts show

### 11. SUGAR DATING ✓

#### Sugar Daddy
- [ ] SugarDaddyScreen shows profiles
- [ ] Profiles marked as "Verified"
- [ ] Shows income/net worth
- [ ] Can filter by criteria
- [ ] Can like/message

#### Sugar Baby
- [ ] SugarBabyScreen shows profiles
- [ ] Profiles marked as "Verified"
- [ ] Shows expectations
- [ ] Can filter by criteria
- [ ] Can like/message

## ERROR HANDLING VERIFICATION

### Network Errors
- [ ] Turn off WiFi → Offline indicator shows
- [ ] Try to swipe → Error message
- [ ] Turn on WiFi → Offline indicator disappears
- [ ] Swipe works again

### Authentication Errors
- [ ] Invalid login → Error message
- [ ] Session expires → Redirect to login
- [ ] Token refresh works
- [ ] Unauthorized access → Error message

### Data Validation
- [ ] Empty form fields → Validation error
- [ ] Invalid email format → Error message
- [ ] Password too short → Error message
- [ ] File too large → Error message

### User Feedback
- [ ] Loading states show during operations
- [ ] Success messages show after actions
- [ ] Error messages are clear and helpful
- [ ] Empty states show when no data

## PERFORMANCE VERIFICATION

### Load Times
- [ ] App launches in < 3 seconds
- [ ] Screens load in < 1 second
- [ ] Images load progressively
- [ ] Navigation is smooth (60 FPS)

### Memory Management
- [ ] No memory leaks after 30 min use
- [ ] Images are cached properly
- [ ] Old data is cleaned up
- [ ] App doesn't crash

### Optimization
- [ ] Large lists use virtual scrolling
- [ ] Images are lazy loaded
- [ ] Components are memoized
- [ ] Unnecessary re-renders avoided

## ACCESSIBILITY VERIFICATION

### Screen Reader
- [ ] All buttons have labels
- [ ] All images have alt text
- [ ] Navigation is logical
- [ ] Forms are accessible

### Keyboard Navigation
- [ ] Can tab through forms
- [ ] Can submit with Enter
- [ ] Can cancel with Escape
- [ ] Focus indicators visible

### Color Contrast
- [ ] Text is readable
- [ ] Buttons are distinguishable
- [ ] Links are visible
- [ ] Dark mode works

## TESTING COMMANDS SUMMARY

```bash
# Verify all screens
node scripts/verify-all-screens.js

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific tests
npm test -- --testPathPattern=services
npm test -- --testPathPattern=screens
npm test -- --testPathPattern=generators

# Run integration tests
npm test -- --testPathPattern=integration

# Start app for manual testing
npm start

# Start with cache clear
npm start -- --clear

# Build for production
eas build --platform android
eas build --platform ios
```

## EXPECTED RESULTS

### Automated Tests
- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ All property-based tests pass
- ✅ Coverage > 80%
- ✅ No console errors
- ✅ No memory leaks

### Manual Tests
- ✅ All screens accessible
- ✅ All navigation works
- ✅ All features functional
- ✅ No crashes
- ✅ Good performance
- ✅ Accessible

### Production Readiness
- ✅ All tests passing
- ✅ No critical bugs
- ✅ Performance optimized
- ✅ Security verified
- ✅ Legal compliance
- ✅ Documentation complete

## NEXT STEPS

1. Run automated verification: `node scripts/verify-all-screens.js`
2. Run all tests: `npm test -- --coverage`
3. Perform manual testing using checklist above
4. Fix any issues found
5. Re-test until all pass
6. Document any remaining issues
7. Prepare for production deployment

**Status**: Ready for comprehensive testing
**Last Updated**: Dec 07, 2025 23:45
