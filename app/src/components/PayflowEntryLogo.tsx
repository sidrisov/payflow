import { Avatar, Box, Stack, Typography } from '@mui/material';
import { green } from '@mui/material/colors';

export default function PayflowEntryLogo() {
  return (
    <Box
      position="fixed"
      display="flex"
      alignItems="center"
      boxSizing="border-box"
      justifyContent="center"
      sx={{ inset: 0 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Avatar
          src="/payflow.png"
          variant="rounded"
          sx={{ width: 60, height: 60, borderRadius: 3, border: 0.5, borderColor: 'divider' }}
        />
        <Stack>
          <Typography variant="h5" fontWeight="bold">
            Payflow
          </Typography>
          <Typography fontSize={16} fontWeight="bold" sx={{ color: green.A700 }}>
            Onchain Social Payments
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
