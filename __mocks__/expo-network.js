// Mock for expo-network
const Network = {
  getNetworkStateAsync: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  })),
  getIpAddressAsync: jest.fn(() => Promise.resolve('192.168.1.1')),
  getMacAddressAsync: jest.fn(() => Promise.resolve('00:00:00:00:00:00')),
};

module.exports = Network;
