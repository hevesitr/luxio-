import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

// Manuálisan beállított értékek, ha a környezeti változók nem érhetők el
const DEFAULT_SUPABASE_URL = 'https://xgvubkbfhleeagdvkhds.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndnVia2JmaGxlZWFnZHZraGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDAyNjcsImV4cCI6MjA3OTU3NjI2N30.AjaIcxqS73kUDDOWTwHofp2XcxnGbRIVGXLaI6Sdboc';

// Környezeti változók kinyerése
const extra = Constants?.expoConfig?.extra || Constants?.manifest?.extra || {};

// Végleges értékek meghatározása
const SUPABASE_URL = extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Ellenőrzés a konzolban
console.log('Supabase URL:', SUPABASE_URL ? '✅ Beállítva' : '❌ Hiányzik');
console.log('Supabase Anon Key:', SUPABASE_ANON_KEY ? '✅ Beállítva' : '❌ Hiányzik');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '❌ Figyelmeztetés: Hiányoznak a Supabase hitelesítő adatok! ' +
    'Kérlek ellenőrizd a környezeti változókat.'
  );
}

// Supabase kliens létrehozása
let supabase;

try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  
  console.log('✅ Supabase kliens sikeresen létrehozva');
} catch (error) {
  console.error('❌ Hiba a Supabase kliens létrehozásakor:', error.message);
  // Hibás állapotú kliens létrehozása, hogy ne álljon le az alkalmazás
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export { supabase };

