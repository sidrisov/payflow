import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogProps,
  Stack,
  Typography,
  Box,
  TextField,
  InputAdornment
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { CloseCallbackType } from '../types/CloseCallbackType';
import { Check, Error } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import axios from 'axios';
import { ProfileType } from '../types/ProfleType';
import { toast } from 'react-toastify';
import { baseGoerli, optimismGoerli, zkSyncTestnet, zoraTestnet } from 'viem/chains';
import { keccak256, toHex } from 'viem';
import { useCreateSafeWallets as usePreCreateSafeWallets } from '../utils/hooks/useCreateSafeWallets';
import saveFlow from '../services/flow';

import { FlowWalletType } from '../types/FlowType';
import { DEFAULT_SAFE_VERSION } from '@safe-global/protocol-kit';
import { updateUsername } from '../services/user';

const API_URL = import.meta.env.VITE_PAYFLOW_SERVICE_API_URL;
const preCreateWalletChains = [baseGoerli, optimismGoerli, zoraTestnet, zkSyncTestnet];

export type ShareDialogProps = DialogProps &
  CloseCallbackType & {
    profile: ProfileType;
    username?: string | undefined;
  };

export default function OnboardingDialog({ closeStateCallback, ...props }: ShareDialogProps) {
  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  const { profile } = props;
  const [username, setUsername] = useState<string>(props.username ?? '');
  const [usernameAvailble, setUsernameAvailable] = useState<boolean>();

  const { loading: loadingWallets, created, create, wallets } = usePreCreateSafeWallets();

  // TODO: add random generator
  const saltNonce = keccak256(toHex('1'));

  useMemo(async () => {
    if (username) {
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
    create(profile.address, saltNonce, preCreateWalletChains);
  }

  useMemo(async () => {
    if (wallets && wallets.length === preCreateWalletChains.length) {
      const flowWallets = wallets.map(
        (wallet) =>
          ({
            address: wallet.address,
            network: wallet.chain.name,
            smart: true,
            safe: true,
            safeDeployed: false,
            safeSaltNonce: saltNonce,
            safeVersion: DEFAULT_SAFE_VERSION,
            master: profile.address
          } as FlowWalletType)
      );
      const success = await saveFlow({
        account: profile.address,
        title: 'Main flow',
        description: '',
        wallets: flowWallets
      });

      if (success) {
        toast.success('Default flow created!');
      } else {
        toast.error('Failed, try again');
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
              error={username !== '' && !usernameAvailble}
              helperText={
                username &&
                (usernameAvailble ? 'username is available' : 'username is not available')
              }
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
                setUsername(event.target.value);
              }}
            />
          </Box>

          <LoadingButton
            loading={loadingWallets}
            disabled={!usernameAvailble || !username}
            variant="contained"
            onClick={async () => {
              await createMainFlow();
              await updateUsername(username);
            }}
            sx={{ borderRadius: 3 }}>
            Complete
          </LoadingButton>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
