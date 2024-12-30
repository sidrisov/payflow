import { Address } from 'viem';
import { ProfileType } from './ProfleType';

export interface FlowType {
  signer: Address;
  signerProvider?: string;
  title: string;
  type: string;
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
