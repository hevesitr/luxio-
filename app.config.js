module.exports = {
  expo: {
    name: 'Luxio',
    slug: 'dating-app',
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
      bundleIdentifier: 'com.datingapp'
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#FF3B75'
      },
      package: 'com.datingapp'
    },
    web: {
      bundler: 'metro'
    },
    plugins: [
      'expo-font'
    ]
  }
};

