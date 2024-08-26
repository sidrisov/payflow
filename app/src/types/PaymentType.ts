import { Address, Hash } from 'viem';
import { ProfileType } from './ProfileType';
import { FlowType } from './FlowType';

export type PaymentStatus = 'PENDING' | 'INPROGRESS' | 'REFUNDED' | 'COMPLETED' | 'CANCELLED';
export type Type = 'FRAME' | 'INTENT' | 'APP' | 'INTENT_TOP_REPLY' | 'BATCH';
export interface PaymentType {
  referenceId?: string;
  type: Type;
  category?: string;
  status: PaymentStatus;
  receiver: ProfileType;
  receiverFlow: FlowType;
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
}
