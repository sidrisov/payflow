import { Address } from 'viem';

export interface FlowType {
  account: Address;
  title: string;
  description: string;
  uuid: string;
  wallets: FlowWalletType[];
}

export interface FlowWalletType {
  address: Address;
  network: string;
  smart: boolean;
  safe: boolean;
  master: Address;
}
