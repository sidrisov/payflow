import { Address, Hash } from 'viem';
import { ProfileType } from './ProfleType';
import { FlowType } from './FlowType';

export type type = 'FRAME' | 'INTENT' | 'APP' | 'INTENT_TOP_REPLY' | 'BATCH';
export interface PaymentType {
  referenceId?: string;
  type: type;
  category?: string;
  status: 'PENDING' | 'COMPLETED';
  receiver: ProfileType;
  receiverFlow: FlowType;
  receiverAddress: Address;
  receiverFid?: number;
  chainId: number;
  token: 'eth' | 'usdc' | 'degen';
  usdAmount: number;
  tokenAmount: number;
  hash?: Hash;
  source?: { app: string; ref?: string };
  comment?: string;
}
