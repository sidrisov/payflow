import { createConfig } from '@wagmi/core';
import { http } from 'viem';
import { base, baseSepolia, degen, optimism, zora } from 'viem/chains';

export const wagmiConfig = createConfig({
  chains: [base, optimism, baseSepolia, degen],
  transports: {
    [base.id]: http(),
    [optimism.id]: http(),
    [degen.id]: http(),
    [zora.id]: http(),
    [baseSepolia.id]: http()
  },
  batch: {}
});
