import { Avatar, Box, Card, Divider, Stack, Typography } from '@mui/material';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AuthClientError, SignInButton, StatusAPIResponse } from '@farcaster/auth-kit';

import { green } from '@mui/material/colors';
import { CheckCircle } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { API_URL } from '../utils/urlConstants';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FarcasterAccountsCard } from './FarcasterAccountsCard';

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

export function ConnectCard() {
  const [siwfNonce, setSiwfNonce] = useState<string>();
  const [sifwResponse, setSifeResponse] = useState<StatusAPIResponse>();

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
          <ConnectButton
            label={'Sign in with Ethereum'}
            showBalance={{ smallScreen: false, largeScreen: false }}
          />
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
