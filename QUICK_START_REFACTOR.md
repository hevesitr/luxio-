# 🚀 Quick Start Guide - Dating App Refactor

## ⚡ 5-Minute Setup

### Step 1: Apply RLS Policies (CRITICAL!)
```bash
# 1. Open Supabase Dashboard
# 2. Go to SQL Editor
# 3. Copy content from: supabase/rls-policies.sql
# 4. Paste and click "Run"
```

### Step 2: Install Dependencies
```bash
npm install expo-secure-store expo-image-manipulator @react-native-async-storage/async-storage
```

### Step 3: Update App.js
```javascript
import { AuthProvider } from './src/contexts/AuthContext';
import { PreferencesProvider } from './src/contexts/PreferencesContext';
import { NotificationProvider } from './src/contexts/NotificationContext';

export default function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <NotificationProvider>
          {/* Your existing navigation */}
        </NotificationProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
```

### Step 4: Test It!
```bash
npm start
```

## 📱 What You Get

### ✅ Security
- Row Level Security (RLS) protecting all data
- Secure authentication with JWT tokens
- Password encryption with bcrypt
- Session management with auto-refresh

### ✅ Core Features
- Real-time messaging with typing indicators
- Location-based matching with distance calculation
- Discovery feed with smart filtering
- Image compression (200KB max)

### ✅ Premium Features
- Unlimited swipes
- Super likes (5/day)
- Rewind last swipe
- See who liked you
- Profile boost

### ✅ Safety
- User reporting
- User blocking
- Content moderation
- Auto-suspension (3+ reports)
- Unmatch with conversation deletion

### ✅ Analytics
- Event tracking
- Error logging
- Performance monitoring
- PII-safe logging

## 🎯 Quick Usage Examples

### Authentication
```javascript
import { useAuth } from './src/contexts/AuthContext';

function LoginScreen() {
  const { signIn, signUp } = useAuth();

  const handleLogin = async () => {
    const result = await signIn(email, password);
    if (result.success) {
      // Navigate to home
    }
  };
}
```

### Discovery Feed
```javascript
import SupabaseMatchService from './src/services/SupabaseMatchService';
import { usePreferences } from './src/contexts/PreferencesContext';

function HomeScreen() {
  const { user } = useAuth();
  const { getDiscoveryFilters } = usePreferences();

  const loadProfiles = async () => {
    const filters = getDiscoveryFilters();
    const result = await SupabaseMatchService.getDiscoveryFeed(
      user.id,
      filters
    );
    setProfiles(result.data);
  };
}
```

### Real-time Messaging
```javascript
import MessageService from './src/services/MessageService';

function ChatScreen({ matchId }) {
  useEffect(() => {
    const subscription = MessageService.subscribeToMessages(
      matchId,
      (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
      }
    );

    return () => {
      MessageService.unsubscribeFromMessages(subscription);
    };
  }, [matchId]);
}
```

### Premium Features
```javascript
import PaymentService from './src/services/PaymentService';

function ProfileScreen() {
  const handleSuperLike = async () => {
    const result = await PaymentService.useSuperLike(
      user.id,
      targetUserId
    );
    
    if (result.success) {
      Alert.alert('Super Like sent!');
    } else if (result.code === 'BUSINESS_PREMIUM_REQUIRED') {
      // Show premium upgrade screen
    }
  };
}
```

### Safety Features
```javascript
import SafetyService from './src/services/SafetyService';

function ProfileScreen() {
  const handleBlock = async () => {
    const result = await SafetyService.blockUser(
      user.id,
      targetUserId
    );
    
    if (result.success) {
      navigation.goBack();
    }
  };
}
```

## 🔍 Verify Installation

### Check RLS is Active
```sql
-- Run in Supabase SQL Editor
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- All tables should show rowsecurity = true
```

### Test Authentication
```javascript
// Create a test user
const result = await AuthService.signUp(
  'test@example.com',
  'password123',
  {
    firstName: 'Test',
    age: 25,
    gender: 'male',
  }
);

console.log('Sign up:', result.success);
console.log('User:', result.user);
```

### Test Services
```javascript
// Test location service
const location = await LocationService.getCurrentLocation();
console.log('Location:', location.data);

// Test distance calculation
const distance = LocationService.calculateDistance(
  { latitude: 40.7128, longitude: -74.0060 },
  { latitude: 34.0522, longitude: -118.2437 }
);
console.log('Distance:', distance, 'km'); // ~3944 km
```

## 🐛 Troubleshooting

### "Cannot find module 'expo-secure-store'"
```bash
npm install expo-secure-store
npx expo install expo-secure-store
```

### "RLS policy violation"
- Make sure you ran `supabase/rls-policies.sql`
- Check if user is authenticated
- Verify user ID matches in requests

### "Session expired"
- AuthService automatically refreshes sessions
- Check if token is valid: `AuthService.isAuthenticated()`
- Re-authenticate if needed

### "Image compression failed"
```bash
npm install expo-image-manipulator
npx expo install expo-image-manipulator
```

## 📚 Documentation

- **Full Implementation:** See `REFACTOR_IMPLEMENTATION_SUMMARY.md`
- **Next Steps:** See `REFACTOR_NEXT_STEPS.md`
- **Service Docs:** Check comments in each service file

## 🎉 You're Ready!

Your dating app now has:
- ✅ Enterprise-grade security
- ✅ Real-time features
- ✅ Premium monetization
- ✅ Safety & moderation
- ✅ Analytics & logging

**Next:** Start integrating services into your UI screens!

## 💡 Pro Tips

1. **Always use ErrorHandler** - Wrap service calls for consistent error handling
2. **Use Context hooks** - `useAuth()`, `usePreferences()`, `useNotifications()`
3. **Check premium status** - Before using premium features
4. **Log events** - Use AnalyticsService for tracking
5. **Test RLS** - Verify data access restrictions work

## 🆘 Need Help?

1. Check service file comments for detailed usage
2. Review implementation summary for architecture
3. Look at context providers for state management
4. Test individual services before UI integration

**Happy coding! 🚀**
