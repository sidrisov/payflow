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
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
        <Avatar
          src="/payflow.png"
          alt="Payflow Logo"
          sx={{
            width: 55,
            height: 55,
            borderRadius: 3,
            border: 1,
            borderColor: 'divider'
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
