import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import OnboardingDialog from '../components/OnboardingDialog';
import CenteredCircularProgress from '../components/CenteredCircularProgress';
import { ProfileType } from '../types/ProfleType';
import { toast } from 'react-toastify';
import { ConnectCard } from '../components/ConnectCard';
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

  const { address } = useAccount();

  const { chain } = useNetwork();
  const { switchNetwork, pendingChainId } = useSwitchNetwork();

  useMemo(() => {
    if (authStatus === 'unauthenticated' && chain && chain.id !== 1 && pendingChainId !== 1) {
      toast.warning('Please, switch to Ethereum!', { autoClose: 10000 });
      switchNetwork?.(1);
    }
  }, [chain, pendingChainId, authStatus]);

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
    <CustomThemeProvider darkMode={settings.darkMode}>
      <Helmet>
        <title> Payflow | Connect </title>
      </Helmet>
      {authStatus === 'loading' ? (
        <CenteredCircularProgress />
      ) : (
        (!profile || !address) && (
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
      {profile && address && (!profile.username || !profile.defaultFlow) && (
        <OnboardingDialog
          fullScreen={isMobile}
          open={!profile.username || !profile.defaultFlow}
          profile={profile}
          closeStateCallback={() => {}}
          username={username}
          code={invitationCode}
        />
      )}
    </CustomThemeProvider>
  );
}
