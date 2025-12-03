-- ============================================
-- DIAGNOSTIC: Check table column types
-- Run this to see what types your tables have
-- ============================================

-- Check profiles table
SELECT 
  'profiles' as table_name,
  column_name, 
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name IN ('id', 'user_id');

-- Check matches table
SELECT 
  'matches' as table_name,
  column_name, 
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'matches'
AND column_name IN ('id', 'user_id', 'matched_user_id');

-- Check messages table
SELECT 
  'messages' as table_name,
  column_name, 
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'messages'
AND column_name IN ('id', 'sender_id', 'match_id');

-- Check likes table
SELECT 
  'likes' as table_name,
  column_name, 
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'likes'
AND column_name IN ('id', 'user_id', 'liked_user_id');

-- Check passes table
SELECT 
  'passes' as table_name,
  column_name, 
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'passes'
AND column_name IN ('id', 'user_id', 'passed_user_id');
