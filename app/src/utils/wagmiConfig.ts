import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { SUPPORTED_CHAINS } from '../utils/networks';
import { http, fallback } from 'viem';
import { mainnet, base, baseGoerli, optimism, goerli } from 'viem/chains';

const WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

export const wagmiConfig = getDefaultConfig({
  appName: 'Payflow',
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains: SUPPORTED_CHAINS as any,
  transports: {
    [mainnet.id]: http(
      `https://eth-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    ),
    [goerli.id]: http(
      `https://eth-goerli.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    ),
    [base.id]: fallback([
      http(
        `https://api.developer.coinbase.com/rpc/v1/base/${import.meta.env.VITE_BASE_RPC_API_KEY}`
      ),
      http(`https://base-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`)
    ]),
    [baseGoerli.id]: http(
      `https://base-goerli.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    ),
    [optimism.id]: http(
      `https://opt-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    )
  }
});

export const loginWagmiConfig = getDefaultConfig({
  appName: 'Payflow',
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(
      `https://eth-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    )
  }
});
