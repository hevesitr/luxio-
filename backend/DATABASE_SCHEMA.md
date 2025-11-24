# 🗄️ Adatbázis Séma - Luxio

**Verzió:** 1.0.0  
**Dátum:** 2024  
**Adatbázis:** PostgreSQL (ajánlott) vagy MongoDB

---

## 📋 TARTALOMJEGYZÉK

1. [Felhasználók](#felhasználók)
2. [Profilok](#profilok)
3. [Matchek](#matchek)
4. [Üzenetek](#üzenetek)
5. [Média](#média)
6. [Moderáció](#moderáció)
7. [Fizetés](#fizetés)
8. [GDPR](#gdpr)
9. [Értesítések](#értesítések)

---

## 👤 FELHASZNÁLÓK

### `users` tábla

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  birth_date DATE NOT NULL,
  gender VARCHAR(20) NOT NULL, -- male, female, other
  looking_for TEXT[] NOT NULL, -- array: ['male', 'female']
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  phone_verification_code VARCHAR(6),
  phone_verification_expires TIMESTAMP,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  ban_expires TIMESTAMP,
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexek
  INDEX idx_users_email (email),
  INDEX idx_users_phone (phone),
  INDEX idx_users_last_active (last_active),
  INDEX idx_users_created_at (created_at)
);
```

---

### `user_settings` tábla

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Értesítések
  notifications_matches BOOLEAN DEFAULT TRUE,
  notifications_messages BOOLEAN DEFAULT TRUE,
  notifications_likes BOOLEAN DEFAULT TRUE,
  notifications_super_likes BOOLEAN DEFAULT TRUE,
  notifications_top_picks BOOLEAN DEFAULT FALSE,
  notifications_promotions BOOLEAN DEFAULT FALSE,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Privacy
  show_distance BOOLEAN DEFAULT TRUE,
  show_last_active BOOLEAN DEFAULT TRUE,
  incognito_mode BOOLEAN DEFAULT FALSE,
  
  -- Biometrikus autentikáció
  biometric_enabled BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);
```

---

### `user_consents` tábla (GDPR)

```sql
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL, -- terms, privacy, marketing, analytics
  accepted BOOLEAN NOT NULL,
  accepted_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  INDEX idx_user_consents_user_id (user_id),
  INDEX idx_user_consents_type (consent_type)
);
```

---

## 📸 PROFILOK

### `profiles` tábla

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Alapvető információk
  bio TEXT,
  interests TEXT[],
  relationship_goal VARCHAR(20), -- serious, casual, friendship
  communication_style VARCHAR(20), -- frequent, moderate, occasional
  
  -- Részletes információk
  height INTEGER, -- cm
  work VARCHAR(100),
  education VARCHAR(100),
  exercise VARCHAR(50),
  smoking VARCHAR(50),
  drinking VARCHAR(50),
  children VARCHAR(50),
  religion VARCHAR(50),
  politics VARCHAR(50),
  zodiac_sign VARCHAR(20),
  mbti VARCHAR(10),
  
  -- Helyszín
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  location_city VARCHAR(100),
  location_country VARCHAR(100),
  
  -- Verifikáció
  is_verified BOOLEAN DEFAULT FALSE,
  verification_photo_url TEXT,
  verification_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  verification_requested_at TIMESTAMP,
  verification_approved_at TIMESTAMP,
  
  -- Prémium
  is_premium BOOLEAN DEFAULT FALSE,
  premium_tier VARCHAR(20) DEFAULT 'free', -- free, plus, gold, platinum
  premium_expires_at TIMESTAMP,
  
  -- Sugar Dating
  is_sugar_dating BOOLEAN DEFAULT FALSE,
  
  -- Profil kitöltés
  completion_percentage INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id),
  INDEX idx_profiles_location (location_latitude, location_longitude),
  INDEX idx_profiles_verified (is_verified),
  INDEX idx_profiles_premium (is_premium),
  INDEX idx_profiles_sugar_dating (is_sugar_dating)
);
```

---

### `profile_photos` tábla

```sql
CREATE TABLE profile_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  is_primary BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  size BIGINT, -- bytes
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_profile_photos_profile_id (profile_id),
  INDEX idx_profile_photos_order (profile_id, order_index)
);
```

---

### `profile_prompts` tábla

```sql
CREATE TABLE profile_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_profile_prompts_profile_id (profile_id)
);
```

---

### `profile_music` tábla

```sql
CREATE TABLE profile_music (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artists TEXT[],
  genres TEXT[],
  anthem TEXT, -- kedvenc dal
  spotify_connected BOOLEAN DEFAULT FALSE,
  spotify_user_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(profile_id)
);
```

---

## ❤️ MATCHEK

### `swipes` tábla

```sql
CREATE TABLE swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  swiped_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(10) NOT NULL, -- like, pass, super_like
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(swiper_id, swiped_id),
  INDEX idx_swipes_swiper (swiper_id),
  INDEX idx_swipes_swiped (swiped_id),
  INDEX idx_swipes_action (action),
  INDEX idx_swipes_created_at (created_at)
);
```

---

### `matches` tábla

```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  unmatched_at TIMESTAMP,
  unmatched_by UUID REFERENCES users(id),
  
  UNIQUE(user1_id, user2_id),
  INDEX idx_matches_user1 (user1_id),
  INDEX idx_matches_user2 (user2_id),
  INDEX idx_matches_matched_at (matched_at)
);
```

---

## 💬 ÜZENETEK

### `messages` tábla

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- text, voice, video, image
  text TEXT,
  media_url TEXT,
  thumbnail_url TEXT, -- videó esetén
  duration INTEGER, -- másodperc, voice/video esetén
  read_status VARCHAR(20) DEFAULT 'sent', -- sent, delivered, read
  read_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_messages_match_id (match_id),
  INDEX idx_messages_sender_id (sender_id),
  INDEX idx_messages_created_at (created_at),
  INDEX idx_messages_read_status (read_status)
);
```

---

## 📤 MÉDIA

### `media_files` tábla

```sql
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  type VARCHAR(20) NOT NULL, -- photo, video
  size BIGINT NOT NULL, -- bytes
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- másodperc, videó esetén
  mime_type VARCHAR(100),
  storage_path TEXT NOT NULL,
  is_nsfw BOOLEAN DEFAULT FALSE,
  nsfw_score DECIMAL(5, 4), -- 0.0 - 1.0
  virus_scan_status VARCHAR(20) DEFAULT 'pending', -- pending, clean, infected
  virus_scan_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_media_files_user_id (user_id),
  INDEX idx_media_files_type (type),
  INDEX idx_media_files_nsfw (is_nsfw)
);
```

---

## 🛡️ MODERÁCIÓ

### `reports` tábla

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  evidence_urls TEXT[],
  status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  resolution TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_reports_reporter (reporter_id),
  INDEX idx_reports_reported (reported_id),
  INDEX idx_reports_status (status),
  INDEX idx_reports_created_at (created_at)
);
```

---

### `blocks` tábla

```sql
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(blocker_id, blocked_id),
  INDEX idx_blocks_blocker (blocker_id),
  INDEX idx_blocks_blocked (blocked_id)
);
```

---

## 💳 FIZETÉS

### `subscriptions` tábla

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(20) NOT NULL, -- plus, gold, platinum
  platform VARCHAR(20) NOT NULL, -- ios, android
  status VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired, refunded
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  cancelled_at TIMESTAMP,
  cancelled_reason TEXT,
  
  -- App Store / Play Store adatok
  original_transaction_id VARCHAR(255),
  latest_receipt TEXT, -- App Store receipt
  purchase_token TEXT, -- Play Store token
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_subscriptions_user_id (user_id),
  INDEX idx_subscriptions_status (status),
  INDEX idx_subscriptions_end_date (end_date)
);
```

