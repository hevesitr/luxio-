// Check Database Status
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabaseStatus() {
  console.log('🔍 Checking Database Status...\n');

  const tables = ['profiles', 'matches', 'messages', 'likes', 'passes', 'reports', 'blocks'];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Table exists (${count || 0} rows)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  console.log('\n🔒 Checking RLS Status...');
  
  // Try to query without auth (should fail if RLS is enabled)
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.log('✅ RLS is enabled (query blocked):', error.message);
    } else if (data && data.length === 0) {
      console.log('✅ RLS is enabled (no data returned)');
    } else {
      console.log('⚠️  RLS might not be enabled (data returned without auth)');
    }
  } catch (err) {
    console.log('✅ RLS is enabled (query blocked)');
  }

  console.log('\n✅ Database status check completed!');
}

checkDatabaseStatus();
