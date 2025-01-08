import { Address, Hash } from 'viem';
import { FlowWalletType, ProfileType, PaymentType } from '@payflow/common';

export type ActivityFetchResultType = {
  isLoading: boolean;
  isFetched: boolean;
  transactions: TxInfo[] | undefined;
};

export interface TxInfo {
  chainId: number;
  block: number;
  hash: Hash;
  timestamp: Date;
  success: boolean;
  from: Address;
  to: Address;
  type: string | number;
  value: number;
  token?: TxToken;
  activity: 'inbound' | 'outbound' | 'self';
  fromProfile?: ProfileType;
  toProfile?: ProfileType;
  payment?: PaymentType;
}

export interface TxToken {
  address: Address;
  decimals: number;
  exchange_rate: number;
  name: string;
  symbol: string;
  type: string;
}

export type WalletActivityType = { wallet: FlowWalletType; txs: TxInfo[] | undefined };
