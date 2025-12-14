const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block react-native-maps from being bundled on web
config.resolver.blockList = [
  ...(config.resolver.blockList || []),
  /react-native-maps/,
];

module.exports = config;

