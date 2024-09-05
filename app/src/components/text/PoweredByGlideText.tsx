import { Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useDarkMode } from '../../utils/hooks/useDarkMode';

export default function PoweredByGlideText() {
  const prefersDarkMode = useDarkMode();

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
