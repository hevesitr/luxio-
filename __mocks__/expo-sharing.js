/**
 * Mock for expo-sharing
 */

export async function isAvailableAsync() {
  return true;
}

export async function shareAsync(url, options = {}) {
  return;
}

export default {
  isAvailableAsync,
  shareAsync,
};
