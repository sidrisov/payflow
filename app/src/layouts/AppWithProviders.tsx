import App from './App';

import '@rainbow-me/rainbowkit/styles.css';
import 'react-toastify/dist/ReactToastify.css';

import {
  connectorsForWallets,
  getDefaultWallets,
  RainbowKitProvider
} from '@rainbow-me/rainbowkit';

import { rainbowWeb3AuthConnector } from '../utils/web3AuthConnector';

import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { useMediaQuery } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppSettings } from '../types/AppSettingsType';
import { CustomAvatar } from '../components/CustomAvatar';
import { customDarkTheme, customLightTheme } from '../theme/rainbowTheme';
import { SUPPORTED_CHAINS } from '../utils/supportedChains';
import { AirstackProvider, init } from '@airstack/airstack-react';
import { me } from '../services/user';
import CenteredCircularProgress from '../components/CenteredCircularProgress';
import { ProfileType } from '../types/ProfleType';

const WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const AIRSTACK_API_KEY = import.meta.env.VITE_AIRSTACK_API_KEY;

init(AIRSTACK_API_KEY);

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
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<ProfileType>();

  // Fetch user when:
  useEffect(() => {
    const fetchStatus = async () => {
      if (fetchingStatusRef.current) {
        return;
      }

      fetchingStatusRef.current = true;

      try {
        const profile = await me();

        setLoading(false);

        if (profile) {
          setProfile(profile);
        } else {
          setProfile(undefined);
        }
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
      <AirstackProvider apiKey={AIRSTACK_API_KEY}>
        <RainbowKitProvider
          theme={appSettings.darkMode ? customDarkTheme : customLightTheme}
          avatar={CustomAvatar}
          modalSize="compact"
          chains={chains}>
          {loading ? (
            <CenteredCircularProgress />
          ) : (
            <App profile={profile} appSettings={appSettings} setAppSettings={setAppSettings} />
          )}
        </RainbowKitProvider>
      </AirstackProvider>
    </WagmiConfig>
  );
}
