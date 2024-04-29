import { Avatar, Box, Card, Divider, Stack, Typography } from '@mui/material';
import { AuthClientError, SignInButton, StatusAPIResponse } from '@farcaster/auth-kit';

import { green, grey } from '@mui/material/colors';
import { CheckCircle } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { API_URL } from '../../utils/urlConstants';
import { toast } from 'react-toastify';
import axios from 'axios';

import { FarcasterAccountsCard } from './FarcasterAccountsCard';
import { SiweMessage } from 'siwe';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useWalletClient } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import LoadingButton from '@mui/lab/LoadingButton';
import { useSetActiveWallet } from '@privy-io/wagmi';

const FARCASTER_CONNECT_ENABLED = import.meta.env.VITE_FARCASTER_CONNECT_ENABLED === 'true';

function FeatureSection({ description }: { description: string }) {
  return (
    <Stack spacing={1} direction="row" alignItems="center">
      <CheckCircle color="inherit" />
      <Typography variant="subtitle2" fontSize={15} fontWeight="bold">
        {description}
      </Typography>
    </Stack>
  );
}

export type AuthenticationStatus = 'loading' | 'unauthenticated' | 'authenticated';

export function ConnectCard() {
  const [siwfNonce, setSiwfNonce] = useState<string>();
  const [sifwResponse, setSifeResponse] = useState<StatusAPIResponse>();

  const { connectWallet, isModalOpen } = usePrivy();

  const { data: signer, isSuccess } = useWalletClient();
  const [authStatus, setAuthStatus] = useState<AuthenticationStatus>('unauthenticated');

  const navigate = useNavigate();

  const { wallets } = useWallets();
  const { ready } = usePrivy();
  const { setActiveWallet } = useSetActiveWallet();

  useEffect(() => {
    if (ready && wallets.length !== 0) {
      // filter out embedded wallets
      const wallet = wallets.filter((w) => w.walletClientType !== 'privy')[0] ?? wallets[0];
      console.debug('Setting active wallet: ', wallet);
      setActiveWallet(wallet);
    }
  }, [wallets, ready]);

  useMemo(async () => {
    if (FARCASTER_CONNECT_ENABLED && !siwfNonce) {
      const response = await axios.get(`${API_URL}/api/auth/nonce`, {
        withCredentials: true
      });

      const nonce = response.data;

      console.debug('Nonce: ', nonce);

      setSiwfNonce(nonce);
    }
  }, []);

  console.log(signer);

  async function signInWithEthereum() {
    if (isSuccess && signer && authStatus === 'unauthenticated') {
      setAuthStatus('loading');
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address: signer.account.address,
        statement: 'Sign in with Ethereum to Payflow',
        uri: window.location.origin,
        version: '1',
        chainId: signer.chain.id,
        nonce: siwfNonce
      });

      try {
        const signature = await signer.signMessage({
          message: siweMessage.prepareMessage()
        });

        console.log(siweMessage, signature);

        const response = await axios.post(
          `${API_URL}/api/auth/verify/${siweMessage.address}`,
          { message: siweMessage, signature },
          { withCredentials: true }
        );

        if (response.status === 200) {
          setAuthStatus('authenticated');
          navigate('/');
        } else {
          toast.error('Failed to sign in with Ethereum');
          setAuthStatus('unauthenticated');
        }
      } catch (error) {
        setAuthStatus('unauthenticated');
      }
    }
  }

  async function onFarcasterSignInError(error: AuthClientError | undefined) {
    setSiwfNonce(undefined);
    if (error) {
      console.error(error);
    }
    toast.error('Failed to sign in with Farcaster. Try again!');
  }

  return !sifwResponse || sifwResponse.state !== 'completed' ? (
    <Card
      elevation={5}
      sx={{
        m: 2,
        p: 1,
        border: 1.5,
        borderRadius: 5,
        borderColor: 'divider',
        maxWidth: 400
      }}>
      <Box
        m={1}
        p={1}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          borderRadius: 5
        }}>
        <Stack my={3} spacing={1} direction="row" alignItems="center">
          <Avatar src="/payflow.png" />
          <Typography flexWrap="wrap" variant="h5" textAlign="center">
            welcome to
          </Typography>

          <Typography flexWrap="wrap" variant="h5" textAlign="center">
            <b>
              <u>payflow</u>
            </b>
          </Typography>
        </Stack>

        <Stack my={1} p={1} spacing={2} alignItems="flex-start" color={green.A700}>
          <FeatureSection description="payment flows linked to social layer" />
          <FeatureSection description="discover friends by their social layer" />
          <FeatureSection description="send, receive, and embed payments" />
        </Stack>

        <Card
          sx={{ mt: 1, mb: 2, p: 1.5, borderRadius: 3, border: 1, borderColor: 'divider' }}
          elevation={5}>
          <Typography variant="subtitle2" textAlign="center">
            <u>Web3 Social Layer</u>
          </Typography>

          <Typography
            mt={1}
            mb={2}
            variant="caption"
            fontWeight="bold"
            textAlign="center"
            color={grey[400]}>
            On-chain identity like Farcaster, Lens, or ENS
          </Typography>
        </Card>

        <Stack my={2} spacing={1} alignItems="center">
          {FARCASTER_CONNECT_ENABLED && siwfNonce && (
            <>
              <Box
                sx={{
                  p: -10,
                  fontSize: 10,
                  borderRadius: 3,
                  overflow: 'auto'
                }}>
                <SignInButton
                  hideSignOut
                  nonce={siwfNonce}
                  onSuccess={async (response) => {
                    setSifeResponse(response);
                  }}
                  onError={onFarcasterSignInError}
                />
              </Box>
              <Divider flexItem sx={{ color: grey[400] }}>
                or
              </Divider>
            </>
          )}
          <LoadingButton
            variant="contained"
            color="inherit"
            loading={isModalOpen || authStatus === 'loading'}
            startIcon={
              !(isModalOpen || authStatus === 'loading') && (
                <Avatar src="/networks/ethereum.png" sx={{ width: 28, height: 28 }} />
              )
            }
            sx={{
              borderRadius: 3,
              width: 135,
              height: 50,
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: 18
            }}
            onClick={async () => {
              if (!signer) {
                connectWallet();
              } else {
                signInWithEthereum();
              }
            }}>
            {!signer ? 'Sign in' : 'Verify'}
          </LoadingButton>
        </Stack>
      </Box>
    </Card>
  ) : (
    <FarcasterAccountsCard siwfResponse={sifwResponse} />
  );
}
