import { Address } from 'viem';

export interface PaymentRequestType {
  account: Address;
  flowUuid: string;
  title: string;
  description: string | undefined;
  uuid: string;
  network: string;
  address: string;
  amount: string;
  payed: boolean;
  proof: string | undefined;
}
