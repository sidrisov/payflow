import { Address, Hash } from 'viem';

export interface PaymentRequestType {
  account: Address;
  flowUuid: string;
  title: string;
  description: string | undefined;
  uuid: string;
  network: number;
  address: string;
  amount: string;
  payed: boolean;
  proof: Hash | undefined;
}
