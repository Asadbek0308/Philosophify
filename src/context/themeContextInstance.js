import { createContext } from 'react';
import { THEMES } from '../constants/themes';

export const ThemeContext = createContext({
  theme: 'default',
  currentThemeObj: THEMES[0],
  setTheme: () => {},
  THEMES,
});
