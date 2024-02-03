import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { useMediaQuery } from '@mui/material';
import { useMemo, useState } from 'react';
import { AppSettings } from '../types/AppSettingsType';
import { CustomAvatar } from '../components/avatars/CustomAvatar';
import { customDarkTheme, customLightTheme } from '../theme/rainbowTheme';
import PublicProfile from './PublicProfile';

import { AirstackProvider, init } from '@airstack/airstack-react';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import CustomToastContainer from '../components/toasts/CustomToastContainer';
import { wagmiConfig } from '../utils/wagmiConfig';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../utils/query';

const AIRSTACK_API_KEY = import.meta.env.VITE_AIRSTACK_API_KEY;

const appSettingsStorageItem = localStorage.getItem('appSettings');
const appSettingsStored = appSettingsStorageItem
  ? (JSON.parse(appSettingsStorageItem) as AppSettings)
  : null;

export default function PublicProfileWithProviders() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [appSettings, setAppSettings] = useState<AppSettings>(
    appSettingsStored
      ? appSettingsStored
      : {
          darkMode: prefersDarkMode
        }
  );

  useMemo(() => {
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
  }, [appSettings]);

  init(AIRSTACK_API_KEY);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AirstackProvider apiKey={AIRSTACK_API_KEY}>
          <RainbowKitProvider
            theme={appSettings.darkMode ? customDarkTheme : customLightTheme}
            avatar={CustomAvatar}
            modalSize="compact">
            <CustomThemeProvider darkMode={appSettings.darkMode}>
              <PublicProfile appSettings={appSettings} setAppSettings={setAppSettings} />
            </CustomThemeProvider>
          </RainbowKitProvider>
        </AirstackProvider>
        <CustomToastContainer />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