---

### `payments` tábla

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'HUF',
  platform VARCHAR(20) NOT NULL, -- ios, android
  transaction_id VARCHAR(255) UNIQUE,
  receipt_data TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
  refunded_at TIMESTAMP,
  refund_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_payments_user_id (user_id),
  INDEX idx_payments_subscription_id (subscription_id),
  INDEX idx_payments_status (status),
  INDEX idx_payments_transaction_id (transaction_id)
);
```

---

## 🔒 GDPR

### `data_export_requests` tábla

```sql
CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  file_url TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  INDEX idx_data_export_requests_user_id (user_id),
  INDEX idx_data_export_requests_status (status)
);
```

---

### `data_deletion_requests` tábla

```sql
CREATE TABLE data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, scheduled, completed, cancelled
  scheduled_deletion_date TIMESTAMP,
  deleted_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_data_deletion_requests_user_id (user_id),
  INDEX idx_data_deletion_requests_status (status),
  INDEX idx_data_deletion_requests_scheduled_date (scheduled_deletion_date)
);
```

---

### `audit_logs` tábla

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50), -- user, profile, match, message, etc.
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_audit_logs_user_id (user_id),
  INDEX idx_audit_logs_action (action),
  INDEX idx_audit_logs_resource (resource_type, resource_id),
  INDEX idx_audit_logs_created_at (created_at)
);
```

