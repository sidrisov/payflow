import { Avatar, Box, Stack, Typography } from '@mui/material';
import { green } from '@mui/material/colors';
import { keyframes } from '@mui/system';

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

export default function LoadingPayflowEntryLogo() {
  return (
    <Box
      position="fixed"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{ inset: 0 }}>
      <Stack mx={2} direction="row" spacing={2} alignItems="center" justifyContent="center">
        <Box
          position="relative"
          sx={{
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: -1.5,
              borderRadius: 4,
              padding: 2,
              background: green.A700,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              animation: `${rotate} 2s linear infinite`
            }
          }}>
          <Avatar
            src="/payflow.png"
            sx={{ width: 60, height: 60, borderRadius: 3, border: 0.5, borderColor: 'divider' }}
          />
        </Box>
        <Stack spacing={0.1} alignItems="flex-start">
          <Typography variant="h5" fontWeight="bold" fontFamily="monospace">
            Payflow
          </Typography>
          <Typography
            fontSize={18}
            fontWeight="bold"
            fontFamily="monospace"
            sx={{ color: green.A700 }}>
            Onchain Social Payments
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
