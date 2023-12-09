import { AirstackProvider, init } from '@airstack/airstack-react';
import { Card, CircularProgress, Container, Stack, Typography, useMediaQuery } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { AppSettings } from '../types/AppSettingsType';
import { useMemo, useState } from 'react';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import { getAllActiveProfiles } from '../services/user';
import { ProfileType } from '../types/ProfleType';
import ProfileSectionButton from '../components/ProfileSectionButton';
import { delay } from '../utils/delay';

const AIRSTACK_API_KEY = import.meta.env.VITE_AIRSTACK_API_KEY;

init(AIRSTACK_API_KEY);

const appSettingsStorageItem = localStorage.getItem('appSettings');
const appSettingsStored = appSettingsStorageItem
  ? (JSON.parse(appSettingsStorageItem) as AppSettings)
  : null;

export default function Leaderboard() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [appSettings] = useState<AppSettings>(
    appSettingsStored
      ? appSettingsStored
      : {
          autoConnect: import.meta.env.VITE_INIT_CONNECT === 'true',
          darkMode: prefersDarkMode
        }
  );

  const [profiles, setProfiles] = useState<ProfileType[]>();
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>();

  useMemo(() => {
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
  }, [appSettings]);

  useMemo(async () => {
    setLoadingProfiles(true);
    try {
      await delay(1000);
      const profiles = await getAllActiveProfiles();
      setProfiles(profiles);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  return (
    <AirstackProvider apiKey={AIRSTACK_API_KEY}>
      <CustomThemeProvider darkMode={appSettings.darkMode}>
        <Helmet>
          <title> Payflow | Leaderboard </title>
        </Helmet>
        <Container maxWidth="xs">
          <Card
            elevation={5}
            sx={{
              p: 3,
              mt: 5,
              border: 2,
              borderColor: 'divider',
              borderRadius: 5,
              borderStyle: 'double',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'center',
              minHeight: 300
            }}>
            <Typography my={1} textAlign="center" variant="h6">
              Leaderboard
            </Typography>

            {loadingProfiles ? (
              <CircularProgress color="inherit" size={20} sx={{ m: 1 }} />
            ) : profiles && profiles.length ? (
              <Stack p={1} maxHeight="65vhvh" overflow="auto" spacing={3} alignItems="flex-start">
                {profiles.map((profile, index) => (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2">{index + 1}</Typography>
                    <ProfileSectionButton ml={2} width={150} profile={profile} />
                    <Typography variant="caption">
                      joined on: {new Date(profile.createdDate).toLocaleDateString()}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography textAlign="center" variant="subtitle2">
                No profiles available
              </Typography>
            )}
          </Card>
        </Container>
      </CustomThemeProvider>
    </AirstackProvider>
  );
}
