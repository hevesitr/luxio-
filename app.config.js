require('dotenv').config();

const {
  SUPABASE_URL = '',
  SUPABASE_ANON_KEY = '',
  SUPABASE_REDIRECT_URL = 'https://hevesitr.github.io/lovex-/',
} = process.env;

module.exports = {
  expo: {
    name: 'Lovex',
    slug: 'lovex-app',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    splash: {
      backgroundColor: '#FF3B75',
      resizeMode: 'contain'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.lovexapp'
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#FF3B75'
      },
      package: 'com.lovexapp'
    },
    web: {
      bundler: 'metro'
    },
    plugins: [
      'expo-font'
    ],
    extra: {
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      SUPABASE_REDIRECT_URL,
    },
  }
};

