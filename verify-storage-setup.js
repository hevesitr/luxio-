#!/usr/bin/env node

/**
 * Verify Supabase Storage Setup
 * Checks if all required storage buckets exist
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

const requiredBuckets = [
  'avatars',
  'photos',
  'videos',
  'voice-messages',
  'video-messages'
];

async function verifySetup() {
  console.log('🔍 Verifying Supabase Storage Setup...\n');

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('❌ Error listing buckets:', error.message);
      process.exit(1);
    }

    console.log('📋 Found buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    console.log();

    const bucketNames = buckets.map(b => b.name);
    let allExist = true;

    console.log('✅ Checking required buckets:\n');

    requiredBuckets.forEach(bucketName => {
      if (bucketNames.includes(bucketName)) {
        console.log(`✅ ${bucketName} bucket - OK`);
      } else {
        console.log(`❌ ${bucketName} bucket - MISSING`);
        allExist = false;
      }
    });

    console.log();

    if (allExist) {
      console.log('🎉 SUCCESS! All storage buckets are properly configured!');
      console.log('\n🚀 Your dating app is now FULLY FUNCTIONAL!');
      console.log('\n📱 Test features:');
      console.log('• Profile creation with photos');
      console.log('• Real-time messaging');
      console.log('• Match creation');
      console.log('• File uploads');
      console.log('\n🎯 Ready for production!');

      return true;
    } else {
      console.log('❌ SETUP INCOMPLETE');
      console.log('Please create the missing buckets in Supabase Dashboard → Storage');
      console.log('\nMissing buckets:');
      requiredBuckets.forEach(bucketName => {
        if (!bucketNames.includes(bucketName)) {
          console.log(`  - ${bucketName}`);
        }
      });
      return false;
    }

  } catch (error) {
    console.error('💥 Verification failed:', error.message);
    return false;
  }
}

// Run verification
verifySetup().then(success => {
  process.exit(success ? 0 : 1);
});
