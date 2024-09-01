import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import ProfileOnboardingDialog from '../components/dialogs/ProfileOnboardingDialog';
import CenteredCircularProgress from '../components/CenteredCircularProgress';
import { ProfileType } from '../types/ProfileType';
import { ConnectCard } from '../components/cards/ConnectCard';

export default function Login({
  authStatus,
  profile
}: {
  authStatus: string;
  profile: ProfileType | undefined;
}) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const [searchParams] = useSearchParams();
  const username = searchParams.get('username');
  const invitationCode = searchParams.get('code');
  const redirect = searchParams.get('redirect');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = useNavigate();

  useEffect(() => {
    console.debug(profile, authStatus);

    if (profile && authStatus === 'authenticated') {
      if (profile.username) {
        console.debug('redirecting to: ', redirect ?? '/');
        navigate(redirect ?? '/');
      }
    }
  }, [authStatus, profile]);

  return (
    <CustomThemeProvider darkMode={prefersDarkMode}>
      <Helmet>
        <title> Payflow | Connect </title>
      </Helmet>
      {authStatus === 'loading' ? (
        <CenteredCircularProgress />
      ) : (
        !profile && (
          <Container maxWidth="sm">
            <Box
              position="fixed"
              display="flex"
              alignItems="center"
              boxSizing="border-box"
              justifyContent="center"
              sx={{ inset: 0 }}>
              <ConnectCard />
            </Box>
          </Container>
        )
      )}
      {profile && !profile.username && (
        <ProfileOnboardingDialog
          fullScreen={isMobile}
          open={!profile.username}
          profile={profile}
          closeStateCallback={() => {}}
          username={username}
          code={invitationCode}
        />
      )}
    </CustomThemeProvider>
  );
}
