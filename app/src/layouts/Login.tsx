import { AppBar, Box, Card, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import { DarkModeOutlined, LightModeOutlined } from '@mui/icons-material';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import HideOnScroll from '../components/HideOnScroll';
import { Helmet } from 'react-helmet-async';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import { useAccount } from 'wagmi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import OnboardingDialog from '../components/OnboardingDialog';
import CenteredCircularProgress from '../components/CenteredCircularProgress';
import { ProfileType } from '../types/ProfleType';
import { AppSettings } from '../types/AppSettingsType';

export default function Login({
  authStatus,
  profile,
  appSettings,
  setAppSettings
}: {
  authStatus: string;
  profile: ProfileType | undefined;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}) {
  const [searchParams] = useSearchParams();
  const username = searchParams.get('username');

  const navigate = useNavigate();

  const { address } = useAccount();

  useEffect(() => {
    console.log(profile, authStatus);

    if (profile && address === profile.address && authStatus === 'authenticated') {
      if (profile.username && profile.defaultFlow) {
        console.log('redirecting to /');
        navigate('/');
      }
    }
  }, [authStatus, profile, address]);

  return (
    <CustomThemeProvider darkMode={appSettings.darkMode}>
      <Helmet>
        <title> PayFlow | Login </title>
      </Helmet>
      {authStatus === 'loading' ? (
        <CenteredCircularProgress />
      ) : (
        (!profile || !address) && (
          <>
            <HideOnScroll>
              <AppBar
                position="sticky"
                color="transparent"
                elevation={0}
                sx={{ alignItems: 'flex-end', backdropFilter: 'blur(5px)' }}>
                <Toolbar
                  sx={{
                    justifyContent: 'space-between'
                  }}>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      onClick={() =>
                        setAppSettings({ ...appSettings, darkMode: !appSettings.darkMode })
                      }>
                      {appSettings.darkMode ? <DarkModeOutlined /> : <LightModeOutlined />}
                    </IconButton>
                  </Stack>
                </Toolbar>
              </AppBar>
            </HideOnScroll>
            <Box
              position="fixed"
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{ inset: 0 }}>
              <Card
                elevation={15}
                sx={{
                  p: 5,
                  width: 300,
                  height: 250,
                  border: 2,
                  borderStyle: 'double',
                  borderRadius: 5,
                  borderColor: 'divider'
                }}>
                <Box
                  height="100%"
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                  alignItems="center">
                  <Typography variant="h6">Welcome To PayFlow</Typography>
                  <Typography variant="h6">{username}</Typography>
                  <Typography alignSelf="flex-start" variant="subtitle2">
                    Wallet Connected: {address ? 'Yes' : 'No'}
                  </Typography>
                  <Typography alignSelf="flex-start" variant="subtitle2">
                    Authenticated:{' '}
                    {profile && address === profile.address && authStatus === 'authenticated'
                      ? 'Yes'
                      : 'No'}
                  </Typography>
                  <ConnectButton
                    label={address ? 'Verify' : 'Connect'}
                    showBalance={{ smallScreen: false, largeScreen: false }}
                  />
                </Box>
              </Card>
            </Box>
          </>
        )
      )}
      {profile && address && (!profile.username || !profile.defaultFlow) && (
        <OnboardingDialog
          open={!profile.username || !profile.defaultFlow}
          profile={profile}
          closeStateCallback={() => {}}
          username={username ?? ''}
        />
      )}
    </CustomThemeProvider>
  );
}
