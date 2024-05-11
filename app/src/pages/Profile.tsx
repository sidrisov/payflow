import { useContext, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ProfileContext } from '../contexts/UserContext';
import {
  Avatar,
  Box,
  Button,
  Container,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { ProfileSection } from '../components/ProfileSection';
import LoadingButton from '@mui/lab/LoadingButton';
import { Check, Error, Sync } from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../utils/urlConstants';
import { ProfileType } from '../types/ProfleType';
import { updateProfile } from '../services/user';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { isAlphanumericPlusFewSpecialChars } from '../utils/regex';
import { green } from '@mui/material/colors';
import { QUERY_SOCIALS } from '../utils/airstackQueries';
import { useQuery } from '@airstack/airstack-react';
import { convertSocialResults, normalizeUsername } from '../services/socials';
import { FARCASTER_DAPP, LENS_DAPP } from '../utils/dapps';

export default function Profile() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { profile } = useContext(ProfileContext);

  const [displayName, setDisplayName] = useState<string>(profile?.displayName ?? '');
  const [username, setUsername] = useState<string>(profile?.username ?? '');
  const [profileImage, setProfileImage] = useState<string>(profile?.profileImage ?? '');

  const [usernameAvailable, setUsernameAvailable] = useState<boolean>();
  const [usernameValid, setUsernameValid] = useState<boolean>();

  const [loadingUpdateProfile, setLoadingUpdateProfile] = useState<boolean>(false);

  const navigate = useNavigate();

  // TODO: fetch only on sync click event
  const { data: socialInfo, loading: loadingSocials } = useQuery(
    QUERY_SOCIALS,
    { identity: profile?.identity },
    {
      cache: true
    }
  );

  useMemo(async () => {
    if (username) {
      if (username === profile?.username) {
        setUsernameAvailable(true);
        setUsernameValid(true);
        return;
      }

      if (!isAlphanumericPlusFewSpecialChars(username)) {
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

  async function sync() {
    if (!loadingSocials && profile) {
      const identity = convertSocialResults(socialInfo.Wallet);

      console.log('Identity', identity);

      if (identity) {
        if (identity.meta?.socials && identity.meta?.socials.length > 0) {
          const socialInfo =
            identity.meta?.socials.find((s) => s.dappName === FARCASTER_DAPP) ??
            identity.meta?.socials.find((s) => s.dappName === LENS_DAPP) ??
            identity.meta?.socials[0];

          if (socialInfo.profileDisplayName) {
            setDisplayName(socialInfo.profileDisplayName);
          }

          const username = normalizeUsername(
            (socialInfo.dappName === LENS_DAPP
              ? socialInfo.profileName.replace('lens/@', '')
              : socialInfo.profileName) ?? identity.meta?.ens
          );

          if (username) {
            setUsername(username);
          }

          if (
            socialInfo.dappName === FARCASTER_DAPP ||
            !socialInfo.profileImage.includes('ipfs://')
          ) {
            setProfileImage(socialInfo.profileImage);
          }
        } else if (identity.meta?.ensAvatar) {
          setProfileImage(identity.meta?.ensAvatar);
        }
      }
    }
  }

  async function save() {
    const updatedProfile = {
      ...profile,
      displayName,
      username,
      profileImage
    } as ProfileType;

    setLoadingUpdateProfile(true);

    try {
      const success = await updateProfile(updatedProfile);

      if (success) {
        toast.success('Saved');
        navigate(0);
      } else {
        toast.error('Failed! Try again');
      }
    } finally {
      setLoadingUpdateProfile(false);
    }
  }

  return (
    profile && (
      <>
        <Helmet>
          <title> Payflow | Profile </title>
        </Helmet>
        <Container maxWidth="xs" sx={{ height: '100%' }}>
          <Box
            height="100%"
            display="flex"
            flexDirection="column"
            justifyContent={isMobile ? 'space-between' : 'flex-start'}
            sx={{ p: 3 }}>
            <Stack mb={3} direction="column" spacing={3}>
              <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between">
                <ProfileSection profile={profile} avatarSize={48} maxWidth={200} />
                <Tooltip title="Metadata is synced from social graph">
                  <Button
                    startIcon={<Sync />}
                    sx={{ borderRadius: 5, color: 'inherit', textTransform: 'capitalize' }}
                    onClick={sync}>
                    Sync Metadata
                  </Button>
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                focused
                autoFocus
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
                  (!usernameValid && 'username invalid format')
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
              disabled={!usernameAvailable || !usernameValid || !username}
              fullWidth
              variant="outlined"
              size="large"
              color="inherit"
              onClick={save}
              sx={{ borderRadius: 5 }}>
              Save
            </LoadingButton>
          </Box>
        </Container>
      </>
    )
  );
}
