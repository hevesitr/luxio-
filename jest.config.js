module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@supabase|expo-location|expo-file-system|expo-image-manipulator|@expo/vector-icons|expo-linear-gradient|expo-haptics|expo-blur|expo-camera|expo-constants|expo-device|expo-font|expo-image|expo-image-picker|expo-linking|expo-local-authentication|expo-sqlite|expo-status-bar|react-native-safe-area-context|react-native-screens|@react-navigation)/)',
  ],
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.properties.test.js',
    '**/__tests__/properties/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  testTimeout: 15000, // Increased for property tests
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/**/__tests__/**',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^expo-location$': '<rootDir>/__mocks__/expo-location.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/@react-native-async-storage/async-storage.js',
    '^expo-notifications$': '<rootDir>/__mocks__/expo-notifications.js',
    '^expo-device$': '<rootDir>/__mocks__/expo-device.js',
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.js',
    '^expo-sqlite$': '<rootDir>/__mocks__/expo-sqlite.js',
    '^expo-av$': '<rootDir>/__mocks__/expo-av.js',
    '^@expo/vector-icons$': '<rootDir>/__mocks__/@expo/vector-icons.js',
  },
};
