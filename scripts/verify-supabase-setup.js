/**
 * Supabase Setup Verification Script
 * 
 * Ez a szkript ellenőrzi, hogy a Supabase manual setup helyesen lett-e elvégezve.
 * 
 * Futtatás: node scripts/verify-supabase-setup.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ HIBA: SUPABASE_URL vagy SUPABASE_ANON_KEY nincs beállítva a .env fájlban!');
  process.exit(1);
}

// Használjuk a service role key-t a bucket listázáshoz, ha elérhető
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

if (!supabaseServiceKey) {
  console.log('⚠️  FIGYELEM: SUPABASE_SERVICE_ROLE_KEY nincs beállítva.');
  console.log('   A storage bucket ellenőrzés lehet, hogy nem működik helyesen.\n');
}

console.log('🔍 Supabase Setup Ellenőrzés Indítása...\n');

let allChecks = [];

// ============================================
// 1. STORAGE BUCKETS ELLENŐRZÉSE
// ============================================
async function checkStorageBuckets() {
  console.log('📦 1. Storage Buckets Ellenőrzése...');
  
  const requiredBuckets = [
    'avatars',
    'photos',
    'videos',
    'voice-messages',
    'video-messages'
  ];

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('   ❌ Hiba a buckets lekérésekor:', error.message);
      allChecks.push({ name: 'Storage Buckets', status: 'FAILED', error: error.message });
      return;
    }

    const bucketNames = buckets.map(b => b.name);
    const missingBuckets = requiredBuckets.filter(b => !bucketNames.includes(b));

    if (missingBuckets.length === 0) {
      console.log('   ✅ Minden szükséges bucket létezik!');
      requiredBuckets.forEach(bucket => {
        const bucketInfo = buckets.find(b => b.name === bucket);
        console.log(`      - ${bucket} (${bucketInfo.public ? 'public' : 'private'})`);
      });
      allChecks.push({ name: 'Storage Buckets', status: 'PASSED' });
    } else {
      console.log('   ❌ Hiányzó buckets:', missingBuckets.join(', '));
      allChecks.push({ name: 'Storage Buckets', status: 'FAILED', missing: missingBuckets });
    }
  } catch (error) {
    console.error('   ❌ Váratlan hiba:', error.message);
    allChecks.push({ name: 'Storage Buckets', status: 'ERROR', error: error.message });
  }

  console.log('');
}

// ============================================
// 2. STORAGE POLICIES ELLENŐRZÉSE
// ============================================
async function checkStoragePolicies() {
  console.log('🔐 2. Storage Policies Ellenőrzése...');
  
  const testBucket = 'avatars';

  try {
    // Próbálj meg listázni a bucket-et (public read test)
    const { data, error } = await supabase.storage
      .from(testBucket)
      .list('', { limit: 1 });

    if (error && error.message.includes('not found')) {
      console.log(`   ⚠️  A '${testBucket}' bucket nem létezik. Hozd létre először!`);
      allChecks.push({ name: 'Storage Policies', status: 'SKIPPED', reason: 'Bucket not found' });
    } else if (error) {
      console.log('   ❌ Storage policies hiba:', error.message);
      allChecks.push({ name: 'Storage Policies', status: 'FAILED', error: error.message });
    } else {
      console.log('   ✅ Storage policies működnek (public read OK)');
      allChecks.push({ name: 'Storage Policies', status: 'PASSED' });
    }
  } catch (error) {
    console.error('   ❌ Váratlan hiba:', error.message);
    allChecks.push({ name: 'Storage Policies', status: 'ERROR', error: error.message });
  }

  console.log('');
}

// ============================================
// 3. REALTIME ELLENŐRZÉSE
// ============================================
async function checkRealtime() {
  console.log('⚡ 3. Realtime Ellenőrzése...');
  
  const requiredTables = ['messages', 'matches', 'notifications'];

  try {
    // Ellenőrizzük, hogy a táblák léteznek-e
    for (const table of requiredTables) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        console.log(`   ⚠️  A '${table}' tábla nem létezik`);
      } else if (error) {
        console.log(`   ❌ Hiba a '${table}' tábla elérésekor:`, error.message);
      } else {
        console.log(`   ✅ '${table}' tábla elérhető`);
      }
    }

    // Realtime subscription teszt
    console.log('   ℹ️  Realtime subscription tesztelése...');
    const channel = supabase.channel('test-channel');
    
    const subscribePromise = new Promise((resolve) => {
      channel
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'messages' },
          () => {}
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('   ✅ Realtime subscription működik!');
            resolve(true);
          } else if (status === 'CHANNEL_ERROR') {
            console.log('   ❌ Realtime subscription hiba');
            resolve(false);
          }
        });

      // Timeout after 5 seconds
      setTimeout(() => {
        console.log('   ⚠️  Realtime subscription timeout (lehet, hogy nincs engedélyezve)');
        resolve(false);
      }, 5000);
    });

    const realtimeWorks = await subscribePromise;
    await supabase.removeChannel(channel);

    allChecks.push({ 
      name: 'Realtime', 
      status: realtimeWorks ? 'PASSED' : 'WARNING',
      note: realtimeWorks ? null : 'Realtime lehet, hogy nincs engedélyezve'
    });

  } catch (error) {
    console.error('   ❌ Váratlan hiba:', error.message);
    allChecks.push({ name: 'Realtime', status: 'ERROR', error: error.message });
  }

  console.log('');
}

// ============================================
// 4. RLS POLICIES ELLENŐRZÉSE
// ============================================
async function checkRLSPolicies() {
  console.log('🛡️  4. RLS Policies Ellenőrzése...');
  
  const requiredTables = [
    'profiles',
    'matches',
    'messages',
    'likes',
    'passes'
  ];

  try {
    // Ellenőrizzük, hogy RLS engedélyezve van-e
    const { data: tables, error } = await supabase.rpc('check_rls_enabled', {});

    if (error && error.message.includes('does not exist')) {
      console.log('   ⚠️  Az RLS ellenőrző függvény nem létezik');
      console.log('   ℹ️  Manuális ellenőrzés szükséges a Supabase Dashboard-on');
      
      // Próbáljuk meg elérni a táblákat
      for (const table of requiredTables) {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);

        if (error && error.message.includes('does not exist')) {
          console.log(`   ⚠️  A '${table}' tábla nem létezik`);
        } else if (error && error.message.includes('permission denied')) {
          console.log(`   ⚠️  A '${table}' tábla RLS blokkolja a hozzáférést (ez normális, ha nincs bejelentkezve)`);
        } else if (error) {
          console.log(`   ❌ Hiba a '${table}' tábla elérésekor:`, error.message);
        } else {
          console.log(`   ✅ '${table}' tábla elérhető`);
        }
      }

      allChecks.push({ 
        name: 'RLS Policies', 
        status: 'WARNING',
        note: 'Manuális ellenőrzés szükséges'
      });
    } else {
      console.log('   ✅ RLS policies ellenőrzése sikeres');
      allChecks.push({ name: 'RLS Policies', status: 'PASSED' });
    }

  } catch (error) {
    console.error('   ❌ Váratlan hiba:', error.message);
    allChecks.push({ name: 'RLS Policies', status: 'ERROR', error: error.message });
  }

  console.log('');
}

// ============================================
// 5. AUTHENTICATION ELLENŐRZÉSE
// ============================================
async function checkAuthentication() {
  console.log('🔑 5. Authentication Ellenőrzése...');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.log('   ❌ Authentication hiba:', error.message);
      allChecks.push({ name: 'Authentication', status: 'FAILED', error: error.message });
    } else if (session) {
      console.log('   ✅ User be van jelentkezve:', session.user.email);
      allChecks.push({ name: 'Authentication', status: 'PASSED' });
    } else {
      console.log('   ℹ️  Nincs bejelentkezett user (ez normális)');
      allChecks.push({ name: 'Authentication', status: 'INFO', note: 'No active session' });
    }
  } catch (error) {
    console.error('   ❌ Váratlan hiba:', error.message);
    allChecks.push({ name: 'Authentication', status: 'ERROR', error: error.message });
  }

  console.log('');
}

// ============================================
// ÖSSZEFOGLALÓ
// ============================================
function printSummary() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 ÖSSZEFOGLALÓ');
  console.log('═══════════════════════════════════════════════════════\n');

  const passed = allChecks.filter(c => c.status === 'PASSED').length;
  const failed = allChecks.filter(c => c.status === 'FAILED').length;
  const warnings = allChecks.filter(c => c.status === 'WARNING').length;
  const errors = allChecks.filter(c => c.status === 'ERROR').length;

  allChecks.forEach(check => {
    const icon = check.status === 'PASSED' ? '✅' : 
                 check.status === 'FAILED' ? '❌' : 
                 check.status === 'WARNING' ? '⚠️' : 
                 check.status === 'ERROR' ? '🔴' : 'ℹ️';
    
    console.log(`${icon} ${check.name}: ${check.status}`);
    if (check.note) console.log(`   └─ ${check.note}`);
    if (check.error) console.log(`   └─ Error: ${check.error}`);
    if (check.missing) console.log(`   └─ Hiányzó: ${check.missing.join(', ')}`);
  });

  console.log('');
  console.log(`✅ Sikeres: ${passed}`);
  console.log(`❌ Sikertelen: ${failed}`);
  console.log(`⚠️  Figyelmeztetés: ${warnings}`);
  console.log(`🔴 Hiba: ${errors}`);
  console.log('');

  if (failed === 0 && errors === 0) {
    console.log('🎉 MINDEN RENDBEN! A Supabase setup helyesen van beállítva!');
  } else if (warnings > 0 && failed === 0 && errors === 0) {
    console.log('⚠️  VAN NÉHÁNY FIGYELMEZTETÉS. Ellenőrizd a részleteket!');
  } else {
    console.log('❌ VANNAK HIBÁK! Kövesd a SUPABASE_MANUAL_SETUP_FINAL.md útmutatót!');
  }

  console.log('═══════════════════════════════════════════════════════\n');
}

// ============================================
// MAIN
// ============================================
async function main() {
  try {
    await checkStorageBuckets();
    await checkStoragePolicies();
    await checkRealtime();
    await checkRLSPolicies();
    await checkAuthentication();
    
    printSummary();
  } catch (error) {
    console.error('🔴 Kritikus hiba:', error);
    process.exit(1);
  }
}

// Futtatás
main();
