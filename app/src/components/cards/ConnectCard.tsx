import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, Card, Divider, Stack, Typography } from '@mui/material';
import { AuthClientError, SignInButton, StatusAPIResponse } from '@farcaster/auth-kit';
import { green, grey } from '@mui/material/colors';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useWalletClient } from 'wagmi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoadingButton from '@mui/lab/LoadingButton';
import { SiweMessage } from 'siwe';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../../utils/urlConstants';
import { FarcasterAccountsCard } from './FarcasterAccountsCard';
import { useSetActiveWallet } from '@privy-io/wagmi';

const FARCASTER_CONNECT_ENABLED = import.meta.env.VITE_FARCASTER_CONNECT_ENABLED === 'true';

export type AuthenticationStatus = 'loading' | 'unauthenticated' | 'authenticated';

export function ConnectCard() {
  const [siwfNonce, setSiwfNonce] = useState<string>();
  const [sifwResponse, setSifeResponse] = useState<StatusAPIResponse>();
  const [authStatus, setAuthStatus] = useState<AuthenticationStatus>('unauthenticated');

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

  useEffect(() => {
    const fetchNonce = async () => {
      if (FARCASTER_CONNECT_ENABLED && !siwfNonce) {
        try {
          const response = await axios.get(`${API_URL}/api/auth/nonce`, { withCredentials: true });
          setSiwfNonce(response.data);
        } catch (error) {
          console.error('Failed to fetch nonce:', error);
        }
      }
    };
    fetchNonce();
  }, [siwfNonce]);

  const signInWithEthereum = useCallback(async () => {
    if (isSuccess && signer && authStatus === 'unauthenticated') {
      setAuthStatus('loading');
      try {
        const siweMessage = new SiweMessage({
          domain: window.location.host,
          address: signer.account.address,
          statement: 'Sign in with Ethereum to Payflow',
          uri: window.location.origin,
          version: '1',
          chainId: signer.chain.id,
          nonce: siwfNonce
        });

        const signature = await signer.signMessage({ message: siweMessage.prepareMessage() });
        const response = await axios.post(
          `${API_URL}/api/auth/verify/${siweMessage.address}`,
          { message: siweMessage, signature },
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

  if (sifwResponse && sifwResponse.state === 'completed') {
    return <FarcasterAccountsCard siwfResponse={sifwResponse} />;
  }

  return (
    <Card elevation={5} sx={{ p: 3, borderRadius: 5, width: 300, height: 300 }}>
      <Stack spacing={5} alignItems="center">
        <Typography variant="h5" fontWeight="bold" textAlign="center">
          Welcome to Payflow
          <Typography mt={1} variant="body1" textAlign="center" color="text.secondary">
            Sign in with your onchain identity to access social payments
          </Typography>
        </Typography>

        <Stack spacing={1}>
          {FARCASTER_CONNECT_ENABLED && siwfNonce && (
            <>
              <SignInButton
                hideSignOut
                nonce={siwfNonce}
                onSuccess={async (response) => setSifeResponse(response)}
                onError={onFarcasterSignInError}
              />
              <Divider flexItem sx={{ color: grey[400] }}>
                or
              </Divider>
            </>
          )}
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
              ...(signer && { background: green.A700 })
            }}
            onClick={handleEthereumClick}>
            {!signer ? 'Ethereum' : 'Verify'}
          </LoadingButton>
        </Stack>
      </Stack>
    </Card>
  );
}
