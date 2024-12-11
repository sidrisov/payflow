import { useState, useEffect, useCallback } from 'react';
import { Avatar, Card, Divider, Stack, Typography } from '@mui/material';
import { AuthClientError, SignInButton, StatusAPIResponse } from '@farcaster/auth-kit';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useWalletClient } from 'wagmi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoadingButton from '@mui/lab/LoadingButton';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../../utils/urlConstants';
import { FarcasterAccountsCard } from './FarcasterAccountsCard';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { createSiweMessage, parseSiweMessage } from 'viem/siwe';

import FrameV2SDK from '@farcaster/frame-sdk';
const FARCASTER_CONNECT_ENABLED = import.meta.env.VITE_FARCASTER_CONNECT_ENABLED === 'true';

export type AuthenticationStatus = 'loading' | 'unauthenticated' | 'authenticated';

export default function ConnectCard() {
  const [siwfNonce, setSiwfNonce] = useState<string>();
  const [sifwResponse, setSifeResponse] = useState<StatusAPIResponse>();
  const [authStatus, setAuthStatus] = useState<AuthenticationStatus>('unauthenticated');
  const [nonceFetched, setNonceFetched] = useState(false);

  const { connectWallet, isModalOpen, ready } = usePrivy();
  const { data: signer, isSuccess } = useWalletClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  useEffect(() => {
    const setWallet = async () => {
      if (ready && wallets.length !== 0) {
        console.log('Trying to set a wallet: ', wallets);
        const wallet = wallets.find((w) => w.walletClientType !== 'privy');
        if (wallet) {
          console.debug('Setting active wallet: ', wallet);
          await setActiveWallet(wallet);
        }
      }
    };
    setWallet();
  }, [wallets, ready, setActiveWallet]);

  const [isFrameV2, setIsFrameV2] = useState(false);

  useEffect(() => {
    const initiateFrameV2 = async () => {
      const context = await FrameV2SDK.context;

      if (context) {
        FrameV2SDK.actions.ready();
        setIsFrameV2(true);
      }
    };
    if (FrameV2SDK && !isFrameV2) {
      initiateFrameV2();
    }
  }, [isFrameV2]);

  useEffect(() => {
    const fetchNonce = async () => {
      if (FARCASTER_CONNECT_ENABLED && !siwfNonce && !nonceFetched) {
        try {
          const response = await axios.get(`${API_URL}/api/auth/nonce`, { withCredentials: true });
          setSiwfNonce(response.data);
          setNonceFetched(true);
        } catch (error) {
          console.error('Failed to fetch nonce:', error);
        }
      }
    };
    fetchNonce();
  }, [siwfNonce, nonceFetched]);

  const signInWithEthereum = useCallback(async () => {
    if (isSuccess && signer && authStatus === 'unauthenticated') {
      setAuthStatus('loading');

      const address = signer.account.address;
      try {
        const message = createSiweMessage({
          domain: window.location.host,
          address,
          statement: 'Sign in with Ethereum to Payflow',
          uri: window.location.origin,
          version: '1',
          chainId: signer.chain.id,
          nonce: siwfNonce!
        });

        console.log('SIWE Message: ', message);

        const signature = await signer.signMessage({ message });
        const response = await axios.post(
          `${API_URL}/api/auth/verify/${address}`,
          { message: parseSiweMessage(message), signature },
          { withCredentials: true }
        );

        if (response.status === 200) {
          setAuthStatus('authenticated');
          console.debug('redirecting to: ', redirect ?? '/');
          navigate(redirect ?? '/');
        } else {
          throw new Error('Verification failed');
        }
      } catch (error) {
        console.error('Sign in error:', error);
        toast.error('Failed to sign in with Ethereum');
        setAuthStatus('unauthenticated');
      }
    }
  }, [isSuccess, signer, authStatus, siwfNonce, navigate, redirect]);

  const handleEthereumClick = useCallback(() => {
    if (!signer) {
      connectWallet();
    } else {
      signInWithEthereum();
    }
  }, [signer, connectWallet, signInWithEthereum]);

  const onFarcasterSignInError = useCallback((error: AuthClientError | undefined) => {
    setSiwfNonce(undefined);
    if (error) {
      console.error('Farcaster sign in error:', error);
    }
    toast.error('Failed to sign in with Farcaster. Try again!');
  }, []);

  const handleConnectAnotherWallet = useCallback(() => {
    connectWallet();
  }, [connectWallet]);

  if (sifwResponse && sifwResponse.state === 'completed') {
    return <FarcasterAccountsCard siwfResponse={sifwResponse} />;
  }

  return (
    <Card
      elevation={5}
      sx={{ p: 3, borderRadius: 5, maxWidth: 360, minHeight: 300, maxHeight: 350 }}>
      <Stack spacing={5} alignItems="center">
        <Typography variant="h5" fontWeight="bold" textAlign="center">
          Welcome to Payflow
          <Typography mt={1} variant="body1" textAlign="center" color="text.secondary">
            Sign in with your onchain identity to access social payments
          </Typography>
        </Typography>

        <Stack spacing={1}>
          {!isFrameV2 && FARCASTER_CONNECT_ENABLED && siwfNonce && (
            <>
              <SignInButton
                hideSignOut
                nonce={siwfNonce}
                onSuccess={async (response) => setSifeResponse(response)}
                onError={onFarcasterSignInError}
              />
              <Divider flexItem sx={{ color: 'text.secondary' }}>
                or
              </Divider>
            </>
          )}
          <Stack spacing={1} alignItems="center">
            <LoadingButton
              variant="text"
              color="inherit"
              loading={isModalOpen || authStatus === 'loading'}
              startIcon={
                !(isModalOpen || authStatus === 'loading') && (
                  <Avatar src="/networks/ethereum.png" sx={{ width: 28, height: 28 }} />
                )
              }
              sx={{
                borderRadius: 3,
                width: '100%',
                height: 47,
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: 18,
                border: 1,
                borderColor: 'divider'
              }}
              onClick={handleEthereumClick}>
              {!signer ? 'Ethereum' : 'Verify'}
            </LoadingButton>
            {signer && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={handleConnectAnotherWallet}>
                with different wallet
              </Typography>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}
