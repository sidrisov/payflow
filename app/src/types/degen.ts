import { Chain, defineChain } from 'viem';
import { chainConfig } from 'viem/zksync';

const sourceId = 1; // mainnet
export const degen = defineChain({
  id: 666666666,
  name: 'Degen',
  nativeCurrency: { name: 'Degen', symbol: 'DEGEN', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.degen.tips']
    }
  },
  blockExplorers: {
    default: {
      name: 'Degenscan',
      url: 'https://explorer.degen.tips'
    }
  },
  sourceId
});
