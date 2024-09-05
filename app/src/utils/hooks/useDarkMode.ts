import { useMediaQuery } from '@mui/material';

export const useDarkMode = () => {
  return useMediaQuery('(prefers-color-scheme: dark)');
};
