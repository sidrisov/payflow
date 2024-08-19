import { Typography, useMediaQuery } from '@mui/material';
import { grey } from '@mui/material/colors';

export default function PoweredByGlideText() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  return (
    <Typography variant="caption" textAlign="center" color={grey[prefersDarkMode ? 400 : 700]}>
      Cross-chain payments powered by{' '}
      <b>
        <a href="https://paywithglide.xyz" target="_blank" style={{ color: 'inherit' }}>
          Glide
        </a>
      </b>
    </Typography>
  );
}
