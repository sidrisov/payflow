import { SUPPORTED_CHAINS } from './networks';
import { http, fallback } from 'viem';
import { mainnet, base, optimism, baseSepolia, zora, sepolia } from 'viem/chains';

import { createConfig } from '@privy-io/wagmi';
import { Config } from 'wagmi';

const WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
/* const { wallets } = getDefaultWallets();
 */
const commonWagmiConfig = {
  chains: SUPPORTED_CHAINS as any,
  transports: {
    [mainnet.id]: http(
      `https://eth-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    ),
    [sepolia.id]: http(
      `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    ),
    [base.id]: fallback([
      http(
        `https://api.developer.coinbase.com/rpc/v1/base/${import.meta.env.VITE_BASE_RPC_API_KEY}`
      ),
      http(`https://base-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`)
    ]),
    [optimism.id]: fallback([
      http(),
      http(`https://opt-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`)
    ]),
    [zora.id]: http('https://rpc.zora.energy'),
    [baseSepolia.id]: http(
      `https://base-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    )
  },
  syncConnectedChain: true
};

/* export const privyWagmiConfig = getDefaultConfig({
  ...commonWagmiConfig,
  appName: 'Payflow',
  projectId: WALLET_CONNECT_PROJECT_ID,
  appDescription: 'On-chain Social Payments',
  appUrl: 'https://payflow.me',
  appIcon: 'https://payflow.me/favicon.ico',
  wallets: [
    ...wallets,
    {
      groupName: 'More',
      wallets: [trustWallet, injectedWallet]
    }
  ]
}); */

export const privyWagmiConfig = createConfig({
  ...commonWagmiConfig
}) as Config;
