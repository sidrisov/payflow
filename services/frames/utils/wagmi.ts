import { createConfig } from '@wagmi/core';
import { http } from 'viem';
import { base, baseSepolia, optimism, zora } from 'viem/chains';

export const wagmiConfig = createConfig({
  chains: [base, optimism, baseSepolia],
  transports: {
    [base.id]: http(),
    [optimism.id]: http(),
    [zora.id]: http(),
    [baseSepolia.id]: http()
  },
  batch: {}
});
