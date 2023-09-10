import { Address, zeroAddress } from 'viem';
import { optimismGoerli } from 'wagmi/chains';

export const ERC20_CONTRACTS = {
  [optimismGoerli.id]: [
    { name: 'USDC', address: '0x7E07E15D2a87A24492740D16f5bdF58c16db0c4E' }
  ] as Token[]
} as {
  [id: number]: Token[];
};

export interface Token {
  address: Address;
  name: string;
}

export function getSupportedTokens(chainId: number | undefined): Token[] {
  if (!chainId || !ERC20_CONTRACTS[chainId]) {
    return [ETH];
  }
  return [ETH, ...ERC20_CONTRACTS[chainId]];
}

export const ETH = { name: 'ETH', address: zeroAddress };
