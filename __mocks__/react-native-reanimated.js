// Mock for react-native-reanimated
const Animated = {
  Value: jest.fn(() => ({
    setValue: jest.fn(),
    interpolate: jest.fn(() => 0),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeListener: jest.fn(),
  })),
  timing: jest.fn(() => ({
    start: jest.fn(),
  })),
  spring: jest.fn(() => ({
    start: jest.fn(),
  })),
  decay: jest.fn(() => ({
    start: jest.fn(),
  })),
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
};

const useAnimatedStyle = jest.fn(() => ({}));
const useSharedValue = jest.fn(() => ({
  value: 0,
  set: jest.fn(),
}));
const useDerivedValue = jest.fn(() => ({
  value: 0,
}));
const runOnJS = jest.fn((fn) => fn);
const runOnUI = jest.fn((fn) => fn);

const Easing = {
  linear: jest.fn(),
  ease: jest.fn(),
  quad: jest.fn(),
  cubic: jest.fn(),
  poly: jest.fn(),
  sin: jest.fn(),
  circle: jest.fn(),
  exp: jest.fn(),
  elastic: jest.fn(),
  back: jest.fn(),
  bounce: jest.fn(),
  bezier: jest.fn(),
};

module.exports = {
  ...Animated,
  useAnimatedStyle,
  useSharedValue,
  useDerivedValue,
  runOnJS,
  runOnUI,
  Easing,
};
