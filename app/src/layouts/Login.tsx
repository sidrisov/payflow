import { Box, Container, Stack, Typography } from '@mui/material';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Helmet } from 'react-helmet-async';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import { useAccount } from 'wagmi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import OnboardingDialog from '../components/OnboardingDialog';
import CenteredCircularProgress from '../components/CenteredCircularProgress';
import { ProfileType } from '../types/ProfleType';
import { blue, yellow } from '@mui/material/colors';

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
    <CustomThemeProvider darkMode={true}>
      <Helmet>
        <title> PayFlow | Login </title>
      </Helmet>
      {authStatus === 'loading' ? (
        <CenteredCircularProgress color="inherit" />
      ) : (
        (!profile || !address) && (
          <Container maxWidth="xl">
            <Box
              display="flex"
              height="100vh"
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between">
              <Box
                flexGrow={0.5}
                height="90vh"
                display="flex"
                alignItems="center"
                justifyContent="center"
                sx={{
                  background: blue[800],
                  borderTopLeftRadius: 25,
                  borderBottomLeftRadius: 25
                }}>
                <Stack spacing={2} alignItems="flex-start" width={600}>
                  <Typography pb={5} variant="h5" fontFamily="monospace" textAlign="center">
                    Abstract your web3 identity payments
                  </Typography>
                  <Typography variant="subtitle2" fontSize={16} fontFamily="monospace">
                    ✨ create a flow abstracted from your identity wallet
                  </Typography>
                  <Typography variant="subtitle2" fontSize={16} fontFamily="monospace">
                    🫂 discover users by farcaster, lens, ens, or address
                  </Typography>
                  <Typography variant="subtitle2" fontSize={16} fontFamily="monospace">
                    💸 send, receive, and request crypto
                  </Typography>
                  <Typography variant="subtitle2" fontSize={16} fontFamily="monospace">
                    🚀 and more coming
                  </Typography>
                </Stack>
              </Box>
              <Box
                flexGrow={0.5}
                height="90vh"
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                sx={{
                  background: yellow[800],
                  borderTopRightRadius: 25,
                  borderBottomRightRadius: 25
                }}>
                <Stack spacing={2} alignItems="center" width={600}>
                  <Typography pb={5} variant="h4" fontFamily="monospace" textAlign="center">
                    Welcome to payflow
                  </Typography>

                  <ConnectButton
                    label={address ? 'Sign & verify' : 'Connect wallet'}
                    showBalance={{ smallScreen: false, largeScreen: false }}
                  />
                </Stack>
              </Box>
            </Box>
          </Container>
        )
      )}
      {profile && address && (!profile.username || !profile.defaultFlow) && (
        <OnboardingDialog
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
