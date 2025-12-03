# Dating App Refactor - Next Steps Guide

## 🚀 IMMEDIATE ACTIONS (Do These First!)

### 1. Apply RLS Policies to Supabase
**Priority:** CRITICAL ⚠️

```bash
# Navigate to Supabase Dashboard
# Go to: SQL Editor
# Copy and paste the content of: supabase/rls-policies.sql
# Click "Run"
```

**Why:** Without RLS, your database is completely open! This is a critical security vulnerability.

**Verification:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Should show rowsecurity = true for all tables
```

### 2. Install Missing Dependencies

```bash
npm install expo-secure-store
npm install expo-image-manipulator
npm install @react-native-async-storage/async-storage
```

**Why:** New services require these packages.

### 3. Update App.js to Include Context Providers

```javascript
import { AuthProvider } from './src/contexts/AuthContext';
import { PreferencesProvider } from './src/contexts/PreferencesContext';
import { NotificationProvider } from './src/contexts/NotificationContext';

export default function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <NotificationProvider>
          {/* Your existing app content */}
        </NotificationProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
```

### 4. Test Authentication Flow

Create a simple test screen:

```javascript
import { useAuth } from './src/contexts/AuthContext';

function TestAuthScreen() {
  const { user, signIn, signUp, signOut, isAuthenticated } = useAuth();

  const handleSignUp = async () => {
    const result = await signUp(
      'test@example.com',
      'password123',
      {
        firstName: 'Test',
        age: 25,
        gender: 'male',
        bio: 'Test user',
      }
    );
    console.log('Sign up result:', result);
  };

  return (
    <View>
      <Text>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
      <Text>User: {user?.email || 'None'}</Text>
      <Button title="Sign Up" onPress={handleSignUp} />
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}
```

## 📋 SHORT TERM TASKS (This Week)

### 1. Integrate ErrorHandler into Existing Services

Update `ProfileService.js`:
```javascript
import ErrorHandler from './ErrorHandler';

// Replace all try-catch blocks with:
async someMethod() {
  return ErrorHandler.wrapServiceCall(async () => {
    // Your code here
  }, { operation: 'someMethod', context: {...} });
}
```

Do the same for:
- ✅ ProfileService.js (partially done)
- ⬜ SupabaseStorageService.js
- ⬜ MatchService.js (local cache version)

### 2. Update SupabaseStorageService with Image Compression

```javascript
import ImageCompressionService from './ImageCompressionService';

async uploadImage(localUri, bucket, userId, fileName) {
  // Add compression before upload
  const compressed = await ImageCompressionService.compressImage(localUri);
  
  if (compressed.success) {
    // Upload compressed.data.uri instead of localUri
    // ... rest of upload logic
  }
}
```

### 3. Connect Discovery Feed to HomeScreen

```javascript
import SupabaseMatchService from './services/SupabaseMatchService';
import { usePreferences } from './contexts/PreferencesContext';

function HomeScreen() {
  const { user } = useAuth();
  const { getDiscoveryFilters } = usePreferences();
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const filters = getDiscoveryFilters();
    const result = await SupabaseMatchService.getDiscoveryFeed(
      user.id,
      filters
    );
    
    if (result.success) {
      setProfiles(result.data);
    }
  };

  // ... rest of component
}
```

### 4. Implement Real-time Messaging in ChatRoomScreen

```javascript
import MessageService from './services/MessageService';

function ChatRoomScreen({ route }) {
  const { matchId } = route.params;
  const [messages, setMessages] = useState([]);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    loadMessages();
    subscribeToMessages();

    return () => {
      if (subscription) {
        MessageService.unsubscribeFromMessages(subscription);
      }
    };
  }, [matchId]);

  const loadMessages = async () => {
    const result = await MessageService.getMessages(matchId);
    if (result.success) {
      setMessages(result.data);
    }
  };

  const subscribeToMessages = () => {
    const sub = MessageService.subscribeToMessages(matchId, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
    });
    setSubscription(sub);
  };

  // ... rest of component
}
```

### 5. Add Typing Indicators

```javascript
import MessageService from './services/MessageService';

