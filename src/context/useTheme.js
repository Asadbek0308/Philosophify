import { useContext } from 'react';
import { ThemeContext } from './themeContextInstance';

export function useTheme() {
  return useContext(ThemeContext);
}
