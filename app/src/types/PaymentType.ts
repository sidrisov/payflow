import { Address, Hash } from 'viem';
import { ProfileType } from './ProfileType';
import { FlowType } from './FlowType';

export type PaymentStatus = 'PENDING' | 'INPROGRESS' | 'REFUNDED' | 'COMPLETED' | 'CANCELLED';
export type Type = 'FRAME' | 'INTENT' | 'APP' | 'INTENT_TOP_REPLY' | 'BATCH';
export interface PaymentType {
  referenceId?: string;
  type: Type;
  category?: 'fc_storage' | 'mint';
  status: PaymentStatus;
  sender: ProfileType;
  receiver: ProfileType;
  receiverFlow: FlowType;
  senderAddress: Address;
  receiverAddress: Address;
  receiverFid?: number;
  chainId: number;
  token: string;
  usdAmount: number;
  tokenAmount: number;
  hash?: Hash;
  fulfillmentId?: string;
  fulfillmentChainId?: number;
  fulfillmentHash?: Hash;
  source?: { app: string; ref?: string };
  comment?: string;
  target?: string;
  createdAt?: Date;
  completedAt?: Date;
}

export type PaymentTxStatus = {
  isPending: boolean;
  isConfirmed: boolean;
  error: boolean;
  txHash: string | null;
  status: string;
};
