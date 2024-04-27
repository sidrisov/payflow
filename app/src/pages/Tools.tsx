import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Avatar,
  Box,
  Button,
  Container,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import PaymentCastActionDialog from '../components/dialogs/PaymentCastActionDialog';

export default function Tools() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [openPaymentActionDialog, setOpenPaymentActionDialog] = useState<boolean>(false);

  return (
    <>
      <Helmet>
        <title> Payflow | Tools </title>
      </Helmet>
      <Container maxWidth="xs" sx={{ height: '100%' }}>
        <Box
          height="100%"
          display="flex"
          flexDirection="column"
          justifyContent={isMobile ? 'space-between' : 'flex-start'}
          sx={{ p: 3 }}>
          <Stack
            p={3}
            spacing={3}
            alignItems="center"
            border={1.5}
            borderRadius={5}
            borderColor="divider">
            <Avatar src="/farcaster.svg" variant="rounded" />
            <Typography variant="h6">Farcaster Actions</Typography>
            <Stack spacing={1} alignItems="center">
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                sx={{ borderRadius: 5 }}
                href="https://warpcast.com/~/add-cast-action?url=https%3A%2F%2Fapi.alpha.payflow.me%2Fapi%2Ffarcaster%2Factions%2Finvite"
                target="_blank">
                Install Invite Action
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                sx={{ borderRadius: 5 }}
                href="https://warpcast.com/~/add-cast-action?url=https%3A%2F%2Fapi.alpha.payflow.me%2Fapi%2Ffarcaster%2Factions%2Fjar"
                target="_blank">
                Install Create Jar Action
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                sx={{ borderRadius: 5 }}
                onClick={() => setOpenPaymentActionDialog(true)}>
                Create Payment Action
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Container>
      <PaymentCastActionDialog
        open={openPaymentActionDialog}
        closeStateCallback={() => {
          setOpenPaymentActionDialog(false);
        }}
        onClose={() => {
          setOpenPaymentActionDialog(false);
        }}
      />
    </>
  );
}
