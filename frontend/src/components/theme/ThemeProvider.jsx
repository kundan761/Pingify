import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectTheme } from '../../store/slices/themeSlice.js';

export default function ThemeProvider({ children }) {
  const themeMode = useSelector(selectTheme);

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (mode) => {
      root.classList.remove('light', 'dark');
      if (mode === 'dark') {
        root.classList.add('dark');
      } else if (mode === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemPrefersDark) {
          root.classList.add('dark');
        }
      }
    };

    applyTheme(themeMode);

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  return <>{children}</>;
}
