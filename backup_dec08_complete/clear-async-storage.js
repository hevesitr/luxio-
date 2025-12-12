/**
 * Clear AsyncStorage Script
 * Run this in the Expo app to clear all cached data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const clearAsyncStorage = async () => {
  try {
    console.log('Clearing AsyncStorage...');
    await AsyncStorage.clear();
    console.log('✅ AsyncStorage cleared successfully!');
    console.log('Please restart the app.');
  } catch (error) {
    console.error('❌ Error clearing AsyncStorage:', error);
  }
};

clearAsyncStorage();

export default clearAsyncStorage;
