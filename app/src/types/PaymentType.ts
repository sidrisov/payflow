import { Address, Hash } from 'viem';
import { ProfileType } from './ProfleType';
import { FlowType } from './FlowType';

export interface PaymentType {
  referenceId?: string;
  type: 'FRAME' | 'INTENT';
  category?: string;
  status: 'PENDING' | 'COMPLETED';
  receiver: ProfileType;
  receiverFlow: FlowType;
  receiverAddress: Address;
  receiverFid?: number;
  chainId: number;
  token: 'eth' | 'usdc' | 'degen';
  usdAmount: number;
  hash?: Hash;
  source?: { app: string; ref?: string };
  comment?: string;
}
