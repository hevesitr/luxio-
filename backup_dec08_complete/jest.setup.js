// Jest setup file for global test configuration

// Mock React Native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules = {
    ...RN.NativeModules,
    RNGestureHandlerModule: {},
  };
  return RN;
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  clear: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock Expo modules
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: { latitude: 47.4979, longitude: 19.0402 }
  })),
}));

// Note: expo-network is not used anymore, using browser navigator.onLine instead

// Mock Supabase
jest.mock('./src/services/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            gt: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: { tier: 'gold', expiry_date: new Date(Date.now() + 86400000).toISOString() },
                    error: null
                  })),
                })),
              })),
            })),
            single: jest.fn(() => ({
              data: {
                id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                created_at: '2023-01-01T00:00:00Z'
              },
              error: null,
            })),
          })),
        })),
        limit: jest.fn(() => ({
          data: [],
          error: null,
        })),
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'test-id' },
            error: null,
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { id: 'test-id' },
              error: null,
            })),
          })),
        })),
      })),
      upsert: jest.fn(() => ({
        error: null,
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null,
        })),
      })),
      rpc: jest.fn(() => ({
        data: { allowed: true },
        error: null,
      })),
    })),
    auth: {
      signUp: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      getUser: jest.fn(() => ({ data: { user: { id: 'user123' } }, error: null })),
    },
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(() => ({
          unsubscribe: jest.fn(),
        })),
      })),
    })),
  },
}));

// Suppress console logs during tests unless needed
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
