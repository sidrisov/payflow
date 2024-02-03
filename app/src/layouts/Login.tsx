import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import { useAccount, useSwitchChain } from 'wagmi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import ProfileOnboardingDialog from '../components/dialogs/ProfileOnboardingDialog';
import CenteredCircularProgress from '../components/CenteredCircularProgress';
import { ProfileType } from '../types/ProfleType';
import { toast } from 'react-toastify';
import { ConnectCard } from '../components/cards/ConnectCard';
import { AppSettings } from '../types/AppSettingsType';

export default function Login({
  authStatus,
  profile,
  settings
}: {
  authStatus: string;
  profile: ProfileType | undefined;
  settings: AppSettings;
}) {
  const [searchParams] = useSearchParams();
  const username = searchParams.get('username');
  const invitationCode = searchParams.get('code');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = useNavigate();

  const { chain } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  useMemo(() => {
    if (authStatus === 'unauthenticated' && chain && chain.id !== 1 && !isPending) {
      toast.warning('Please, switch to Ethereum!', { autoClose: 10000 });
      switchChain?.({ chainId: 1 });
    }
  }, [chain, isPending, authStatus]);

  useEffect(() => {
    console.debug(profile, authStatus);

    if (profile && authStatus === 'authenticated') {
      if (profile.username) {
        console.debug('redirecting to /');
        navigate('/');
      }
    }
  }, [authStatus, profile]);

  return (
    <CustomThemeProvider darkMode={settings.darkMode}>
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
