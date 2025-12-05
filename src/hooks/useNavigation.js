/**
 * useNavigation hook - Egyszerűsített navigációs hook
 * A NavigationService használatára szolgál komponensekben
 */
import { useContext } from 'react';
import NavigationService from '../services/NavigationService';

export const useNavigation = () => {
  return NavigationService;
};

export default useNavigation;
