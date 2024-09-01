import { Avatar, Box, Stack, Typography } from '@mui/material';
import { green } from '@mui/material/colors';

export default function LoadingPayflowEntryLogo() {
  return (
    <Box
      position="fixed"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{ inset: 0 }}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
        <Avatar
          src="/payflow.png"
          sx={{ width: 60, height: 60, borderRadius: 3, border: 0.5, borderColor: 'divider' }}
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
