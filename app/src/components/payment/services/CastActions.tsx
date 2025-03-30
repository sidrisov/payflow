import { useContext, useState } from 'react';
import { Stack, Typography, Grid, IconButton, Badge } from '@mui/material';
import PaymentRewardCastActionComposerDialog from '../../dialogs/PaymentRewardCastActionComposerDialog';
import { AutoAwesome, Interests } from '@mui/icons-material';
import { GrStorage } from 'react-icons/gr';
import CastActionButton from '../../buttons/CastActionButton';
import { FaRegClock } from 'react-icons/fa';
import { GoZap } from 'react-icons/go';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router';
import { ProfileContext } from '../../../contexts/UserContext';
import { DEFAULT_FARCASTER_CLIENT, FARCASTER_CLIENTS } from '@payflow/common';
import { FarcasterClientAvatar } from '../../avatars/FarcasterClientAvatar';
import { SiFarcaster } from 'react-icons/si';

interface Action {
  title: string;
  description: string;
  installUrl?: string;
  onClick?: () => void;
  startIcon: React.ReactNode;
  earlyFeature?: boolean;
  disabled?: boolean;
}

interface ActionCategoryProps {
  title: string;
  icon: React.ReactNode;
  actions: Action[];
}

const ActionCategory: React.FC<ActionCategoryProps> = ({ title, icon, actions }) => {
  const navigate = useNavigate();

  const { profile } = useContext(ProfileContext);

  const preferredClient = FARCASTER_CLIENTS.find(
    (c) => c.id === (profile?.preferredFarcasterClient || DEFAULT_FARCASTER_CLIENT).toLowerCase()
  );

  return (
    <Stack alignItems="center" spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        {icon}
        <Typography variant="h6">{title}</Typography>

        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          badgeContent={
            preferredClient && (
              <FarcasterClientAvatar
                image={preferredClient.image}
                name={preferredClient.name}
                sx={{ width: 20, height: 20 }}
              />
            )
          }>
          <IconButton size="small" onClick={() => navigate('/settings/farcaster/client')}>
            <SettingsIcon />
          </IconButton>
        </Badge>
      </Stack>
      <Grid
        container
        rowSpacing={{ xs: 1, sm: 2 }}
        columnSpacing={{ xs: 1, sm: 2 }}
        justifyContent="center">
        {actions.map((action, index) => (
          <Grid
            component="span"
            key={index}
            size={{ xs: 6 }}
            display="flex"
            justifyContent="center">
            <CastActionButton {...action} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
};

export default function CastActions() {
  const [openPaymentActionDialog, setOpenPaymentActionDialog] = useState<boolean>(false);

  const { profile } = useContext(ProfileContext);

  const preferredClient = FARCASTER_CLIENTS.find(
    (c) => c.id === (profile?.preferredFarcasterClient || DEFAULT_FARCASTER_CLIENT).toLowerCase()
  );
  const BASE_URL = `${preferredClient?.url}/~/add-cast-action?url=https://api.payflow.me/api/farcaster/actions`;

  const farcasterActions = [
    {
      title: 'Pay',
      description: 'Social feed payments',
      installUrl: `${BASE_URL}/profile`,
      startIcon: <GoZap size={25} />
    },
    {
      title: 'Reward',
      description: 'Submit custom rewards',
      onClick: () => setOpenPaymentActionDialog(true),
      startIcon: <Interests sx={{ width: 25, height: 25 }} />
    },
    {
      title: 'Storage',
      description: 'Buy farcaster storage',
      installUrl: `${BASE_URL}/products/storage`,
      startIcon: <GrStorage size={25} />
    },
    {
      title: 'Mint',
      description: 'Mint from cast embeds',
      installUrl: `${BASE_URL}/products/mint`,
      startIcon: <AutoAwesome sx={{ width: 25, height: 25 }} />
    },
    {
      title: 'Subscribe',
      description: 'Buy Hypersub subscription',
      installUrl: `${BASE_URL}/products/hypersub`,
      startIcon: <FaRegClock size={25} />
    }
    /* {
      earlyFeature: true,
      disabled: true,
      title: 'Jar',
      description: 'Collect contributions',
      installUrl: `${BASE_URL}/jar`,
      startIcon: <PiTipJar size={25} />
    } */
  ];

  return (
    <>
      <Stack
        alignItems="center"
        mt={3}
        mb={2}
        p={2}
        spacing={3}
        borderRadius={5}
        borderColor="divider">
        <ActionCategory
          title="Cast Actions"
          icon={<SiFarcaster size={30} />}
          actions={farcasterActions}
        />
      </Stack>
      <PaymentRewardCastActionComposerDialog
        open={openPaymentActionDialog}
        closeStateCallback={() => setOpenPaymentActionDialog(false)}
        onClose={() => setOpenPaymentActionDialog(false)}
      />
    </>
  );
}
