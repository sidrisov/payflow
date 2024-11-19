import { Address } from 'viem';

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
