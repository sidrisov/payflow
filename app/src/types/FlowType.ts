import { Address } from 'viem';
import { ProfileType } from './ProfleType';

export interface FlowType {
  owner: Address;
  title: string;
  description: string;
  uuid: string;
  walletProvider: string;
  saltNonce: string;
  wallets: FlowWalletType[];
}

export interface FlowWalletType {
  address: Address;
  network: number;
  version: string;
  deployed: boolean;
}

export interface WalletType {
  address: Address;
  network: number;
}

export interface WalletWithProfileType {
  address: Address;
  network: number;
  profile?: ProfileType;
}
