import { useMediaQuery } from '@mui/material';
import { useEffect, useState } from 'react';

export const useDarkMode = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [isDarkMode, setIsDarkMode] = useState(prefersDarkMode);

  useEffect(() => {
    // Force initial check
    setIsDarkMode(prefersDarkMode);

    // Set up listener for Android WebView
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
      // Update root color-scheme for WebView
      document.documentElement.style.colorScheme = e.matches ? 'dark' : 'light';
    };

    // Add listener with compatibility check
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    }

    return () => {
      // Clean up listener with compatibility check
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      }
    };
  }, [prefersDarkMode]);

  return isDarkMode;
};
