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
  Avatar,
  CircularProgress,
  Button
} from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { Check, Error } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import axios from 'axios';
import { ProfileType } from '../types/ProfleType';
import { toast } from 'react-toastify';

export type ShareDialogProps = DialogProps &
  CloseCallbackType & {
    username?: string | undefined;
  };

const API_URL = import.meta.env.VITE_PAYFLOW_SERVICE_API_URL;

export default function OnboardingDialog({ closeStateCallback, ...props }: ShareDialogProps) {
  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  const [username, setUsername] = useState<string>(props.username ?? '');
  const [isUsernameAvailble, setUserAvailable] = useState<boolean>();

  useMemo(async () => {
    if (username) {
      try {
        const response = await axios.get(`${API_URL}/api/user/${username}`, {
          withCredentials: true
        });
        const profile = (await response.data) as ProfileType;

        setUserAvailable(!profile);
      } catch (error) {
        setUserAvailable(undefined);
        console.log(2);
      }
    } else {
      setUserAvailable(undefined);
      console.log(3);
    }
  }, [username]);

  async function updateUsername() {
    if (username) {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/user/me`,
          username,

          {
            headers: {
              'Content-Type': 'application/text'
            },
            withCredentials: true
          }
        );
        if (response.status === 200) {
          toast.success(`Successfully claimed username: ${username}`);
        }
        console.log(response.status);
      } catch (error) {
        console.log(error);
      }
    }
  }

  async function createMainFlow() {}

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
            Let's setup your profile
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', justifyContent: 'center' }}>
        <Stack m={1} direction="column" spacing={3}>
          <Typography>Claim username</Typography>
          <TextField
            error={username !== '' && !isUsernameAvailble}
            helperText={
              username &&
              (isUsernameAvailble ? 'username is available' : 'username is not available')
            }
            margin="dense"
            fullWidth
            defaultValue={username}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Avatar src="/logo.svg" sx={{ width: 30, height: 30 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {username ? (
                    isUsernameAvailble ? (
                      <Check color="success" />
                    ) : (
                      <Error color="error" />
                    )
                  ) : (
                    <></>
                  )}
                </InputAdornment>
              ),
              inputProps: { maxLength: 42, inputMode: 'text' },
              sx: { borderRadius: 3 }
            }}
            onChange={async (event) => {
              setUsername(event.target.value);
            }}
          />
          <Button
            disabled={!isUsernameAvailble}
            variant="contained"
            onClick={async () => {
              await updateUsername();
            }}
            sx={{ borderRadius: 3 }}>
            Claim
          </Button>

          <Typography>Create main flow </Typography>
          <Button
            variant="contained"
            onClick={async () => {
              await createMainFlow();
            }}
            sx={{ borderRadius: 3 }}>
            Create
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
