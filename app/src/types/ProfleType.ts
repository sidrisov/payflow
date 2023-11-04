import { Address } from 'viem';
import { FlowWalletType } from './FlowType';

export interface ProfileType {
  address: Address;
  username?: string;
  defaultFlow?: FlowWalletType;
}
