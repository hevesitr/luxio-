// Mock for expo-location
export const Accuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
};

export const requestForegroundPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted' })
);

export const getForegroundPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted' })
);

export const getCurrentPositionAsync = jest.fn(() =>
  Promise.resolve({
    coords: {
      latitude: 47.4979,
      longitude: 19.0402,
      altitude: 0,
      accuracy: 10,
      altitudeAccuracy: 10,
      heading: 0,
      speed: 0,
    },
    timestamp: Date.now(),
  })
);

export const watchPositionAsync = jest.fn(() =>
  Promise.resolve({
    remove: jest.fn(),
  })
);

export const geocodeAsync = jest.fn(() =>
  Promise.resolve([
    {
      latitude: 47.4979,
      longitude: 19.0402,
    },
  ])
);

export const reverseGeocodeAsync = jest.fn(() =>
  Promise.resolve([
    {
      city: 'Budapest',
      region: 'Budapest',
      country: 'Hungary',
    },
  ])
);
