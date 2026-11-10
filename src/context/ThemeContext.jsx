import React, { useState, useEffect } from 'react';
import { THEMES } from '../constants/themes';
import { ThemeContext } from './themeContextInstance';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('philosophify_quick_theme');
      if (saved && THEMES.some((t) => t.id === saved)) {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'default';
  });

  const currentThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];

  const setTheme = (newThemeId) => {
    if (THEMES.some((t) => t.id === newThemeId)) {
      setThemeState(newThemeId);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-app-theme', theme);
    root.setAttribute('data-theme', theme === 'white' ? 'light' : 'dark');
    try {
      localStorage.setItem('philosophify_quick_theme', theme);
    } catch {
      // localStorage may be disabled
    }

    // Set custom CSS variables on document root
    root.style.setProperty('--theme-bg', currentThemeObj.bg);
    root.style.setProperty('--theme-surface', currentThemeObj.surface);
    root.style.setProperty('--theme-surface-subtle', currentThemeObj.surfaceSubtle);
    root.style.setProperty('--theme-border', currentThemeObj.border);
    root.style.setProperty('--theme-border-strong', currentThemeObj.borderStrong);
    root.style.setProperty('--theme-text', currentThemeObj.text);
    root.style.setProperty('--theme-text-muted', currentThemeObj.textMuted);
    root.style.setProperty('--theme-accent', currentThemeObj.accent);
    root.style.setProperty('--theme-accent-hover', currentThemeObj.accentHover);
    root.style.setProperty('--theme-accent-text', currentThemeObj.accentText);
    root.style.setProperty('--theme-radius-box', currentThemeObj.radiusBox);
    root.style.setProperty('--theme-radius-btn', currentThemeObj.radiusBtn);
    root.style.setProperty('--theme-radius-badge', currentThemeObj.radiusBadge);

    // Enforce directly on document body as well
    document.body.style.backgroundColor = currentThemeObj.bg;
    document.body.style.color = currentThemeObj.text;
  }, [theme, currentThemeObj]);

  return (
    <ThemeContext.Provider value={{ theme, currentThemeObj, setTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}
