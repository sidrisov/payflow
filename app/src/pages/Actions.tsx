import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, Container, Stack, Typography } from '@mui/material';
import PaymentCastActionDialog from '../components/dialogs/PaymentCastActionDialog';
import { AutoAwesome, ElectricBolt, Interests, PersonAdd, Star } from '@mui/icons-material';
import { PiTipJar } from 'react-icons/pi';
import { GrStorage } from 'react-icons/gr';
import CastActionButton from '../components/buttons/CastActionButton';
import FarcasterAvatar from '../components/avatars/FarcasterAvatar';
import { FaRegClock } from 'react-icons/fa';

const BASE_URL =
  'https://warpcast.com/~/add-cast-action?url=https://api.alpha.payflow.me/api/farcaster/actions';

interface Action {
  title: string;
  description: string;
  installUrl?: string;
  onClick?: () => void;
  startIcon: React.ReactNode;
  earlyFeature?: boolean;
}

interface ActionCategoryProps {
  title: string;
  icon: React.ReactNode;
  actions: Action[];
}

const ActionCategory: React.FC<ActionCategoryProps> = ({ title, icon, actions }) => (
  <Stack spacing={2}>
    <Stack direction="row" spacing={1} alignItems="center">
      {icon}
      <Typography variant="h6">{title}</Typography>
    </Stack>
    <Stack spacing={1.5} alignItems="center">
      {actions.map((action, index) => (
        <CastActionButton key={index} {...action} />
      ))}
    </Stack>
  </Stack>
);

export default function Actions() {
  const [openPaymentActionDialog, setOpenPaymentActionDialog] = useState<boolean>(false);

  const farcasterActions = [
    {
      title: 'Pay',
      description: 'Social feed payments',
      installUrl: `${BASE_URL}/profile`,
      startIcon: <ElectricBolt />
    },
    {
      title: 'Storage',
      description: 'Buy farcaster storage',
      installUrl: `${BASE_URL}/products/storage`,
      startIcon: <GrStorage />
    },
    {
      title: 'Mint',
      description: 'Mint from cast embeds',
      installUrl: `${BASE_URL}/products/mint`,
      startIcon: <AutoAwesome />
    },
    {
      title: 'Buy Fan Token',
      description: 'Buy fan tokens from cast',
      installUrl: `${BASE_URL}/products/fan`,
      startIcon: <Star />
    },
    {
      earlyFeature: true,
      title: 'Subscribe',
      description: 'Buy Hypersub subscription',
      installUrl: `${BASE_URL}/products/hypersub`,
      startIcon: <FaRegClock />
    },
    {
      earlyFeature: true,
      title: 'Create Jar',
      description: 'Collect contributions',
      installUrl: `${BASE_URL}/jar`,
      startIcon: <PiTipJar />
    },
    {
      title: 'Compose Intents',
      description: 'Submit custom intents',
      onClick: () => setOpenPaymentActionDialog(true),
      startIcon: <Interests />
    },
    {
      title: 'Invite',
      description: 'Invite to Payflow',
      installUrl: `${BASE_URL}/invite`,
      startIcon: <PersonAdd />
    }
  ];

  return (
    <>
      <Helmet>
        <title> Payflow | Actions </title>
      </Helmet>
      <Container maxWidth="xs" sx={{ height: '100%' }}>
        <Stack
          m={3}
          p={3}
          spacing={3}
          alignItems="center"
          component={Card}
          borderRadius={5}
          elevation={5}
          borderColor="divider">
          <ActionCategory
            title="Cast Actions"
            icon={<FarcasterAvatar size={30} />}
            actions={farcasterActions}
          />
        </Stack>
      </Container>
      <PaymentCastActionDialog
        open={openPaymentActionDialog}
        closeStateCallback={() => setOpenPaymentActionDialog(false)}
        onClose={() => setOpenPaymentActionDialog(false)}
      />
    </>
  );
}
