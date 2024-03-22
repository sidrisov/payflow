import { Address } from 'viem';
import { ProfileType } from './ProfleType';

export interface FlowType {
  signer: Address;
  signerProvider?: string;
  title: string;
  type: 'JAR' | 'REGULAR' | undefined;
  uuid: string;
  walletProvider: string;
  saltNonce: string;
  wallets: FlowWalletType[];
}

export interface JarType {
  flow: FlowType;
  profile: ProfileType;
  description?: string;
  image?: string;
  link?: string;
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
