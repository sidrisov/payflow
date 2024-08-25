import {
  Dialog,
  DialogContent,
  DialogProps,
  Stack,
  Typography,
  Box,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Avatar,
  AvatarGroup,
  Tooltip
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { CloseCallbackType } from '../../types/CloseCallbackType';
import { useMemo, useState } from 'react';
import { ProfileType } from '../../types/ProfileType';
import { toast } from 'react-toastify';
import { useCreateSafeWallets as usePreCreateSafeWallets } from '../../utils/hooks/useCreateSafeWallets';

import { FlowType } from '../../types/FlowType';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_FLOW_WALLET_CHAINS } from '../../utils/networks';
import { updateProfile } from '../../services/user';
import { LoadingConnectWalletButton } from '../buttons/LoadingConnectWalletButton';
import { useAccount } from 'wagmi';
import { grey } from '@mui/material/colors';
import { shortenWalletAddressLabel } from '../../utils/address';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { HistoryToggleOff, Info } from '@mui/icons-material';
import ProfileAvatar from '../avatars/ProfileAvatar';
import { usePrivy } from '@privy-io/react-auth';
import { BackDialogTitle } from './BackDialogTitle';
import axios from 'axios';
import { API_URL } from '../../utils/urlConstants';

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

  const [extraSigner] = useState<boolean>(true);

  const { address, connector } = useAccount();

  const { user } = usePrivy();

  const navigate = useNavigate();

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  async function createMainFlow() {
    console.debug(profile.identity, SALT_NONCE, DEFAULT_FLOW_WALLET_CHAINS);

    let owners = [profile.identity];
    if (extraSigner) {
      if (address) {
        owners.push(address);
      } else {
        toast.error('Signer not connected!');
        return;
      }
    }

    create(owners, SALT_NONCE, DEFAULT_FLOW_WALLET_CHAINS);
  }

  useMemo(async () => {
    if (error) {
      toast.error('Failed to prepare flow, try again!');
      await reset();
    } else if (wallets && wallets.length === DEFAULT_FLOW_WALLET_CHAINS.length) {
      const primaryFlow = {
        // TODO: choose different one
        ...(extraSigner && {
          signer: address,
          signerProvider: 'privy',
          signerType: 'email',
          signerCredential: user?.email?.address
        }),
        title: 'Payflow Balance',
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
      disableEnforceFocus
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
        zIndex: 1450,
        backdropFilter: 'blur(5px)'
      }}>
      <BackDialogTitle
        showOnDesktop
        title="Set Up Payflow Balance"
        closeStateCallback={async () => {
          try {
            await axios.get(`${API_URL}/api/auth/logout`, {
              withCredentials: true
            });
            navigate('/connect');
          } catch (error) {
            toast.error('Failed to logout!');
          }
        }}
      />

      <DialogContent>
        <Box
          maxWidth={350}
          minHeight={400}
          height="100%"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          p={1}>
          <Stack spacing={1} alignItems="flex-start">
            <Typography fontWeight="bold" color={grey[400]}>
              Smart Wallets
            </Typography>
            <Box
              display="flex"
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              p={2}
              sx={{
                height: 75,
                width: '100%',
                color: 'inherit',
                border: 1.5,
                borderRadius: 5,
                borderColor: 'divider'
              }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar src="/safe.png" />
                <Stack spacing={0.1} alignItems="flex-start">
                  <Typography fontSize={18} color={grey[400]}>
                    Provider
                  </Typography>
                  <Typography fontSize={16} fontWeight="bold">
                    Safe Smart Wallet
                  </Typography>
                </Stack>
              </Stack>
              <AvatarGroup
                max={4}
                color="inherit"
                total={DEFAULT_FLOW_WALLET_CHAINS.length}
                sx={{
                  '& .MuiAvatar-root': {
                    borderStyle: 'none',
                    width: 25,
                    height: 25
                  }
                }}>
                {[...Array(Math.min(4, DEFAULT_FLOW_WALLET_CHAINS.length))].map((_item, i) => (
                  <NetworkAvatar
                    key={`onboarding_wallet_list_${DEFAULT_FLOW_WALLET_CHAINS[i].id}`}
                    chainId={DEFAULT_FLOW_WALLET_CHAINS[i].id}
                  />
                ))}
              </AvatarGroup>
            </Box>

            <Typography fontWeight="bold" color={grey[400]}>
              Signers
            </Typography>
            <Stack spacing={1} width="100%">
              <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                p={2}
                sx={{
                  height: 65,
                  width: '100%',
                  color: 'inherit',
                  border: 1.5,
                  borderRadius: 5,
                  borderColor: 'divider'
                }}>
                <Stack direction="row" width="100%" spacing={1} alignItems="center">
                  <ProfileAvatar profile={profile} />
                  <Stack spacing={0.1} alignItems="flex-start">
                    <Typography fontSize={18} color={grey[400]}>
                      Identity
                    </Typography>
                    <Typography fontSize={15} fontWeight="bold">
                      {shortenWalletAddressLabel(profile.identity)}
                    </Typography>
                  </Stack>
                </Stack>
                <Tooltip title="Identity wallet is used as back up signer in Safe Web Wallet! We will never ask you to sign with it in the app!">
                  <Info fontSize="small" />
                </Tooltip>
              </Box>
              <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                p={2}
                sx={{
                  height: 65,
                  width: '100%',
                  color: 'inherit',
                  border: 1.5,
                  borderRadius: 5,
                  borderColor: 'divider'
                }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar src="/privy.png" sx={{ width: 40, height: 40 }} />
                  <Stack spacing={0.1} alignItems="flex-start">
                    <Typography fontSize={18} color={grey[400]}>
                      Social Signer
                    </Typography>
                    <Typography fontSize={15} fontWeight="bold">
                      {extraSigner && address && connector?.id === 'io.privy.wallet'
                        ? user?.email?.address
                        : 'waiting for sign in'}
                    </Typography>
                  </Stack>
                </Stack>

                <Tooltip title="Embedded wallet is default signer in the app! It allows to have 1-click gaslesss transactions experience on web and mobile!">
                  <Info fontSize="small" />
                </Tooltip>
              </Box>
              <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                p={2}
                sx={{
                  height: 65,
                  width: '100%',
                  color: 'inherit',
                  border: 2,
                  borderRadius: 5,
                  borderColor: 'divider',
                  borderStyle: 'dashed'
                }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <HistoryToggleOff sx={{ width: 40, height: 40 }} />
                  <Stack spacing={0.1} alignItems="flex-start">
                    <Typography fontSize={18} color={grey[400]}>
                      Passkey Signer
                    </Typography>
                    <Typography fontSize={15} fontWeight="bold">
                      Coming Soon
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
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
                    {loadingWallets ? 'setting up' : loadingUpdateProfile ? 'updating' : ''}
                  </Typography>
                </Stack>
              }
              size="large"
              onClick={async () => {
                await createMainFlow();
              }}
              sx={{ mt: 3, mb: 1, borderRadius: 5 }}>
              Complete
            </LoadingButton>
          ) : (
            <LoadingConnectWalletButton isEmbeddedSigner={true} title="Next" />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
