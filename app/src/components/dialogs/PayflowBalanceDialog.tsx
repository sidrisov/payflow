import {
  Dialog,
  DialogContent,
  DialogProps,
  Stack,
  Typography,
  Box,
  CircularProgress,
  Avatar,
  AvatarGroup,
  Tooltip,
  TextField,
  Button
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { CloseCallbackType } from '../../types/CloseCallbackType';
import { useState, useEffect } from 'react';
import { ProfileType } from '../../types/ProfileType';
import { toast } from 'react-toastify';
import { useCreateSafeWallets } from '../../utils/hooks/useCreateSafeWallets';

import { FlowType } from '../../types/FlowType';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_FLOW_WALLET_CHAINS } from '../../utils/networks';
import { LoadingConnectWalletButton } from '../buttons/LoadingConnectWalletButton';
import { useAccount } from 'wagmi';
import { green, grey } from '@mui/material/colors';
import { shortenWalletAddressLabel2 } from '../../utils/address';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { Info } from '@mui/icons-material';
import ProfileAvatar from '../avatars/ProfileAvatar';
import { usePrivy } from '@privy-io/react-auth';
import { BackDialogTitle } from './BackDialogTitle';
import { useMobile } from '../../utils/hooks/useMobile';
import saveFlow from '../../services/flow';
import { HiOutlineCheckCircle } from 'react-icons/hi';

export type PayflowBalanceDialogProps = DialogProps &
  CloseCallbackType & {
    profile: ProfileType;
    username?: string | null;
    code?: string | null;
  };

const SALT_NONCE = import.meta.env.VITE_DEFAULT_FLOW_CREATE2_SALT_NONCE;

export default function PayflowBalanceDialog({
  closeStateCallback,
  profile,
  ...props
}: PayflowBalanceDialogProps) {
  const isMobile = useMobile();

  const { loading: loadingWallets, error, wallets, generate, reset } = useCreateSafeWallets();
  const [loadingUpdateProfile, setLoadingUpdateProfile] = useState<boolean>(false);
  const [saltNonce] = useState(() => SALT_NONCE + '-' + crypto.randomUUID().slice(0, 10));

  const [extraSigner] = useState<boolean>(true);

  const { address, connector } = useAccount();

  const { user } = usePrivy();

  const navigate = useNavigate();

  const [walletTitle, setWalletTitle] = useState<string>('Payflow Balance');

  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
  const [createdFlow, setCreatedFlow] = useState<FlowType | null>(null);

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  async function createMainFlow() {
    console.debug(profile.identity, saltNonce, DEFAULT_FLOW_WALLET_CHAINS);

    let owners = [profile.identity];
    if (extraSigner) {
      if (address) {
        owners.push(address);
      } else {
        toast.error('Signer not connected!');
        return;
      }
    }

    generate(
      owners,
      saltNonce,
      DEFAULT_FLOW_WALLET_CHAINS.map((chain) => chain.id)
    );
  }

  useEffect(() => {
    const handleWalletsChange = async () => {
      if (error) {
        toast.error('Failed to prepare flow, try again!');
        await reset();
      } else if (wallets && wallets.length === DEFAULT_FLOW_WALLET_CHAINS.length) {
        const newFlow = {
          ...(extraSigner && {
            signer: address,
            signerProvider: 'privy',
            signerType: 'email',
            signerCredential: user?.email?.address
          }),
          title: walletTitle,
          walletProvider: 'safe',
          saltNonce,
          wallets
        } as FlowType;
        setLoadingUpdateProfile(true);
        try {
          const success = await saveFlow(newFlow);

          if (success) {
            setShowSuccessDialog(true);
            setCreatedFlow(newFlow);
          } else {
            toast.error('Failed. Try again!');
          }
        } finally {
          setLoadingUpdateProfile(false);
          await reset();
        }
      }
    };

    handleWalletsChange();
  }, [wallets, error]);

  return !showSuccessDialog ? (
    <Dialog
      fullScreen={isMobile}
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
        backdropFilter: 'blur(3px)'
      }}>
      <BackDialogTitle
        showOnDesktop
        title="Create Payflow Balance"
        closeStateCallback={closeStateCallback}
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
              Title
            </Typography>
            <TextField
              fullWidth
              value={walletTitle}
              onChange={(e) => setWalletTitle(e.target.value)}
              placeholder="Payflow Balance"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3
                }
              }}
            />

            <Typography fontWeight="bold" color={grey[400]}>
              Smart Wallet Account
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
                    Safe
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
                      {shortenWalletAddressLabel2(profile.identity)}
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
              {/* <Box
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
                </Box> */}
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
                  <Typography
                    noWrap
                    variant="button"
                    textOverflow="ellipsis"
                    overflow="hidden"
                    whiteSpace="nowrap"
                    sx={{ maxWidth: 200 }}>
                    {loadingWallets ? 'initializing' : loadingUpdateProfile ? 'updating' : ''}
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
            <LoadingConnectWalletButton isEmbeddedSigner title="Next" />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  ) : (
    <Dialog
      open={showSuccessDialog}
      onClose={() => {
        setShowSuccessDialog(false);
        navigate(0);
      }}
      PaperProps={{
        sx: {
          borderRadius: 5,
          maxWidth: 350
        }
      }}
      sx={{
        zIndex: 1451,
        backdropFilter: 'blur(3px)'
      }}>
      <DialogContent>
        <Stack spacing={2} alignItems="center" py={3}>
          <HiOutlineCheckCircle style={{ fontSize: 65, color: green.A700, marginBottom: 1 }} />
          <Typography fontSize={18} fontWeight="bold" textAlign="center">
            <i>
              <b>{walletTitle}</b>
            </i>{' '}
            flow was successfully created!
          </Typography>
          <Stack direction="row" spacing={1} width="100%">
            <Button
              fullWidth
              variant="outlined"
              size="small"
              color="inherit"
              onClick={() => {
                navigate('/payment/create?recipient=' + createdFlow?.wallets?.[0].address);
              }}
              sx={{
                height: 45,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: 14,
                fontWeight: 'normal',
                '&:hover': { backgroundColor: 'action.hover' },
                borderColor: 'divider'
              }}>
              Top Up
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              color="inherit"
              onClick={() => {
                closeStateCallback();
                setShowSuccessDialog(false);
                navigate(0);
              }}
              sx={{
                height: 45,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: 14,
                fontWeight: 'normal',
                '&:hover': { backgroundColor: 'action.hover' },
                borderColor: 'divider'
              }}>
              Continue
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
