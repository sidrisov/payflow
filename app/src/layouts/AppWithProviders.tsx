import App from './App';

import { RainbowKitProvider } from '@rainbow-me/rainbowkit';

import { WagmiProvider } from 'wagmi';
import { useMediaQuery } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppSettings } from '../types/AppSettingsType';
import { CustomAvatar } from '../components/avatars/CustomAvatar';
import { customDarkTheme, customLightTheme } from '../theme/rainbowTheme';
import { AirstackProvider, init } from '@airstack/airstack-react';
import { me } from '../services/user';
import CenteredCircularProgress from '../components/CenteredCircularProgress';
import { ProfileType } from '../types/ProfleType';
import { useNavigate } from 'react-router-dom';
import sortAndFilterFlows from '../utils/sortAndFilterFlows';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import { toast } from 'react-toastify';
import axios from 'axios';
import CustomToastContainer from '../components/toasts/CustomToastContainer';
import { QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '../utils/wagmiConfig';
import { queryClient } from '../utils/query';

const AIRSTACK_API_KEY = import.meta.env.VITE_AIRSTACK_API_KEY;

init(AIRSTACK_API_KEY);

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
          darkMode: prefersDarkMode
        }
  );

  const navigate = useNavigate();

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

        if (profile) {
          if (profile.defaultFlow && profile.flows) {
            profile.flows = sortAndFilterFlows(profile.defaultFlow, profile.flows);
          }

          setProfile(profile);
        } else {
          //navigate('/connect');
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error(`🤷🏻‍♂️ ${error.message}`);
        }
        console.error(error);
      } finally {
        setLoading(false);
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

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AirstackProvider apiKey={AIRSTACK_API_KEY}>
          <RainbowKitProvider
            theme={appSettings.darkMode ? customDarkTheme : customLightTheme}
            avatar={CustomAvatar}
            modalSize="compact">
            <CustomThemeProvider darkMode={appSettings.darkMode}>
              {loading ? (
                <CenteredCircularProgress />
              ) : (
                <App
                  profile={profile}
                  appSettings={appSettings}
                  setAppSettings={setAppSettings}
                />
              )}
            </CustomThemeProvider>
          </RainbowKitProvider>
        </AirstackProvider>
        <CustomToastContainer />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
