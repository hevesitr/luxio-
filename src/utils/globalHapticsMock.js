// Global Haptics mock to prevent 'Cannot read property 'medium' of undefined' errors
// This completely disables Haptics for the entire app after uninstalling expo-haptics

// Mock the entire Haptics module globally BEFORE any other code runs
const MockHaptics = {
  impactAsync: () => Promise.resolve(),
  notificationAsync: () => Promise.resolve(),
  selectionAsync: () => Promise.resolve(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy'
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error'
  }
};

// Mock expo-haptics module globally
if (typeof global !== 'undefined') {
  // Create a safe mock that won't interfere with read-only properties
  try {
    // Only set up minimal global mocks that won't conflict
    global.__MOCK_HAPTICS__ = MockHaptics;
  } catch (e) {
    // Ignore if global modification fails
  }
}

// Export for explicit import
export default MockHaptics;
