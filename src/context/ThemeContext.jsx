import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { THEMES } from '../constants/themes';
import { ThemeContext } from './themeContextInstance';

// Where the user last pressed, so the theme can spread outward from that point
const lastPointer = { x: null, y: null };
if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    (e) => {
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;
    },
    { capture: true, passive: true }
  );
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('philosophify_quick_theme');
      if (saved && THEMES.some((t) => t.id === saved)) return saved;
    } catch {
      // fallback
    }
    return 'default';
  });

  const currentThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];

  // Switching theme: a circle of the new theme grows from the click point
  // (View Transitions API). Browsers without it simply switch instantly.
  const setTheme = useCallback(
    (newThemeId) => {
      if (!THEMES.some((t) => t.id === newThemeId) || newThemeId === theme) return;

      if (!document.startViewTransition || prefersReducedMotion()) {
        setThemeState(newThemeId);
        return;
      }

      const x = lastPointer.x ?? window.innerWidth - 80;
      const y = lastPointer.y ?? 40;
      const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

      const transition = document.startViewTransition(() => {
        flushSync(() => setThemeState(newThemeId));
      });
      transition.ready
        .then(() => {
          document.documentElement.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
            { duration: 550, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }
          );
        })
        .catch(() => {});
    },
    [theme]
  );

  // Layout effect (not a passive effect) so the CSS variables are already
  // applied when the view transition takes its "after" snapshot
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-app-theme', theme);
    root.setAttribute('data-theme', theme === 'white' ? 'light' : 'dark');

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

    document.body.style.backgroundColor = currentThemeObj.bg;
    document.body.style.color = currentThemeObj.text;
  }, [theme, currentThemeObj]);

  useEffect(() => {
    try {
      localStorage.setItem('philosophify_quick_theme', theme);
    } catch {
      // localStorage may be disabled
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, currentThemeObj, setTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}