import { QueryClientProvider } from '@tanstack/react-query';
import { privyQueryClient } from './query';
import { AirstackProvider, init } from '@airstack/airstack-react';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import CustomToastContainer from '../components/toasts/CustomToastContainer';
import { PrivyClientConfig, PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi';
import { wagmiConfig } from './wagmiConfig';
import { AuthKitProvider } from '@farcaster/auth-kit';
import { SUPPORTED_CHAINS } from './networks';
import { useDarkMode } from './hooks/useDarkMode';
import { configureFabricSDK } from '@withfabric/protocol-sdks';

const AIRSTACK_API_KEY = import.meta.env.VITE_AIRSTACK_API_KEY;
init(AIRSTACK_API_KEY);

configureFabricSDK({ wagmiConfig });

const PRIVY_API_KEY = import.meta.env.VITE_PRIVY_API_KEY;
const PRIVY_CLIENT_ID_KEY = import.meta.env.VITE_PRIVY_CLIENT_ID_KEY;

const farcasterAuthConfig = {
  rpcUrl: `https://opt-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
  domain: window.location.hostname,
  siweUri: window.location.origin,
  relay: 'https://relay.farcaster.xyz',
  version: 'v1'
};

export type WalletProviderType = 'privy' | 'rainbowkit';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const prefersDarkMode = useDarkMode();

  /* return WALLET_PROVIDER === 'privy' ? (
    <PrivyAppProviders darkMode={darkMode ?? prefersDarkMode}>{children}</PrivyAppProviders>
  ) : (
    <RainbowKitAppProviders darkMode={darkMode ?? prefersDarkMode}>
      {children}
    </RainbowKitAppProviders>
  ); */
  return <PrivyAppProviders darkMode={prefersDarkMode}>{children}</PrivyAppProviders>;
}

/* function RainbowKitAppProviders({
  children,
  darkMode
}: {
  children: React.ReactNode;
  darkMode: boolean;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={privyWagmiConfig}>
        <AirstackProvider apiKey={AIRSTACK_API_KEY}>
          <RainbowKitProvider
            theme={darkMode ? customDarkTheme : customLightTheme}
            avatar={CustomAvatar}
            modalSize="compact">
            <CustomThemeProvider darkMode={darkMode}>{children}</CustomThemeProvider>
          </RainbowKitProvider>
        </AirstackProvider>
        <CustomToastContainer />
      </WagmiProvider>
    </QueryClientProvider>
  );
} */

const WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

const privyConfig = (darkMode: boolean): PrivyClientConfig => {
  return {
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
      requireUserPasswordOnCreate: false
    },
    appearance: {
      theme: darkMode ? 'dark' : 'light',
      walletList: ['detected_wallets', 'metamask', 'coinbase_wallet', 'rainbow', 'wallet_connect']
    },
    externalWallets: {
      coinbaseWallet: {
        connectionOptions: 'all'
      }
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
      <QueryClientProvider client={privyQueryClient}>
        <PrivyWagmiProvider config={wagmiConfig}>
          <CommonProviders darkMode={darkMode}>{children}</CommonProviders>
          <CustomToastContainer />
        </PrivyWagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

function CommonProviders({
  children,
  darkMode
}: {
  children: React.ReactNode;
  darkMode: boolean;
}) {
  return (
    <AirstackProvider apiKey={AIRSTACK_API_KEY}>
      <AuthKitProvider config={farcasterAuthConfig}>
        <CustomThemeProvider darkMode={darkMode}>{children}</CustomThemeProvider>
        <CustomToastContainer />
      </AuthKitProvider>
    </AirstackProvider>
  );
}
