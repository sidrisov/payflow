import {
  Avatar,
  Box,
  Card,
  Divider,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  ConnectError,
  ConnectButton as FarcasterConnectButton,
  StatusAPIResponse
} from '@farcaster/connect-kit';

import { useAccount } from 'wagmi';
import { green } from '@mui/material/colors';
import { CheckCircle } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { API_URL } from '../utils/urlConstants';
import { ParsedMessage } from '@spruceid/siwe-parser';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { address } = useAccount();
  const [siweNonce, setSiweNonce] = useState<string>();

  const navigate = useNavigate();

  useEffect(() => {
    if (FARCASTER_CONNECT_ENABLED) {
      axios
        .get(`${API_URL}/api/auth/nonce`, {
          withCredentials: true
        })
        .then((response) => {
          console.debug(response.data);
          setSiweNonce(response.data);
        });
    }
  }, []);

  async function onFarcasterSignInSuccess(data: StatusAPIResponse) {
    if (data.message && data.signature && data.state === 'completed') {
      const parsedMessage = new ParsedMessage(data.message);
      const signature = data.signature;
      console.debug(parsedMessage, signature);

      try {
        const response = await axios.post(
          `${API_URL}/api/auth/verify`,
          { message: parsedMessage, signature },
          { withCredentials: true }
        );

        if (response.status === 200) {
          navigate('/');
        } else {
          toast.error('Failed to sign in with Farcaster');
        }
      } catch (error) {
        toast.error('Failed to sign in with Farcaster');
        console.error(error);
      }
    }
  }

  async function onFarcasterSignInError(error: ConnectError | undefined) {
    if (error) {
      console.error(error);
    }
    toast.error('Failed to sign in with Farcaster. Try again!');
  }

  return (
    <Card
      elevation={10}
      sx={{
        m: 2,
        p: 1,
        border: 3,
        borderRadius: 5,
        borderStyle: 'double',
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
          {': '}your ethereum address linked to web3 socials (ens, farcaster, lens), facilitates
          seamless profile discovery and payments with your friends
        </Typography>

        <Stack my={2} spacing={1} alignItems="center">
          <ConnectButton
            label={address ? 'Verify Identity Wallet' : 'Connect Identity Wallet'}
            showBalance={{ smallScreen: false, largeScreen: false }}
          />
          {!isMobile && FARCASTER_CONNECT_ENABLED && (
            <>
              <Divider flexItem>or</Divider>
              <Box
                sx={{
                  fontSize: 16,
                  borderRadius: 3,
                  overflow: 'hidden'
                }}>
                <FarcasterConnectButton
                  nonce={siweNonce}
                  onSuccess={onFarcasterSignInSuccess}
                  onError={onFarcasterSignInError}
                />
              </Box>
            </>
          )}
        </Stack>
      </Box>
    </Card>
  );
}
