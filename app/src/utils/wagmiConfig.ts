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
  worldchain,
  ham
} from 'viem/chains';

import { createConfig } from '@privy-io/wagmi';
import { Config } from 'wagmi';
import { frameConnector } from './farcasterConnector';

const createOptimizedTransport = (url: string) =>
  http(url, {
    batch: { batchSize: 1000 },
    retryCount: 3,
    retryDelay: 1000,
    timeout: 30000
  });

const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;
const BASE_RPC_API_KEY = import.meta.env.VITE_BASE_RPC_API_KEY;
const INFURA_API_KEY = import.meta.env.VITE_INFURA_API_KEY;

export const commonWagmiConfig = {
  chains: SUPPORTED_CHAINS as any,
  transports: {
    [mainnet.id]: createOptimizedTransport(
      `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    ),
    [sepolia.id]: createOptimizedTransport(
      `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    ),
    [base.id]: fallback([
      createOptimizedTransport(
        `https://api.developer.coinbase.com/rpc/v1/base/${BASE_RPC_API_KEY}`
      ),
      createOptimizedTransport(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
    ]),
    [optimism.id]: fallback([
      createOptimizedTransport(`https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`),
      createOptimizedTransport(`https://optimism-mainnet.infura.io/v3/${INFURA_API_KEY}`)
    ]),
    [zora.id]: createOptimizedTransport('https://rpc.zora.energy'),
    [baseSepolia.id]: createOptimizedTransport(
      `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    ),
    [degen.id]: createOptimizedTransport(
      `https://degen-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    ),
    [arbitrum.id]: fallback([
      createOptimizedTransport(`https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`),
      createOptimizedTransport(`https://arbitrum-mainnet.infura.io/v3/${INFURA_API_KEY}`)
    ]),
    [mode.id]: createOptimizedTransport(mode.rpcUrls.default.http[0]),
    [zksync.id]: createOptimizedTransport(zksync.rpcUrls.default.http[0]),
    [worldchain.id]: createOptimizedTransport(worldchain.rpcUrls.default.http[0]),
    [ham.id]: createOptimizedTransport(ham.rpcUrls.default.http[0])
  }
};

export const wagmiConfig = createConfig({
  ...commonWagmiConfig,
  connectors: [frameConnector as any]
}) as Config;
