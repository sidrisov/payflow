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
import { DEFAULT_FLOW_PRE_CREATE_WALLET_CHAINS as PRIMARY_FLOW_PRE_CREATE_WALLET_CHAINS } from '../../utils/networks';
import { updateProfile } from '../../services/user';
import { LoadingConnectWalletButton } from '../buttons/LoadingConnectWalletButton';
import { useAccount, useConfig, useDisconnect } from 'wagmi';
import { green, red } from '@mui/material/colors';
import { shortenWalletAddressLabel } from '../../utils/address';
import { Logout } from '@mui/icons-material';

export type PrimaryFlowOnboardingDialogProps = DialogProps &
  CloseCallbackType & {
    profile: ProfileType;
    username?: string | null;
    code?: string | null;
  };

const SALT_NONCE = import.meta.env.VITE_DEFAULT_FLOW_CREATE2_SALT_NONCE;

export default function PrimaryFlowOnboardingDialog({
  closeStateCallback,
  profile,
  ...props
}: PrimaryFlowOnboardingDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { loading: loadingWallets, error, wallets, create, reset } = usePreCreateSafeWallets();
  const [loadingUpdateProfile, setLoadingUpdateProfile] = useState<boolean>(false);

  const [extraSigner, setExtraSigner] = useState<boolean>(true);

  const { address, connector } = useAccount();

  console.log('Hello', connector);

  const { disconnectAsync } = useDisconnect();

  const navigate = useNavigate();

  const config = useConfig();

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  async function createMainFlow() {
    console.debug(profile.identity, SALT_NONCE, PRIMARY_FLOW_PRE_CREATE_WALLET_CHAINS);

    let owners = [profile.identity];
    if (extraSigner) {
      if (address) {
        owners.push(address);
      } else {
        toast.error('Signer not connected!');
        return;
      }
    }

    create(owners, SALT_NONCE, PRIMARY_FLOW_PRE_CREATE_WALLET_CHAINS);
  }

  useMemo(async () => {
    if (error) {
      toast.error('Failed to prepare flow, try again!');
      await reset();
    } else if (wallets && wallets.length === PRIMARY_FLOW_PRE_CREATE_WALLET_CHAINS.length) {
      const primaryFlow = {
        // TODO: choose different one
        ...(extraSigner && { signer: address, signerProvider: 'privy' }),
        title: 'Primary flow',
        description: '',
        walletProvider: 'safe',
        saltNonce: SALT_NONCE,
        wallets
      } as FlowType;
      const updatedProfile = {
        ...profile,
        defaultFlow: primaryFlow
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
      PaperProps={{
        sx: {
          ...(!isMobile && {
            borderRadius: 5
          })
        }
      }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle>
        <Box display="flex" justifyContent="center">
          <Typography variant="h6" sx={{ overflow: 'auto' }}>
            Flow initialization
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
                <u>Primary flow</u>
              </b>
              {': '}
              abstracted set of multi-chain wallets, primary flow receives funds sent to your
              profile
            </Typography>
            <Typography variant="caption" fontSize={isMobile ? 14 : 16}>
              <b>
                <u>Flow signer</u>
              </b>
              {': '}
              address used to sign all flow related transactions, by default your identity wallet is
              added as flow signer
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={extraSigner}
                  color="success"
                  onChange={(event) => {
                    setExtraSigner(event.target.checked);
                  }}
                  sx={{ accentColor: green.A700 }}
                />
              }
              label="Enable signless flow payments"
            />
            {/* {extraSigner && address === profile.identity && (
              <Typography
                variant="subtitle2"
                color={red.A700}
                fontSize={isMobile ? 15 : 16}
                sx={{ pl: 1 }}>
                Additional flow signer should be different from identity address:{' '}
                <u>
                  <b>{shortenWalletAddressLabel(profile.identity)}</b>
                </u>
              </Typography>
            )} */}
            {extraSigner && address && connector?.id === 'io.privy.wallet' && (
              <Box
                width="100%"
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between">
                <Typography variant="subtitle2" fontSize={isMobile ? 15 : 16} sx={{ pl: 1 }}>
                  Connected signer:{' '}
                  <u>
                    <b>{shortenWalletAddressLabel(address)}</b>
                  </u>
                </Typography>
                {/* <IconButton onClick={async () => await disconnectAsync()} sx={{ color: red.A700 }}>
                  <Logout />
                </IconButton> */}
              </Box>
            )}
          </Stack>
          {!extraSigner || (address && connector?.id === 'io.privy.wallet') ? (
            <LoadingButton
              loading={loadingWallets || loadingUpdateProfile}
              disabled={extraSigner && address === profile.identity}
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
            <LoadingConnectWalletButton isEmbeddedSigner={true} title="Connect Signer" />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
