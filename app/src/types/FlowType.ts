import { Address } from 'viem';
import { ProfileType } from './ProfleType';

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
  safeVersion: string;
  safeSaltNonce: string;
  safeDeployed: boolean;
  master: Address;
}

export interface SafeWalletType {
  address: Address;
  network: string;
  safe: boolean;
  safeDeployed: boolean;
}

export interface WalletType {
  address: Address;
  network: string;
}

export interface WalletWithProfileType {
  address: Address;
  network: string;
  profile?: ProfileType;
}
