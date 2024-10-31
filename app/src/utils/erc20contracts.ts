import { Address } from 'viem';

import tokensData from './tokens.json';

export const SUPPORTED_TOKENS = tokensData as Token[];

export interface UnderlyingToken {
  id: string;
  name: string;
  tokenAddress?: Address;
}

export interface Token {
  id: string;
  name: string;
  chain: string;
  chainId: number;
  decimals: number;
  description?: string;
  tokenAddress?: Address;
  imageURL?: string;
  underlyingToken?: UnderlyingToken;
}

export interface TokenPrices {
  [name: string]: number;
}

export function getSupportedTokens(chainId?: number | undefined): Token[] {
  if (!chainId) {
    return SUPPORTED_TOKENS;
  }

  return SUPPORTED_TOKENS.filter((token) => token.chainId === chainId);
}

export function getSupportedTokensByChainIds(chainIds: number[]): Token[] {
  if (!chainIds) {
    return SUPPORTED_TOKENS;
  }

  return SUPPORTED_TOKENS.filter((token) => chainIds.includes(token.chainId));
}

export default function getTokenName(id: string): string | undefined {
  return SUPPORTED_TOKENS.find((token) => token.id === id)?.name;
}
