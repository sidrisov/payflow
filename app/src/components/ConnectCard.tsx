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
import { ConnectButton as FarcasterConnectButton } from '@farcaster/connect-kit';

import { useAccount } from 'wagmi';
import { green } from '@mui/material/colors';
import { CheckCircle } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { API_URL } from '../utils/urlConstants';
import { ParsedMessage } from '@spruceid/siwe-parser';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
    axios
      .get(`${API_URL}/api/auth/nonce`, {
        withCredentials: true
      })
      .then((response) => {
        console.debug(response.data);
        setSiweNonce(response.data);
      });
  }, []);

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

        <Typography my={1} variant="caption" fontWeight="bold" textAlign="center">
          <u>
            <b>{'Identity'}</b>
          </u>
          {': '}your ethereum address linked to web3 socials (ens, farcaster, lens) for seamless
          profile discovery and payments with your friends.
        </Typography>

        <Stack my={2} spacing={1} alignItems="center">
          <ConnectButton
            label={address ? 'Verify Identity' : 'Connect Identity'}
            showBalance={{ smallScreen: false, largeScreen: false }}
          />
          {!isMobile && (
            <>
              <Divider flexItem>or</Divider>
              <Box
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden'
                }}>
                <FarcasterConnectButton
                  onStatusResponse={(data) => {
                    console.log(data);
                  }}
                  nonce={siweNonce}
                  onSuccess={async (data) => {
                    if (data.message && data.signature) {
                      const message = new ParsedMessage(data.message);
                      const signature = data.signature;
                      console.log(message, signature);

                      try {
                        const response = await axios.post(
                          `${API_URL}/api/auth/verify`,
                          { message, signature },
                          { withCredentials: true }
                        );

                        if (Boolean(response.status === 200)) {
                          toast.success('Successfully signed in with Farcaster');
                          navigate('/');
                        } else {
                          toast.error('Failed to sign in with Farcaster');
                        }
                      } catch (error) {
                        console.log(error);
                        toast.error('Failed to sign in with Farcaster');
                      }
                    }
                  }}
                />
              </Box>
            </>
          )}
        </Stack>
      </Box>
    </Card>
  );
}
