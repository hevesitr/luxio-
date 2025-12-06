import React from 'react';
import { Text } from 'react-native';

const createIconSet = (glyphMap, fontFamily, fontFile) => {
  const Icon = ({ name, size = 12, color = '#000', ...props }) => {
    return React.createElement(Text, {
      ...props,
      style: {
        fontSize: size,
        color,
        fontFamily,
      },
    }, glyphMap[name] || '?');
  };

  return Icon;
};

// Mock Ionicons
const Ionicons = createIconSet({
  'heart': '♥',
  'close': '✕',
  'search': '🔍',
  'user': '👤',
  'settings': '⚙️',
  'arrow-back': '←',
  'checkmark': '✓',
}, 'Ionicons');

export { Ionicons, createIconSet };
export default Ionicons;
