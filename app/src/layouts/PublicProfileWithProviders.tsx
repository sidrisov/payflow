import '@rainbow-me/rainbowkit/styles.css';
import 'react-toastify/dist/ReactToastify.css';

import {
  connectorsForWallets,
  getDefaultWallets,
  RainbowKitProvider
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { useMediaQuery } from '@mui/material';
import { useMemo, useState } from 'react';
import { AppSettings } from '../types/AppSettingsType';
import { CustomAvatar } from '../components/CustomAvatar';
import { customDarkTheme, customLightTheme } from '../theme/rainbowTheme';
import { SUPPORTED_CHAINS } from '../utils/networks';
import PublicProfile from './PublicProfile';

import { AirstackProvider, init } from '@airstack/airstack-react';
import CustomThemeProvider from '../theme/CustomThemeProvider';

const { chains, publicClient, webSocketPublicClient } = configureChains(SUPPORTED_CHAINS, [
  alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_API_KEY }),
  publicProvider()
]);

const WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const AIRSTACK_API_KEY = import.meta.env.VITE_AIRSTACK_API_KEY;

const { wallets } = getDefaultWallets({
  appName: 'Payflow',
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains
});

const connectors = connectorsForWallets([
  ...wallets
  /*   {
    groupName: 'Other',
    wallets: [rainbowWeb3AuthConnector({ chains })]
  } */
]);

const appSettingsStorageItem = localStorage.getItem('appSettings');
const appSettingsStored = appSettingsStorageItem
  ? (JSON.parse(appSettingsStorageItem) as AppSettings)
  : null;

export default function PublicProfileWithProviders() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [appSettings] = useState<AppSettings>(
    appSettingsStored
      ? appSettingsStored
      : {
          autoConnect: import.meta.env.VITE_INIT_CONNECT === 'true',
          darkMode: prefersDarkMode
        }
  );

  useMemo(() => {
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
  }, [appSettings]);

  const wagmiConfig = createConfig({
    autoConnect: appSettings.autoConnect,
    connectors,
    publicClient,
    webSocketPublicClient
  });

  init(AIRSTACK_API_KEY);

  return (
    <WagmiConfig config={wagmiConfig}>
      <AirstackProvider apiKey={AIRSTACK_API_KEY}>
        <RainbowKitProvider
          theme={appSettings.darkMode ? customDarkTheme : customLightTheme}
          avatar={CustomAvatar}
          modalSize="compact"
          chains={chains}>
          <CustomThemeProvider darkMode={appSettings.darkMode}>
            <PublicProfile appSettings={appSettings} />
          </CustomThemeProvider>
        </RainbowKitProvider>
      </AirstackProvider>
    </WagmiConfig>
  );
}
