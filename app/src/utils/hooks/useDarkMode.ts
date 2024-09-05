import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';

export const useDarkMode = () => {
  const theme = useTheme();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  return useMemo(() => {
    // If theme.palette.mode is not set, fall back to system preference
    return theme.palette.mode === 'dark' || (theme.palette.mode !== 'light' && prefersDarkMode);
  }, [theme.palette.mode, prefersDarkMode]);
};
