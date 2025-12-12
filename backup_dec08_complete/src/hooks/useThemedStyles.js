import { useTheme } from '../context/ThemeContext';
import { StyleSheet } from 'react-native';

/**
 * Hook to create themed styles
 * Usage: const styles = useThemedStyles(createStyles);
 */
export const useThemedStyles = (createStylesFn) => {
  const { theme } = useTheme();
  return createStylesFn(theme);
};

export default useThemedStyles;

