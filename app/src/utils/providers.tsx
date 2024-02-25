import { QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { privyQueryClient, queryClient } from './query';
import { AirstackProvider, init } from '@airstack/airstack-react';
import {
  AuthenticationConfig,
  RainbowKitAuthenticationProvider,
  RainbowKitProvider
} from '@rainbow-me/rainbowkit';
import { CustomAvatar } from '../components/avatars/CustomAvatar';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import CustomToastContainer from '../components/toasts/CustomToastContainer';
import { customDarkTheme, customLightTheme } from '../theme/rainbowTheme';
import { PrivyClientConfig, PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi';
import { privyWagmiConfig, wagmiConfig } from './wagmiConfig';
import { AuthKitProvider } from '@farcaster/auth-kit';
import { SiweMessage } from 'siwe';

const AIRSTACK_API_KEY = import.meta.env.VITE_AIRSTACK_API_KEY;
init(AIRSTACK_API_KEY);

const PRIVY_API_KEY = import.meta.env.VITE_PRIVY_API_KEY;

export type WalletProviderType = 'privy' | 'rainbowkit';

export default function AppProviders({
  children,
  walletProvider,
  darkMode
}: {
  children: React.ReactNode;
  walletProvider: WalletProviderType;
  darkMode: boolean;
}) {
  return walletProvider === 'privy' ? (
    <PrivyAppProviders darkMode={darkMode}>{children}</PrivyAppProviders>
  ) : (
    <RainbowKitAppProviders darkMode={darkMode}>{children}</RainbowKitAppProviders>
  );
}

function RainbowKitAppProviders({
  children,
  darkMode
}: {
  children: React.ReactNode;
  darkMode: boolean;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
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
}

const WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

const privyConfig = (darkMode: boolean): PrivyClientConfig => {
  return {
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
      requireUserPasswordOnCreate: false,
      priceDisplay: { primary: 'fiat-currency', secondary: 'native-token' },
      waitForTransactionConfirmation: true
    },
    appearance: {
      showWalletLoginFirst: false,
      theme: darkMode ? 'dark' : 'light',
      walletList: ['detected_wallets', 'metamask', 'rainbow', 'coinbase_wallet', 'wallet_connect']
    },
    walletConnectCloudProjectId: WALLET_CONNECT_PROJECT_ID
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
    <QueryClientProvider client={privyQueryClient}>
      <PrivyProvider
        appId={PRIVY_API_KEY}
        config={privyConfig(darkMode)}
        onSuccess={(user, isNewUser) => {
          console.log('Privy success: ', user, isNewUser);
        }}>
        <PrivyWagmiProvider config={privyWagmiConfig}>
          <AirstackProvider apiKey={AIRSTACK_API_KEY}>
            <CustomThemeProvider darkMode={darkMode}>{children}</CustomThemeProvider>
          </AirstackProvider>
          <CustomToastContainer />
        </PrivyWagmiProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}

const config = {
  rpcUrl: `https://opt-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
  domain: window.location.hostname,
  siweUri: window.location.origin,
  relay: 'https://relay.farcaster.xyz',
  version: 'v1'
};

export function LoginProviders({
  children,
  darkMode,
  authConfig
}: {
  children: React.ReactNode;
  darkMode: boolean;
  authConfig: AuthenticationConfig<SiweMessage>;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RainbowKitAuthenticationProvider adapter={authConfig.adapter} status={authConfig.status}>
          <RainbowKitProvider
            theme={darkMode ? customDarkTheme : customLightTheme}
            avatar={CustomAvatar}
            modalSize="compact"
            appInfo={{ appName: 'Payflow', learnMoreUrl: 'https://payflow.super.site' }}>
            <AuthKitProvider config={config}>{children}</AuthKitProvider>
          </RainbowKitProvider>
        </RainbowKitAuthenticationProvider>
        <CustomToastContainer />
      </WagmiProvider>
    </QueryClientProvider>
  );
}
