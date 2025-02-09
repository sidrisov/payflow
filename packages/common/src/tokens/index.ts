import { Token } from '../types/tokens';
import tokenList from './tokens.json';

export const tokens: Token[] = tokenList as Token[];

export const getTokenByAddress = (chainId: number, address?: string): Token | undefined => {
  return tokens.find(
    (token) =>
      token.tokenAddress?.toLowerCase() === address?.toLowerCase() && token.chainId === chainId
  );
};

export const getTokensByChain = (chainId?: number): Token[] => {
  if (!chainId) {
    return tokens;
  }
  return tokens.filter((token) => token.chainId === chainId);
};

export const getTokensByChainIds = (chainIds: number[]): Token[] => {
  if (!chainIds?.length) {
    return tokens;
  }
  return tokens.filter((token) => chainIds.includes(token.chainId));
};

export const getTokenById = (id: string): Token | undefined => {
  return tokens.find((token) => token.id === id);
};

export const getTokenName = (id: string): string | undefined => {
  return tokens.find((token) => token.id === id)?.name;
};

export interface TokenPrices {
  [name: string]: number;
}
