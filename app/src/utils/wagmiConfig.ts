import { SUPPORTED_CHAINS } from './networks';
import { http, fallback } from 'viem';
import {
  mainnet,
  base,
  optimism,
  degen,
  baseSepolia,
  zora,
  sepolia,
  arbitrum,
  zksync,
  mode,
  worldchain
} from 'viem/chains';

import { createConfig } from '@privy-io/wagmi';
import { Config } from 'wagmi';

const WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

const createOptimizedTransport = (url: string) =>
  http(url, {
    batch: { batchSize: 1000 },
    retryCount: 3,
    retryDelay: 1000,
    timeout: 30000
  });

export const commonWagmiConfig = {
  chains: SUPPORTED_CHAINS as any,
  transports: {
    [mainnet.id]: createOptimizedTransport(
      `https://eth-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    ),
    [sepolia.id]: createOptimizedTransport(
      `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    ),
    [base.id]: fallback([
      createOptimizedTransport(
        `https://api.developer.coinbase.com/rpc/v1/base/${import.meta.env.VITE_BASE_RPC_API_KEY}`
      ),
      createOptimizedTransport(
        `https://base-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
      )
    ]),
    [optimism.id]: fallback([
      createOptimizedTransport(
        `https://optimism-mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`
      ),
      createOptimizedTransport(
        `https://opt-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
      )
    ]),
    [zora.id]: createOptimizedTransport('https://rpc.zora.energy'),
    [baseSepolia.id]: createOptimizedTransport(
      `https://base-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    ),
    [degen.id]: createOptimizedTransport(degen.rpcUrls.default.http[0]),
    [arbitrum.id]: createOptimizedTransport(
      `https://arbitrum-mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`
    ),
    [mode.id]: createOptimizedTransport(mode.rpcUrls.default.http[0]),
    [zksync.id]: createOptimizedTransport(zksync.rpcUrls.default.http[0]),
    [worldchain.id]: createOptimizedTransport(
      `https://worldchain-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    )
  }
};

/* export const privyWagmiConfig = getDefaultConfig({
  ...commonWagmiConfig,
  appName: 'Payflow',
  projectId: WALLET_CONNECT_PROJECT_ID,
  appDescription: 'Onchain Social Payments',
  appUrl: 'https://payflow.me',
  appIcon: 'https://payflow.me/favicon.ico',
  wallets: [
    ...wallets,
    {
      groupName: 'More',
      wallets: [trustWallet, injectedWallet]
    }
  ]
}); */

export const wagmiConfig = createConfig({
  ...commonWagmiConfig
}) as Config;
