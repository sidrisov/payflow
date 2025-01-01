import { http } from 'viem';
import {
  arbitrum,
  base,
  baseSepolia,
  degen,
  ham,
  optimism,
  zora
} from 'viem/chains';

import { createConfig } from '@wagmi/core';

export const wagmiConfig = createConfig({
  chains: [base, optimism, zora, arbitrum, degen, ham, baseSepolia],
  transports: {
    [base.id]: http(),
    [optimism.id]: http(),
    [degen.id]: http(),
    [zora.id]: http(),
    [arbitrum.id]: http(),
    [ham.id]: http(),
    [baseSepolia.id]: http()
  },
  batch: {}
});
