import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createCustomTheme } from '../theme/customTheme';

const ThemeModeContext = createContext(null);

export const useThemeMode = () => {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
};

export const ThemeModeProvider = ({ children }) => {
  const getInitial = () => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    if (typeof window !== 'undefined') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };

  const [isDarkMode, setIsDarkMode] = useState(getInitial);

  // Apply to DOM and persist
  useEffect(() => {
    const mode = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('theme', mode);
  }, [isDarkMode]);

  // Sync when OS preference changes
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      const saved = localStorage.getItem('theme');
      if (!saved) setIsDarkMode(e.matches);
    };
    mql.addEventListener?.('change', handler);
    return () => mql.removeEventListener?.('change', handler);
  }, []);

  // Optional cross-tab sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'theme' && e.newValue) {
        setIsDarkMode(e.newValue === 'dark');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Observe data-theme attribute changes (in case other code toggles it)
  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => {
      const attr = el.getAttribute('data-theme');
      if (attr === 'dark' || attr === 'light') {
        setIsDarkMode(attr === 'dark');
      }
    });
    observer.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => setIsDarkMode((v) => !v);
  const setTheme = (mode) => setIsDarkMode(mode === 'dark');

  const muiTheme = useMemo(() => createCustomTheme(isDarkMode), [isDarkMode]);

  const value = useMemo(
    () => ({ isDarkMode, toggleTheme, setTheme, muiTheme }),
    [isDarkMode, muiTheme]
  );

  return (
    <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>
  );
};
