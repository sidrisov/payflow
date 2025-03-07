import { Address, Hash } from 'viem';
import { ProfileType } from './ProfileType';
import { FlowType } from './FlowType';

export type PaymentStatus =
  | 'CREATED'
  | 'INPROGRESS'
  | 'PENDING_REFUND'
  | 'REFUNDED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FAILED';

export type Type = 'FRAME' | 'INTENT' | 'APP' | 'BATCH' | 'SESSION_INTENT';

export type PaymentCategory =
  | 'fc_storage'
  | 'mint'
  | 'hypersub'
  | 'reward'
  | 'reward_top_reply'
  | 'reward_top_casters';
export interface PaymentType {
  referenceId?: string;
  type: Type;
  name?: string;
  category?: PaymentCategory;
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
  refundHash?: Hash;
  source?: { app: string; ref?: string };
  comment?: string;
  target?: string;
  createdAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
}

export type PaymentTxStatus = {
  isPending: boolean;
  isConfirmed: boolean;
  error: boolean;
  txHash: string | null;
  status: string;
};
