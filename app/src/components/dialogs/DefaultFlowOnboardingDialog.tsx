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
  useMediaQuery,
  FormControlLabel,
  Switch,
  IconButton
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { CloseCallbackType } from '../../types/CloseCallbackType';
import { useMemo, useState } from 'react';
import { ProfileType } from '../../types/ProfleType';
import { toast } from 'react-toastify';
import { useCreateSafeWallets as usePreCreateSafeWallets } from '../../utils/hooks/useCreateSafeWallets';

import { FlowType } from '../../types/FlowType';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_FLOW_PRE_CREATE_WALLET_CHAINS } from '../../utils/networks';
import { updateProfile } from '../../services/user';
import { LoadingConnectWalletButton } from '../buttons/LoadingConnectWalletButton';
import { useAccount, useConfig, useDisconnect } from 'wagmi';
import { green, red } from '@mui/material/colors';
import { shortenWalletAddressLabel } from '../../utils/address';
import { Logout } from '@mui/icons-material';

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

  const [signerAsIdentity, setSignerAsIdentity] = useState<boolean>(true);

  const { address } = useAccount();

  const { disconnectAsync } = useDisconnect();

  const navigate = useNavigate();

  const config = useConfig();

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  async function createMainFlow() {
    console.debug(profile.identity, SALT_NONCE, DEFAULT_FLOW_PRE_CREATE_WALLET_CHAINS);
    if (signerAsIdentity) {
      create(profile.identity, SALT_NONCE, DEFAULT_FLOW_PRE_CREATE_WALLET_CHAINS);
    } else if (address) {
      create(address, SALT_NONCE, DEFAULT_FLOW_PRE_CREATE_WALLET_CHAINS);
    } else {
      toast.error('No wallet connected!');
    }
  }

  useMemo(async () => {
    if (error) {
      toast.error('Failed to prepare flow, try again!');
      await reset();
    } else if (wallets && wallets.length === DEFAULT_FLOW_PRE_CREATE_WALLET_CHAINS.length) {
      const defaultFlow = {
        owner: signerAsIdentity ? undefined : address,
        title: 'default',
        description: '',
        walletProvider: 'safe',
        saltNonce: SALT_NONCE,
        wallets
      } as FlowType;
      const updatedProfile = {
        ...profile,
        signer: signerAsIdentity ? undefined : address,
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
          <Typography variant="h6" sx={{ overflow: 'auto' }}>
            Initialize default flow and signer
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box
          maxWidth={350}
          minHeight={400}
          height="100%"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          p={1}>
          <Stack spacing={2} alignItems="flex-start">
            <Typography variant="caption" fontSize={isMobile ? 14 : 16}>
              <b>
                <u>Default Flow</u>
              </b>
              {': '}
              abstracted set of smart wallets across various chains, funds sent to your profile are
              received on default flow.
            </Typography>
            <Typography variant="caption" fontSize={isMobile ? 14 : 16}>
              <b>
                <u>Flow Signer</u>
              </b>
              {': '}
              your ethereum address used to sign all flow related transactions, reducing the need
              for additional identity wallet signatures.
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={signerAsIdentity}
                  onChange={(event) => {
                    setSignerAsIdentity(event.target.checked);
                  }}
                  sx={{ accentColor: green.A700 }}
                />
              }
              label="Use your identity wallet as signer"
            />

            {!signerAsIdentity && address && (
              <Box
                width="100%"
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between">
                <Typography variant="subtitle2" fontSize={isMobile ? 15 : 16} sx={{ pl: 1 }}>
                  Connected Signer:{' '}
                  <u>
                    <b>{shortenWalletAddressLabel(address)}</b>
                  </u>
                </Typography>
                <IconButton onClick={async () => await disconnectAsync()} sx={{ color: red.A700 }}>
                  <Logout />
                </IconButton>
              </Box>
            )}
          </Stack>
          {signerAsIdentity || address ? (
            <LoadingButton
              loading={loadingWallets || loadingUpdateProfile}
              fullWidth
              variant="outlined"
              color="inherit"
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
              onClick={async () => {
                await createMainFlow();
              }}
              sx={{ mt: 3, mb: 1, borderRadius: 5 }}>
              Initialize
            </LoadingButton>
          ) : (
            <LoadingConnectWalletButton title="Connect Signer" />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
