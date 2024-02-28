import { Avatar, Box, Card, Divider, Stack, Typography } from '@mui/material';
import { AuthClientError, SignInButton, StatusAPIResponse } from '@farcaster/auth-kit';

import { green } from '@mui/material/colors';
import { CheckCircle } from '@mui/icons-material';
import { useContext, useMemo, useState } from 'react';
import { API_URL } from '../../utils/urlConstants';
import { toast } from 'react-toastify';
import axios from 'axios';

import { FarcasterAccountsCard } from './FarcasterAccountsCard';
import { SiweMessage } from 'siwe';
import { usePrivy } from '@privy-io/react-auth';
import { useWalletClient } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import LoadingButton from '@mui/lab/LoadingButton';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { WALLET_PROVIDER } from '../../utils/providers';

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

  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { connectWallet, isModalOpen } = usePrivy();

  const { data: signer, isSuccess } = useWalletClient();
  const [authStatus, setAuthStatus] = useState<AuthenticationStatus>('unauthenticated');

  const navigate = useNavigate();

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

  useMemo(async () => {
    if (isSuccess && signer && authStatus === 'loading') {
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
  }, [isSuccess, signer, authStatus]);

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
          <FeatureSection description="create a flow abstracted from social wallet" />
          <FeatureSection description="discover friends by farcaster, lens, and ens" />
          <FeatureSection description="send, receive, request crypto, and more" />
        </Stack>

        <Typography my={1} mx={1} variant="caption" fontWeight="bold" textAlign="center">
          <u>
            <b>{'Identity'}</b>
          </u>
          {': '}your ethereum address linked to web3 socials (farcaster, lens, ens), facilitates
          seamless profile discovery and payments with your friends
        </Typography>

        <Stack my={2} spacing={1} alignItems="center">
          <LoadingButton
            variant="contained"
            color="inherit"
            loading={
              (WALLET_PROVIDER === 'privy' ? isModalOpen : connectModalOpen) ||
              authStatus === 'loading'
            }
            sx={{
              borderRadius: 3,
              height: 50,
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: 18
            }}
            onClick={() => {
              if (!signer) {
                console.log(WALLET_PROVIDER, connectWallet);
                if (WALLET_PROVIDER === 'privy') {
                  connectWallet();
                } else {
                  openConnectModal?.();
                }
              } else {
                setAuthStatus('loading');
              }
            }}>
            Sign in with Ethereum
          </LoadingButton>
          {FARCASTER_CONNECT_ENABLED && siwfNonce && (
            <>
              <Divider flexItem>or</Divider>
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
            </>
          )}
        </Stack>
      </Box>
    </Card>
  ) : (
    <FarcasterAccountsCard siwfResponse={sifwResponse} />
  );
}
