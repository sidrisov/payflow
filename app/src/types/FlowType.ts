import { Address } from 'viem';
import { ProfileType } from './ProfileType';

export interface FlowType {
  signer: Address;
  signerProvider?: string;
  signerType?: string;
  signerCredential?: string;
  title: string;
  type: 'JAR' | 'REGULAR' | 'LINKED' | 'FARCASTER_VERIFICATION' | 'BANKR' | 'RODEO' | undefined;
  uuid: string;
  walletProvider: string;
  saltNonce: string;
  wallets: FlowWalletType[];
  supportedTokens?: string[];
  archived: boolean;
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
