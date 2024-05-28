import { Address } from 'viem';
import { arbitrum, base, degen, mode, optimism } from 'viem/chains';

export const ERC20_CONTRACTS = [
  // base
  {
    id: 'eth',
    name: 'Ether',
    chain: 'base',
    chainId: base.id
  },
  {
    id: 'usdc',
    name: 'USD Coin',
    chain: 'base',
    chainId: base.id,
    tokenAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
  },
  {
    id: 'degen',
    name: 'Degen',
    description:
      'Degen, an ERC-20 token launched in January 2024, has reshaped the Farcaster ecosystem by enabling Casters to reward others with DEGEN for posting quality content.',
    chain: 'base',
    chainId: base.id,
    tokenAddress: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
    imageURL: 'https://pbs.twimg.com/profile_images/1751028059325501440/9jrvP_yG_400x400.jpg'
  },
  // optimism
  {
    id: 'eth',
    name: 'Ether',
    chain: 'optimism',
    chainId: optimism.id
  },
  {
    id: 'usdc',
    name: 'USD Coin',
    chain: 'optimism',
    chainId: optimism.id,
    tokenAddress: '0x0b2c639c533813f4aa9d7837caf62653d097ff85'
  },
  // arbitrum
  {
    id: 'eth',
    name: 'Ether',
    chain: 'optimism',
    chainId: arbitrum.id
  },
  {
    id: 'usdc',
    name: 'USD Coin',
    chain: 'optimism',
    chainId: arbitrum.id,
    tokenAddress: '0xaf88d065e77c8cc2239327c5edb3a432268e5831'
  },
  // mode
  {
    id: 'eth',
    name: 'Ether',
    chain: 'mode',
    chainId: mode.id
  },
  {
    id: 'usdc',
    name: 'USD Coin',
    chain: 'mode',
    chainId: mode.id,
    // bridged
    tokenAddress: '0xd988097fb8612cc24eec14542bc03424c656005f'
  },
  // degen
  {
    id: 'degen',
    name: 'Degen',
    chain: 'degen',
    chainId: degen.id,
    imageURL: 'https://pbs.twimg.com/profile_images/1751028059325501440/9jrvP_yG_400x400.jpg'
  },
  {
    id: 'ath',
    name: 'ATH',
    description:
      "ATH is the growth flywheel for Degen Chain. Airdrops, a game, the ATH DAO, a layer 4?! and more - powered by the ATH community. $ATH is more than a token, it's a vibe.",
    chain: 'degen',
    chainId: degen.id,
    tokenAddress: '0xeb1c32ea4e392346795aed3607f37646e2a9c13f',
    imageURL: 'https://i.imgur.com/oQO5lv9.gif'
  }
] as Token[];

export interface Token {
  id: string;
  name: string;
  description?: string;
  chain: string;
  chainId: number;
  tokenAddress?: Address;
  imageURL?: string;
}

export interface TokenPrices {
  [name: string]: number;
}

export function getSupportedTokens(chainId: number | undefined): Token[] {
  if (!chainId) {
    return [];
  }

  return ERC20_CONTRACTS.filter((token) => token.chainId === chainId);
}

export default function getTokenName(id: string): string | undefined {
  return ERC20_CONTRACTS.find((token) => token.id === id)?.name;
}
