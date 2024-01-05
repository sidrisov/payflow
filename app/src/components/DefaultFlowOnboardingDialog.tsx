import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogProps,
  Stack,
  Typography,
  Box,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { CloseCallbackType } from '../types/CloseCallbackType';
import { useMemo, useState } from 'react';
import { ProfileType } from '../types/ProfleType';
import { toast } from 'react-toastify';
import { useCreateSafeWallets as usePreCreateSafeWallets } from '../utils/hooks/useCreateSafeWallets';

import { FlowType } from '../types/FlowType';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_FLOW_PRE_CREATE_WALLET_CHAINS } from '../utils/networks';
import { updateProfile } from '../services/user';

export type DefaultFlowOnboardingDialogProps = DialogProps &
  CloseCallbackType & {
    profile: ProfileType;
    username?: string | null;
    code?: string | null;
  };

const SALT_NONCE = import.meta.env.VITE_DEFAULT_FLOW_CREATE2_SALT_NONCE;

export default function DefaultFlowOnboardingDialog({
  closeStateCallback,
  profile,
  ...props
}: DefaultFlowOnboardingDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { loading: loadingWallets, error, wallets, create, reset } = usePreCreateSafeWallets();
  const [loadingUpdateProfile, setLoadingUpdateProfile] = useState<boolean>(false);

  const navigate = useNavigate();

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  async function createMainFlow() {
    console.debug(profile.identity, SALT_NONCE, DEFAULT_FLOW_PRE_CREATE_WALLET_CHAINS);
    create(profile.identity, SALT_NONCE, DEFAULT_FLOW_PRE_CREATE_WALLET_CHAINS);
  }

  useMemo(async () => {
    if (error) {
      toast.error('Failed to prepare flow, try again!');
      await reset();
    } else if (wallets && wallets.length === DEFAULT_FLOW_PRE_CREATE_WALLET_CHAINS.length) {
      const defaultFlow = {
        owner: profile.identity,
        title: 'default',
        description: '',
        walletProvider: 'safe',
        saltNonce: SALT_NONCE,
        wallets
      } as FlowType;
      const updatedProfile = {
        ...profile,
        defaultFlow
      } as ProfileType;
      setLoadingUpdateProfile(true);
      try {
        const success = await updateProfile(updatedProfile);

        if (success) {
          toast.success('Onboarding successfully completed');
          navigate(0);
        } else {
          toast.error('Failed to update profile, try again!');
        }
      } finally {
        setLoadingUpdateProfile(false);
        await reset();
      }
    }
  }, [wallets, error]);

  return (
    <Dialog
      onClose={handleCloseCampaignDialog}
      {...props}
      PaperProps={{ sx: { borderRadius: 5 } }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle>
        <Box display="flex" justifyContent="center">
          <Typography variant="h5" sx={{ overflow: 'auto' }}>
            Initialize default flow!
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box
          minWidth={350}
          minHeight={400}
          height="100%"
          display="flex"
          flexDirection="column"
          justifyContent={isMobile ? 'space-between' : 'flex-start'}
          p={1}>
          <LoadingButton
            loading={loadingWallets || loadingUpdateProfile}
            fullWidth
            variant="outlined"
            loadingIndicator={
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress color="inherit" size={16} />
                <Typography variant="button">
                  {loadingWallets
                    ? 'preparing flow'
                    : loadingUpdateProfile
                    ? 'updating profile'
                    : ''}
                </Typography>
              </Stack>
            }
            size="large"
            color="primary"
            onClick={async () => {
              await createMainFlow();
            }}
            sx={{ borderRadius: 5 }}>
            Complete
          </LoadingButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
