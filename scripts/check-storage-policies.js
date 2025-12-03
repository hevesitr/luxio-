/**
 * Storage Policies Ellenőrző
 * Ellenőrzi, hogy a storage policies be vannak-e állítva
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkPolicies() {
  log('\n🔒 Storage Policies Ellenőrzés\n', 'cyan');
  log('═'.repeat(50), 'cyan');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const buckets = ['avatars', 'photos', 'videos', 'voice-messages', 'video-messages'];

  log('\n📋 Policies ellenőrzése...\n', 'cyan');

  for (const bucket of buckets) {
    try {
      // Próbáljuk meg feltölteni egy teszt fájlt
      const testFileName = `test_${Date.now()}.txt`;
      const testContent = 'Test file for policy check';
      
      log(`\n📦 ${bucket}:`, 'cyan');
      
      // Próbáljuk meg feltölteni
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(testFileName, testContent, {
          contentType: 'text/plain',
          upsert: false,
        });

      if (uploadError) {
        if (uploadError.message.includes('policy')) {
          log(`  ❌ Nincs INSERT policy`, 'red');
        } else if (uploadError.message.includes('not found')) {
          log(`  ❌ Bucket nem létezik`, 'red');
        } else {
          log(`  ⚠️  Feltöltési hiba: ${uploadError.message}`, 'yellow');
        }
      } else {
        log(`  ✅ INSERT policy OK`, 'green');
        
        // Próbáljuk meg letölteni
        const { data: downloadData, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(testFileName);

        if (downloadError) {
          if (downloadError.message.includes('policy')) {
            log(`  ❌ Nincs SELECT policy`, 'red');
          } else {
            log(`  ⚠️  Letöltési hiba: ${downloadError.message}`, 'yellow');
          }
        } else {
          log(`  ✅ SELECT policy OK`, 'green');
        }

        // Próbáljuk meg törölni
        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove([testFileName]);

        if (deleteError) {
          if (deleteError.message.includes('policy')) {
            log(`  ❌ Nincs DELETE policy`, 'red');
          } else {
            log(`  ⚠️  Törlési hiba: ${deleteError.message}`, 'yellow');
          }
        } else {
          log(`  ✅ DELETE policy OK`, 'green');
        }
      }
    } catch (err) {
      log(`  ❌ Hiba: ${err.message}`, 'red');
    }
  }

  log('\n═'.repeat(50), 'cyan');
  log('\n💡 Következtetés:\n', 'cyan');
  log('Ha minden policy ✅, akkor minden rendben!', 'green');
  log('Ha ❌ látod, futtasd le a supabase/storage-policies.sql scriptet.', 'yellow');
  log('\n');
}

checkPolicies();
