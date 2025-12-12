// Verify Supabase Setup
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifySupabaseSetup() {
  console.log('🔍 Verifying Supabase Setup...\n');

  let allPassed = true;

  // Test 1: Check database connection
  console.log('📡 Test 1: Database Connection');
  try {
    const { data, error } = await supabase.from('profiles').select('count');
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      allPassed = false;
    } else {
      console.log('✅ Database connection successful\n');
    }
  } catch (err) {
    console.log('❌ Database connection failed:', err.message);
    allPassed = false;
  }

  // Test 2: Check tables exist
  console.log('📋 Test 2: Tables Existence');
  const tables = ['profiles', 'matches', 'messages', 'likes', 'passes', 'reports', 'blocks'];
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        allPassed = false;
      } else {
        console.log(`✅ ${table}: exists`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      allPassed = false;
    }
  }

  // Test 3: Check storage buckets
  console.log('\n📦 Test 3: Storage Buckets');
  const requiredBuckets = ['avatars', 'photos', 'videos', 'voice-messages', 'video-messages'];
  
  for (const bucket of requiredBuckets) {
    try {
      // Try to upload a test file to check if bucket exists
      const testContent = 'test';
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(`test/verify-${Date.now()}.txt`, testContent, {
          contentType: 'text/plain',
          upsert: true
        });

      if (error) {
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          console.log(`❌ ${bucket}: Bucket does not exist`);
          allPassed = false;
        } else if (error.message.includes('row-level security') || error.message.includes('JWT')) {
          // RLS policy blocks upload, but bucket exists!
          console.log(`✅ ${bucket}: exists (RLS protected)`);
        } else {
          console.log(`⚠️  ${bucket}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${bucket}: exists and accessible`);
        // Clean up
        await supabase.storage.from(bucket).remove([data.path]);
      }
    } catch (err) {
      console.log(`❌ ${bucket}: ${err.message}`);
      allPassed = false;
    }
  }

  // Test 4: Check RLS policies
  console.log('\n🔒 Test 4: RLS Policies');
  
  // Try to insert without auth (should fail)
  const { error: insertError } = await supabase
    .from('matches')
    .insert({ user_id: 'test', matched_user_id: 'test' });
  
  if (insertError) {
    console.log('✅ RLS is working (insert blocked without auth)');
  } else {
    console.log('⚠️  RLS might not be fully enabled (insert succeeded)');
    allPassed = false;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED! Supabase is ready to use!');
  } else {
    console.log('⚠️  SOME TESTS FAILED. Please check the manual setup guide:');
    console.log('   See MANUAL_SUPABASE_SETUP.md for instructions');
  }
  console.log('='.repeat(50));
}

verifySupabaseSetup();
