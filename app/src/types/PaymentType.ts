import { Address, Hash } from 'viem';
import { ProfileType } from './ProfileType';
import { FlowType } from './FlowType';

export type type = 'FRAME' | 'INTENT' | 'APP' | 'INTENT_TOP_REPLY' | 'BATCH';
export interface PaymentType {
  referenceId?: string;
  type: type;
  category?: string;
  status: 'PENDING' | 'INPROGRESS' | 'REFUNDED' | 'COMPLETED';
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
