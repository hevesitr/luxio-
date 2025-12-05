#!/usr/bin/env node

/**
 * Create Supabase Storage Buckets Script
 * Automatically creates all required storage buckets for the dating app
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const buckets = [
  { name: 'avatars', public: true, description: 'Profile avatar images' },
  { name: 'photos', public: true, description: 'Profile photos' },
  { name: 'videos', public: true, description: 'Profile videos' },
  { name: 'voice-messages', public: false, description: 'Voice messages in chats' },
  { name: 'video-messages', public: false, description: 'Video messages in chats' }
];

async function createBuckets() {
  console.log('🚀 Creating Supabase Storage Buckets...\n');

  for (const bucket of buckets) {
    try {
      console.log(`📦 Creating bucket: ${bucket.name} (${bucket.public ? 'public' : 'private'})`);

      // Check if bucket already exists
      const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.log(`❌ Error checking buckets: ${listError.message}`);
        continue;
      }

      const bucketExists = existingBuckets.some(b => b.name === bucket.name);

      if (bucketExists) {
        console.log(`✅ Bucket '${bucket.name}' already exists`);
        continue;
      }

      // Create bucket
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        allowedMimeTypes: bucket.name.includes('video') ? ['video/*'] :
                         bucket.name.includes('voice') ? ['audio/*'] :
                         ['image/*'],
        fileSizeLimit: bucket.name.includes('video') ? 50 * 1024 * 1024 : // 50MB for videos
                       bucket.name.includes('voice') ? 10 * 1024 * 1024 : // 10MB for voice
                       5 * 1024 * 1024 // 5MB for images
      });

      if (error) {
        console.log(`❌ Failed to create bucket '${bucket.name}': ${error.message}`);
      } else {
        console.log(`✅ Successfully created bucket '${bucket.name}'`);
      }

    } catch (error) {
      console.log(`❌ Unexpected error creating bucket '${bucket.name}': ${error.message}`);
    }
  }

  console.log('\n🔍 Verifying bucket creation...\n');

  // Verify buckets exist
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.log(`❌ Error listing buckets: ${error.message}`);
    } else {
      console.log('📋 Current buckets:');
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }
  } catch (error) {
    console.log(`❌ Error verifying buckets: ${error.message}`);
  }

  console.log('\n🎉 Storage bucket creation completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Check Supabase Dashboard → Storage to verify buckets');
  console.log('2. Set up RLS policies for private buckets if needed');
  console.log('3. Test file uploads in the app');
}

createBuckets().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
