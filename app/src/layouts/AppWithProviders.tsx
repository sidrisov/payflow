import { HelmetProvider } from 'react-helmet-async';
import App from './App';

import '@rainbow-me/rainbowkit/styles.css';
import 'react-toastify/dist/ReactToastify.css';

import merge from 'lodash.merge';

import {
  AvatarComponent,
  connectorsForWallets,
  darkTheme,
  lightTheme,
  RainbowKitProvider,
  Theme
} from '@rainbow-me/rainbowkit';

import { rainbowWeb3AuthConnector } from '../utils/web3AuthConnector';

import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { optimismGoerli, mainnet, zkSyncTestnet, baseGoerli } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import AddressAvatar from '../components/AddressAvatar';
import { useMediaQuery } from '@mui/material';
import { useMemo, useState } from 'react';
import { AppSettings } from '../types/AppSettingsType';
import { ToastContainer } from 'react-toastify';
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet
} from '@rainbow-me/rainbowkit/wallets';

const WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [zkSyncTestnet, optimismGoerli, baseGoerli, mainnet],
  [alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_API_KEY }), publicProvider()]
);

const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      injectedWallet({ chains }),
      metaMaskWallet({ chains, projectId: WALLET_CONNECT_PROJECT_ID }),
      coinbaseWallet({ appName: 'PayFlow', chains }),
      rainbowWallet({ chains, projectId: WALLET_CONNECT_PROJECT_ID }),
      walletConnectWallet({ chains, projectId: WALLET_CONNECT_PROJECT_ID }),
      rainbowWeb3AuthConnector({ chains })
    ]
  }
]);

const CustomAvatar: AvatarComponent = ({ address, ensImage, size }) => {
  return ensImage ? (
    <img src={ensImage} width={size} height={size} style={{ borderRadius: 999 }} />
  ) : (
    <AddressAvatar
      address={address}
      scale={size < 30 ? 3 : 10}
      sx={{ width: size, height: size }}
    />
  );
};

const custLightTheme = lightTheme({ overlayBlur: 'small' });
const customDarkTheme = merge(darkTheme({ overlayBlur: 'small' }), {
  colors: {
    modalBackground: '#242424',
    connectButtonBackground: '#1e1e1e'
  }
} as Theme);

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
          magicEnabled: false,
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
    <HelmetProvider>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider
          theme={appSettings.darkMode ? customDarkTheme : custLightTheme}
          avatar={CustomAvatar}
          modalSize="compact"
          chains={chains}
          initialChain={
            chains.find((chain) => chain.network === import.meta.env.VITE_DEFAULT_NETWORK)?.id
          }>
          <App appSettings={appSettings} setAppSettings={setAppSettings} />
          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            limit={5}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </RainbowKitProvider>
      </WagmiConfig>
    </HelmetProvider>
  );
}
