import { useContext, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ProfileContext } from '../contexts/UserContext';
import {
  Avatar,
  Box,
  Container,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { ProfileSection } from '../components/ProfileSection';
import LoadingButton from '@mui/lab/LoadingButton';
import { Check, Error } from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../utils/urlConstants';
import { ProfileType } from '../types/ProfleType';
import { updateProfile } from '../services/user';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { isAlphanumericPlusFewSpecialChars } from '../utils/regex';
import { green } from '@mui/material/colors';

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
              <ProfileSection profile={profile} avatarSize={48} maxWidth={200} />
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
