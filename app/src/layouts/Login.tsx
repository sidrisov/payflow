import { Box, Container } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import ProfileOnboardingDialog from '../components/dialogs/ProfileOnboardingDialog';
import { ProfileType } from '../types/ProfileType';
import { ConnectCard } from '../components/cards/ConnectCard';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';
import { useDarkMode } from '../utils/hooks/useDarkMode';
import { useMobile } from '../utils/hooks/useMobile';

export default function Login({
  authStatus,
  profile
}: {
  authStatus: string;
  profile: ProfileType | undefined;
}) {
  const prefersDarkMode = useDarkMode();

  const [searchParams] = useSearchParams();
  const username = searchParams.get('username');
  const invitationCode = searchParams.get('code');
  const redirect = searchParams.get('redirect');

  const isMobile = useMobile();

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
      <Container maxWidth="sm" sx={{ height: '80vh' }}>
        {authStatus === 'loading' ? (
          <LoadingPayflowEntryLogo />
        ) : (
          !profile && (
            <Box
              position="fixed"
              display="flex"
              alignItems="center"
              boxSizing="border-box"
              justifyContent="center"
              sx={{ inset: 0 }}>
              <ConnectCard />
            </Box>
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
      </Container>
    </CustomThemeProvider>
  );
}
