import { AirstackProvider, init } from '@airstack/airstack-react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { AppSettings } from '../types/AppSettingsType';
import { useMemo, useState } from 'react';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import { getAllActiveProfiles } from '../services/user';
import { ProfileType } from '../types/ProfleType';
import ProfileSectionButton from '../components/ProfileSectionButton';
import { delay } from '../utils/delay';
import { HomeOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import HideOnScroll from '../components/HideOnScroll';
import HomeLogo from '../components/Logo';
import SearchIdentityDialog from '../components/SearchIdentityDialog';

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
          darkMode: prefersDarkMode
        }
  );

  console.debug(appSettings);

  const [profiles, setProfiles] = useState<ProfileType[]>();
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>();

  const [openSearchIdentity, setOpenSearchIdentity] = useState<boolean>(false);

  const navigate = useNavigate();

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

  // TODO: refactor app bar into a separate reusable component
  return (
    <AirstackProvider apiKey={AIRSTACK_API_KEY}>
      <CustomThemeProvider darkMode={appSettings.darkMode}>
        <Helmet>
          <title> Payflow | Leaderboard </title>
        </Helmet>
        <Container maxWidth="xs">
          <HideOnScroll>
            <AppBar
              position="sticky"
              color="transparent"
              elevation={0}
              sx={{ backdropFilter: 'blur(5px)' }}>
              <Toolbar>
                <Box
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between"
                  flexGrow={1}>
                  <Stack direction="row" alignItems="center">
                    <IconButton onClick={() => navigate('/home')}>
                      <HomeOutlined />
                    </IconButton>
                    <HomeLogo />
                  </Stack>
                  <Box
                    ml={1}
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    component={Button}
                    color="inherit"
                    sx={{
                      width: 120,
                      borderRadius: 5,
                      border: 1,
                      borderColor: 'inherit',
                      textTransform: 'none',
                      justifyContent: 'space-evenly'
                    }}
                    onClick={async () => {
                      setOpenSearchIdentity(true);
                    }}>
                    <Avatar src="payflow.png" sx={{ width: 24, height: 24 }} />
                    <Typography variant="subtitle2">Search ... </Typography>
                  </Box>
                </Box>
              </Toolbar>
            </AppBar>
          </HideOnScroll>
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
              <Stack p={1} maxHeight="65vh" overflow="auto" spacing={3} alignItems="flex-start">
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
        <SearchIdentityDialog
          open={openSearchIdentity}
          closeStateCallback={() => {
            setOpenSearchIdentity(false);
          }}
        />
      </CustomThemeProvider>
    </AirstackProvider>
  );
}
