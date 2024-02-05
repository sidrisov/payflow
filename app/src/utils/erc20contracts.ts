import { Address, zeroAddress } from 'viem';
import { base } from 'viem/chains';

export const USDC_TOKEN = 'USDC';
export const DEGEN_TOKEN = 'DEGEN';
export const ETH_TOKEN = 'ETH';

export const ERC20_CONTRACTS = {
  [base.id]: [
    { name: USDC_TOKEN, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
    { name: DEGEN_TOKEN, address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed' }
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

export const ETH: Token = { name: ETH_TOKEN, address: zeroAddress };
