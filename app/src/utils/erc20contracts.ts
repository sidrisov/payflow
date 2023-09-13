import { Address, zeroAddress } from 'viem';
import { optimismGoerli } from 'wagmi/chains';

export const ERC20_CONTRACTS = {
  [optimismGoerli.id]: [
    { name: 'USDC', address: '0x7E07E15D2a87A24492740D16f5bdF58c16db0c4E' },
    { name: 'USDT', address: '0x853eb4bA5D0Ba2B77a0A5329Fd2110d5CE149ECE' }
  ] as Token[]
} as {
  [id: number]: Token[];
};

export interface Token {
  address: Address;
  name: string;
}

export function getSupportedTokens(chainId: number | undefined): Token[] {
  if (!chainId) {
    return [];
  }

  if (ERC20_CONTRACTS[chainId]) {
    return [ETH].concat(ERC20_CONTRACTS[chainId]);
  } else {
    return [ETH];
  }
}

export const ETH: Token = { name: 'ETH', address: zeroAddress };
