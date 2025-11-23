import { queryClient } from './query';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import CustomToastContainer from '../components/toasts/CustomToastContainer';
import { PrivyClientConfig, PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi';
import { wagmiConfig } from './wagmiConfig';
import { SUPPORTED_CHAINS } from './networks';
import { useDarkMode } from './hooks/useDarkMode';
import { configureFabricSDK } from '@withfabric/protocol-sdks';
import { QueryClientProvider } from '@tanstack/react-query';

configureFabricSDK({ wagmiConfig });

const PRIVY_API_KEY = import.meta.env.VITE_PRIVY_API_KEY;
const PRIVY_CLIENT_ID_KEY = import.meta.env.VITE_PRIVY_CLIENT_ID_KEY;

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const prefersDarkMode = useDarkMode();
  return <PrivyAppProviders darkMode={prefersDarkMode}>{children}</PrivyAppProviders>;
}

const WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

const privyConfig = (darkMode: boolean): PrivyClientConfig => {
  return {
    embeddedWallets: {
      ethereum: {
        createOnLogin: 'users-without-wallets'
      },
      showWalletUIs: false
    },
    appearance: {
      theme: darkMode ? 'dark' : 'light',
      walletList: ['detected_wallets', 'metamask', 'coinbase_wallet', 'rainbow', 'wallet_connect']
    },
    walletConnectCloudProjectId: WALLET_CONNECT_PROJECT_ID,
    supportedChains: SUPPORTED_CHAINS
  };
};

function PrivyAppProviders({
  children,
  darkMode
}: {
  children: React.ReactNode;
  darkMode: boolean;
}) {
  return (
    <PrivyProvider
      appId={PRIVY_API_KEY}
      clientId={PRIVY_CLIENT_ID_KEY}
      config={privyConfig(darkMode)}>
      <QueryClientProvider client={queryClient}>
        <PrivyWagmiProvider config={wagmiConfig}>
          <CommonProviders darkMode={darkMode}>{children}</CommonProviders>
          <CustomToastContainer />
        </PrivyWagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

function CommonProviders({ children, darkMode }: { children: React.ReactNode; darkMode: boolean }) {
  return (
    <>
      <CustomThemeProvider darkMode={darkMode}>{children}</CustomThemeProvider>
      <CustomToastContainer />
    </>
  );
}
