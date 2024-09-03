import { Avatar, Box, Stack, Typography } from '@mui/material';
import { green } from '@mui/material/colors';
import { keyframes } from '@mui/system';

const gradientChange = keyframes`
  0% { border-color: transparent; }
  50% { border-color: ${green.A700}; }
  100% { border-color: transparent; }
`;

export default function LoadingPayflowEntryLogo() {
  return (
    <Box
      position="fixed"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{ inset: 0 }}>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
        <Avatar
          src="/payflow.png"
          alt="Payflow Logo"
          sx={{
            width: 60,
            height: 60,
            borderRadius: 4,
            border: 3,
            animation: `${gradientChange} 1s ease-in-out infinite`
          }}
        />
        <Stack spacing={0.1} alignItems="flex-start">
          <Typography variant="h5" fontWeight="bold" fontFamily="monospace">
            Payflow
          </Typography>
          <Typography
            fontSize={16}
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
