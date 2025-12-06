// Mock for react-native-gesture-handler
const GestureHandlerRootView = ({ children }) => children;
const PanGestureHandler = ({ children }) => children;
const TapGestureHandler = ({ children }) => children;
const LongPressGestureHandler = ({ children }) => children;
const PinchGestureHandler = ({ children }) => children;
const RotationGestureHandler = ({ children }) => children;

const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
};

const Directions = {
  RIGHT: 1,
  LEFT: 2,
  UP: 4,
  DOWN: 8,
};

module.exports = {
  GestureHandlerRootView,
  PanGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  PinchGestureHandler,
  RotationGestureHandler,
  State,
  Directions,
};
