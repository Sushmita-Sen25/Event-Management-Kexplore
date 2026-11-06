import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const KEY = 'es-theme'; // same key as the original site, so a saved choice carries over

const initialTheme = () => document.documentElement.getAttribute('data-theme') || 'light';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    const apply = () => {
      document.documentElement.setAttribute('data-theme', next);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#150b10' : '#fff6f8');
      setTheme(next);
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* storage unavailable */
      }
    };
    // Cross-fade the whole page where the View Transitions API exists.
    if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, dark: theme === 'dark', toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
