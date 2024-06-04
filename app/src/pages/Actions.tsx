import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Avatar, Box, Container, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import PaymentCastActionDialog from '../components/dialogs/PaymentCastActionDialog';
import { ElectricBolt, Interests, Inventory, PersonAdd, Storage } from '@mui/icons-material';
import CastActionButton from '../components/buttons/CastActionButton';

export default function Actions() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [openPaymentActionDialog, setOpenPaymentActionDialog] = useState<boolean>(false);

  return (
    <>
      <Helmet>
        <title> Payflow | Actions </title>
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
              <CastActionButton
                title="Invite"
                description="Use this action to invite farcaster users to Payflow"
                installUrl="https://warpcast.com/~/add-cast-action?url=https%3A%2F%2Fapi.alpha.payflow.me%2Fapi%2Ffarcaster%2Factions%2Finvite"
                startIcon={<PersonAdd />}
              />
              <CastActionButton
                title="Pay Profile"
                description="Use this action to pay farcaster users with in-frame txs"
                installUrl="https://warpcast.com/~/add-cast-action?url=https%3A%2F%2Fapi.alpha.payflow.me%2Fapi%2Ffarcaster%2Factions%2Fprofile"
                startIcon={<ElectricBolt />}
              />
              <CastActionButton
                title="Pay Intents"
                description="Use this action to submit different types of payment intents: Regular, Top Comment, etc for farcaster users in Payflow app"
                onClick={() => setOpenPaymentActionDialog(true)}
                startIcon={<Interests />}
              />
              <CastActionButton
                title="Create Jar"
                description="Use this action to turn any existing cast into contribution jar to fundraise for any purpose via Payflow"
                installUrl="https://warpcast.com/~/add-cast-action?url=https%3A%2F%2Fapi.alpha.payflow.me%2Fapi%2Ffarcaster%2Factions%2Fjar"
                startIcon={<Inventory />}
              />
              <CastActionButton
                title="Gift Storage"
                description="Use this action to gift a storage to farcaster user via Payflow"
                installUrl="https://warpcast.com/~/add-cast-action?url=https%3A%2F%2Fapi.alpha.payflow.me%2Fapi%2Ffarcaster%2Factions%2Fproducts%2Fstorage"
                startIcon={<Storage />}
              />
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
