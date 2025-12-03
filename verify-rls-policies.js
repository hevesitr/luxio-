// Verify RLS Policies
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyRLSPolicies() {
  console.log('🔒 Verifying RLS Policies...\n');

  // Test 1: Try to read profiles without auth (should fail or return empty)
  console.log('Test 1: Reading profiles without authentication...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);

  if (profilesError) {
    console.log('✅ RLS is working - profiles query blocked:', profilesError.message);
  } else if (profiles && profiles.length === 0) {
    console.log('✅ RLS is working - no profiles returned without auth');
  } else {
    console.log('⚠️  RLS might not be fully enabled - profiles returned:', profiles?.length);
  }

  // Test 2: Try to read matches without auth
  console.log('\nTest 2: Reading matches without authentication...');
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .limit(5);

  if (matchesError) {
    console.log('✅ RLS is working - matches query blocked:', matchesError.message);
  } else if (matches && matches.length === 0) {
    console.log('✅ RLS is working - no matches returned without auth');
  } else {
    console.log('⚠️  RLS might not be fully enabled - matches returned:', matches?.length);
  }

  // Test 3: Try to read messages without auth
  console.log('\nTest 3: Reading messages without authentication...');
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .limit(5);

  if (messagesError) {
    console.log('✅ RLS is working - messages query blocked:', messagesError.message);
  } else if (messages && messages.length === 0) {
    console.log('✅ RLS is working - no messages returned without auth');
  } else {
    console.log('⚠️  RLS might not be fully enabled - messages returned:', messages?.length);
  }

  // Test 4: Try to insert without auth (should fail)
  console.log('\nTest 4: Trying to insert profile without authentication...');
  const { data: insertData, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: 'test-user-id',
      first_name: 'Test',
      age: 25,
      gender: 'male',
    });

  if (insertError) {
    console.log('✅ RLS is working - insert blocked:', insertError.message);
  } else {
    console.log('⚠️  RLS might not be fully enabled - insert succeeded');
  }

  console.log('\n✅ RLS verification completed!');
}

verifyRLSPolicies();
