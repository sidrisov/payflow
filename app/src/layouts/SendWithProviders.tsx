import { HelmetProvider } from 'react-helmet-async';
import Send from './Send';

import '@rainbow-me/rainbowkit/styles.css';
import 'react-toastify/dist/ReactToastify.css';

import merge from 'lodash.merge';

import {
  AvatarComponent,
  darkTheme,
  getDefaultWallets,
  lightTheme,
  RainbowKitProvider,
  Theme
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { optimismGoerli, mainnet, zkSyncTestnet, baseGoerli } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import AddressAvatar from '../components/AddressAvatar';
import { useMediaQuery } from '@mui/material';
import { useMemo, useState } from 'react';
import { AppSettings } from '../types/AppSettingsType';
import { ToastContainer } from 'react-toastify';
import CustomThemeProvider from '../theme/CustomThemeProvider';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [zkSyncTestnet, optimismGoerli, baseGoerli, mainnet],
  [alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_API_KEY }), publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'PayFlow',
  projectId: '795e48b684a91818331afe21e54973ab',
  chains
});

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

export default function SendWithProviders() {
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
          <CustomThemeProvider darkMode={appSettings.darkMode}>
            <Send appSettings={appSettings} setAppSettings={setAppSettings} />
          </CustomThemeProvider>
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
