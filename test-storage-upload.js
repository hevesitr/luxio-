// Test Storage Upload
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testStorageUpload() {
  console.log('🧪 Testing Storage Upload...\n');

  // Create a test file
  const testContent = 'This is a test file';
  const testFileName = 'test.txt';
  
  const buckets = ['avatars', 'photos', 'videos', 'voice-messages', 'video-messages'];

  for (const bucket of buckets) {
    try {
      // Try to upload a test file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(`test/${testFileName}`, testContent, {
          contentType: 'text/plain',
          upsert: true
        });

      if (error) {
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          console.log(`❌ ${bucket}: Bucket does not exist`);
        } else if (error.message.includes('JWT')) {
          console.log(`⚠️  ${bucket}: Bucket exists but requires authentication`);
        } else {
          console.log(`⚠️  ${bucket}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${bucket}: Bucket exists and is accessible`);
        
        // Clean up: delete the test file
        await supabase.storage.from(bucket).remove([`test/${testFileName}`]);
      }
    } catch (err) {
      console.log(`❌ ${bucket}: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Storage test completed!');
  console.log('='.repeat(50));
}

testStorageUpload();
