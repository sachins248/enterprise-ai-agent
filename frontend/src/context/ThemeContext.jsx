import { createContext, useContext, useEffect, useState } from 'react';

/**
 * ThemeContext — light/dark theme state, persisted to localStorage.
 *
 * On first visit (no stored choice) the theme follows the OS/browser's
 * prefers-color-scheme, and keeps following it live if it changes. The
 * moment the user picks a theme explicitly (toggleTheme/setTheme), that
 * choice is written to localStorage and system-preference changes are
 * ignored from then on.
 *
 * The actual <html data-theme="..."> attribute is also set synchronously
 * by an inline script in index.html, before React mounts, so there's no
 * flash of the wrong theme on load — this context takes over from there.
 */

const STORAGE_KEY = 'agent-theme';

const ThemeContext = createContext(null);

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => getStoredTheme() ?? getSystemTheme());

  // Keep the <html> attribute in sync with state
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Follow the OS setting live, but only until the user makes an explicit choice
  useEffect(() => {
    if (getStoredTheme()) return; // user already chose — don't override it

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setThemeState(media.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  function setTheme(next) {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore — theme still works for this session, just won't persist
    }
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
