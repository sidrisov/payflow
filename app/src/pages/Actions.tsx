import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Avatar, Container, Stack, Typography } from '@mui/material';
import PaymentCastActionDialog from '../components/dialogs/PaymentCastActionDialog';
import { AutoAwesome, ElectricBolt, Interests, PersonAdd } from '@mui/icons-material';

import { PiTipJar } from 'react-icons/pi';
import { GrStorage } from 'react-icons/gr';

import CastActionButton from '../components/buttons/CastActionButton';

export default function Actions() {
  const [openPaymentActionDialog, setOpenPaymentActionDialog] = useState<boolean>(false);

  return (
    <>
      <Helmet>
        <title> Payflow | Actions </title>
      </Helmet>
      <Container maxWidth="xs" sx={{ height: '100%' }}>
        <Stack
          p={3}
          spacing={3}
          alignItems="center"
          border={1.5}
          borderRadius={5}
          borderColor="divider">
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar src="/farcaster.svg" variant="rounded" sx={{ height: 25, width: 25 }} />
            <Typography variant="h6">Farcaster Actions</Typography>
          </Stack>
          <Stack spacing={1.5} alignItems="center">
            <CastActionButton
              title="Pay"
              description="Social feed payments"
              installUrl="https://warpcast.com/~/add-cast-action?url=https://api.alpha.payflow.me/api/farcaster/actions/profile"
              startIcon={<ElectricBolt />}
            />
            <CastActionButton
              title="Storage"
              description="Buy farcaster storage"
              installUrl="https://warpcast.com/~/add-cast-action?url=https://api.alpha.payflow.me/api/farcaster/actions/products/storage"
              startIcon={<GrStorage size={20} />}
            />
            <CastActionButton
              earlyFeature
              title="Mint"
              description="Mint from cast embeds"
              installUrl="https://warpcast.com/~/add-cast-action?url=https://api.alpha.payflow.me/api/farcaster/actions/products/mint"
              startIcon={<AutoAwesome />}
            />
            <CastActionButton
              earlyFeature
              title="Create Jar"
              description="Collect contributions"
              installUrl="https://warpcast.com/~/add-cast-action?url=https://api.alpha.payflow.me/api/farcaster/actions/jar"
              startIcon={<PiTipJar size={20} />}
            />
            <CastActionButton
              title="Compose Intents"
              description="Submit custom intents"
              onClick={() => setOpenPaymentActionDialog(true)}
              startIcon={<Interests />}
            />
            <CastActionButton
              title="Invite"
              description="Invite to Payflow"
              installUrl="https://warpcast.com/~/add-cast-action?url=https://api.alpha.payflow.me/api/farcaster/actions/invite"
              startIcon={<PersonAdd />}
            />
          </Stack>
        </Stack>
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