function ChatRoomScreen() {
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const handleTextChange = (text) => {
    setMessage(text);
    
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      MessageService.sendTypingIndicator(matchId, user.id);
    } else if (text.length === 0 && isTyping) {
      setIsTyping(false);
      MessageService.stopTypingIndicator(matchId, user.id);
    }
  };

  // Subscribe to presence for typing indicators
  useEffect(() => {
    const channel = MessageService.subscribeToPresence(matchId, (event) => {
      if (event.type === 'sync') {
        // Check if other user is typing
        const presences = Object.values(event.state);
        const otherPresence = presences.find(p => p.user_id !== user.id);
        setOtherUserTyping(otherPresence?.typing || false);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  // ... rest of component
}
```

## 🎯 MEDIUM TERM TASKS (This Month)

### 1. Implement React Query for Caching

```bash
npm install @tanstack/react-query
```

```javascript
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// In App.js
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    {/* ... */}
  </AuthProvider>
</QueryClientProvider>

// In components
function ProfileScreen() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => ProfileService.getProfile(userId),
  });
}
```

### 2. Component Refactoring

Break down large screens into smaller components:

**HomeScreen.js** → 
- `DiscoveryCard.js` (already exists)
- `SwipeButtons.js` (already exists)
- `FilterPanel.js` (already exists)
- `EmptyState.js` (new)
- `ProfileDetails.js` (new)

**ChatRoomScreen.js** →
- `MessageList.js` (new)
- `MessageBubble.js` (new)
- `ChatHeader.js` (new)
- `MessageInput.js` (new)
- `TypingIndicator.js` (new)

**ProfileScreen.js** →
- `PhotoGrid.js` (new)
- `PromptList.js` (new)
- `ProfileEditor.js` (new)
- `VerificationBadge.js` (new)

### 3. Add Premium Features UI

Create `PremiumScreen.js`:
```javascript
import PaymentService from './services/PaymentService';

function PremiumScreen() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(null);

  useEffect(() => {
    loadPlans();
    loadStatus();
  }, []);

  const loadPlans = () => {
    const result = PaymentService.getSubscriptionPlans();
    setPlans(result.data);
  };

  const loadStatus = async () => {
    const result = await PaymentService.getSubscriptionStatus(user.id);
    if (result.success) {
      setCurrentStatus(result.data);
    }
  };

  const handleSubscribe = async (planId) => {
    const result = await PaymentService.createSubscription(user.id, planId);
    if (result.success) {
      Alert.alert('Success', 'Premium activated!');
      loadStatus();
    }
  };

  // ... render plans
}
```

### 4. Add Safety Features UI

Create `SafetyScreen.js`:
```javascript
import SafetyService from './services/SafetyService';

function ProfileScreen({ route }) {
  const { profileId } = route.params;

  const handleReport = async () => {
    const result = await SafetyService.reportUser(
      user.id,
      profileId,
      'harassment',
      null,
      'User was harassing me'
    );
    
    if (result.success) {
      Alert.alert('Reported', 'Thank you for reporting');
    }
  };

  const handleBlock = async () => {
    const result = await SafetyService.blockUser(user.id, profileId);
    
    if (result.success) {
      Alert.alert('Blocked', 'User has been blocked');
      navigation.goBack();
    }
  };

  // ... render UI with Report and Block buttons
}
```

### 5. Implement Location-Based Discovery

```javascript
import LocationService from './services/LocationService';

function HomeScreen() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    const permission = await LocationService.requestPermission();
    
    if (permission.success) {
      const loc = await LocationService.getCurrentLocation();
      if (loc.success) {
        setLocation(loc.data);
        
        // Update user location in database
        await LocationService.updateUserLocation(user.id, loc.data);
      }
    }
  };

  // Use location in discovery feed
  const loadProfiles = async () => {
    const filters = {
      ...getDiscoveryFilters(),
      userLocation: location,
    };
    
    const result = await SupabaseMatchService.getDiscoveryFeed(
      user.id,
      filters
    );
    
    // Profiles will have distance calculated
    setProfiles(result.data);
  };
}
```

## 🔧 TECHNICAL DEBT & OPTIMIZATION

### 1. Bundle Size Optimization

```bash
# Analyze bundle
npx react-native-bundle-visualizer

