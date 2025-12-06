// Mock for @react-native-community/netinfo
const NetInfo = {
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    details: null,
  })),
  addEventListener: jest.fn(() => jest.fn()), // returns unsubscribe function
  refresh: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  })),
};

module.exports = NetInfo;
