/**
 * Storage Bucket létrehozó script
 * Ez a script létrehozza az összes szükséges storage bucket-et a Supabase-ben
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Hiányzó környezeti változók!');
  console.error('Ellenőrizd, hogy a .env fájlban szerepel-e a SUPABASE_URL és SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BUCKETS = [
  { name: 'avatars', public: true },
  { name: 'photos', public: true },
  { name: 'videos', public: true },
  { name: 'voice-messages', public: false },
  { name: 'video-messages', public: false },
];

async function createBuckets() {
  console.log('🚀 Storage Bucket létrehozás\n');
  console.log('══════════════════════════════════════════════════\n');

  for (const bucket of BUCKETS) {
    try {
      console.log(`📦 Bucket létrehozása: ${bucket.name}...`);
      
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: 52428800, // 50MB
      });

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`✅ Bucket már létezik: ${bucket.name}`);
        } else {
          console.error(`❌ Hiba: ${error.message}`);
        }
      } else {
        console.log(`✅ Bucket létrehozva: ${bucket.name} (public: ${bucket.public})`);
      }
    } catch (err) {
      console.error(`❌ Váratlan hiba: ${err.message}`);
    }
    console.log('');
  }

  console.log('══════════════════════════════════════════════════\n');
  console.log('✅ Storage bucket létrehozás kész!\n');
  console.log('ℹ️  Megjegyzés: Ha "insufficient_privilege" hibát kapsz,');
  console.log('   akkor a bucket-eket manuálisan kell létrehozni a');
  console.log('   Supabase Dashboard → Storage menüben.\n');
}

createBuckets();
