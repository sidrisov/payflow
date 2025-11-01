import { Address } from 'viem';
import { base, arbitrum, optimism } from 'viem/chains';

export const OP_FARCASTER_STORAGE_CONTRACT_ADDR: Address =
  '0x00000000fcce7f938e7ae6d3c335bd6a1a7c593d';
export const RODEO_MINT_CONTRACT_ADDR: Address = '0x132363a3bbf47e06cf642dd18e9173e364546c99';

export const HIGHLIGHT_MINT_MANAGER_ADDRS: { [chainId: number]: Address } = {
  [base.id]: '0x8087039152c472fa74f47398628ff002994056ea',
  [optimism.id]: '0xfafd47bb399d570b5ac95694c5d2a1fb5ea030bb',
  [arbitrum.id]: '0x41cbab1028984a34c1338f437c726de791695ae8'
};