---

## 🔔 ÉRTESÍTÉSEK

### `push_tokens` tábla

```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL, -- ios, android
  device_id VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, device_id),
  INDEX idx_push_tokens_user_id (user_id),
  INDEX idx_push_tokens_token (token)
);
```

---

### `notifications` tábla

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- match, message, like, super_like, etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB, -- additional data
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_notifications_user_id (user_id),
  INDEX idx_notifications_type (type),
  INDEX idx_notifications_is_read (is_read),
  INDEX idx_notifications_created_at (created_at)
);
```

---

## 📊 STATISZTIKÁK

### `user_statistics` tábla

```sql
CREATE TABLE user_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Swipes
  swipes_sent INTEGER DEFAULT 0,
  likes_sent INTEGER DEFAULT 0,
  passes_sent INTEGER DEFAULT 0,
  super_likes_sent INTEGER DEFAULT 0,
  
  -- Matches
  matches_received INTEGER DEFAULT 0,
  
  -- Messages
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  
  -- Profile
  profile_views INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, date),
  INDEX idx_user_statistics_user_id (user_id),
  INDEX idx_user_statistics_date (date)
);
```

---

## 🔍 INDEXEK ÉS OPTIMALIZÁLÁS

### További Indexek

```sql
-- Keresés optimalizálás
CREATE INDEX idx_profiles_search ON profiles USING GIN (
  interests,
  to_tsvector('hungarian', COALESCE(bio, ''))
);

-- Távolság számítás optimalizálás
CREATE INDEX idx_profiles_location_btree ON profiles USING GIST (
  point(location_longitude, location_latitude)
);

-- Match keresés optimalizálás
CREATE INDEX idx_matches_active ON matches (is_active, matched_at DESC)
WHERE is_active = TRUE;
```

---

## 🔐 BIZTONSÁGI MEGJEGYZÉSEK

1. **Jelszó tárolás:** bcrypt hash, minimum 12 rounds
2. **Token tárolás:** JWT refresh tokenek titkosítva tárolva
3. **Személyes adatok:** Titkosítva tárolva (pl. phone, email)
4. **Audit log:** Minden fontos művelet naplózva
5. **Soft delete:** Felhasználók soft delete-tel (30 napos grace period)
6. **Adatmegőrzés:** GDPR szerint, automatikus törlés inaktivitás után

---

## 📈 SKÁLÁZÁS

### Particionálás
- `messages` tábla particionálva `created_at` szerint (havi partíciók)
- `swipes` tábla particionálva `created_at` szerint (havi partíciók)
- `audit_logs` tábla particionálva `created_at` szerint (havi partíciók)

### Replikáció
- Read replica-k a keresési lekérdezésekhez
- Master-slave replikáció a magas rendelkezésre állásért

---

**Utolsó frissítés:** 2024  
**Verzió:** 1.0.0

