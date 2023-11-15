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
  network: number;
  smart: boolean;
  safe: boolean;
  safeVersion: string;
  safeSaltNonce: string;
  safeDeployed: boolean;
  master: Address;
}

export interface SafeWalletType {
  address: Address;
  network: number;
  safe: boolean;
  safeDeployed: boolean;
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
