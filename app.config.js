require('dotenv').config();

// Alapértelmezett értékek
const DEFAULT_SUPABASE_URL = 'https://xgvubkbfhleeagdvkhds.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndnVia2JmaGxlZWFnZHZraGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDAyNjcsImV4cCI6MjA3OTU3NjI2N30.AjaIcxqS73kUDDOWTwHofp2XcxnGbRIVGXLaI6Sdboc';

// Környezeti változók betöltése
const {
  EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY,
  EXPO_PUBLIC_SUPABASE_PROJECT_ID = process.env.EXPO_PUBLIC_SUPABASE_PROJECT_ID || 'xgvubkbfhleeagdvkhds',
  SUPABASE_REDIRECT_URL = process.env.SUPABASE_REDIRECT_URL || 'https://hevesitr.github.io/lovex-/'
} = process.env;

module.exports = {
  expo: {
    name: 'LoveX',
    slug: 'lovex-dating',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      backgroundColor: '#FF3B75',
      resizeMode: 'contain'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      bundleIdentifier: 'com.lovex.dating',
      buildNumber: '1',
      supportsTablet: false,
      infoPlist: {
        NSCameraUsageDescription: 'We need camera access for profile photos and videos',
        NSPhotoLibraryUsageDescription: 'We need photo library access to upload profile pictures',
        NSLocationWhenInUseUsageDescription: 'We use your location to show nearby matches'
      }
    },
    android: {
      package: 'com.lovex.dating',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FF3B75'
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
      'expo-location'
    ],
    extra: {
      SUPABASE_URL: EXPO_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: EXPO_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_PROJECT_ID: EXPO_PUBLIC_SUPABASE_PROJECT_ID,
      SUPABASE_REDIRECT_URL,
      eas: {
        projectId: 'your-project-id' // Ezt később frissítheted
      }
    },
  }
};

