// Test Supabase Connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('URL:', SUPABASE_URL);
console.log('Key:', SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    // Test 1: Check connection
    console.log('\n📡 Test 1: Checking connection...');
    const { data, error } = await supabase.from('profiles').select('count');
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
    } else {
      console.log('✅ Connection successful!');
    }

    // Test 2: List tables
    console.log('\n📋 Test 2: Listing tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (tablesError) {
      console.log('❌ Cannot query profiles table:', tablesError.message);
    } else {
      console.log('✅ Profiles table accessible!');
    }

    // Test 3: Check RLS
    console.log('\n🔒 Test 3: Checking RLS status...');
    const { data: rlsData, error: rlsError } = await supabase.rpc('check_rls_enabled');
    
    if (rlsError) {
      console.log('⚠️  Cannot check RLS (function might not exist)');
    } else {
      console.log('✅ RLS check completed');
    }

    console.log('\n✅ All tests completed!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testConnection();
