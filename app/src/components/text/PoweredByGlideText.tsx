import { Typography } from '@mui/material';

export default function PoweredByGlideText() {
  return (
    <Typography variant="caption" textAlign="center" color="text.secondary">
      Cross-chain payments powered by{' '}
      <b>
        <a href="https://paywithglide.xyz" target="_blank" style={{ color: 'inherit' }}>
          Glide
        </a>
      </b>
    </Typography>
  );
}
