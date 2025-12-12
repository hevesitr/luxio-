#!/usr/bin/env node

/**
 * Create Storage Buckets with Service Role Key
 * ⚠️  WARNING: This requires your Supabase SERVICE ROLE KEY
 * ⚠️  NEVER share this key with anyone!
 * ⚠️  This key has FULL ACCESS to your database
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
const fs = require('fs');

// Load environment variables manually
let supabaseUrl = null;
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const envLines = envContent.split('\n');
  envLines.forEach(line => {
    const [key, ...value] = line.split('=');
    if (key === 'SUPABASE_URL') {
      supabaseUrl = value.join('=').trim();
    }
  });
} catch (error) {
  console.log('❌ Error reading .env file');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚨 SECURITY WARNING 🚨');
console.log('This script requires your SUPABASE SERVICE ROLE KEY');
console.log('⚠️  NEVER share this key with anyone!');
console.log('⚠️  This key has FULL ACCESS to your database');
console.log('⚠️  Only use this for setup, then delete the key\n');

rl.question('Do you want to continue? (yes/no): ', (answer) => {
  if (!['yes', 'y'].includes(answer.toLowerCase())) {
    console.log('Operation cancelled.');
    rl.close();
    return;
  }

  rl.question('Enter your SUPABASE SERVICE ROLE KEY: ', (serviceKey) => {
    if (!serviceKey || serviceKey.length < 100) {
      console.log('❌ Invalid service key format');
      rl.close();
      return;
    }

    createBuckets(serviceKey);
    rl.close();
  });
});

async function createBuckets(serviceKey) {
  if (!supabaseUrl) {
    console.log('❌ Missing SUPABASE_URL in .env file');
    return;
  }

  // Create Supabase client with SERVICE ROLE KEY
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const buckets = [
    {
      name: 'avatars',
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 5 * 1024 * 1024 // 5MB
    },
    {
      name: 'photos',
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 5 * 1024 * 1024 // 5MB
    },
    {
      name: 'videos',
      public: true,
      allowedMimeTypes: ['video/*'],
      fileSizeLimit: 50 * 1024 * 1024 // 50MB
    },
    {
      name: 'voice-messages',
      public: false,
      allowedMimeTypes: ['audio/*'],
      fileSizeLimit: 10 * 1024 * 1024 // 10MB
    },
    {
      name: 'video-messages',
      public: false,
      allowedMimeTypes: ['video/*'],
      fileSizeLimit: 50 * 1024 * 1024 // 50MB
    }
  ];

  console.log('\n🚀 Creating storage buckets...\n');

  for (const bucket of buckets) {
    try {
      console.log(`📦 Creating bucket: ${bucket.name} (${bucket.public ? 'public' : 'private'})`);

      // Check if bucket exists
      const { data: existingBuckets } = await supabase.storage.listBuckets();
      const exists = existingBuckets.some(b => b.name === bucket.name);

      if (exists) {
        console.log(`✅ Bucket '${bucket.name}' already exists`);
        continue;
      }

      // Create bucket with proper configuration
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        allowedMimeTypes: bucket.allowedMimeTypes,
        fileSizeLimit: bucket.fileSizeLimit
      });

      if (error) {
        console.log(`❌ Failed to create '${bucket.name}': ${error.message}`);
      } else {
        console.log(`✅ Successfully created '${bucket.name}'`);
      }

    } catch (error) {
      console.log(`❌ Error creating '${bucket.name}': ${error.message}`);
    }
  }

  console.log('\n🔍 Verifying...\n');

  // Final verification
  try {
    const { data: allBuckets } = await supabase.storage.listBuckets();
    console.log('📋 All buckets:');
    allBuckets.forEach(bucket => {
      console.log(`  ✅ ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    const requiredBuckets = buckets.map(b => b.name);
    const existingBuckets = allBuckets.map(b => b.name);
    const missingBuckets = requiredBuckets.filter(b => !existingBuckets.includes(b));

    if (missingBuckets.length === 0) {
      console.log('\n🎉 SUCCESS! All storage buckets created successfully!');
      console.log('🚀 Your dating app is now FULLY FUNCTIONAL!');
    } else {
      console.log(`\n❌ Missing buckets: ${missingBuckets.join(', ')}`);
    }

  } catch (error) {
    console.log(`❌ Verification error: ${error.message}`);
  }
}
