# 📋 Manual Supabase Setup Guide

## ✅ Already Completed:
- Database schema applied
- RLS policies enabled
- Tables created and verified

## 🔧 Manual Steps Required:

### 1. Create Storage Buckets

Go to Supabase Dashboard → Storage → Create Bucket

Create the following buckets:

#### Bucket 1: `avatars`
- **Name:** `avatars`
- **Public:** ✅ Yes
- **File size limit:** 5 MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`

#### Bucket 2: `photos`
- **Name:** `photos`
- **Public:** ✅ Yes
- **File size limit:** 10 MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`

#### Bucket 3: `videos`
- **Name:** `videos`
- **Public:** ✅ Yes
- **File size limit:** 50 MB
- **Allowed MIME types:** `video/mp4`, `video/quicktime`

#### Bucket 4: `voice-messages`
- **Name:** `voice-messages`
- **Public:** ❌ No (private)
- **File size limit:** 5 MB
- **Allowed MIME types:** `audio/mpeg`, `audio/mp4`, `audio/webm`

#### Bucket 5: `video-messages`
- **Name:** `video-messages`
- **Public:** ❌ No (private)
- **File size limit:** 50 MB
- **Allowed MIME types:** `video/mp4`, `video/quicktime`, `video/webm`

### 2. Enable Realtime for Messages Table

Go to Supabase Dashboard → Database → Replication

Enable realtime for:
- ✅ `messages` table
- ✅ `matches` table (optional, for real-time match notifications)

### 3. Apply Storage Policies

After creating buckets, run this SQL in SQL Editor:

```sql
-- Storage policies for avatars bucket
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for photos bucket
CREATE POLICY "Anyone can view photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

CREATE POLICY "Users can upload their own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for voice-messages bucket (private)
CREATE POLICY "Users can view their own voice messages"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'voice-messages' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload voice messages"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'voice-messages' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for video-messages bucket (private)
CREATE POLICY "Users can view their own video messages"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'video-messages' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload video messages"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'video-messages' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 4. Verify Setup

Run this test script to verify everything is working:

```bash
node verify-supabase-setup.js
```

## 📊 Verification Checklist:

- [ ] All 5 storage buckets created
- [ ] Storage policies applied
- [ ] Realtime enabled for messages table
- [ ] Test script passes all checks

## 🎉 Once Complete:

You can proceed with UI integration tasks:
- Task 8: Integrate SupabaseMatchService into HomeScreen
- Task 9: Integrate MessageService into ChatScreen
- Task 10: Integrate ProfileService into ProfileScreen

---

**Note:** These are one-time setup steps. Once completed, you won't need to do them again unless you create a new Supabase project.
