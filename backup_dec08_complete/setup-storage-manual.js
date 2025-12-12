#!/usr/bin/env node

/**
 * Manual Supabase Storage Setup Script
 * This script provides step-by-step instructions for creating storage buckets
 */

const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 SUPABASE STORAGE BUCKET SETUP ASSISTANT\n');
console.log('This script will help you create the required storage buckets for your dating app.\n');

console.log('📋 REQUIRED BUCKETS:');
console.log('• avatars (public) - Profile avatar images');
console.log('• photos (public) - Profile photos');
console.log('• videos (public) - Profile videos');
console.log('• voice-messages (private) - Voice messages');
console.log('• video-messages (private) - Video messages\n');

console.log('🔧 MANUAL STEPS:\n');

console.log('1. Open Supabase Dashboard:');
console.log('   https://supabase.com/dashboard/project/xgvubkbfhleeagdvkhds\n');

console.log('2. Navigate to:');
console.log('   Left sidebar → Storage → Create bucket\n');

console.log('3. Create these buckets one by one:\n');

const buckets = [
  { name: 'avatars', public: true, mimeTypes: 'image/*', sizeLimit: '5MB' },
  { name: 'photos', public: true, mimeTypes: 'image/*', sizeLimit: '5MB' },
  { name: 'videos', public: true, mimeTypes: 'video/*', sizeLimit: '50MB' },
  { name: 'voice-messages', public: false, mimeTypes: 'audio/*', sizeLimit: '10MB' },
  { name: 'video-messages', public: false, mimeTypes: 'video/*', sizeLimit: '50MB' }
];

buckets.forEach((bucket, index) => {
  console.log(`${index + 1}. Bucket: "${bucket.name}"`);
  console.log(`   • Visibility: ${bucket.public ? 'Public bucket' : 'Private bucket'}`);
  console.log(`   • Allowed MIME types: ${bucket.mimeTypes}`);
  console.log(`   • File size limit: ${bucket.sizeLimit}`);
  console.log('   • Click "Create bucket"\n');
});

console.log('4. After creating all buckets, run this verification script:\n');
console.log('   node verify-storage-setup.js\n');

console.log('5. Expected result:');
console.log('   ✅ avatars bucket - OK');
console.log('   ✅ photos bucket - OK');
console.log('   ✅ videos bucket - OK');
console.log('   ✅ voice-messages bucket - OK');
console.log('   ✅ video-messages bucket - OK\n');

console.log('🎯 NEED HELP?');
console.log('• Check the Supabase documentation: https://supabase.com/docs/guides/storage');
console.log('• Make sure you have admin access to the project');
console.log('• All buckets should be created successfully\n');

rl.question('Press Enter when you have completed the setup...', () => {
  console.log('\n🔍 Running verification...\n');

  // Run verification
  const { spawn } = require('child_process');
  const verify = spawn('node', ['verify-storage-setup.js'], { stdio: 'inherit' });

  verify.on('close', (code) => {
    if (code === 0) {
      console.log('\n🎉 SUCCESS! All storage buckets are ready!');
      console.log('🚀 Your dating app is now fully functional!');
    } else {
      console.log('\n❌ VERIFICATION FAILED');
      console.log('Please check that all buckets were created correctly.');
    }
    rl.close();
  });
});
