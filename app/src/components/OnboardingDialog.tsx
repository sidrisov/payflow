import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogProps,
  Stack,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Avatar
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { CloseCallbackType } from '../types/CloseCallbackType';
import { Check, Error } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import axios from 'axios';
import { ProfileType } from '../types/ProfleType';
import { toast } from 'react-toastify';
import { useCreateSafeWallets as usePreCreateSafeWallets } from '../utils/hooks/useCreateSafeWallets';

import { FlowType, FlowWalletType } from '../types/FlowType';
import { DEFAULT_SAFE_VERSION } from '@safe-global/protocol-kit';
import { updateProfile } from '../services/user';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../utils/urlConstants';
import { DEFAULT_FLOW_PRE_CREATE_WALLET_CHAINS } from '../utils/networks';
import { keccak256, toBytes } from 'viem';

export type OnboardingDialogProps = DialogProps &
  CloseCallbackType & {
    profile: ProfileType;
    username?: string | null;
    code?: string | null;
  };

const SALT_NONCE = import.meta.env.VITE_DEFAULT_FLOW_CREATE2_SALT_NONCE;

export default function OnboardingDialog({
  closeStateCallback,
  profile,
  username: paramUsername,
  code,
  ...props
}: OnboardingDialogProps) {
  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  const [displayName, setDisplayName] = useState<string>(profile.displayName ?? '');
  const [username, setUsername] = useState<string>(paramUsername ?? profile.username ?? '');
  const [profileImage, setProfileImage] = useState<string>(profile.profileImage ?? '');

  const [usernameAvailble, setUsernameAvailable] = useState<boolean>();

  const { loading: loadingWallets, create, wallets } = usePreCreateSafeWallets();
  const [loadingUpdateProfile, setLoadingUpdateProfile] = useState<boolean>(false);

  const navigate = useNavigate();

  useMemo(async () => {
    if (username) {
      if (username === profile.username) {
        setUsernameAvailable(true);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/user/${username}`, {
          withCredentials: true
        });
        const profile = (await response.data) as ProfileType;

        setUsernameAvailable(!profile);
      } catch (error) {
        setUsernameAvailable(undefined);
      }
    } else {
      setUsernameAvailable(undefined);
    }
  }, [username]);

  async function createMainFlow() {
    console.log(profile.address, SALT_NONCE, DEFAULT_FLOW_PRE_CREATE_WALLET_CHAINS);
    create(profile.address, SALT_NONCE, DEFAULT_FLOW_PRE_CREATE_WALLET_CHAINS);
  }

  useMemo(async () => {
    if (wallets && wallets.length === DEFAULT_FLOW_PRE_CREATE_WALLET_CHAINS.length) {
      const flowWallets = wallets.map(
        (wallet) =>
          ({
            address: wallet.address,
            network: wallet.chain.id,
            version: DEFAULT_SAFE_VERSION
          } as FlowWalletType)
      );

      const defaultFlow = {
        account: profile.address,
        title: 'default',
        description: '',
        walletProvider: 'safe',
        saltNonce: SALT_NONCE,
        wallets: flowWallets
      } as FlowType;

      const updatedProfile = {
        ...profile,
        displayName,
        username,
        profileImage,
        defaultFlow
      } as ProfileType;

      setLoadingUpdateProfile(true);

      try {
        const success = await updateProfile(updatedProfile, code ?? undefined);

        if (success) {
          toast.success('Onboarding successfully completed');
          navigate('/');
        } else {
          toast.error('Failed, try again');
        }
      } finally {
        setLoadingUpdateProfile(false);
      }
    }
  }, [wallets]);

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
            Complete your sign up!
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', justifyContent: 'center' }}>
        <Stack m={1} direction="column" spacing={3}>
          <Box>
            <TextField
              margin="dense"
              fullWidth
              value={displayName}
              label={'Display Name'}
              InputProps={{
                inputProps: { maxLength: 16, inputMode: 'text' },
                sx: { borderRadius: 3 }
              }}
              onChange={async (event) => {
                setDisplayName(event.target.value);
              }}
            />

            <TextField
              error={username !== '' && !usernameAvailble}
              helperText={username && !usernameAvailble && 'username is not available'}
              margin="dense"
              fullWidth
              value={username}
              label={'Username'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography variant="subtitle2">payflow.me/</Typography>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {username ? (
                      usernameAvailble ? (
                        <Check color="success" />
                      ) : (
                        <Error color="error" />
                      )
                    ) : (
                      <></>
                    )}
                  </InputAdornment>
                ),
                inputProps: { maxLength: 16, inputMode: 'text' },
                sx: { borderRadius: 3 }
              }}
              onChange={async (event) => {
                setUsername(event.target.value.toLowerCase());
              }}
            />

            <TextField
              margin="dense"
              fullWidth
              value={profileImage}
              label={'Profile Image'}
              InputProps={{
                inputProps: { maxLength: 64, inputMode: 'url' },
                sx: { borderRadius: 3 },
                endAdornment: (
                  <InputAdornment position="end">
                    {profileImage && <Avatar src={profileImage} />}
                  </InputAdornment>
                )
              }}
              onChange={async (event) => {
                setProfileImage(event.target.value);
              }}
            />
          </Box>

          <LoadingButton
            loading={loadingWallets || loadingUpdateProfile}
            disabled={!usernameAvailble || !username}
            variant="outlined"
            onClick={async () => {
              await createMainFlow();
            }}
            sx={{ borderRadius: 3 }}>
            {loadingWallets
              ? 'Creating default flow ...'
              : loadingUpdateProfile
              ? 'Updating profile...'
              : 'Complete'}
          </LoadingButton>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
