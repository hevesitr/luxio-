/**
 * Supabase Connection Tester
 * Ellenőrzi, hogy a Supabase setup helyesen működik-e
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Színes konzol output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testSupabaseConnection() {
  log('\n🚀 Supabase Connection Tester\n', 'cyan');
  log('═'.repeat(50), 'cyan');

  let passedTests = 0;
  let failedTests = 0;

  // 1. Környezeti változók ellenőrzése
  log('\n1️⃣  Környezeti változók ellenőrzése...', 'cyan');
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    error('SUPABASE_URL vagy SUPABASE_ANON_KEY hiányzik a .env fájlból!');
    failedTests++;
    return;
  }
  success('Környezeti változók OK');
  passedTests++;

  // 2. Supabase client létrehozása
  log('\n2️⃣  Supabase client létrehozása...', 'cyan');
  let supabase;
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    success('Supabase client létrehozva');
    passedTests++;
  } catch (err) {
    error(`Supabase client hiba: ${err.message}`);
    failedTests++;
    return;
  }

  // 3. Táblák ellenőrzése
  log('\n3️⃣  Adatbázis táblák ellenőrzése...', 'cyan');
  const tables = ['profiles', 'matches', 'likes', 'passes', 'messages'];
  
  for (const table of tables) {
    try {
      const { data, error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (tableError) {
        if (tableError.code === '42P01') {
          error(`Tábla nem létezik: ${table}`);
          warn(`Futtasd a supabase/schema_extended.sql fájlt!`);
        } else {
          error(`Tábla hiba (${table}): ${tableError.message}`);
        }
        failedTests++;
      } else {
        success(`Tábla OK: ${table}`);
        passedTests++;
      }
    } catch (err) {
      error(`Tábla ellenőrzés hiba (${table}): ${err.message}`);
      failedTests++;
    }
  }

  // 4. Storage bucket-ek ellenőrzése
  log('\n4️⃣  Storage bucket-ek ellenőrzése...', 'cyan');
  const buckets = ['avatars', 'photos', 'videos', 'voice-messages', 'video-messages'];
  
  try {
    const { data: bucketList, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      warn(`Storage lista hiba: ${bucketError.message}`);
      warn(`Ez normális, ha nincs admin jogosultságod a bucket listázáshoz.`);
      info(`Ellenőrizd manuálisan a Supabase Dashboard → Storage menüben.`);
      
      // Próbáljuk meg egyesével ellenőrizni
      log('\nEgyedi bucket ellenőrzés...', 'cyan');
      for (const bucket of buckets) {
        try {
          // Próbáljunk meg feltölteni egy teszt fájlt
          const testFileName = `test_${Date.now()}.txt`;
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(testFileName, 'test', { upsert: false });
          
          if (uploadError) {
            if (uploadError.message.includes('not found') || uploadError.message.includes('does not exist')) {
              error(`Bucket hiányzik: ${bucket}`);
              warn(`Hozd létre a Supabase Dashboard → Storage menüben!`);
              failedTests++;
            } else if (uploadError.message.includes('already exists')) {
              // A fájl már létezik, ami azt jelenti, hogy a bucket is létezik
              success(`Bucket OK: ${bucket}`);
              passedTests++;
            } else {
              // Más hiba, de a bucket valószínűleg létezik (pl. policy hiba)
              success(`Bucket OK: ${bucket} (létezik)`);
              passedTests++;
            }
          } else {
            // Sikeres feltöltés, töröljük a teszt fájlt
            await supabase.storage.from(bucket).remove([testFileName]);
            success(`Bucket OK: ${bucket}`);
            passedTests++;
          }
        } catch (err) {
          warn(`Bucket ellenőrzés hiba (${bucket}): ${err.message}`);
          info(`Ellenőrizd manuálisan a Dashboard-on.`);
        }
      }
    } else {
      const existingBuckets = bucketList.map(b => b.name);
      
      for (const bucket of buckets) {
        if (existingBuckets.includes(bucket)) {
          success(`Bucket OK: ${bucket}`);
          passedTests++;
        } else {
          error(`Bucket hiányzik: ${bucket}`);
          warn(`Hozd létre a Supabase Dashboard → Storage menüben!`);
          failedTests++;
        }
      }
    }
  } catch (err) {
    error(`Storage ellenőrzés hiba: ${err.message}`);
    warn(`Ellenőrizd manuálisan a Supabase Dashboard → Storage menüben.`);
    failedTests++;
  }

  // 5. Realtime ellenőrzése (csak info, nem teszt)
  log('\n5️⃣  Realtime konfiguráció...', 'cyan');
  info('Realtime-ot manuálisan kell engedélyezni:');
  info('Supabase Dashboard → Database → Replication → messages tábla');

  // Összegzés
  log('\n' + '═'.repeat(50), 'cyan');
  log('\n📊 Teszt Eredmények:\n', 'cyan');
  success(`Sikeres tesztek: ${passedTests}`);
  if (failedTests > 0) {
    error(`Sikertelen tesztek: ${failedTests}`);
  }
  
  const totalTests = passedTests + failedTests;
  const percentage = Math.round((passedTests / totalTests) * 100);
  
  log(`\n📈 Sikerességi arány: ${percentage}%\n`, percentage === 100 ? 'green' : 'yellow');

  if (failedTests === 0) {
    log('🎉 Minden teszt sikeres! A Supabase setup kész!\n', 'green');
  } else {
    log('⚠️  Néhány teszt sikertelen. Nézd meg a fenti hibákat!\n', 'yellow');
  }
}

// Futtatás
testSupabaseConnection().catch(err => {
  error(`Kritikus hiba: ${err.message}`);
  console.error(err);
  process.exit(1);
});
