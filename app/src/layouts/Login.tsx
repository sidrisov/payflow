import { Box, Container, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Helmet } from 'react-helmet-async';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import OnboardingDialog from '../components/OnboardingDialog';
import CenteredCircularProgress from '../components/CenteredCircularProgress';
import { ProfileType } from '../types/ProfleType';
import { blue, yellow } from '@mui/material/colors';
import { toast } from 'react-toastify';

export default function Login({
  authStatus,
  profile
}: {
  authStatus: string;
  profile: ProfileType | undefined;
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
    <CustomThemeProvider darkMode={true}>
      <Helmet>
        <title> Payflow | Login </title>
      </Helmet>
      {authStatus === 'loading' ? (
        <CenteredCircularProgress />
      ) : (
        (!profile || !address) && (
          <Container maxWidth="xl" sx={{ py: '4vh' }}>
            <Box
              display="flex"
              flexDirection={isMobile ? 'column-reverse' : 'row'}
              alignItems={isMobile ? 'center' : 'stretch'}
              height="90vh">
              <Box
                m={1}
                p={3}
                flexGrow={1}
                flexDirection="column"
                display="flex"
                alignItems="center"
                justifyContent="center"
                width={isMobile ? 300 : 600}
                sx={{
                  background: blue[800],
                  borderBottomLeftRadius: 25,
                  borderBottomRightRadius: isMobile ? 25 : 0,
                  borderTopLeftRadius: isMobile ? 0 : 25
                }}>
                <Typography
                  variant={isMobile ? 'h6' : 'h5'}
                  fontFamily="monospace"
                  textAlign="center">
                  Abstracted onchain social payments
                </Typography>

                <Stack mt={3} p={1} spacing={2} alignItems="flex-start">
                  <Typography
                    variant="subtitle2"
                    fontSize={isMobile ? 14 : 16}
                    fontFamily="monospace">
                    ✨ create a flow abstracted from your identity wallet
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    fontSize={isMobile ? 14 : 16}
                    fontFamily="monospace">
                    🫂 discover users by farcaster, lens, ens, or address
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    fontSize={isMobile ? 14 : 16}
                    fontFamily="monospace">
                    💸 send, receive, request crypto, and more coming
                  </Typography>
                </Stack>
              </Box>
              <Box
                m={1}
                p={1}
                flexGrow={1}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                width={isMobile ? 300 : 600}
                sx={{
                  background: yellow[800],
                  borderTopLeftRadius: isMobile ? 25 : 0,
                  borderTopRightRadius: 25,
                  borderBottomRightRadius: isMobile ? 0 : 25
                }}>
                <Typography flexWrap="wrap" variant="h4" fontFamily="monospace" textAlign="center">
                  Welcome to payflow
                </Typography>

                <Box my={3}>
                  <ConnectButton
                    label={address ? 'Sign & verify' : 'Connect wallet'}
                    showBalance={{ smallScreen: false, largeScreen: false }}
                  />
                </Box>
              </Box>
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
