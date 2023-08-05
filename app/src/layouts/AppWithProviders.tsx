import App from './App';

import '@rainbow-me/rainbowkit/styles.css';
import 'react-toastify/dist/ReactToastify.css';

import {
  AuthenticationStatus,
  connectorsForWallets,
  createAuthenticationAdapter,
  getDefaultWallets,
  RainbowKitAuthenticationProvider,
  RainbowKitProvider
} from '@rainbow-me/rainbowkit';

import { rainbowWeb3AuthConnector } from '../utils/web3AuthConnector';

import { Address, configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
  optimismGoerli,
  mainnet,
  zkSyncTestnet,
  baseGoerli,
  zoraTestnet,
  optimism,
  base
} from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { useMediaQuery } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppSettings } from '../types/AppSettingsType';
import { CustomAvatar } from '../components/CustomAvatar';
import { customDarkTheme, customLightTheme } from '../theme/rainbowTheme';
import { SiweMessage } from 'siwe';

const WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const AUTH_URL = import.meta.env.VITE_PAYFLOW_SERVICE_API_URL;

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [optimismGoerli, baseGoerli, zoraTestnet, zkSyncTestnet, optimism, base, mainnet],
  [alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_API_KEY }), publicProvider()]
);

const { wallets } = getDefaultWallets({
  appName: 'PayFlow',
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains
});

const connectors = connectorsForWallets([
  ...wallets,
  {
    groupName: 'Other',
    wallets: [rainbowWeb3AuthConnector({ chains })]
  }
]);

const appSettingsStorageItem = localStorage.getItem('appSettings');
const appSettingsStored = appSettingsStorageItem
  ? (JSON.parse(appSettingsStorageItem) as AppSettings)
  : null;

export default function AppWithProviders() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [appSettings, setAppSettings] = useState<AppSettings>(
    appSettingsStored
      ? appSettingsStored
      : {
          autoConnect: import.meta.env.VITE_INIT_CONNECT === 'true',
          darkMode: prefersDarkMode
        }
  );

  const fetchingStatusRef = useRef(false);
  const verifyingRef = useRef(false);
  const [authStatus, setAuthStatus] = useState<AuthenticationStatus>('loading');
  const [authAccount, setAuthAccount] = useState<Address>();

  // Fetch user when:
  useEffect(() => {
    const fetchStatus = async () => {
      if (fetchingStatusRef.current || verifyingRef.current) {
        return;
      }

      fetchingStatusRef.current = true;

      try {
        const response = await fetch(`${AUTH_URL}/api/me`, { credentials: 'include' });
        const authProfile = await response.json();
        console.log(authProfile.address);
        setAuthStatus(authProfile && authProfile.address ? 'authenticated' : 'unauthenticated');

        if (authProfile && authProfile.address) {
          setAuthAccount(authProfile.address);
        } else {
          setAuthAccount(undefined);
        }
      } catch (_error) {
        setAuthStatus('unauthenticated');
      } finally {
        fetchingStatusRef.current = false;
      }
    };

    // 1. page loads
    fetchStatus();

    // 2. window is focused (in case user logs out of another window)
    window.addEventListener('focus', fetchStatus);
    return () => window.removeEventListener('focus', fetchStatus);
  }, []);

  const authAdapter = useMemo(() => {
    return createAuthenticationAdapter({
      getNonce: async () => {
        const response = await fetch(`${AUTH_URL}/api/auth/nonce`, { credentials: 'include' });
        return await response.text();
      },

      createMessage: ({ nonce, address, chainId }) => {
        return new SiweMessage({
          domain: window.location.host,
          address,
          statement: 'Sign in with Ethereum to PayFlow',
          uri: window.location.origin,
          version: '1',
          chainId,
          nonce
        });
      },

      getMessageBody: ({ message }) => {
        return message.prepareMessage();
      },

      verify: async ({ message, signature }) => {
        verifyingRef.current = true;

        try {
          const response = await fetch(`${AUTH_URL}/api/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, signature }),
            credentials: 'include'
          });

          const authenticated = Boolean(response.ok);

          if (authenticated) {
            setAuthStatus(authenticated ? 'authenticated' : 'unauthenticated');
          }

          return authenticated;
        } catch (error) {
          return false;
        } finally {
          verifyingRef.current = false;
        }
      },

      signOut: async () => {
        setAuthStatus('unauthenticated');
        setAuthAccount(undefined);
        await fetch(`${AUTH_URL}/api/auth/logout`, { credentials: 'include' });
      }
    });
  }, []);

  useMemo(() => {
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
  }, [appSettings]);

  const wagmiConfig = createConfig({
    autoConnect: appSettings.autoConnect,
    connectors,
    publicClient,
    webSocketPublicClient
  });

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitAuthenticationProvider adapter={authAdapter} status={authStatus}>
        <RainbowKitProvider
          theme={appSettings.darkMode ? customDarkTheme : customLightTheme}
          avatar={CustomAvatar}
          modalSize="compact"
          chains={chains}>
          <App
            authStatus={authStatus}
            authAccount={authAccount}
            appSettings={appSettings}
            setAppSettings={setAppSettings}
          />
        </RainbowKitProvider>
      </RainbowKitAuthenticationProvider>
    </WagmiConfig>
  );
}
