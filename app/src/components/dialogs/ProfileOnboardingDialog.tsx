import {
  Dialog,
  DialogContent,
  DialogProps,
  Stack,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Avatar,
  CircularProgress
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { CloseCallbackType } from '../../types/CloseCallbackType';
import { Check, Error } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import axios from 'axios';
import { ProfileType } from '@payflow/common';
import { toast } from 'react-toastify';

import { updateProfile } from '../../services/user';
import { useNavigate } from 'react-router';
import { API_URL } from '../../utils/urlConstants';
import { normalizeUsername } from '../../services/socials';
import { isAlphanumericPlusFewSpecialChars as isAlphanumericWithSpecials } from '../../utils/regex';
import { green, lightGreen, red } from '@mui/material/colors';
import { BackDialogTitle } from './BackDialogTitle';
import LoadingPayflowEntryLogo from '../LoadingPayflowEntryLogo';
import { useMobile } from '../../utils/hooks/useMobile';

export type ProfileOnboardingDialogProps = DialogProps &
  CloseCallbackType & {
    profile: ProfileType;
    username?: string | null;
    code?: string | null;
  };

export default function ProfileOnboardingDialog({
  closeStateCallback,
  profile,
  username: paramUsername,
  code: paramCode,
  ...props
}: ProfileOnboardingDialogProps) {
  const isMobile = useMobile();

  const [displayName, setDisplayName] = useState<string>(profile.displayName ?? '');
  const [username, setUsername] = useState<string>(paramUsername ?? '');
  const [code, setCode] = useState<string>(paramCode ?? '');
  const [profileImage, setProfileImage] = useState<string>(profile.profileImage ?? '');

  const [usernameAvailable, setUsernameAvailable] = useState<boolean>();
  const [usernameValid, setUsernameValid] = useState<boolean>();

  const [codeValid, setCodeValid] = useState<boolean>();
  const [whitelisted, setWhitelisted] = useState<boolean>();

  const [loadingUpdateProfile, setLoadingUpdateProfile] = useState<boolean>(false);

  const navigate = useNavigate();

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  // Social info auto-population removed - Airstack service no longer supported

  useMemo(async () => {
    const response = await axios.get(`${API_URL}/api/invitations/identity/${profile.identity}`, {
      withCredentials: true
    });
    setWhitelisted(response.data);
  }, [profile]);

  useMemo(async () => {
    if (username) {
      if (username === profile.username) {
        setUsernameAvailable(true);
        setUsernameValid(true);
        return;
      }

      if (!isAlphanumericWithSpecials(username)) {
        setUsernameValid(false);
        return;
      } else {
        setUsernameValid(true);
      }

      try {
        const response = await axios.get(`${API_URL}/api/user/${username}`);
        const profile = (await response.data) as ProfileType;

        setUsernameAvailable(!profile);
      } catch (error) {
        setUsernameAvailable(undefined);
      }
    } else {
      setUsernameAvailable(undefined);
    }
  }, [username]);

  useMemo(async () => {
    if (whitelisted) {
      return;
    }

    if (code) {
      try {
        const response = await axios.get(`${API_URL}/api/invitations/code/${code}`, {
          withCredentials: true
        });

        setCodeValid(response.data);
      } catch (error) {
        setCodeValid(undefined);
      }
    } else {
      setCodeValid(undefined);
    }
  }, [code, whitelisted]);

  async function updatedProfile() {
    const updatedProfile = {
      ...profile,
      displayName,
      username,
      profileImage
    } as ProfileType;

    setLoadingUpdateProfile(true);

    try {
      const success = await updateProfile(updatedProfile, code ?? undefined);

      if (success) {
        toast.success('Onboarding successfully completed');
        navigate('/');
      } else {
        toast.error('Failed to update profile, try again!');
      }
    } finally {
      setLoadingUpdateProfile(false);
    }
  }

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
        backdropFilter: 'blur(3px)'
      }}>
      <BackDialogTitle
        showOnDesktop
        title="Complete your profile"
        closeStateCallback={async () => {
          try {
            await axios.get(`${API_URL}/api/auth/logout`, {
              withCredentials: true
            });
            navigate(0);
          } catch (error) {
            toast.error('Failed to logout!');
          }
        }}
      />
      <DialogContent>
        <Box
          height="100%"
          display="flex"
          flexDirection="column"
          justifyContent={isMobile ? 'space-between' : 'flex-start'}
          p={1}>
          <Stack mb={3} spacing={3}>
            {whitelisted ? (
              <Typography textAlign="center" fontWeight="bold" color={lightGreen.A700}>
                Congratulations 🎉
                <br />
                Your identity is whitelisted!
              </Typography>
            ) : (
              <TextField
                error={code !== '' && !codeValid}
                helperText={code && !codeValid && 'invitation code is not valid'}
                fullWidth
                value={code}
                label={'Invitation Code'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {code ? (
                        codeValid ? (
                          <Check sx={{ color: green.A700 }} />
                        ) : (
                          <Error sx={{ color: red.A400 }} />
                        )
                      ) : (
                        <></>
                      )}
                    </InputAdornment>
                  ),
                  inputProps: { maxLength: 16, inputMode: 'text' },
                  sx: { borderRadius: 5 }
                }}
                onChange={async (event) => {
                  setCode(event.target.value.toLowerCase());
                }}
              />
            )}
            <TextField
              fullWidth
              value={displayName}
              label={'Display Name'}
              InputProps={{
                inputProps: { maxLength: 16, inputMode: 'text' },
                sx: { borderRadius: 5 }
              }}
              onChange={async (event) => {
                setDisplayName(event.target.value);
              }}
            />

            <TextField
              error={username !== '' && (!usernameAvailable || !usernameValid)}
              helperText={
                (username && !usernameAvailable && 'username not available') ||
                (username && !usernameValid && 'username invalid format')
              }
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
                      usernameAvailable && usernameValid ? (
                        <Check sx={{ color: green.A700 }} />
                      ) : (
                        <Error color="error" />
                      )
                    ) : (
                      <></>
                    )}
                  </InputAdornment>
                ),
                inputProps: { maxLength: 16, inputMode: 'text' },
                sx: { borderRadius: 5 }
              }}
              onChange={async (event) => {
                setUsername(event.target.value.toLowerCase());
              }}
            />

            <TextField
              fullWidth
              value={profileImage}
              label={'Profile Image'}
              InputProps={{
                inputProps: { maxLength: 128, inputMode: 'url' },
                sx: { borderRadius: 5 },
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
          </Stack>
          <LoadingButton
            loading={loadingUpdateProfile}
            disabled={!usernameAvailable || !usernameValid || !(whitelisted || codeValid)}
            fullWidth
            variant="outlined"
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
                  {loadingUpdateProfile ? 'updating profile' : ''}
                </Typography>
              </Stack>
            }
            size="large"
            color="inherit"
            onClick={async () => {
              await updatedProfile();
            }}
            sx={{ borderRadius: 5 }}>
            Complete
          </LoadingButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
