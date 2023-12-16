import '@rainbow-me/rainbowkit/styles.css';

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
import PaymentRequest from './PaymentRequest';
import { SUPPORTED_CHAINS } from '../utils/networks';

const { chains, publicClient, webSocketPublicClient } = configureChains(SUPPORTED_CHAINS, [
  alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_API_KEY }),
  publicProvider()
]);

const WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

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

export default function PaymentRequestWithProviders() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [appSettings, setAppSettings] = useState<AppSettings>(
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

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider
        theme={appSettings.darkMode ? customDarkTheme : customLightTheme}
        avatar={CustomAvatar}
        modalSize="compact"
        chains={chains}>
        <PaymentRequest appSettings={appSettings} setAppSettings={setAppSettings} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
