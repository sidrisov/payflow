import { Hash } from 'viem';
import { ProfileType } from './ProfleType';
import { FlowType } from './FlowType';

export interface PaymentType {
  referenceId?: string;
  type: 'FRAME' | 'INTENT';
  status: 'PENDING' | 'COMPLETED';
  receiver: ProfileType;
  receiverFlow: FlowType;
  chainId: number;
  token: 'eth' | 'usdc' | 'degen';
  usdAmount: number;
  hash?: Hash;
  source?: { app: string; ref?: string };
  comment?: string;
}
