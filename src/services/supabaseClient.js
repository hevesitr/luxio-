import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

// ❌ KRITIKUS BIZTONSÁGI PROBLÉMA JAVÍTVA:
// Eltávolítottuk a hardcoded Supabase kulcsokat!
// Most csak környezeti változók használhatók.

// Környezeti változók kinyerése
const extra = Constants?.expoConfig?.extra || Constants?.manifest?.extra || {};

// ✅ BIZTONSÁGOS MEGOLDÁS: Csak környezeti változók használhatók
// Nincs fallback default érték többé!
const SUPABASE_URL = extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// 🔒 BIZTONSÁGI ELLENŐRZÉS: Kritikus hitelesítő adatok
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const errorMsg = '🚨 KRITIKUS BIZTONSÁGI HIBA: Hiányoznak a Supabase hitelesítő adatok!\n' +
    'A hardcoded kulcsok eltávolításra kerültek a biztonság érdekében.\n' +
    'Kérlek állítsd be a következő környezeti változókat:\n' +
    '- EXPO_PUBLIC_SUPABASE_URL\n' +
    '- EXPO_PUBLIC_SUPABASE_ANON_KEY\n\n' +
    'Használd az env.example fájlt sablonként.';

  console.error(errorMsg);
  throw new Error('Supabase credentials missing. Check environment variables.');
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
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-application-name': 'lovex-dating-app',
        'x-client-version': '1.0.0',
      },
    },
    db: {
      schema: 'public',
    },
    // Connection pool és networking optimalizációk
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    // HTTP kliens konfiguráció
    fetch: (url, options = {}) => {
      // Timeout beállítása (30 másodperc)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    },
  });

  console.log('✅ Supabase kliens sikeresen létrehozva optimalizált konfigurációval');
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

