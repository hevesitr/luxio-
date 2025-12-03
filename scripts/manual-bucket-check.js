/**
 * Manuális Bucket Ellenőrző
 * Próbálja meg feltölteni egy teszt fájlt minden bucket-be
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

async function checkBuckets() {
  log('\n🔍 Manuális Bucket Ellenőrzés\n', 'cyan');
  log('═'.repeat(50), 'cyan');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const buckets = ['avatars', 'photos', 'videos', 'voice-messages', 'video-messages'];

  log('\n📦 Bucket-ek ellenőrzése...\n', 'cyan');

  for (const bucket of buckets) {
    try {
      // Próbáljuk meg listázni a bucket tartalmát
      const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });
      
      if (error) {
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          log(`❌ ${bucket}: NEM LÉTEZIK`, 'red');
        } else if (error.message.includes('permission') || error.message.includes('authorized')) {
          log(`✅ ${bucket}: LÉTEZIK (nincs listázási jog, de ez OK)`, 'green');
        } else {
          log(`⚠️  ${bucket}: ${error.message}`, 'yellow');
        }
      } else {
        log(`✅ ${bucket}: LÉTEZIK és elérhető`, 'green');
      }
    } catch (err) {
      log(`❌ ${bucket}: Hiba - ${err.message}`, 'red');
    }
  }

  log('\n' + '═'.repeat(50), 'cyan');
  log('\n💡 Tipp:', 'cyan');
  log('Ha minden bucket ✅, akkor minden rendben!', 'green');
  log('Ha ❌ látod, hozd létre a Supabase Dashboard → Storage menüben.\n', 'yellow');
}

checkBuckets().catch(err => {
  console.error('Hiba:', err);
  process.exit(1);
});