# Enable Hermes (if not already)
# In android/app/build.gradle:
project.ext.react = [
    enableHermes: true
]
```

### 2. Code Splitting

```javascript
// Lazy load screens
const HomeScreen = React.lazy(() => import('./screens/HomeScreen'));
const ChatScreen = React.lazy(() => import('./screens/ChatScreen'));

// Use Suspense
<Suspense fallback={<LoadingScreen />}>
  <HomeScreen />
</Suspense>
```

### 3. Image Optimization

- Use WebP format where possible
- Implement progressive image loading
- Add image placeholders
- Use react-native-fast-image for caching

### 4. Performance Monitoring

```bash
npm install @react-native-firebase/perf
```

```javascript
import perf from '@react-native-firebase/perf';

// Measure screen load time
const trace = await perf().startTrace('home_screen_load');
// ... load data
await trace.stop();
```

## 📊 TESTING STRATEGY

### 1. Unit Tests (Jest)

```bash
npm install --save-dev jest @testing-library/react-native
```

```javascript
// __tests__/LocationService.test.js
import LocationService from '../src/services/LocationService';

describe('LocationService', () => {
  test('calculateDistance returns correct distance', () => {
    const coord1 = { latitude: 40.7128, longitude: -74.0060 }; // NYC
    const coord2 = { latitude: 34.0522, longitude: -118.2437 }; // LA
    
    const distance = LocationService.calculateDistance(coord1, coord2);
    
    expect(distance).toBeGreaterThan(3900); // ~3944 km
    expect(distance).toBeLessThan(4000);
  });
});
```

### 2. Integration Tests

Test complete user flows:
- Sign up → Profile creation → Discovery → Match → Message
- Premium subscription → Super like → Rewind
- Report → Block → Unmatch

### 3. E2E Tests (Detox)

```bash
npm install --save-dev detox
```

```javascript
// e2e/auth.test.js
describe('Authentication', () => {
  it('should sign up successfully', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('signup-button')).tap();
    
    await expect(element(by.id('home-screen'))).toBeVisible();
  });
});
```

## 🎉 SUCCESS METRICS

Track these metrics to measure success:

### Performance
- [ ] Initial load time < 3 seconds
- [ ] Bundle size < 2MB
- [ ] Image load time < 1 second
- [ ] API response time < 500ms

### Quality
- [ ] Test coverage > 80%
- [ ] Zero critical security vulnerabilities
- [ ] Crash rate < 0.1%
- [ ] ESLint errors: 0

### User Experience
- [ ] Onboarding completion rate > 80%
- [ ] Daily active users retention > 40%
- [ ] Match rate > 10% of swipes
- [ ] Message response rate > 50%
- [ ] Premium conversion rate > 5%

## 📞 SUPPORT

If you encounter issues:

1. **Check logs:** Use Logger service to debug
2. **Verify RLS:** Ensure policies are applied correctly
3. **Test services:** Use the test screens to verify functionality
4. **Review documentation:** Check service files for usage examples

## 🎯 PRIORITY MATRIX

```
HIGH IMPACT, HIGH EFFORT:
- Component refactoring
- React Query integration
- Bundle optimization

HIGH IMPACT, LOW EFFORT:
- Apply RLS policies ← START HERE!
- Install dependencies
- Update context providers
- Test authentication

LOW IMPACT, HIGH EFFORT:
- E2E testing
- Advanced analytics
- A/B testing framework

LOW IMPACT, LOW EFFORT:
- ESLint configuration
- Code formatting
- Documentation updates
```

**Recommendation:** Start with HIGH IMPACT, LOW EFFORT tasks first!
