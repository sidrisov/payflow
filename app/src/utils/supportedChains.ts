import {
  optimismGoerli,
  baseGoerli,
  zoraTestnet,
  modeTestnet,
  zkSyncTestnet,
  optimism,
  base,
  mainnet
} from 'wagmi/chains';

export const SUPPORTED_CHAINS = [
  optimismGoerli,
  baseGoerli,
  zoraTestnet,
  {
    ...modeTestnet,
    iconUrl:
      'https://uploads-ssl.webflow.com/64c906a6ed3c4d809558853b/64d0b11158be9cdd5c89a2fe_webc.png'
  },
  {
    ...zkSyncTestnet,
    iconUrl: 'https://zksync.io/apple-touch-icon.png'
  },
  optimism,
  base,
  mainnet
];