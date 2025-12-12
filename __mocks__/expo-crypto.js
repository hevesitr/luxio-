/**
 * Mock for expo-crypto
 */

export const CryptoDigestAlgorithm = {
  SHA1: 'SHA-1',
  SHA256: 'SHA-256',
  SHA384: 'SHA-384',
  SHA512: 'SHA-512',
  MD5: 'MD5',
};

export const CryptoEncoding = {
  HEX: 'hex',
  BASE64: 'base64',
};

export async function digestStringAsync(algorithm, data, options = {}) {
  // Mock implementation - return a fake hash
  return 'mocked-hash-' + algorithm + '-' + data.substring(0, 10);
}

export async function getRandomBytesAsync(byteCount) {
  // Mock implementation - return fake random bytes
  const bytes = new Uint8Array(byteCount);
  for (let i = 0; i < byteCount; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

export function getRandomBytes(byteCount) {
  // Synchronous version
  const bytes = new Uint8Array(byteCount);
  for (let i = 0; i < byteCount; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

export default {
  CryptoDigestAlgorithm,
  CryptoEncoding,
  digestStringAsync,
  getRandomBytesAsync,
  getRandomBytes,
};
