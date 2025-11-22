import { Address } from 'viem';
import { ProfileType } from './ProfileType';

export interface FlowType {
  signer: Address;
  signerProvider?: string;
  signerType?: string;
  signerCredential?: string;
  title: string;
  icon?: string;
  type:
    | 'CONNECTED'
    | 'FARCASTER_VERIFICATION'
    | undefined;
  uuid: string;
  walletProvider: string;
  saltNonce: string;
  wallets: FlowWalletType[];
  supportedTokens?: string[];
  archived: boolean;
}

export interface FlowWalletType {
  address: Address;
  network: number;
  version: string;
  deployed: boolean;
  sessions?: WalletSessionType[];
}

export interface WalletSessionType {
  sessionId: string;
  active: boolean;
  createdAt: Date;
  expiresAt: Date;
  sessionKey?: string;
  actions?: (SpendActionType | SudoActionType)[];
}

// Define the action types separately
type SpendActionType = {
  type: 'spend';
  token: string;
  limit: string;
  spent: string;
};

type SudoActionType = {
  type: 'sudo';
};

export interface WalletType {
  address: Address;
  network: number;
}

export interface WalletWithProfileType {
  address: Address;
  network: number;
  profile?: ProfileType;
}
