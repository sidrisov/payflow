import { createConfig } from '@wagmi/core';
import { http } from 'viem';
import { arbitrum, base, degen, optimism, zora } from 'viem/chains';

export const wagmiConfig = createConfig({
  chains: [base, optimism, zora, arbitrum, degen],
  transports: {
    [base.id]: http(),
    [optimism.id]: http(),
    [degen.id]: http(),
    [zora.id]: http(),
    [arbitrum.id]: http()
  },
  batch: {}
});
