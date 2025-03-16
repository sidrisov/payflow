import '@farcaster/auth-kit/styles.css';

import Login from './Login';
import { usePrivy } from '@privy-io/react-auth';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';
import { AuthKitProvider } from '@farcaster/auth-kit';

const farcasterAuthConfig = {
  rpcUrl: `https://opt-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
  domain: window.location.hostname,
  siweUri: window.location.origin,
  relay: 'https://relay.farcaster.xyz',
  version: 'v1'
};

export default function LoginWithProviders() {
  const { ready } = usePrivy();

  return !ready ? (
    <LoadingPayflowEntryLogo />
  ) : (
    <AuthKitProvider config={farcasterAuthConfig}>
      <Login />
    </AuthKitProvider>
  );
}
