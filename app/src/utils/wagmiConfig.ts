import { SUPPORTED_CHAINS } from './networks';
import { http, fallback } from 'viem';
import { mainnet, base, optimism, arbitrum, polygon } from 'viem/chains';

import { createConfig } from '@privy-io/wagmi';

const createOptimizedTransport = (url: string) =>
  http(url, {
    batch: { batchSize: 1000 },
    retryCount: 3,
    retryDelay: 1000,
    timeout: 30000
  });

const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;
const BASE_RPC_API_KEY = import.meta.env.VITE_BASE_RPC_API_KEY;

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS as any,
  transports: {
    [mainnet.id]: createOptimizedTransport(
      `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    ),
    [base.id]: fallback([
      createOptimizedTransport(
        `https://api.developer.coinbase.com/rpc/v1/base/${BASE_RPC_API_KEY}`
      ),
      createOptimizedTransport(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
    ]),
    [optimism.id]: fallback([
      createOptimizedTransport(`https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
    ]),
    [arbitrum.id]: fallback([
      createOptimizedTransport(`https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
    ]),
    [polygon.id]: createOptimizedTransport(polygon.rpcUrls.default.http[0])
  }});
