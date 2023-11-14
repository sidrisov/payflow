import { Address, Hash } from 'viem';
import { FlowWalletType } from './FlowType';

export type ActivityFetchResultType = {
  loading: boolean;
  fetched: boolean;
  transactions: TxInfo[];
};

export interface TxInfo {
  chainId: number;
  block: number;
  hash: Hash;
  timestamp: string;
  success: boolean;
  from: Address;
  to: Address;
  type: string | number;
  value: number;
  activity: 'inbound' | 'outbound' | 'self';
}

export type WalletActivityType = { wallet: FlowWalletType; txs: TxInfo[] | undefined };
