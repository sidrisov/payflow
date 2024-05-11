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
  useTheme,
  useMediaQuery
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { CloseCallbackType } from '../../types/CloseCallbackType';
import { Check, Error } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import axios from 'axios';
import { ProfileType } from '../../types/ProfleType';
import { toast } from 'react-toastify';

import { updateProfile } from '../../services/user';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../utils/urlConstants';
import { convertSocialResults, normalizeUsername } from '../../services/socials';
import { useQuery } from '@airstack/airstack-react';
import CenteredCircularProgress from '../CenteredCircularProgress';
import { isAlphanumericPlusFewSpecialChars as isAlphanumericWithSpecials } from '../../utils/regex';
import { green, lightGreen, red } from '@mui/material/colors';
import { FARCASTER_DAPP, LENS_DAPP } from '../../utils/dapps';
import { QUERY_SOCIALS } from '../../utils/airstackQueries';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  const { data: socialInfo, loading: loadingSocials } = useQuery(
    QUERY_SOCIALS,
    { identity: profile.identity },
    {
      cache: true
    }
  );

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  // make a best effort to pull social info for the user
  useMemo(async () => {
    if (socialInfo) {
      console.log(loadingSocials, socialInfo);

      const identity = convertSocialResults(socialInfo.Wallet);

      console.log(identity);

      if (identity) {
        if (identity.meta?.socials && identity.meta?.socials.length > 0) {
          const socialInfo =
            identity.meta?.socials.find((s) => s.dappName === FARCASTER_DAPP) ??
            identity.meta?.socials.find((s) => s.dappName === LENS_DAPP) ??
            identity.meta?.socials[0];

          if (!displayName) {
            setDisplayName(socialInfo.profileDisplayName);
          }

          if (!username || username === profile.identity) {
            setUsername(
              normalizeUsername(
                socialInfo.dappName === LENS_DAPP
                  ? socialInfo.profileName.replace('lens/@', '')
                  : socialInfo.profileName
              )
            );
          }

          if (!profileImage) {
            if (
              socialInfo.dappName === FARCASTER_DAPP ||
              !socialInfo.profileImage.includes('ipfs://')
            ) {
              setProfileImage(socialInfo.profileImage);
            }
          }
        } else {
          // TODO: allow .eth, .xyz, etc in the username?
          if (!displayName && identity.meta?.ens) {
            //setDisplayName(meta.ens);
          }

          if ((!username || username === profile.identity) && identity.meta?.ens) {
            setUsername(normalizeUsername(identity.meta.ens));
          }

          if (!profile.profileImage && identity.meta?.ensAvatar) {
            setProfileImage(identity.meta?.ensAvatar);
          }
        }
      }
    }
  }, [socialInfo]);

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

  return loadingSocials ? (
    <Box alignSelf="stretch" justifySelf="stretch">
      <CenteredCircularProgress />
    </Box>
  ) : (
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
            Complete your profile
          </Typography>
        </Box>
      </DialogTitle>
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
                <Typography variant="button">
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
