# 🚀 Supabase Integráció - Gyors Referencia

## 📦 Service-ek

### ProfileService
```javascript
import ProfileService from './services/ProfileService';

// Profil frissítése
await ProfileService.updateProfile(userId, {
  bio: 'Új bio',
  age: 25,
  interests: ['Sport', 'Zene'],
});

// Profil lekérése
const result = await ProfileService.getProfile(userId);

// Profilkép feltöltése
await ProfileService.uploadProfilePhoto(userId, photoUri);
```

### SupabaseMatchService
```javascript
import SupabaseMatchService from './services/SupabaseMatchService';

// Like mentése (automatikus match detektálás)
const result = await SupabaseMatchService.saveLike(userId, likedUserId);
if (result.isMatch) {
  // Match történt!
}

// Match-ek lekérése
const matches = await SupabaseMatchService.getMatches(userId);

// Pass mentése
await SupabaseMatchService.savePass(userId, passedUserId);
```

### MessageService
```javascript
import MessageService from './services/MessageService';

// Üzenet küldése
await MessageService.sendMessage(matchId, senderId, 'Hello!', 'text');

// Üzenetek lekérése
const result = await MessageService.getMessages(matchId);

// Real-time feliratkozás
const subscription = MessageService.subscribeToMessages(matchId, (newMessage) => {
  console.log('New message:', newMessage);
});

// Leiratkozás
MessageService.unsubscribeFromMessages(subscription);
```

### Logger
```javascript
import Logger from './services/Logger';

Logger.debug('Debug message', { context: 'data' });
Logger.info('Info message');
Logger.success('Success message');
Logger.warn('Warning message');
Logger.error('Error message', error);
```

## 🗄️ Adatbázis Táblák

### profiles
```sql
- id (UUID)
- full_name (TEXT)
- gender (TEXT)
- birth_date (DATE)
- photos (TEXT[])
- avatar_url (TEXT)
- bio (TEXT)
- age (INTEGER)
- interests (TEXT[])
- job_title (TEXT)
- education (TEXT)
- relationship_goal (TEXT)
- is_verified (BOOLEAN)
- is_premium (BOOLEAN)
```

### matches
```sql
- id (UUID)
- user_id (UUID)
- matched_user_id (UUID)
- matched_at (TIMESTAMP)
- status (TEXT) -- 'active', 'unmatched', 'blocked'
```

### likes
```sql
- id (UUID)
- user_id (UUID)
- liked_user_id (UUID)
- liked_at (TIMESTAMP)
```

### messages
```sql
- id (UUID)
- match_id (UUID)
- sender_id (UUID)
- content (TEXT)
- type (TEXT) -- 'text', 'voice', 'video', 'image', 'gif'
- is_read (BOOLEAN)
- read_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

## 📁 Storage Bucket-ek

- **avatars**: Profilképek
- **photos**: Profil fotók (több kép)
- **videos**: Videó profilok
- **voice-messages**: Hangüzenetek
- **video-messages**: Videóüzenetek

## 🔧 Környezeti Változók

```env
SUPABASE_URL=https://xgvubkbfhleeagdvkhds.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_REDIRECT_URL=https://hevesitr.github.io/luxio-/auth-callback
```

## 📱 Screen Integrációk

### HomeScreen - Swipe Right
```javascript
const handleSwipeRight = async (profile) => {
  const result = await SupabaseMatchService.saveLike(currentUser.id, profile.id);
  if (result.success && result.isMatch) {
    // Match animáció
    setMatchAnimVisible(true);
  }
};
```

### ChatScreen - Üzenetek
```javascript
// Betöltés
useEffect(() => {
  const loadMessages = async () => {
    const result = await MessageService.getMessages(match.matchId);
    setMessages(result.data);
  };
  loadMessages();
  
  // Real-time
  const sub = MessageService.subscribeToMessages(match.matchId, (msg) => {
    setMessages(prev => [...prev, msg]);
  });
  
  return () => MessageService.unsubscribeFromMessages(sub);
}, [match.matchId]);

// Küldés
const sendMessage = async (text) => {
  await MessageService.sendMessage(match.matchId, currentUser.id, text);
};
```

### ProfileScreen - Profil Mentés
```javascript
const handleSaveProfile = async (updates) => {
  const result = await ProfileService.updateProfile(profile.id, updates);
  if (result.success) {
    Alert.alert('Siker', 'Profil frissítve!');
  }
};
```

## 🐛 Gyakori Hibák

### "Not authenticated"
```javascript
// Ellenőrizd a session-t
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Nincs bejelentkezve
}
```

### "No matchId available"
```javascript
// Ellenőrizd, hogy a match objektumnak van-e matchId mezője
if (!match?.matchId) {
  Logger.warn('No matchId available');
  return;
}
```

### Real-time nem működik
```javascript
// 1. Ellenőrizd a Supabase Dashboard-on: Database → Replication
// 2. Ellenőrizd, hogy a messages tábla realtime engedélyezve van
// 3. Indítsd újra az appot
```

## 📊 Response Format

Minden service metódus ezt a formátumot használja:

```javascript
{
  success: boolean,
  data?: any,
  error?: string,
  count?: number,
  isMatch?: boolean  // csak saveLike-nál
}
```

## 🔄 Offline Support

```javascript
// A SupabaseMatchService automatikusan fallback-el local cache-re
const result = await SupabaseMatchService.getMatches(userId);
if (!result.success) {
  // Offline mode - local cache-ből jönnek az adatok
  console.log('Using local cache:', result.data);
}
```

## 🎯 Következő Lépések

1. ✅ Futtasd a SQL sémát: `supabase/schema_extended.sql`
2. ✅ Hozd létre a storage bucket-eket
3. ✅ Engedélyezd a realtime-ot a messages táblán
4. ✅ Teszteld az appot

**Részletes útmutató:** `docs/SUPABASE_SETUP_GUIDE.md`

---

**Készítette:** Kiro AI  
**Verzió:** 1.0.0
