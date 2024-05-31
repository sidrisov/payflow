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
    id: 'przUSDC',
    name: 'Prize USDC',
    description:
      'Prize USDC is USDC deposited into Aave via the PoolTogether Protocol. Hold Prize USDC and win ETH prizes',
    chain: 'base',
    chainId: base.id,
    tokenAddress: '0x7f5c2b379b88499ac2b997db583f8079503f25b9',
    imageURL: 'https://app.cabana.fi/icons/przUSDC.svg'
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
  {
    id: 'higher',
    name: 'Higher',
    description: 'A community of optimists on Base.',
    chain: 'base',
    chainId: base.id,
    tokenAddress: '0x0578d8a44db98b23bf096a382e016e29a5ce0ffe',
    imageURL: 'https://i.imgur.com/bdQcnVI.png'
  },

  {
    id: 'onchain',
    name: 'Onchain',
    description:
      '$ONCHAIN is introducing the Slowdrop mechanism, where tokens will be distributed through a competition, based on a careful continuous approach, powered by Farcaster and Guild.',
    chain: 'base',
    chainId: base.id,
    tokenAddress: '0xfef2d7b013b88fec2bfe4d2fee0aeb719af73481',
    imageURL: 'https://i.imgur.com/o4c3DQt.jpeg'
  },
  {
    id: 'tn100x',
    name: 'TN100x',
    description:
      '$TN100x aka "The Next 100x Memecoin on Base". This is the coin that powers the HAM ecosystem. It\'s more than a memecoin, it\'s a social token, and a driving force behind everything Ham.',
    chain: 'base',
    chainId: base.id,
    tokenAddress: '0x5b5dee44552546ecea05edea01dcd7be7aa6144a',
    imageURL:
      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e6f48016-65e4-4f9e-8157-9e4f9b233700/original'
  },
  {
    id: 'build',
    name: 'Build',
    description:
      'BUILD is a token of appreciation on Base and a social game to reward onchain builders.',
    chain: 'base',
    chainId: base.id,
    tokenAddress: '0x3c281a39944a2319aa653d81cfd93ca10983d234',
    imageURL:
      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/9f99fea6-2aa9-4dc8-72a6-2fe6ee114400/original'
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
  {
    id: 'przUSDC',
    name: 'Prize USDC',
    description:
      'Prize USDC is USDC deposited into Aave via the PoolTogether Protocol. Hold Prize USDC and win ETH prizes',
    chain: 'optimism',
    chainId: optimism.id,
    tokenAddress: '0x03d3ce84279cb6f54f5e6074ff0f8319d830dafe',
    imageURL: 'https://app.cabana.fi/icons/przUSDC.svg'
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
    chain: 'arbitrum',
    chainId: arbitrum.id,
    tokenAddress: '0xaf88d065e77c8cc2239327c5edb3a432268e5831'
  },
  {
    id: 'przUSDC',
    name: 'Prize USDC',
    description:
      'Prize USDC is USDC deposited into Aave via the PoolTogether Protocol. Hold Prize USDC and win ETH prizes',
    chain: 'arbitrum',
    chainId: arbitrum.id,
    tokenAddress: '0x3c72a2a78c29d1f6454caa1bcb17a7792a180a2e',
    imageURL: 'https://app.cabana.fi/icons/przUSDC.svg'
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
  // TODO: add unerlying asset structure
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
