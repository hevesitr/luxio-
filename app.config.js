require('dotenv').config();

// ❌ KRITIKUS BIZTONSÁGI PROBLÉMA JAVÍTVA:
// Eltávolítottuk az összes hardcoded Supabase kulcsot!
// Most csak környezeti változók használhatók.

// ✅ BIZTONSÁGI MEGOLDÁS: Csak környezeti változók használhatók
const {
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_SUPABASE_PROJECT_ID,
  SUPABASE_REDIRECT_URL
} = process.env;

// 🔒 BIZTONSÁGI ELLENŐRZÉS: Kritikus hitelesítő adatok
if (!EXPO_PUBLIC_SUPABASE_URL || !EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error(
    '🚨 KRITIKUS BIZTONSÁGI HIBA: Hiányoznak a Supabase környezeti változók!\n' +
    'A hardcoded kulcsok eltávolításra kerültek a biztonság érdekében.\n' +
    'Kérlek állítsd be:\n' +
    '- EXPO_PUBLIC_SUPABASE_URL\n' +
    '- EXPO_PUBLIC_SUPABASE_ANON_KEY\n\n' +
    'Használd az env.example fájlt sablonként.'
  );
}

module.exports = {
  expo: {
    name: 'NexusLink',
    slug: 'nexuslink-dating',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      backgroundColor: '#0F0F23',
      resizeMode: 'contain'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      bundleIdentifier: 'com.nexuslink.dating',
      buildNumber: '1',
      supportsTablet: false,
      infoPlist: {
        NSCameraUsageDescription: 'We need camera access for profile photos and videos',
        NSPhotoLibraryUsageDescription: 'We need photo library access to upload profile pictures',
        NSLocationWhenInUseUsageDescription: 'We use your location to show nearby matches'
      }
    },
    android: {
      package: 'com.nexuslink.dating',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0F0F23'
      },
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION'
      ]
    },
    web: {
      bundler: 'metro'
    },
    plugins: [
      'expo-font',
      'expo-location',
      'expo-secure-store'
    ],
    extra: {
      SUPABASE_URL: EXPO_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: EXPO_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_PROJECT_ID: EXPO_PUBLIC_SUPABASE_PROJECT_ID,
      SUPABASE_REDIRECT_URL,
      // Rate limiting configuration
      DISABLE_RATE_LIMITS: process.env.EXPO_PUBLIC_DISABLE_RATE_LIMITS || false,
      eas: {
        projectId: 'your-project-id' // Ezt később frissítheted
      }
    },
  }
};

