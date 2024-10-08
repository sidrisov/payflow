import { Address } from 'viem';
import { base, arbitrum, optimism, zora } from 'viem/chains';

export const OP_FARCASTER_STORAGE_CONTRACT_ADDR: Address =
  '0x00000000fcce7f938e7ae6d3c335bd6a1a7c593d';
export const ZORA_MINT_CONTRACT_ADDR: Address = '0x777777722d078c97c6ad07d9f36801e653e356ae';
export const ZORA_ERC20_MINT_CONTRACT_ADDR: Address = '0x777777e8850d8d6d98de2b5f64fae401f96eff31';
export const RODEO_MINT_CONTRACT_ADDR: Address = '0x132363a3bbf47e06cf642dd18e9173e364546c99';

export const HIGHLIGHT_MINT_MANAGER_ADDRS: { [chainId: number]: Address } = {
  [base.id]: '0x8087039152c472fa74f47398628ff002994056ea',
  [optimism.id]: '0xfafd47bb399d570b5ac95694c5d2a1fb5ea030bb',
  [arbitrum.id]: '0x41cbab1028984a34c1338f437c726de791695ae8',
  [zora.id]: '0x3ad45858a983d193d98bd4e6c14852a4cadcdbea'
};

export const FAN_TOKEN_BOND_CURVE_CONTRACT_ADDR: Address =
  '0x373065e66B32a1C428aa14698dFa99BA7199B55E';

export const FAN_TOKEN_STAKING_CONTRACT_ADDR: Address =
  '0xcb2513d389354f7ac80f5042bb8948a234a439b2';
