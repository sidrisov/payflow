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
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { useMediaQuery } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppSettings } from '../types/AppSettingsType';
import { CustomAvatar } from '../components/CustomAvatar';
import { customDarkTheme, customLightTheme } from '../theme/rainbowTheme';
import { SiweMessage } from 'siwe';
import axios from 'axios';
import { SUPPORTED_CHAINS } from '../utils/supportedChains';

const WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const AUTH_URL = import.meta.env.VITE_PAYFLOW_SERVICE_API_URL;

const { chains, publicClient, webSocketPublicClient } = configureChains(SUPPORTED_CHAINS, [
  alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_API_KEY }),
  publicProvider()
]);

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
  const [authStatus, setAuthStatus] = useState<AuthenticationStatus>('loading');
  const [authAccount, setAuthAccount] = useState<Address>();

  // Fetch user when:
  useEffect(() => {
    const fetchStatus = async () => {
      if (fetchingStatusRef.current) {
        return;
      }

      fetchingStatusRef.current = true;

      try {
        const response = await axios.get(`${AUTH_URL}/api/user/me`, { withCredentials: true });
        const authProfile = await response.data;

        setAuthStatus(authProfile.address ? 'authenticated' : 'unauthenticated');

        if (authProfile.address) {
          setAuthAccount(authProfile.address);
        } else {
          setAuthAccount(undefined);
        }
      } catch (error) {
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
      signOut: async () => {
        await axios.get(`${AUTH_URL}/api/auth/logout`, { withCredentials: true });
        setAuthStatus('unauthenticated');
        setAuthAccount(undefined);
      },
      // authentication logic should be handled on login
      getNonce: function (): Promise<string> {
        throw new Error('Function not implemented.');
      },
      createMessage: function (args: { nonce: string; address: string; chainId: number }): unknown {
        throw new Error('Function not implemented.');
      },
      getMessageBody: function (args: { message: unknown }): string {
        throw new Error('Function not implemented.');
      },
      verify: function (args: { message: unknown; signature: string }): Promise<boolean> {
        throw new Error('Function not implemented.');
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
