import { Chain } from 'wagmi';

export const modeTestnet = {
  id: 919,
  name: 'Mode Testnet',
  network: 'mode-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Mode Testnet',
    symbol: 'ETH'
  },
  rpcUrls: {
    public: { http: ['https://sepolia.mode.network'] },
    default: { http: ['https://sepolia.mode.network'] }
  },
  blockExplorers: {
    etherscan: { name: 'BlockScout', url: 'https://sepolia.explorer.mode.network/' },
    default: { name: 'BlockScout', url: 'https://sepolia.explorer.mode.network/' }
  }
} as const satisfies Chain;
