import { useContext, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { UserContext } from '../contexts/UserContext';
import {
  Avatar,
  Container,
  InputAdornment,
  Stack,
  TextField,
  Typography
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
import { isAlphanumeric } from '../utils/regex';

export default function Profile() {
  const { profile } = useContext(UserContext);

  const [displayName, setDisplayName] = useState<string>(profile.displayName ?? '');
  const [username, setUsername] = useState<string>(profile.username ?? '');
  const [profileImage, setProfileImage] = useState<string>(profile.profileImage ?? '');

  const [usernameAvailble, setUsernameAvailable] = useState<boolean>();

  const [loadingUpdateProfile, setLoadingUpdateProfile] = useState<boolean>(false);

  const navigate = useNavigate();

  useMemo(async () => {
    if (username) {
      if (username === profile.username) {
        setUsernameAvailable(true);
        return;
      }

      if (!isAlphanumeric(username)) {
        setUsernameAvailable(false);
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
    <>
      <Helmet>
        <title> Payflow | Profile </title>
      </Helmet>
      <Container maxWidth="sm" sx={{ p: 3 }}>
        <ProfileSection profile={profile} avatarSize={48} />
        <Stack mt={3} direction="column" spacing={3}>
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
            error={username !== '' && !usernameAvailble}
            helperText={username && !usernameAvailble && 'username is not available'}
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
              inputProps: { maxLength: 64, inputMode: 'url' },
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

          <LoadingButton
            loading={loadingUpdateProfile}
            disabled={!usernameAvailble || !username}
            variant="outlined"
            size="large"
            onClick={save}
            sx={{ borderRadius: 5 }}>
            Save
          </LoadingButton>
        </Stack>
      </Container>
    </>
  );
}
