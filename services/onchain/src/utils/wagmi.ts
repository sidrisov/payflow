import { http } from 'viem';
import {
  arbitrum,
  base,
  baseSepolia,
  degen,
  optimism,
  polygon,
  zora
} from 'viem/chains';

import { createConfig } from '@wagmi/core';

export const wagmiConfig = createConfig({
  chains: [base, optimism, zora, arbitrum, degen, polygon, baseSepolia],
  transports: {
    [base.id]: http(),
    [optimism.id]: http(),
    [degen.id]: http(),
    [zora.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [baseSepolia.id]: http()
  },
  batch: {}
});
