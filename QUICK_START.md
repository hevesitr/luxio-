# 🚀 Quick Start Guide
**Get your dating app running in 30 minutes!**

---

## ⚡ Prerequisites

- Node.js 16+ installed
- Expo CLI installed (`npm install -g expo-cli`)
- Supabase account created
- Physical device for camera testing (optional for initial setup)

---

## 📦 Step 1: Install Dependencies (5 min)

```bash
# Clone the repository (if not already done)
cd dating-app

# Install dependencies
npm install --legacy-peer-deps

# Install React Query (if not already installed)
npm install @tanstack/react-query --legacy-peer-deps
```

---

## 🔧 Step 2: Environment Setup (5 min)

### Create `.env` file in project root:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Get your Supabase credentials:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy `Project URL` and `anon public` key

---

## 🗄️ Step 3: Database Setup (10 min)

### A. Run Database Schema

1. Open Supabase Dashboard → SQL Editor
2. Run these scripts in order:

```sql
-- 1. Main schema
Run: supabase/schema_extended.sql

-- 2. RLS policies
Run: supabase/rls-policies-ultra-simple.sql

-- 3. Storage policies
Run: supabase/storage-policies-clean.sql

-- 4. Video schema (optional)
Run: supabase/video-schema.sql
```

### B. Create Storage Buckets

1. Go to Storage in Supabase Dashboard
2. Create these buckets:

```
✅ avatars (Public)
✅ photos (Public)
✅ videos (Private) - optional
```

### C. Enable Realtime

1. Go to Database → Replication
2. Enable for these tables:
```
✅ messages
✅ matches
```

---

## 🧪 Step 4: Verify Setup (5 min)

```bash
# Run property tests
npm test -- properties --runInBand

# Expected output:
# Test Suites: 9 passed, 9 total
# Tests:       49 passed, 49 total
```

---

## 🎯 Step 5: Start Development (5 min)

```bash
# Start Expo development server
npm start

# Then:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Scan QR code with Expo Go app on physical device
```

---

## ✅ You're Ready!

Your app should now be running! 🎉

---

## 🔍 Quick Verification

### Test These Features:

1. **Registration**
   - Create a new account
   - Verify email/phone

2. **Profile**
   - Upload profile photo
   - Add bio and interests
   - Save changes

3. **Discovery**
   - View profiles
   - Swipe left/right
   - Create a match

4. **Messaging**
   - Send a message
   - Receive real-time updates

---

## 🐛 Troubleshooting

### "Cannot connect to Supabase"
- ✅ Check `.env` file exists
- ✅ Verify SUPABASE_URL and SUPABASE_ANON_KEY
- ✅ Restart Expo server

### "Storage bucket not found"
- ✅ Create buckets in Supabase Dashboard
- ✅ Run storage policies SQL

### "RLS policy error"
- ✅ Run RLS policies SQL
- ✅ Enable RLS on all tables

### "Tests failing"
- ✅ Run `npm install --legacy-peer-deps`
- ✅ Clear cache: `npm start -- --clear`

---

## 📚 Next Steps

### For Development
1. Read `DEVELOPMENT_GUIDE.md`
2. Check `QUICK_REFERENCE_SERVICES.md`
3. Review `VIDEO_FEATURES_GUIDE.md`

### For Testing
1. Read `TESTING_STRATEGY.md`
2. Run property tests
3. Test on physical device

### For Deployment
1. Read `DEPLOYMENT_READY_GUIDE.md`
2. Complete manual setup
3. Build for production

---

## 🎓 Key Files to Know

### Configuration
- `.env` - Environment variables
- `app.config.js` - Expo configuration
- `package.json` - Dependencies

### Services
- `src/services/` - All business logic
- `src/services/supabaseClient.js` - Supabase connection
- `src/services/AuthService.js` - Authentication

### Screens
- `src/screens/HomeScreen.js` - Discovery feed
- `src/screens/ProfileScreen.js` - User profile
- `src/screens/ChatScreen.js` - Messaging

### Database
- `supabase/` - All SQL scripts
- `supabase/schema_extended.sql` - Main schema
- `supabase/rls-policies-ultra-simple.sql` - Security

---

## 💡 Pro Tips

### Development
```bash
# Clear cache if things break
npm start -- --clear

# Run tests in watch mode
npm test -- --watch

# Check for errors
npm run lint
```

### Debugging
```bash
# View Expo logs
npm start

# View device logs
# iOS: Xcode → Window → Devices
# Android: adb logcat
```

### Performance
```bash
# Analyze bundle size
npx expo-cli export --dev

# Check for updates
npm outdated
```

---

## 🚀 Advanced Features

### Enable Video Features
1. Run `supabase/video-schema.sql`
2. Create `videos` bucket (Private)
3. Test on physical device

### Enable Premium Features
1. Configure payment provider
2. Update `PaymentService.js`
3. Test subscription flow

### Enable Analytics
1. Set up Firebase/Mixpanel
2. Update `AnalyticsService.js`
3. Track key events

---

## 📞 Need Help?

### Documentation
- `README.md` - Project overview
- `DEVELOPMENT_GUIDE.md` - Detailed guide
- All `.md` files in project root

### Community
- Supabase Discord
- Expo Discord
- React Native Community

### Logs
- Check `logs/` folder
- View Expo DevTools
- Check Supabase Dashboard logs

---

## ✨ Success!

You should now have a fully functional dating app running locally!

**Time to complete**: ~30 minutes
**Status**: ✅ Ready for development

---

**Next**: Start building features or deploy to production!

*Last Updated: December 3, 2025*
