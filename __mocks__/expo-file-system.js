/**
 * Mock for expo-file-system
 */

export const documentDirectory = 'file:///mock/documents/';
export const cacheDirectory = 'file:///mock/cache/';

export const EncodingType = {
  UTF8: 'utf8',
  Base64: 'base64',
};

export async function getInfoAsync(fileUri, options = {}) {
  return {
    exists: true,
    uri: fileUri,
    size: 1024,
    isDirectory: false,
    modificationTime: Date.now() / 1000,
  };
}

export async function readAsStringAsync(fileUri, options = {}) {
  return 'mocked-file-content';
}

export async function writeAsStringAsync(fileUri, contents, options = {}) {
  return;
}

export async function deleteAsync(fileUri, options = {}) {
  return;
}

export async function moveAsync(options) {
  return;
}

export async function copyAsync(options) {
  return;
}

export async function makeDirectoryAsync(fileUri, options = {}) {
  return;
}

export async function readDirectoryAsync(fileUri) {
  return [];
}

export async function downloadAsync(uri, fileUri, options = {}) {
  return {
    uri: fileUri,
    status: 200,
    headers: {},
    md5: 'mocked-md5',
  };
}

export async function uploadAsync(url, fileUri, options = {}) {
  return {
    status: 200,
    headers: {},
    body: 'mocked-response',
  };
}

export async function createDownloadResumable(uri, fileUri, options, callback, resumeData) {
  return {
    downloadAsync: async () => ({
      uri: fileUri,
      status: 200,
      headers: {},
    }),
    pauseAsync: async () => {},
    resumeAsync: async () => {},
    savable: async () => ({}),
  };
}

export default {
  documentDirectory,
  cacheDirectory,
  EncodingType,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
  deleteAsync,
  moveAsync,
  copyAsync,
  makeDirectoryAsync,
  readDirectoryAsync,
  downloadAsync,
  uploadAsync,
  createDownloadResumable,
};
